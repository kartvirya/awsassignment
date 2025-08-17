import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBService } from '../services/dynamodb';
import { successResponse, errorResponse } from '../utils/response';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Check database connectivity by attempting a simple operation
    let dbStatus = 'unknown';
    try {
      // Try to get a user that doesn't exist (this will still connect to DB)
      await DynamoDBService.getUser('health-check-user');
      dbStatus = 'connected';
    } catch (error) {
      console.error('Database health check failed:', error);
      dbStatus = 'disconnected';
    }

    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.STAGE || 'dev',
      region: process.env.REGION || 'us-east-1',
      database: dbStatus,
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
      },
      version: process.env.npm_package_version || '1.0.0',
      services: {
        dynamodb: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
        s3: 'available', // S3 is generally always available
        sns: 'available', // SNS is generally always available
        cloudwatch: 'available', // CloudWatch is generally always available
      },
    };

    const statusCode = dbStatus === 'connected' ? 200 : 503;
    
    if (statusCode === 200) {
      return successResponse(status, 'Service is healthy');
    } else {
      return errorResponse('Service is unhealthy', statusCode, 'Database connection failed');
    }

  } catch (error) {
    console.error('Health check error:', error);
    return errorResponse(error, 503, 'Health check failed');
  }
};

