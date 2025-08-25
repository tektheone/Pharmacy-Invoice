import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { FileParser } from '../services/fileParser';
import { DiscrepancyChecker } from '../services/discrepancyChecker';
import { ReferenceDrugService } from '../services/referenceDrugService';
import { ValidationError, FileProcessingError, ReferenceAPIError } from '../middleware/errorHandler';

const router = Router();

// Initialize services
const fileParser = new FileParser();
const discrepancyChecker = new DiscrepancyChecker();
const referenceDrugService = new ReferenceDrugService();

// Multer configuration for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                        'application/vnd.ms-excel', // .xls
                        'text/csv', // .csv
                        'application/pdf']; // .pdf
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError(`File type ${file.mimetype} not supported. Allowed types: .xlsx, .xls, .csv, .pdf`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow 1 file per request
  }
});

/**
 * POST /api/upload
 * Upload and validate invoice file
 */
router.post('/', upload.single('invoice'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate file upload
    if (!req.file) {
      throw new ValidationError('No file uploaded. Please provide an invoice file.');
    }

    const { originalname, buffer, mimetype, size } = req.file;
    
    console.log(`Processing file: ${originalname} (${mimetype}, ${size} bytes)`);

    // Parse the uploaded file
    let parsedInvoice;
    try {
      parsedInvoice = await fileParser.parseFile(buffer, originalname);
      console.log(`File parsed successfully: ${parsedInvoice.itemCount} items found`);
    } catch (error) {
      throw new FileProcessingError(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Fetch reference drug data
    let referenceDrugs;
    try {
      referenceDrugs = await referenceDrugService.fetchReferenceDrugs();
      console.log(`Reference drugs fetched: ${referenceDrugs.length} drugs available`);
    } catch (error) {
      throw new ReferenceAPIError(`Failed to fetch reference drugs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Validate reference data integrity
    const referenceValidation = discrepancyChecker.validateReferenceData(referenceDrugs);
    if (!referenceValidation.valid) {
      console.warn('Reference data validation warnings:', referenceValidation.errors);
    }

    // Set reference drugs and validate invoice
    discrepancyChecker.setReferenceDrugs(referenceDrugs);
    const validationResult = discrepancyChecker.validateInvoice(parsedInvoice.items);

    // Prepare response
    const response = {
      success: true,
      message: 'Invoice processed successfully',
      timestamp: new Date().toISOString(),
      fileInfo: {
        name: originalname,
        type: mimetype,
        size: size,
        itemCount: parsedInvoice.itemCount,
        totalAmount: parsedInvoice.totalAmount
      },
      validation: {
        totalDiscrepancies: validationResult.summary.totalDiscrepancies,
        summary: validationResult.summary,
        discrepancies: validationResult.discrepancies,
        statistics: discrepancyChecker.getDiscrepancyStats(validationResult.discrepancies)
      },
      referenceData: {
        totalDrugs: referenceDrugs.length,
        cacheStatus: referenceDrugService.getCacheStatus()
      }
    };

    // Log validation results
    console.log(`Validation complete: ${validationResult.summary.totalDiscrepancies} discrepancies found`);
    
    res.status(200).json(response);

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/upload/supported-formats
 * Get list of supported file formats
 */
router.get('/supported-formats', (req: Request, res: Response) => {
  res.json({
    success: true,
    supportedFormats: [
      {
        extension: '.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        description: 'Excel Spreadsheet (2007+)',
        maxSize: '10MB'
      },
      {
        extension: '.xls',
        mimeType: 'application/vnd.ms-excel',
        description: 'Excel Spreadsheet (97-2003)',
        maxSize: '10MB'
      },
      {
        extension: '.csv',
        mimeType: 'text/csv',
        description: 'Comma-Separated Values',
        maxSize: '10MB'
      },
      {
        extension: '.pdf',
        mimeType: 'application/pdf',
        description: 'Portable Document Format',
        maxSize: '10MB'
      }
    ],
    requirements: {
      maxFileSize: '10MB',
      maxFilesPerRequest: 1,
      requiredColumns: [
        'Drug Name',
        'Strength', 
        'Formulation',
        'Payer',
        'Quantity',
        'Unit Price',
        'Total'
      ]
    }
  });
});

/**
 * POST /api/upload/validate-only
 * Validate existing invoice data without file upload
 */
router.post('/validate-only', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceItems } = req.body;

    if (!invoiceItems || !Array.isArray(invoiceItems)) {
      throw new ValidationError('invoiceItems array is required');
    }

    // Validate each invoice item structure
    for (const item of invoiceItems) {
      if (!item.drugName || !item.strength || !item.formulation || 
          !item.payer || typeof item.quantity !== 'number' || 
          typeof item.unitPrice !== 'number' || typeof item.total !== 'number') {
        throw new ValidationError('Invalid invoice item structure. All fields are required.');
      }
    }

    // Fetch reference drug data
    let referenceDrugs;
    try {
      referenceDrugs = await referenceDrugService.fetchReferenceDrugs();
    } catch (error) {
      throw new ReferenceAPIError(`Failed to fetch reference drugs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Validate invoice
    discrepancyChecker.setReferenceDrugs(referenceDrugs);
    const validationResult = discrepancyChecker.validateInvoice(invoiceItems);

    res.json({
      success: true,
      message: 'Invoice data validated successfully',
      timestamp: new Date().toISOString(),
      validation: {
        totalDiscrepancies: validationResult.summary.totalDiscrepancies,
        summary: validationResult.summary,
        discrepancies: validationResult.discrepancies,
        statistics: discrepancyChecker.getDiscrepancyStats(validationResult.discrepancies)
      }
    });

  } catch (error) {
    next(error);
  }
});

export { router as uploadRouter };
