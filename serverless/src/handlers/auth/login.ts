import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBService } from '../../services/dynamodb';
import { MonitoringService } from '../../services/monitoring';
import { generateToken, hashPassword, comparePassword } from '../../utils/auth';
import { parseRequestBody } from '../../utils/validation';
import { loginSchema } from '../../utils/validation';
import { successResponse, errorResponse, unauthorizedResponse } from '../../utils/response';
import { nanoid } from 'nanoid';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  try {
    // Parse and validate request body
    const loginData = parseRequestBody(loginSchema, event.body);
    
    // Find user by email
    const user = await DynamoDBService.getUserByEmail(loginData.email);
    
    if (!user) {
      await MonitoringService.recordApiCall(
        '/api/login',
        'POST',
        401,
        Date.now() - startTime
      );
      return unauthorizedResponse('Invalid credentials');
    }

    // TODO: In production, implement proper password hashing and verification
    // For now, we'll accept any password for the demo
    // In production, you should use bcrypt or similar to hash/verify passwords
    // const isValidPassword = await comparePassword(loginData.password, user.password);
    // if (!isValidPassword) {
    //   return unauthorizedResponse('Invalid credentials');
    // }

    // Generate JWT token
    const token = generateToken(user);

    // Record successful login
    await MonitoringService.recordUserAction('login', user.id, user.role);
    await MonitoringService.recordApiCall(
      '/api/login',
      'POST',
      200,
      Date.now() - startTime
    );

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImageUrl: user.profileImageUrl,
      },
      token,
      message: 'Login successful',
    });

  } catch (error) {
    console.error('Login error:', error);
    
    await MonitoringService.recordApiCall(
      '/api/login',
      'POST',
      500,
      Date.now() - startTime
    );

    return errorResponse(error, 500, 'Login failed');
  }
};

