import { z } from 'zod';
import { logger } from '../logger.service.js';

export function successResponse(data: Record<string, any>): string {
  return JSON.stringify({ success: true, ...data }, null, 2);
}

export function errorResponse(error: string): string {
  return JSON.stringify({ success: false, error }, null, 2);
}

export function messageResponse(message: string): string {
  return JSON.stringify({ message });
}

export function withErrorHandling(
  toolName: string,
  fn: (userId: string, params: any) => Promise<string>,
): (userId: string, params: any) => Promise<string> {
  return async (userId: string, params: any): Promise<string> => {
    try {
      return await fn(userId, params);
    } catch (error) {
      logger.error(`[LangGraphTools] Error in ${toolName}`, { userId, error });
      return errorResponse(`Failed to execute ${toolName}`);
    }
  };
}

export const dateRangeFields = {
  startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
};

export const paginationFields = {
  page: z.number().optional().describe('Page number (default: 1)'),
  limit: z.number().optional().describe('Items per page (default: 50)'),
};

export const TOOL_ERRORS = {
  ID_REQUIRED: (entity: string) => `${entity} ID is required`,
  NOT_FOUND: (entity: string) => `${entity} not found or access denied`,
  LIMIT_REACHED: (entity: string, max: number) => `Maximum ${max} active ${entity} allowed`,
  NO_FIELDS: 'No valid fields to update',
  CONFIRM_REQUIRED: (action: string) => `Confirmation required to ${action}`,
  UNKNOWN_ACTION: (action: string) => `Unknown action: ${action}`,
};
