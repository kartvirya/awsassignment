import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
// Use the AWS SDK v2 that's available in Lambda runtime
const AWS = require('aws-sdk');
import { 
  createResponse, 
  createErrorResponse, 
  authenticate
} from './utils';

const s3 = new AWS.S3();
const sns = new AWS.SNS();

const BUCKET_NAME = process.env.UPLOADS_BUCKET || `college-safe-serverless-${process.env.STAGE || 'dev'}-uploads`;
const TOPIC_ARN = process.env.NOTIFICATIONS_TOPIC_ARN;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, path } = event;
    console.log(`Upload handler: ${httpMethod} ${path}`);

    // Check authentication
    const auth = await authenticate(event);
    if (!auth) {
      return createErrorResponse(401, 'Unauthorized');
    }

    if (httpMethod === 'POST' && path.endsWith('/api/upload')) {
      return await generateUploadUrl(event, auth);
    }
    
    return createErrorResponse(404, 'Not found');
  } catch (error) {
    console.error('Upload handler error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

const generateUploadUrl = async (
  event: APIGatewayProxyEvent, 
  auth: any
): Promise<APIGatewayProxyResult> => {
  try {
    const { fileName, fileType } = JSON.parse(event.body || '{}');
    
    if (!fileName || !fileType) {
      return createErrorResponse(400, 'fileName and fileType are required');
    }

    // Generate unique key for the file
    const key = `${auth.user.claims.sub}/${Date.now()}-${fileName}`;
    
    // Generate presigned URL for upload
    const uploadUrl = s3.getSignedUrl('putObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Expires: 60 * 5, // 5 minutes
      ACL: 'private'
    });
    
    // Generate presigned URL for download
    const downloadUrl = s3.getSignedUrl('getObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: 60 * 60 * 24 // 24 hours
    });

    // Send SNS notification about file upload
    if (TOPIC_ARN) {
      try {
        await sns.publish({
          TopicArn: TOPIC_ARN,
          Message: `New file uploaded: ${fileName} by user ${auth.user.claims.sub}`,
          Subject: 'File Upload Notification'
        }).promise();
      } catch (snsError) {
        console.warn('Failed to send SNS notification:', snsError);
        // Don't fail the request if SNS fails
      }
    }

    return createResponse(200, {
      uploadUrl,
      downloadUrl,
      key,
      message: 'Upload URL generated successfully'
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return createErrorResponse(500, 'Failed to generate upload URL');
  }
};
