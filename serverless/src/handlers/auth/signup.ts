import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBService } from '../../services/dynamodb';
import { MonitoringService } from '../../services/monitoring';
import { hashPassword } from '../../utils/auth';
import { parseRequestBody } from '../../utils/validation';
import { createUserSchema } from '../../utils/validation';
import { successResponse, errorResponse, conflictResponse } from '../../utils/response';
import { nanoid } from 'nanoid';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  try {
    // Parse and validate request body
    const userData = parseRequestBody(createUserSchema, event.body);
    
    // Check if user already exists
    const existingUser = await DynamoDBService.getUserByEmail(userData.email);
    if (existingUser) {
      await MonitoringService.recordApiCall(
        '/api/signup',
        'POST',
        409,
        Date.now() - startTime
      );
      return conflictResponse('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user ID
    const userId = `user-${Date.now()}-${nanoid(9)}`;

    // Create new user
    const newUser = await DynamoDBService.createUser({
      id: userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      // In a real application, you would store the hashed password
      // For now, we'll skip password storage for the demo
    });

    // Record successful signup
    await MonitoringService.recordUserAction('signup', newUser.id, newUser.role);
    await MonitoringService.recordApiCall(
      '/api/signup',
      'POST',
      201,
      Date.now() - startTime
    );

    return successResponse({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
    }, 'User created successfully', 201);

  } catch (error) {
    console.error('Signup error:', error);
    
    await MonitoringService.recordApiCall(
      '/api/signup',
      'POST',
      500,
      Date.now() - startTime
    );

    return errorResponse(error, 500, 'Failed to create user');
  }
};

