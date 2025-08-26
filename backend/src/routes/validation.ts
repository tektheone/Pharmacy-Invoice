import { Router, Request, Response, NextFunction } from 'express';
import { ValidationError } from '../middleware/errorHandler';
import { ValidationHistoryService } from '../services/validationHistoryService';

const router = Router();
const validationHistoryService = ValidationHistoryService.getInstance();

/**
 * GET /api/validation/history
 * Get validation history for the user
 */
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real application, you would:
    // 1. Get the user ID from authentication middleware
    // 2. Query a database for the user's validation history
    // 3. Apply pagination, filtering, etc.
    
    // Get history from service
    const history = validationHistoryService.getHistory();
    res.json({
      success: true,
      data: history,
      message: 'Validation history retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/validation/history
 * Add a new validation result to history
 */
router.post('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = req.body;
    
    if (!validationResult || !validationResult.id) {
      throw new ValidationError('Invalid validation result data');
    }
    
    // Add timestamp if not present
    if (!validationResult.uploadedAt) {
      validationResult.uploadedAt = new Date().toISOString();
    }
    
    // Add to history using service
    validationHistoryService.addToHistory(validationResult);
    
    res.status(201).json({
      success: true,
      message: 'Validation result added to history',
      data: validationResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/validation/history/:id
 * Delete a specific validation result from history
 */
router.delete('/history/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const deleted = validationHistoryService.deleteById(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Validation result not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Validation result deleted successfully',
      data: deleted,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/validation/history/:id
 * Get a specific validation result by ID
 */
router.get('/history/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const validation = validationHistoryService.getById(id);
    if (!validation) {
      return res.status(404).json({
        success: false,
        message: 'Validation result not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: validation,
      message: 'Validation result retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export { router as validationRouter };
