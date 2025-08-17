import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Service } from '../../services/s3';
import { SNSService } from '../../services/sns';
import { MonitoringService } from '../../services/monitoring';
import { authenticateUser, requireCounsellor } from '../../utils/auth';
import { successResponse, errorResponse, forbiddenResponse } from '../../utils/response';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  try {
    // Authenticate and authorize user (only counsellors and admins can upload)
    const currentUser = requireCounsellor(event);
    
    // Check if request has file content
    if (!event.body) {
      await MonitoringService.recordApiCall(
        '/api/resources/upload',
        'POST',
        400,
        Date.now() - startTime
      );
      return errorResponse('No file content provided', 400);
    }

    // Parse multipart form data
    const contentType = event.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      await MonitoringService.recordApiCall(
        '/api/resources/upload',
        'POST',
        400,
        Date.now() - startTime
      );
      return errorResponse('Invalid content type. Expected multipart/form-data', 400);
    }

    // Parse the multipart form data
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      await MonitoringService.recordApiCall(
        '/api/resources/upload',
        'POST',
        400,
        Date.now() - startTime
      );
      return errorResponse('Invalid multipart boundary', 400);
    }

    // Decode base64 body
    const bodyBuffer = Buffer.from(event.body, 'base64');
    
    // Parse multipart data (simplified version)
    const parts = parseMultipartData(bodyBuffer, boundary);
    
    if (parts.length === 0) {
      await MonitoringService.recordApiCall(
        '/api/resources/upload',
        'POST',
        400,
        Date.now() - startTime
      );
      return errorResponse('No file found in request', 400);
    }

    const filePart = parts.find(part => part.filename);
    if (!filePart) {
      await MonitoringService.recordApiCall(
        '/api/resources/upload',
        'POST',
        400,
        Date.now() - startTime
      );
      return errorResponse('No file found in request', 400);
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (filePart.data.length > maxSize) {
      await MonitoringService.recordApiCall(
        '/api/resources/upload',
        'POST',
        400,
        Date.now() - startTime
      );
      return errorResponse('File size exceeds maximum limit of 10MB', 400);
    }

    // Generate S3 key
    const s3Key = S3Service.generateResourceKey(
      currentUser.sub,
      filePart.filename!,
      'resources'
    );

    // Upload to S3
    const uploadStartTime = Date.now();
    const uploadResult = await S3Service.uploadFile(
      s3Key,
      filePart.data,
      filePart.contentType || 'application/octet-stream',
      {
        uploadedBy: currentUser.sub,
        originalName: filePart.filename!,
        uploadedAt: new Date().toISOString(),
      }
    );

    // Record S3 operation
    await MonitoringService.recordS3Operation(
      'upload',
      uploadResult.bucket,
      Date.now() - uploadStartTime,
      true
    );

    // Record successful upload
    await MonitoringService.recordResourceUpload(
      'file',
      filePart.data.length,
      true
    );

    await MonitoringService.recordUserAction('upload_resource', currentUser.sub, currentUser.role);
    await MonitoringService.recordApiCall(
      '/api/resources/upload',
      'POST',
      200,
      Date.now() - startTime
    );

    return successResponse({
      fileUrl: uploadResult.url,
      cloudFrontUrl: S3Service.getCloudFrontUrl(s3Key),
      key: s3Key,
      filename: filePart.filename,
      size: filePart.data.length,
      contentType: filePart.contentType,
    }, 'File uploaded successfully');

  } catch (error) {
    console.error('Upload resource file error:', error);
    
    await MonitoringService.recordResourceUpload('file', 0, false);
    await MonitoringService.recordApiCall(
      '/api/resources/upload',
      'POST',
      500,
      Date.now() - startTime
    );

    return errorResponse(error, 500, 'Failed to upload file');
  }
};

// Helper function to parse multipart form data
interface MultipartPart {
  name: string;
  filename?: string;
  contentType?: string;
  data: Buffer;
}

function parseMultipartData(buffer: Buffer, boundary: string): MultipartPart[] {
  const parts: MultipartPart[] = [];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const endBoundaryBuffer = Buffer.from(`--${boundary}--`);
  
  let start = 0;
  let end = 0;
  
  while (true) {
    // Find next boundary
    end = buffer.indexOf(boundaryBuffer, start);
    if (end === -1) break;
    
    if (start > 0) {
      // Parse the part between boundaries
      const partBuffer = buffer.slice(start, end);
      const part = parsePart(partBuffer);
      if (part) {
        parts.push(part);
      }
    }
    
    start = end + boundaryBuffer.length;
    
    // Check if this is the end boundary
    if (buffer.slice(start, start + 2).toString() === '--') {
      break;
    }
  }
  
  return parts;
}

function parsePart(buffer: Buffer): MultipartPart | null {
  // Find the header/body separator (double CRLF)
  const separator = Buffer.from('\r\n\r\n');
  const separatorIndex = buffer.indexOf(separator);
  
  if (separatorIndex === -1) return null;
  
  const headers = buffer.slice(0, separatorIndex).toString();
  const body = buffer.slice(separatorIndex + separator.length);
  
  // Parse headers
  const nameMatch = headers.match(/name="([^"]+)"/);
  const filenameMatch = headers.match(/filename="([^"]+)"/);
  const contentTypeMatch = headers.match(/Content-Type: ([^\r\n]+)/);
  
  if (!nameMatch) return null;
  
  return {
    name: nameMatch[1],
    filename: filenameMatch?.[1],
    contentType: contentTypeMatch?.[1],
    data: body,
  };
}

