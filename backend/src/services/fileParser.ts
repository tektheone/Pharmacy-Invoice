import * as ExcelJS from 'exceljs';
import csvParser from 'csv-parser';
import pdfParse from 'pdf-parse';
import { createReadStream } from 'fs';
import { Readable } from 'stream';

export interface InvoiceItem {
  drugName: string;
  patientName: string;
  strength: string;
  formulation: string;
  doseInstructions: string;
  payer: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ParsedInvoice {
  items: InvoiceItem[];
  totalAmount: number;
  itemCount: number;
}

export class FileParser {
  /**
   * Parse invoice file based on its type
   */
  async parseFile(fileBuffer: Buffer, fileName: string): Promise<ParsedInvoice> {
    console.log('🔥🔥🔥 PARSE FILE CALLED 🔥🔥🔥');
    console.log('File name:', fileName);
    console.log('File buffer length:', fileBuffer.length);
    
    const fileType = this.detectFileType(fileName);
    console.log('Detected file type:', fileType);
    
    switch (fileType) {
      case 'excel':
        console.log('Parsing as Excel file...');
        return this.parseExcel(fileBuffer);
      case 'csv':
        console.log('Parsing as CSV file...');
        return this.parseCSV(fileBuffer);
      case 'pdf':
        console.log('Parsing as PDF file...');
        return this.parsePDF(fileBuffer);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Detect file type based on extension
   */
  private detectFileType(fileName: string): 'excel' | 'csv' | 'pdf' {
    const extension = fileName.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return 'excel';
      case 'csv':
        return 'csv';
      case 'pdf':
        return 'pdf';
      default:
        throw new Error(`Unsupported file extension: ${extension}`);
    }
  }

  /**
   * Parse Excel files (.xlsx, .xls)
   */
  private async parseExcel(fileBuffer: Buffer): Promise<ParsedInvoice> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer as any);
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('No worksheet found in Excel file');
      }
      
      // Convert to JSON with header row
      const jsonData: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        const rowData = row.values as any[];
        jsonData.push(rowData);
      });
      
      console.log('Excel parsing debug:', {
        totalRows: jsonData.length,
        headers: jsonData[0],
        sampleData: jsonData.slice(1, 3)
      });
      
      if (jsonData.length < 1) {
        throw new Error('Excel file must contain at least one row');
      }

      // First, try to find Patient Name in headers or outside the main table
      let patientName = this.extractPatientNameFromExcel(jsonData);
      console.log(`🔍 Extracted Patient Name from Excel: "${patientName}"`);

      // Find the most likely header row by searching for expected tokens
      const expectedTokens = ['drug', 'name', 'strength', 'formulation', 'unit', 'price', 'payer', 'qty', 'quantity'];
      let headerRowIndex = 0;
      for (let i = 0; i < jsonData.length; i++) {
        const row = (Array.isArray(jsonData[i]) ? jsonData[i] : []).map((c: any) => String(c).toLowerCase());
        const tokenHits = row.reduce((acc: number, cell: string) => acc + (expectedTokens.some(t => cell.includes(t)) ? 1 : 0), 0);
        if (tokenHits >= 2) { // at least two expected tokens found in a row
          headerRowIndex = i;
          break;
        }
      }

      const headers = (jsonData[headerRowIndex] as string[]) || [];
      const dataRows = jsonData.slice(headerRowIndex + 1);
      
      console.log('Detected header row index:', headerRowIndex);
      console.log('Headers found:', headers);
      console.log('Data rows count:', dataRows.length);
      
      const items = this.parseExcelRows(headers, dataRows);
      
      // Apply the extracted patient name to all items
      if (patientName) {
        items.forEach(item => {
          item.patientName = patientName;
        });
        console.log(`✅ Applied Patient Name "${patientName}" to all ${items.length} items`);
      }
      
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      
      console.log('Parsed items count:', items.length);
      
      return {
        items,
        totalAmount,
        itemCount: items.length
      };
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse CSV files
   */
  private async parseCSV(fileBuffer: Buffer): Promise<ParsedInvoice> {
    console.log('🔥🔥🔥 CSV PARSING STARTED - USING UPDATED CODE 🔥🔥🔥');
    
    return new Promise((resolve, reject) => {
      const items: InvoiceItem[] = [];
      
      console.log('Starting CSV parsing...');
      console.log('File buffer length:', fileBuffer.length);
      console.log('File buffer preview:', fileBuffer.toString('utf8').substring(0, 200));
      
      // Create a readable stream from the buffer (compatible with older Node.js versions)
      const stream = new Readable();
      stream.push(fileBuffer);
      stream.push(null); // End the stream
      
      let columnMap: Record<string, number> | null = null;
      let isFirstRow = true;
      
      stream
        .pipe(csvParser())
        .on('data', (row: any) => {
          console.log('CSV row received:', row);
          
          // Create column mapping from the first row (headers)
          if (isFirstRow) {
            columnMap = this.createColumnMap(Object.keys(row));
            console.log('Column mapping created:', columnMap);
            isFirstRow = false;
            return; // Skip the header row
          }
          
          try {
            const item = this.parseCSVRow(row, columnMap!);
            if (item) {
              items.push(item);
            }
          } catch (error) {
            console.warn('Skipping invalid CSV row:', error);
          }
        })
        .on('end', () => {
          console.log('CSV parsing completed. Total items:', items.length);
          if (items.length === 0) {
            reject(new Error('No valid data found in CSV file'));
            return;
          }
          
          const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
          resolve({
            items,
            totalAmount,
            itemCount: items.length
          });
        })
        .on('error', (error: any) => {
          console.error('CSV parsing error:', error);
          reject(new Error(`Failed to parse CSV file: ${error.message}`));
        });
    });
  }

  /**
   * Parse single CSV row
   */
  private parseCSVRow(row: any, columnMap: Record<string, number>): InvoiceItem | null {
    if (!this.hasRequiredColumns(columnMap)) {
      console.log('Required columns not found, returning null');
      return null;
    }
    
    // Get the actual column names from the row
    const headers = Object.keys(row);
    
    const item = {
      drugName: row[headers[columnMap.drugName]] || '',
      patientName: row[headers[columnMap.patientName]] || '',
      strength: row[headers[columnMap.strength]] || '',
      formulation: row[headers[columnMap.formulation]] || '',
      doseInstructions: row[headers[columnMap.doseInstructions]] || '',
      payer: row[headers[columnMap.payer]] || '',
      quantity: parseFloat(String(row[headers[columnMap.quantity]] || '0').replace(/[$,]/g, '')) || 0,
      unitPrice: parseFloat(String(row[headers[columnMap.unitPrice]] || '0').replace(/[$,]/g, '')) || 0,
      total: parseFloat(String(row[headers[columnMap.total]] || '0').replace(/[$,]/g, '')) || 0
    };
    
    console.log('Parsed item:', item);
    return item;
  }

  /**
   * Parse PDF files
   */
  private async parsePDF(fileBuffer: Buffer): Promise<ParsedInvoice> {
    try {
      console.log('Starting PDF parsing...');
      console.log('File buffer length:', fileBuffer.length);
      
      // Parse PDF content
      const pdfData = await pdfParse(fileBuffer);
      const textContent = pdfData.text;
      
      console.log('PDF text content length:', textContent.length);
      console.log('PDF text preview:', textContent.substring(0, 500));
      
      // Extract patient name from PDF content
      const patientName = this.extractPatientNameFromPDF(textContent);
      console.log(`🔍 Extracted Patient Name from PDF: "${patientName}"`);
      
      // Extract table data from PDF
      const tableData = this.extractTableDataFromPDF(textContent);
      console.log('Extracted table data:', tableData);
      
      if (!tableData || tableData.length === 0) {
        throw new Error('No table data found in PDF');
      }
      
      // Convert table data to invoice items
      const items: InvoiceItem[] = [];
      
      for (const row of tableData) {
        if (row.length >= 6) { // Ensure we have enough columns
          try {
            const item: InvoiceItem = {
              drugName: row[1] || '', // Drug Name column
              patientName: patientName, // Use extracted patient name
              strength: row[2] || '', // Strength column
              formulation: row[3] || '', // Formulation column
              doseInstructions: '',
              payer: row[5] || '', // Payer column
              quantity: parseInt(row[6]) || 0, // Quantity column
              unitPrice: parseFloat(row[4]) || 0, // Unit Price column
              total: 0
            };
            
            // Calculate total
            item.total = item.unitPrice * item.quantity;
            
            // Only add items with valid drug names
            if (item.drugName && item.drugName.trim() !== '') {
              items.push(item);
            }
          } catch (error) {
            console.warn('Skipping invalid PDF row:', error);
          }
        }
      }
      
      console.log('Parsed PDF items count:', items.length);
      
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      
      return {
        items,
        totalAmount,
        itemCount: items.length
      };
    } catch (error) {
      throw new Error(`Failed to parse PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse Excel rows into InvoiceItem objects
   */
  private parseExcelRows(headers: string[], dataRows: any[]): InvoiceItem[] {
    const items: InvoiceItem[] = [];
    
    // Extract patient name from the first data row if available
    let patientName = '';
    const columnMap = this.createColumnMap(headers);
    if (dataRows.length > 0 && columnMap.patientName !== undefined) {
      patientName = this.extractValue(dataRows[0], columnMap.patientName, headers);
      console.log(`📋 Excel invoice is for patient: ${patientName}`);
    }
    
    for (const row of dataRows) {
      try {
        const item = this.parseExcelRow(headers, row);
        if (item) {
          // Apply the patient name to all items
          item.patientName = patientName;
          items.push(item);
        }
      } catch (error) {
        console.warn('Skipping invalid Excel row:', error);
      }
    }
    
    return items;
  }

  /**
   * Parse single Excel row
   */
  private parseExcelRow(headers: string[], row: any[]): InvoiceItem | null {
    // Map common column names to our structure
    const columnMap = this.createColumnMap(headers);
    
    if (!this.hasRequiredColumns(columnMap)) {
      return null;
    }
    
    return {
      drugName: this.extractValue(row, columnMap.drugName, headers),
      patientName: this.extractValue(row, columnMap.patientName, headers),
      strength: this.extractValue(row, columnMap.strength, headers),
      formulation: this.extractValue(row, columnMap.formulation, headers),
      doseInstructions: this.extractValue(row, columnMap.doseInstructions, headers),
      payer: this.extractValue(row, columnMap.payer, headers),
      quantity: this.extractNumber(row, columnMap.quantity, headers),
      unitPrice: this.extractNumber(row, columnMap.unitPrice, headers),
      total: this.extractNumber(row, columnMap.total, headers)
    };
  }

  /**
   * Create column mapping for different file formats
   */
  private createColumnMap(headers: string[]): Record<string, number> {
    const map: Record<string, number> = {};
    
    console.log('Raw headers received:', headers);
    
    headers.forEach((header, index) => {
      if (!header) return; // Skip empty headers
      
      const lowerHeader = String(header).toLowerCase().trim();
      console.log(`Processing header "${header}" (${lowerHeader}) at index ${index}`);
      
      // Drug name variations - handle spaces and special characters
      if (lowerHeader.includes('drug') || lowerHeader.includes('medication') || lowerHeader.includes('medicine') || 
          lowerHeader.includes('name') || lowerHeader.includes('product') || lowerHeader.includes('item') ||
          lowerHeader === 'drug name') {
        map.drugName = index;
        console.log(`  -> Mapped to drugName`);
      }
      
      // Patient name variations - handle spaces and special characters
      if (lowerHeader.includes('patient') || lowerHeader.includes('patient name') || lowerHeader.includes('patient\'s name') || 
          lowerHeader.includes('patient\'s') || lowerHeader.includes('patient\'s name') || lowerHeader.includes('patient\'s name')) {
        map.patientName = index;
        console.log(`  -> Mapped to patientName`);
      }
      
      // Strength variations
      if (lowerHeader.includes('strength') || lowerHeader.includes('dosage') || lowerHeader.includes('mg') || 
          lowerHeader.includes('mcg') || lowerHeader.includes('ml') || lowerHeader.includes('units')) {
        map.strength = index;
        console.log(`  -> Mapped to strength`);
      }
      
      // Formulation variations
      if (lowerHeader.includes('formulation') || lowerHeader.includes('form') || lowerHeader.includes('type') || 
          lowerHeader.includes('dosage form') || lowerHeader.includes('presentation')) {
        map.formulation = index;
        console.log(`  -> Mapped to formulation`);
      }
      
      // Dose instructions variations
      if (lowerHeader.includes('dose') || lowerHeader.includes('instruction') || lowerHeader.includes('directions') || 
          lowerHeader.includes('sig') || lowerHeader.includes('how to take')) {
        map.doseInstructions = index;
        console.log(`  -> Mapped to doseInstructions`);
      }
      
      // Payer variations
      if (lowerHeader.includes('payer') || lowerHeader.includes('insurance') || lowerHeader.includes('plan') || 
          lowerHeader.includes('coverage') || lowerHeader.includes('benefit')) {
        map.payer = index;
        console.log(`  -> Mapped to payer`);
      }
      
      // Quantity variations
      if (lowerHeader.includes('qty') || lowerHeader.includes('quantity') || lowerHeader.includes('amount') || 
          lowerHeader.includes('count') || lowerHeader.includes('number') || lowerHeader.includes('units dispensed')) {
        map.quantity = index;
        console.log(`  -> Mapped to quantity`);
      }
      
      // Unit price variations - handle spaces and special characters
      // Be careful not to match "total" columns (e.g., "Total Cost")
      if (
        (
          lowerHeader.includes('unit') && (lowerHeader.includes('price') || lowerHeader.includes('cost'))
        ) ||
        lowerHeader.includes('per unit') ||
        lowerHeader === 'unit price'
      ) {
        map.unitPrice = index;
        console.log(`  -> Mapped to unitPrice`);
      }
      
      // Total variations
      if (lowerHeader.includes('total') || lowerHeader.includes('sum') || lowerHeader.includes('subtotal') || 
          lowerHeader.includes('amount') || lowerHeader.includes('cost') || lowerHeader.includes('line total')) {
        map.total = index;
        console.log(`  -> Mapped to total`);
      }
    });
    
    console.log('Final column mapping:', map);
    return map;
  }

  /**
   * Check if required columns are present
   */
  private hasRequiredColumns(columnMap: Record<string, number>): boolean {
    // Make this less strict - only require drug name and at least some pricing info
    const essential = ['drugName'];
    const pricing = ['unitPrice', 'total'];
    
    const hasEssential = essential.every(col => columnMap[col] !== undefined);
    const hasPricing = pricing.some(col => columnMap[col] !== undefined);
    
    console.log('Column validation:', { hasEssential, hasPricing, columnMap });
    
    return hasEssential && hasPricing;
  }

  /**
   * Extract value from array-based data (Excel)
   */
  private extractValue(row: any[], columnIndex: number, headers: string[]): string {
    if (columnIndex === undefined || columnIndex === null) {
      // Column not mapped; treat as optional and return empty string
      return '';
    }
    const value = row[columnIndex];
    if (value === undefined || value === null) {
      // Missing cell; treat as empty for optional fields
      return '';
    }
    return String(value).trim();
  }

  /**
   * Extract number from array-based data (Excel)
   */
  private extractNumber(row: any[], columnIndex: number, headers: string[]): number {
    if (columnIndex === undefined || columnIndex === null) {
      // Column not mapped; treat as 0
      return 0;
    }
    const value = this.extractValue(row, columnIndex, headers);
    const cleaned = String(value).replace(/[$,]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) {
      // Treat invalid/missing numeric cell as 0 instead of throwing, to avoid dropping the row
      return 0;
    }
    return num;
  }

  /**
   * Extract value from object-based data (CSV)
   */
  private extractValueFromObject(row: any, columnIndex: number): string {
    const headers = Object.keys(row);
    const header = headers[columnIndex];
    if (!header) {
      throw new Error(`Column index ${columnIndex} not found`);
    }
    const value = row[header];
    if (value === undefined || value === null) {
      throw new Error(`Missing value for column: ${header}`);
    }
    return String(value).trim();
  }

  /**
   * Extract number from object-based data (CSV)
   */
  private extractNumberFromObject(row: any, columnIndex: number): number {
    const value = this.extractValueFromObject(row, columnIndex);
    const num = parseFloat(value.replace(/[$,]/g, ''));
    if (isNaN(num)) {
      throw new Error(`Invalid number value: ${value}`);
    }
    return num;
  }

  /**
   * Extract Patient Name from PDF text content
   */
  private extractPatientNameFromPDF(textContent: string): string {
    console.log('🔍 Starting Patient Name extraction from PDF...');
    
    // Look for patient name patterns in the PDF text, but avoid header rows
    const patientPatterns = [
      /Patient Name[:\s-]+([^\n\r]+)/i,
      /Patient[:\s-]+([^\n\r]+)/i,
      /Invoice[:\s-]+([^\n\r]+)/i,
      /For[:\s-]+([^\n\r]+)/i
    ];
    
    for (const pattern of patientPatterns) {
      const match = textContent.match(pattern);
      if (match && match[1]) {
        const patientName = match[1].trim();
        // Avoid returning header-like text
        if (patientName && 
            patientName.length > 0 && 
            patientName.length < 100 &&
            !patientName.toLowerCase().includes('drug name') &&
            !patientName.toLowerCase().includes('strength') &&
            !patientName.toLowerCase().includes('formulation') &&
            !patientName.toLowerCase().includes('unit price') &&
            !patientName.toLowerCase().includes('payer') &&
            !patientName.toLowerCase().includes('quantity')) {
          console.log(`✅ Found Patient Name in PDF: "${patientName}"`);
          return patientName;
        }
      }
    }
    
    // Look for the first data row that contains a patient name
    const lines = textContent.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 20 && trimmedLine.length < 200) { // Reasonable length for a data row
        // Check if this line contains a drug name (indicating it's a data row)
        const drugPatterns = [
          /Amoxicillin|Lisinopril|Metformin|Simvastatin|Omeprazole|Azithromycin|Clonazepam|Prednisone/i
        ];
        
        for (const drugPattern of drugPatterns) {
          const drugMatch = trimmedLine.match(drugPattern);
          if (drugMatch) {
            // This is a data row, extract the patient name (first part before drug name)
            const drugIndex = trimmedLine.indexOf(drugMatch[0]);
            if (drugIndex > 0) {
              const patientName = trimmedLine.substring(0, drugIndex).trim();
              if (patientName && patientName.length > 0 && patientName.length < 50) {
                console.log(`✅ Found Patient Name from data row: "${patientName}"`);
                return patientName;
              }
            }
          }
        }
      }
    }
    
    // Fallback: look for common patient name patterns in data rows
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 0 && trimmedLine.length < 100) {
        // Check if line looks like a patient name (not a header, not empty, not too long)
        if (!trimmedLine.toLowerCase().includes('drug') && 
            !trimmedLine.toLowerCase().includes('strength') &&
            !trimmedLine.toLowerCase().includes('formulation') &&
            !trimmedLine.toLowerCase().includes('price') &&
            !trimmedLine.toLowerCase().includes('payer') &&
            !trimmedLine.toLowerCase().includes('quantity') &&
            !trimmedLine.toLowerCase().includes('patient name') &&
            !trimmedLine.toLowerCase().includes('pharmacy invoice') &&
            trimmedLine.includes(' ') && // Has spaces (likely a name)
            !trimmedLine.includes('•') && // Not a bullet point
            !trimmedLine.includes(':')) { // Not a label
          console.log(`✅ Found potential Patient Name in PDF: "${trimmedLine}"`);
          return trimmedLine;
        }
      }
    }
    
    console.log('❌ Patient Name not found in PDF, using default');
    return 'PDF Patient';
  }

  /**
   * Extract table data from PDF text content
   */
  private extractTableDataFromPDF(textContent: string): string[][] {
    console.log('🔍 Extracting table data from PDF...');
    
    const lines = textContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const tableData: string[][] = [];
    
    console.log('PDF lines:', lines);
    
    // Find the table section by looking for header patterns
    let tableStartIndex = -1;
    const headerPatterns = ['Patient Name', 'Drug Name', 'Strength', 'Formulation', 'Unit Price', 'Payer', 'Quantity'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatches = headerPatterns.filter(header => 
        line.toLowerCase().includes(header.toLowerCase())
      );
      
      if (headerMatches.length >= 3) { // At least 3 header matches
        tableStartIndex = i;
        console.log(`✅ Found table header at line ${i}: "${line}"`);
        break;
      }
    }
    
    if (tableStartIndex === -1) {
      console.log('⚠️  No table header found, trying to parse all lines as data');
      tableStartIndex = 0;
    }
    
    // Parse table rows
    for (let i = tableStartIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip lines that are clearly not data rows
      if (line.toLowerCase().includes('total') || 
          line.toLowerCase().includes('summary') ||
          line.toLowerCase().includes('invoice') ||
          line.length < 10) {
        continue;
      }
      
      console.log(`Processing line ${i}: "${line}"`);
      
      // Split the line by common delimiters
      let columns: string[] = [];
      
      // Try different splitting strategies
      if (line.includes(',')) {
        columns = line.split(',').map(col => col.trim());
      } else if (line.includes('\t')) {
        columns = line.split('\t').map(col => col.trim());
      } else {
        // Try to split by multiple spaces or by looking for patterns
        // For PDFs, we need to be more sophisticated about splitting
        
        // Look for drug names that are typically followed by strength
        const drugPatterns = [
          /(Amoxicillin|Lisinopril|Metformin|Simvastatin|Omeprazole|Azithromycin|Clonazepam|Prednisone)/i,
          /(\d+(?:\.\d+)?\s*(?:mg|IU|units?))/i,  // Strength pattern
          /(Capsule|Tablet|Injection|Solution|Suspension|Tablet \(ER\)|Capsule \(DR\))/i,  // Formulation
          /(\d+(?:\.\d+)?)/i,  // Price pattern
          /(medicare|medicaid)/i,  // Payer pattern
          /(\d+)/i  // Quantity pattern
        ];
        
        // Try to extract data using patterns
        let currentLine = line;
        columns = [];
        
        // Extract patient name (first part before drug name)
        const drugMatch = currentLine.match(drugPatterns[0]);
        if (drugMatch) {
          const drugIndex = currentLine.indexOf(drugMatch[1]);
          if (drugIndex > 0) {
            const patientName = currentLine.substring(0, drugIndex).trim();
            columns.push(patientName);
            currentLine = currentLine.substring(drugIndex);
          } else {
            columns.push(''); // No patient name found
          }
        } else {
          columns.push(''); // No drug name found
        }
        
        // Extract drug name
        if (drugMatch) {
          columns.push(drugMatch[1]);
          currentLine = currentLine.substring(drugMatch[1].length);
        } else {
          columns.push('');
        }
        
        // Extract strength
        const strengthMatch = currentLine.match(drugPatterns[1]);
        if (strengthMatch) {
          columns.push(strengthMatch[1]);
          currentLine = currentLine.substring(strengthMatch[1].length);
        } else {
          columns.push('');
        }
        
        // Extract formulation
        const formulationMatch = currentLine.match(drugPatterns[2]);
        if (formulationMatch) {
          columns.push(formulationMatch[1]);
          currentLine = currentLine.substring(formulationMatch[1].length);
        } else {
          columns.push('');
        }
        
        // Extract unit price
        const priceMatch = currentLine.match(drugPatterns[3]);
        if (priceMatch) {
          columns.push(priceMatch[1]);
          currentLine = currentLine.substring(priceMatch[1].length);
        } else {
          columns.push('');
        }
        
        // Extract payer
        const payerMatch = currentLine.match(drugPatterns[4]);
        if (payerMatch) {
          columns.push(payerMatch[1]);
          currentLine = currentLine.substring(payerMatch[1].length);
        } else {
          columns.push('');
        }
        
        // Extract quantity
        const quantityMatch = currentLine.match(drugPatterns[5]);
        if (quantityMatch) {
          columns.push(quantityMatch[1]);
        } else {
          columns.push('');
        }
      }
      
      // If we have a reasonable number of columns, add the row
      if (columns.length >= 4) {
        // Pad with empty strings if we don't have enough columns
        while (columns.length < 7) {
          columns.push('');
        }
        tableData.push(columns);
        console.log(`📋 Added table row: [${columns.join(', ')}]`);
      } else {
        console.log(`⚠️  Skipping row with insufficient columns (${columns.length}): [${columns.join(', ')}]`);
      }
    }
    
    console.log(`✅ Extracted ${tableData.length} table rows from PDF`);
    return tableData;
  }

  /**
   * Extract Patient Name from Excel file headers or data rows.
   * This is a heuristic to find the patient name in the first few rows.
   */
  private extractPatientNameFromExcel(jsonData: any[]): string {
    console.log('🔍 Starting Patient Name extraction from Excel...');
    
    // First, look for patient name in the first few rows (headers or data)
    for (let rowIndex = 0; rowIndex < Math.min(5, jsonData.length); rowIndex++) {
      const row = jsonData[rowIndex];
      if (Array.isArray(row)) {
        for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
          const cell = row[cellIndex];
          const cellStr = String(cell).trim();
          
          // Skip empty cells
          if (!cellStr || cellStr === '') continue;
          
          console.log(`  Row ${rowIndex}, Cell ${cellIndex}: "${cellStr}"`);
          
          // Look for cells that contain patient name patterns
          if (cellStr.toLowerCase().includes('patient name') || 
              cellStr.toLowerCase().includes('patient:') ||
              cellStr.toLowerCase().includes('patient -') ||
              cellStr.toLowerCase().includes('patient - ')) {
            
            // If this cell contains "Patient Name", look for the actual name in adjacent cells
            if (cellStr.toLowerCase().includes('patient name')) {
              // Check the next cell for the actual patient name
              if (cellIndex + 1 < row.length) {
                const nextCell = row[cellIndex + 1];
                const nextCellStr = String(nextCell).trim();
                if (nextCellStr && nextCellStr !== '' && !nextCellStr.toLowerCase().includes('patient')) {
                  console.log(`✅ Found Patient Name: "${nextCellStr}"`);
                  return nextCellStr;
                }
              }
              
              // Check the cell below for the actual patient name
              if (rowIndex + 1 < jsonData.length) {
                const nextRow = jsonData[rowIndex + 1];
                if (Array.isArray(nextRow) && cellIndex < nextRow.length) {
                  const belowCell = nextRow[cellIndex];
                  const belowCellStr = String(belowCell).trim();
                  if (belowCellStr && belowCellStr !== '' && !belowCellStr.toLowerCase().includes('patient')) {
                    console.log(`✅ Found Patient Name below: "${belowCellStr}"`);
                    return belowCellStr;
                  }
                }
              }
            }
            
            // If this cell contains a colon or dash, extract the name part
            if (cellStr.includes(':') || cellStr.includes('-')) {
              const parts = cellStr.split(/[:|-]/);
              if (parts.length > 1) {
                const namePart = parts[1].trim();
                if (namePart && namePart !== '' && !namePart.toLowerCase().includes('patient')) {
                  console.log(`✅ Found Patient Name from separator: "${namePart}"`);
                  return namePart;
                }
              }
            }
          }
        }
      }
    }
    
    console.log('❌ Patient Name not found in Excel file');
    return '';
  }
}
