/**
 * Upload Middleware Unit Tests
 *
 * Tests the upload middleware factory functions and the multer error handler.
 * The actual multer upload processing is integration-level (needs multipart
 * parsing), so we test configuration and error handling here.
 */

import { jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

// Mock the r2 service to provide MAX_FILE_SIZE without needing AWS config
jest.unstable_mockModule('../../../src/services/r2.service.js', () => ({
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  default: {},
}));

const {
  createUploadMiddleware,
  createMultiUploadMiddleware,
  createFieldsUploadMiddleware,
  handleUploadError,
} = await import('../../../src/middlewares/upload.middleware.js');

const { createReq, createRes, createNext: _createNext } = await import(
  '../../helpers/controller-harness.js'
);

// Multer MulterError needs to be imported to create instances
const multer = (await import('multer')).default;

describe('upload middleware', () => {
  describe('factory functions', () => {
    it('should return a middleware function from createUploadMiddleware', () => {
      const mw = createUploadMiddleware('image', 'photo');
      expect(typeof mw).toBe('function');
    });

    it('should return a middleware function from createMultiUploadMiddleware', () => {
      const mw = createMultiUploadMiddleware('image', 'photos', 5);
      expect(typeof mw).toBe('function');
    });

    it('should return a middleware function from createFieldsUploadMiddleware', () => {
      const mw = createFieldsUploadMiddleware([
        { name: 'avatar', maxCount: 1 },
        { name: 'documents', maxCount: 5 },
      ]);
      expect(typeof mw).toBe('function');
    });
  });

  describe('handleUploadError', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let nextFn: jest.Mock<any>;

    beforeEach(() => {
      req = createReq();
      res = createRes();
      nextFn = jest.fn() as jest.Mock<any>;
    });

    it('should return 400 with FILE_TOO_LARGE for LIMIT_FILE_SIZE', () => {
      const err = new multer.MulterError('LIMIT_FILE_SIZE');

      handleUploadError(err, req as Request, res as Response, nextFn as NextFunction);

      expect(res.status).toHaveBeenCalledWith(400);
      const body = (res.json as jest.Mock<any>).mock.calls[0][0];
      expect(body.code).toBe('FILE_TOO_LARGE');
      expect(body.success).toBe(false);
    });

    it('should return 400 with TOO_MANY_FILES for LIMIT_FILE_COUNT', () => {
      const err = new multer.MulterError('LIMIT_FILE_COUNT');

      handleUploadError(err, req as Request, res as Response, nextFn as NextFunction);

      expect(res.status).toHaveBeenCalledWith(400);
      const body = (res.json as jest.Mock<any>).mock.calls[0][0];
      expect(body.code).toBe('TOO_MANY_FILES');
    });

    it('should return 400 with UNEXPECTED_FIELD for LIMIT_UNEXPECTED_FILE', () => {
      const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'wrongField');

      handleUploadError(err, req as Request, res as Response, nextFn as NextFunction);

      expect(res.status).toHaveBeenCalledWith(400);
      const body = (res.json as jest.Mock<any>).mock.calls[0][0];
      expect(body.code).toBe('UNEXPECTED_FIELD');
    });

    it('should pass non-multer errors to next()', () => {
      const err = new Error('Something else');

      handleUploadError(err, req as Request, res as Response, nextFn as NextFunction);

      expect(nextFn).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
