import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBService } from '../../services/dynamodb';
import { SNSService } from '../../services/sns';
import { MonitoringService } from '../../services/monitoring';
import { authenticateUser } from '../../utils/auth';
import { parseRequestBody } from '../../utils/validation';
import { createSessionSchema } from '../../utils/validation';
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse } from '../../utils/response';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  try {
    // Authenticate user
    const currentUser = authenticateUser(event);
    
    // Parse and validate request body
    const sessionData = parseRequestBody(createSessionSchema, event.body);
    
    // Verify that the current user is the student or has admin/counsellor role
    if (currentUser.sub !== sessionData.studentId && 
        !['admin', 'counsellor'].includes(currentUser.role)) {
      await MonitoringService.recordApiCall(
        '/api/sessions',
        'POST',
        403,
        Date.now() - startTime
      );
      return forbiddenResponse('Insufficient permissions to create session');
    }

    // Verify that student exists
    const student = await DynamoDBService.getUser(sessionData.studentId);
    if (!student) {
      await MonitoringService.recordApiCall(
        '/api/sessions',
        'POST',
        404,
        Date.now() - startTime
      );
      return notFoundResponse('Student');
    }

    // Verify that counsellor exists
    const counsellor = await DynamoDBService.getUser(sessionData.counsellorId);
    if (!counsellor || counsellor.role !== 'counsellor') {
      await MonitoringService.recordApiCall(
        '/api/sessions',
        'POST',
        404,
        Date.now() - startTime
      );
      return notFoundResponse('Counsellor');
    }

    // Create session
    const session = await DynamoDBService.createSession({
      studentId: sessionData.studentId,
      counsellorId: sessionData.counsellorId,
      scheduledAt: sessionData.scheduledAt,
      type: sessionData.type || 'individual',
      notes: sessionData.notes,
    });

    // Send notifications
    try {
      // Notify student
      await SNSService.sendSessionBookingNotification(
        sessionData.studentId,
        {
          sessionId: session.id,
          studentName: `${student.firstName} ${student.lastName}`,
          counsellorName: `${counsellor.firstName} ${counsellor.lastName}`,
          scheduledAt: sessionData.scheduledAt,
        }
      );

      // Notify counsellor
      await SNSService.sendSessionBookingNotification(
        sessionData.counsellorId,
        {
          sessionId: session.id,
          studentName: `${student.firstName} ${student.lastName}`,
          counsellorName: `${counsellor.firstName} ${counsellor.lastName}`,
          scheduledAt: sessionData.scheduledAt,
        }
      );
    } catch (notificationError) {
      console.error('Failed to send notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    // Record successful session creation
    await MonitoringService.recordSessionBooking(sessionData.type || 'individual', true);
    await MonitoringService.recordUserAction('create_session', currentUser.sub, currentUser.role);
    await MonitoringService.recordApiCall(
      '/api/sessions',
      'POST',
      201,
      Date.now() - startTime
    );

    return successResponse(session, 'Session created successfully', 201);

  } catch (error) {
    console.error('Create session error:', error);
    
    await MonitoringService.recordSessionBooking('individual', false);
    await MonitoringService.recordApiCall(
      '/api/sessions',
      'POST',
      500,
      Date.now() - startTime
    );

    return errorResponse(error, 500, 'Failed to create session');
  }
};

