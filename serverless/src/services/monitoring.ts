import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { MetricData } from '../types';

const cloudWatchClient = new CloudWatchClient({ region: process.env.REGION || 'us-east-1' });

export class MonitoringService {
  private static readonly NAMESPACE = 'CollegeSafe/Application';

  static async putMetric(metricData: MetricData): Promise<void> {
    const command = new PutMetricDataCommand({
      Namespace: this.NAMESPACE,
      MetricData: [{
        MetricName: metricData.metricName,
        Value: metricData.value,
        Unit: metricData.unit,
        Dimensions: metricData.dimensions?.map(dim => ({
          Name: dim.name,
          Value: dim.value,
        })),
        Timestamp: new Date(),
      }],
    });

    try {
      await cloudWatchClient.send(command);
      console.log(`Metric ${metricData.metricName} published successfully`);
    } catch (error) {
      console.error('Error publishing metric:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  static async recordApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number
  ): Promise<void> {
    const dimensions = [
      { name: 'Endpoint', value: endpoint },
      { name: 'Method', value: method },
      { name: 'StatusCode', value: statusCode.toString() },
      { name: 'Environment', value: process.env.STAGE || 'dev' },
    ];

    // Record request count
    await this.putMetric({
      namespace: this.NAMESPACE,
      metricName: 'ApiRequestCount',
      value: 1,
      unit: 'Count',
      dimensions,
    });

    // Record response time
    await this.putMetric({
      namespace: this.NAMESPACE,
      metricName: 'ApiResponseTime',
      value: duration,
      unit: 'Milliseconds',
      dimensions,
    });

    // Record error rate
    if (statusCode >= 400) {
      await this.putMetric({
        namespace: this.NAMESPACE,
        metricName: 'ApiErrorCount',
        value: 1,
        unit: 'Count',
        dimensions,
      });
    }
  }

  static async recordDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean
  ): Promise<void> {
    const dimensions = [
      { name: 'Operation', value: operation },
      { name: 'Table', value: table },
      { name: 'Environment', value: process.env.STAGE || 'dev' },
    ];

    // Record operation count
    await this.putMetric({
      namespace: this.NAMESPACE,
      metricName: 'DatabaseOperationCount',
      value: 1,
      unit: 'Count',
      dimensions,
    });

    // Record operation duration
    await this.putMetric({
      namespace: this.NAMESPACE,
      metricName: 'DatabaseOperationDuration',
      value: duration,
      unit: 'Milliseconds',
      dimensions,
    });

    // Record error count
    if (!success) {
      await this.putMetric({
        namespace: this.NAMESPACE,
        metricName: 'DatabaseErrorCount',
        value: 1,
        unit: 'Count',
        dimensions,
      });
    }
  }

  static async recordS3Operation(
    operation: string,
    bucket: string,
    duration: number,
    success: boolean
  ): Promise<void> {
    const dimensions = [
      { name: 'Operation', value: operation },
      { name: 'Bucket', value: bucket },
      { name: 'Environment', value: process.env.STAGE || 'dev' },
    ];

    // Record operation count
    await this.putMetric({
      namespace: this.NAMESPACE,
      metricName: 'S3OperationCount',
      value: 1,
      unit: 'Count',
      dimensions,
    });

    // Record operation duration
    await this.putMetric({
      namespace: this.NAMESPACE,
      metricName: 'S3OperationDuration',
      value: duration,
      unit: 'Milliseconds',
      dimensions,
    });

    // Record error count
    if (!success) {
      await this.putMetric({
        namespace: this.NAMESPACE,
        metricName: 'S3ErrorCount',
        value: 1,
        unit: 'Count',
        dimensions,
      });
    }
  }

  static async recordSNSPublish(
    topic: string,
    success: boolean,
    duration: number
  ): Promise<void> {
    const dimensions = [
      { name: 'Topic', value: topic },
      { name: 'Environment', value: process.env.STAGE || 'dev' },
    ];

    // Record publish count
    await this.putMetric({
      namespace: this.NAMESPACE,
      metricName: 'SNSPublishCount',
      value: 1,
      unit: 'Count',
      dimensions,
    });

    // Record publish duration
    await this.putMetric({
      namespace: this.NAMESPACE,
      metricName: 'SNSPublishDuration',
      value: duration,
      unit: 'Milliseconds',
      dimensions,
    });

    // Record error count
    if (!success) {
      await this.putMetric({
        namespace: this.NAMESPACE,
        metricName: 'SNSErrorCount',
        value: 1,
        unit: 'Count',
        dimensions,
      });
    }
  }

  static async recordUserAction(
    action: string,
    userId: string,
    role: string
  ): Promise<void> {
    const dimensions = [
      { name: 'Action', value: action },
      { name: 'UserRole', value: role },
      { name: 'Environment', value: process.env.STAGE || 'dev' },
    ];

    await this.putMetric({
      namespace: this.NAMESPACE,
      metricName: 'UserActionCount',
      value: 1,
      unit: 'Count',
      dimensions,
    });
  }

  static async recordSessionBooking(
    sessionType: string,
    success: boolean
  ): Promise<void> {
    const dimensions = [
      { name: 'SessionType', value: sessionType },
      { name: 'Environment', value: process.env.STAGE || 'dev' },
    ];

    await this.putMetric({
      namespace: this.NAMESPACE,
      metricName: 'SessionBookingCount',
      value: 1,
      unit: 'Count',
      dimensions,
    });

    if (!success) {
      await this.putMetric({
        namespace: this.NAMESPACE,
        metricName: 'SessionBookingErrorCount',
        value: 1,
        unit: 'Count',
        dimensions,
      });
    }
  }

  static async recordResourceUpload(
    resourceType: string,
    fileSize: number,
    success: boolean
  ): Promise<void> {
    const dimensions = [
      { name: 'ResourceType', value: resourceType },
      { name: 'Environment', value: process.env.STAGE || 'dev' },
    ];

    await this.putMetric({
      namespace: this.NAMESPACE,
      metricName: 'ResourceUploadCount',
      value: 1,
      unit: 'Count',
      dimensions,
    });

    await this.putMetric({
      namespace: this.NAMESPACE,
      metricName: 'ResourceUploadSize',
      value: fileSize,
      unit: 'Bytes',
      dimensions,
    });

    if (!success) {
      await this.putMetric({
        namespace: this.NAMESPACE,
        metricName: 'ResourceUploadErrorCount',
        value: 1,
        unit: 'Count',
        dimensions,
      });
    }
  }

  static async recordLambdaInvocation(
    functionName: string,
    duration: number,
    memoryUsed: number,
    success: boolean
  ): Promise<void> {
    const dimensions = [
      { name: 'FunctionName', value: functionName },
      { name: 'Environment', value: process.env.STAGE || 'dev' },
    ];

    await this.putMetric({
      namespace: this.NAMESPACE,
      metricName: 'LambdaInvocationCount',
      value: 1,
      unit: 'Count',
      dimensions,
    });

    await this.putMetric({
      namespace: this.NAMESPACE,
      metricName: 'LambdaDuration',
      value: duration,
      unit: 'Milliseconds',
      dimensions,
    });

    await this.putMetric({
      namespace: this.NAMESPACE,
      metricName: 'LambdaMemoryUsed',
      value: memoryUsed,
      unit: 'Bytes',
      dimensions,
    });

    if (!success) {
      await this.putMetric({
        namespace: this.NAMESPACE,
        metricName: 'LambdaErrorCount',
        value: 1,
        unit: 'Count',
        dimensions,
      });
    }
  }
}

