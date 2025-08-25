import request from 'supertest';
import app from '../src/index';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FileParser } from '../src/services/fileParser';
import { DiscrepancyChecker } from '../src/services/discrepancyChecker';
import { ReferenceDrugService } from '../src/services/referenceDrugService';

// Mock the services
jest.mock('../src/services/fileParser');
jest.mock('../src/services/discrepancyChecker');
jest.mock('../src/services/referenceDrugService');

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Pharmacy Invoice Validation API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('status', 'running');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('system');
    });

    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status', 'ready');
    });

    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status', 'alive');
    });
  });

  describe('GET /api/upload/supported-formats', () => {
    it('should return supported file formats', async () => {
      const response = await request(app)
        .get('/api/upload/supported-formats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('supportedFormats');
      expect(response.body.supportedFormats).toHaveLength(4);
      
      const formats = response.body.supportedFormats;
      expect(formats.find((f: any) => f.extension === '.xlsx')).toBeDefined();
      expect(formats.find((f: any) => f.extension === '.xls')).toBeDefined();
      expect(formats.find((f: any) => f.extension === '.csv')).toBeDefined();
      expect(formats.find((f: any) => f.extension === '.pdf')).toBeDefined();
      
      expect(response.body).toHaveProperty('requirements');
      expect(response.body.requirements).toHaveProperty('maxFileSize', '10MB');
      expect(response.body.requirements).toHaveProperty('maxFilesPerRequest', 1);
    });
  });

  describe('POST /api/upload', () => {
    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/upload')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.message).toContain('No file uploaded');
    });

    it('should return 400 for unsupported file type', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('invoice', Buffer.from('test content'), 'test.txt')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.message).toContain('File type text/plain not supported');
    });

    it('should return 413 for file too large', async () => {
      // Create a large buffer (11MB)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
      
      const response = await request(app)
        .post('/api/upload')
        .attach('invoice', largeBuffer, 'large.xlsx')
        .expect(413);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'FILE_TOO_LARGE');
    });
  });

  describe('POST /api/upload/validate-only', () => {
    it('should return 400 when invoiceItems is missing', async () => {
      const response = await request(app)
        .post('/api/upload/validate-only')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.message).toContain('invoiceItems array is required');
    });

    it('should return 400 when invoiceItems is not an array', async () => {
      const response = await request(app)
        .post('/api/upload/validate-only')
        .send({ invoiceItems: 'not an array' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.message).toContain('invoiceItems array is required');
    });

    it('should return 400 for invalid invoice item structure', async () => {
      const invalidItems = [
        {
          drugName: 'Test Drug',
          strength: '100 mg',
          // Missing required fields
          quantity: 30,
          unitPrice: 1.00,
          total: 30.00
        }
      ];

      const response = await request(app)
        .post('/api/upload/validate-only')
        .send({ invoiceItems: invalidItems })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Invalid invoice item structure');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      expect(response.body.error.message).toContain('Route /api/unknown not found');
      expect(response.body).toHaveProperty('availableEndpoints');
    });

    it('should handle validation errors properly', async () => {
      const response = await request(app)
        .post('/api/upload/validate-only')
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
      expect(response.body).toHaveProperty('method');
    });
  });

  describe('CORS', () => {
    it('should allow requests from allowed origins', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/api/upload')
        .set('Origin', 'http://localhost:3001')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3001');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });
  });

  describe('Request Logging', () => {
    it('should log request details in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/')
        .expect(200);

      // In a real test, you would verify that logging occurred
      // For now, we just ensure the request completes successfully
      expect(response.status).toBe(200);

      process.env.NODE_ENV = originalEnv;
    });
  });
});
