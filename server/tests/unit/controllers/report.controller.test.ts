/**
 * Report Controller Unit Tests
 *
 * Tests: generate, downloadPDF, downloadCSV
 * The controller is a class instance (reportController) with asyncHandler-wrapped methods.
 */

import { jest } from '@jest/globals';

// 1. Infrastructure mocks
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

setupDbMock();
setupLoggerMock();
setupCacheMock();

// 2. Mock report generation service
const mockReportGenerationService = {
  generateReport: jest.fn<any>(),
  generatePDF: jest.fn<any>(),
  generateCSV: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/report-generation.service.js', () => ({
  reportGenerationService: mockReportGenerationService,
}));

// 3. Dynamic imports (AFTER mocks)
const { reportController } = await import('../../../src/controllers/report.controller.js');

const { createAuthReq, createRes, createNext, callHandler, getJsonBody, getStatus } =
  await import('../../helpers/controller-harness.js');

beforeEach(() => {
  jest.clearAllMocks();
});

// Helper: assert 401 for unauthenticated requests
async function expectUnauth(handler: (...args: unknown[]) => unknown) {
  const req = createAuthReq();
  (req as any).user = undefined;
  const res = createRes();
  const next = createNext();

  await callHandler(handler, req, res, next);

  expect(next).toHaveBeenCalled();
  const error = (next as jest.Mock<any>).mock.calls[0][0];
  expect(error.statusCode).toBe(401);
}

// ─── generate ───────────────────────────────────────────────

describe('reportController.generate', () => {
  it('should generate a report with default period (month)', async () => {
    const report = { period: 'month', data: { income: 5000 } };
    mockReportGenerationService.generateReport.mockResolvedValue(report);

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(reportController.generate, req, res, next);

    expect(mockReportGenerationService.generateReport).toHaveBeenCalledWith('user-1', 'month');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(report);
    expect(body.message).toBe('Report generated successfully');
  });

  it('should accept valid period query param', async () => {
    const report = { period: 'quarter', data: {} };
    mockReportGenerationService.generateReport.mockResolvedValue(report);

    const req = createAuthReq({ userId: 'user-1' }, { query: { period: 'quarter' } });
    const res = createRes();
    const next = createNext();

    await callHandler(reportController.generate, req, res, next);

    expect(mockReportGenerationService.generateReport).toHaveBeenCalledWith('user-1', 'quarter');
  });

  it('should accept all valid period values', async () => {
    for (const period of ['week', 'month', 'quarter', 'year']) {
      jest.clearAllMocks();
      mockReportGenerationService.generateReport.mockResolvedValue({ period });

      const req = createAuthReq({ userId: 'user-1' }, { query: { period } });
      const res = createRes();
      const next = createNext();

      await callHandler(reportController.generate, req, res, next);

      expect(mockReportGenerationService.generateReport).toHaveBeenCalledWith('user-1', period);
      expect(getStatus(res)).toBe(200);
    }
  });

  it('should throw 400 for invalid period', async () => {
    const req = createAuthReq({ userId: 'user-1' }, { query: { period: 'decade' } });
    const res = createRes();
    const next = createNext();

    await callHandler(reportController.generate, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should throw 401 when not authenticated', async () => {
    await expectUnauth(reportController.generate);
  });

  it('should propagate service errors via next', async () => {
    mockReportGenerationService.generateReport.mockRejectedValue(new Error('Service down'));

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(reportController.generate, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.message).toBe('Service down');
  });
});

// ─── downloadPDF ────────────────────────────────────────────

describe('reportController.downloadPDF', () => {
  it('should generate PDF and set correct headers', async () => {
    const report = { period: 'month', data: {} };
    const pdfBuffer = Buffer.from('fake-pdf-content');
    mockReportGenerationService.generateReport.mockResolvedValue(report);
    mockReportGenerationService.generatePDF.mockResolvedValue(pdfBuffer);

    const req = createAuthReq({ userId: 'user-1' }, { query: { period: 'month' } });
    const res = createRes();
    const next = createNext();

    await callHandler(reportController.downloadPDF, req, res, next);

    expect(mockReportGenerationService.generateReport).toHaveBeenCalledWith('user-1', 'month');
    expect(mockReportGenerationService.generatePDF).toHaveBeenCalledWith(report, 'user-1');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('attachment; filename="balencia-report-month-')
    );
    expect(res.send).toHaveBeenCalledWith(pdfBuffer);
  });

  it('should use default period when not specified', async () => {
    mockReportGenerationService.generateReport.mockResolvedValue({ period: 'month' });
    mockReportGenerationService.generatePDF.mockResolvedValue(Buffer.from('pdf'));

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(reportController.downloadPDF, req, res, next);

    expect(mockReportGenerationService.generateReport).toHaveBeenCalledWith('user-1', 'month');
  });

  it('should throw 401 when not authenticated', async () => {
    await expectUnauth(reportController.downloadPDF);
  });
});

// ─── downloadCSV ────────────────────────────────────────────

describe('reportController.downloadCSV', () => {
  it('should generate CSV and set correct headers', async () => {
    const report = { period: 'week', data: {} };
    const csvContent = 'date,amount,category\n2025-01-01,50,food';
    mockReportGenerationService.generateReport.mockResolvedValue(report);
    mockReportGenerationService.generateCSV.mockResolvedValue(csvContent);

    const req = createAuthReq({ userId: 'user-1' }, { query: { period: 'week' } });
    const res = createRes();
    const next = createNext();

    await callHandler(reportController.downloadCSV, req, res, next);

    expect(mockReportGenerationService.generateReport).toHaveBeenCalledWith('user-1', 'week');
    expect(mockReportGenerationService.generateCSV).toHaveBeenCalledWith(report);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('attachment; filename="balencia-report-week-')
    );
    expect(res.send).toHaveBeenCalledWith(csvContent);
  });

  it('should use default period when not specified', async () => {
    mockReportGenerationService.generateReport.mockResolvedValue({ period: 'month' });
    mockReportGenerationService.generateCSV.mockResolvedValue('csv-data');

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(reportController.downloadCSV, req, res, next);

    expect(mockReportGenerationService.generateReport).toHaveBeenCalledWith('user-1', 'month');
  });

  it('should throw 401 when not authenticated', async () => {
    await expectUnauth(reportController.downloadCSV);
  });

  it('should propagate service errors via next', async () => {
    mockReportGenerationService.generateReport.mockRejectedValue(new Error('CSV generation failed'));

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(reportController.downloadCSV, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.message).toBe('CSV generation failed');
  });
});
