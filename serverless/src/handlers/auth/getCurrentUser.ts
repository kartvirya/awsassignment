import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBService } from '../../services/dynamodb';
import { MonitoringService } from '../../services/monitoring';
import { authenticateUser } from '../../utils/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '../../utils/response';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  try {
    // Authenticate user
    const decoded = authenticateUser(event);
    
    // Get user from database
    const user = await DynamoDBService.getUser(decoded.sub);
    
    if (!user) {
      await MonitoringService.recordApiCall(
        '/api/auth/user',
        'GET',
        404,
        Date.now() - startTime
      );
      return unauthorizedResponse('User not found');
    }

    // Record successful request
    await MonitoringService.recordUserAction('get_profile', user.id, user.role);
    await MonitoringService.recordApiCall(
      '/api/auth/user',
      'GET',
      200,
      Date.now() - startTime
    );

    return successResponse({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

  } catch (error) {
    console.error('Get current user error:', error);
    
    await MonitoringService.recordApiCall(
      '/api/auth/user',
      'GET',
      401,
      Date.now() - startTime
    );

    return errorResponse(error, 401, 'Authentication failed');
  }
};

