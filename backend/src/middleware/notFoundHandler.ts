import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`
    },
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
    availableEndpoints: [
      'GET / - API information',
      'GET /api/health - Health check',
      'POST /api/upload - Upload and validate invoice files'
    ]
  });
};
