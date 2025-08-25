import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    code = 'FILE_TOO_LARGE';
    message = 'File size exceeds limit';
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    code = 'INVALID_FILE_FIELD';
    message = 'Unexpected file field';
  } else if (error.message.includes('Unsupported file type')) {
    statusCode = 400;
    code = 'UNSUPPORTED_FILE_TYPE';
  } else if (error.message.includes('Failed to parse')) {
    statusCode = 400;
    code = 'PARSE_ERROR';
  } else if (error.message.includes('Failed to fetch reference drugs')) {
    statusCode = 503;
    code = 'REFERENCE_API_ERROR';
    message = 'Reference drug service temporarily unavailable';
  }

  // Log error details
  console.error('Error details:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    statusCode,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    },
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  });
};

// Custom error class for operational errors
export class OperationalError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'OPERATIONAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error class
export class ValidationError extends OperationalError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

// File processing error class
export class FileProcessingError extends OperationalError {
  constructor(message: string) {
    super(message, 400, 'FILE_PROCESSING_ERROR');
  }
}

// Reference API error class
export class ReferenceAPIError extends OperationalError {
  constructor(message: string) {
    super(message, 503, 'REFERENCE_API_ERROR');
  }
}
