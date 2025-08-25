import { Request, Response, NextFunction } from 'express';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  
  // Log request start
  console.log(`📥 ${req.method} ${req.originalUrl} - Started at ${new Date().toISOString()}`);
  
  // Log request details in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Request details:', {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): any {
    const duration = Date.now() - start;
    
    // Log response
    console.log(`📤 ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    
    // Log response details in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Response details:', {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        headers: res.getHeaders()
      });
    }
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};
