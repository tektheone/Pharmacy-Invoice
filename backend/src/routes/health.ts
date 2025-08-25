import { Router, Request, Response } from 'express';
import { ReferenceDrugService } from '../services/referenceDrugService';

const router = Router();
const referenceDrugService = new ReferenceDrugService();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Check reference drug service
    let referenceDrugStatus = 'unknown';
    let referenceDrugResponseTime = 0;
    
    try {
      const refStartTime = Date.now();
      await referenceDrugService.fetchReferenceDrugs();
      referenceDrugResponseTime = Date.now() - refStartTime;
      referenceDrugStatus = 'healthy';
    } catch (error) {
      referenceDrugStatus = 'unhealthy';
      console.error('Reference drug service health check failed:', error);
    }

    const totalResponseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        api: {
          status: 'healthy',
          responseTime: totalResponseTime
        },
        referenceDrugs: {
          status: referenceDrugStatus,
          responseTime: referenceDrugResponseTime,
          cacheStatus: referenceDrugService.getCacheStatus()
        }
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: {
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /api/health/ready
 * Readiness probe endpoint
 */
router.get('/ready', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/health/live
 * Liveness probe endpoint
 */
router.get('/live', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

export { router as healthRouter };
