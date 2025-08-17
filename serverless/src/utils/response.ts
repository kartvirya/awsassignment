import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiResponse } from '../types';

export const createResponse = (
  statusCode: number,
  body: any,
  headers: Record<string, string> = {}
): APIGatewayProxyResult => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
  };

  return {
    statusCode,
    headers: { ...defaultHeaders, ...headers },
    body: JSON.stringify(body),
  };
};

export const successResponse = <T>(
  data: T,
  message?: string,
  statusCode: number = 200
): APIGatewayProxyResult => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };

  return createResponse(statusCode, response);
};

export const errorResponse = (
  error: string | Error,
  statusCode: number = 500,
  message?: string
): APIGatewayProxyResult => {
  const errorMessage = error instanceof Error ? error.message : error;
  
  const response: ApiResponse = {
    success: false,
    error: errorMessage,
    message,
  };

  return createResponse(statusCode, response);
};

export const validationErrorResponse = (errors: string[]): APIGatewayProxyResult => {
  return errorResponse(
    'Validation failed',
    400,
    errors.join(', ')
  );
};

export const notFoundResponse = (resource: string): APIGatewayProxyResult => {
  return errorResponse(
    `${resource} not found`,
    404
  );
};

export const unauthorizedResponse = (message: string = 'Unauthorized'): APIGatewayProxyResult => {
  return errorResponse(
    message,
    401
  );
};

export const forbiddenResponse = (message: string = 'Access denied'): APIGatewayProxyResult => {
  return errorResponse(
    message,
    403
  );
};

export const conflictResponse = (message: string = 'Resource conflict'): APIGatewayProxyResult => {
  return errorResponse(
    message,
    409
  );
};

