import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3UploadResult } from '../types';

const s3Client = new S3Client({ region: process.env.REGION || 'us-east-1' });
const BUCKET_NAME = process.env.RESOURCES_BUCKET!;

export class S3Service {
  static async uploadFile(
    key: string,
    fileBuffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<S3UploadResult> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: metadata,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    const url = `https://${BUCKET_NAME}.s3.${process.env.REGION || 'us-east-1'}.amazonaws.com/${key}`;

    return {
      key,
      url,
      bucket: BUCKET_NAME,
    };
  }

  static async getFile(key: string): Promise<Buffer | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);
      
      if (!response.Body) {
        return null;
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error getting file from S3:', error);
      return null;
    }
  }

  static async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      return false;
    }
  }

  static async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  static generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  }

  static generateUploadUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  }

  static generateResourceKey(
    userId: string,
    originalName: string,
    resourceType: string
  ): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `resources/${resourceType}/${userId}/${timestamp}_${sanitizedName}`;
  }

  static getFileUrl(key: string): string {
    return `https://${BUCKET_NAME}.s3.${process.env.REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }

  static getCloudFrontUrl(key: string): string {
    // This would be the CloudFront distribution URL
    // You would need to get this from environment variables or CloudFormation outputs
    const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
    if (cloudFrontDomain) {
      return `https://${cloudFrontDomain}/${key}`;
    }
    
    // Fallback to S3 URL
    return this.getFileUrl(key);
  }
}

