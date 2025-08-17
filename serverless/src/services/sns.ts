import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Notification } from '../types';

const snsClient = new SNSClient({ region: process.env.REGION || 'us-east-1' });
const TOPIC_ARN = process.env.NOTIFICATIONS_TOPIC!;

export class SNSService {
  static async sendNotification(notification: Notification): Promise<string> {
    const message = {
      type: notification.type,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      timestamp: new Date().toISOString(),
    };

    const command = new PublishCommand({
      TopicArn: TOPIC_ARN,
      Message: JSON.stringify(message),
      MessageAttributes: {
        'notification_type': {
          DataType: 'String',
          StringValue: notification.type,
        },
        'user_id': {
          DataType: 'String',
          StringValue: notification.userId,
        },
      },
    });

    try {
      const result = await snsClient.send(command);
      console.log('Notification sent successfully:', result.MessageId);
      return result.MessageId!;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  static async sendSessionBookingNotification(
    userId: string,
    sessionData: {
      sessionId: string;
      studentName: string;
      counsellorName: string;
      scheduledAt: string;
    }
  ): Promise<string> {
    const notification: Notification = {
      type: 'session_booking',
      userId,
      title: 'New Session Booking',
      message: `A new session has been booked with ${sessionData.counsellorName} on ${new Date(sessionData.scheduledAt).toLocaleDateString()}`,
      data: sessionData,
    };

    return this.sendNotification(notification);
  }

  static async sendSessionUpdateNotification(
    userId: string,
    sessionData: {
      sessionId: string;
      status: string;
      scheduledAt: string;
    }
  ): Promise<string> {
    const notification: Notification = {
      type: 'session_update',
      userId,
      title: 'Session Update',
      message: `Your session scheduled for ${new Date(sessionData.scheduledAt).toLocaleDateString()} has been ${sessionData.status}`,
      data: sessionData,
    };

    return this.sendNotification(notification);
  }

  static async sendMessageNotification(
    userId: string,
    messageData: {
      messageId: string;
      senderName: string;
      content: string;
    }
  ): Promise<string> {
    const notification: Notification = {
      type: 'message_received',
      userId,
      title: 'New Message',
      message: `You have received a new message from ${messageData.senderName}`,
      data: messageData,
    };

    return this.sendNotification(notification);
  }

  static async sendResourceUploadNotification(
    userId: string,
    resourceData: {
      resourceId: string;
      title: string;
      type: string;
      uploadedBy: string;
    }
  ): Promise<string> {
    const notification: Notification = {
      type: 'resource_uploaded',
      userId,
      title: 'New Resource Available',
      message: `A new ${resourceData.type} resource "${resourceData.title}" has been uploaded`,
      data: resourceData,
    };

    return this.sendNotification(notification);
  }

  static async sendBulkNotifications(
    notifications: Notification[]
  ): Promise<string[]> {
    const promises = notifications.map(notification => 
      this.sendNotification(notification)
    );

    return Promise.all(promises);
  }

  static async sendCustomNotification(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<string> {
    const notification: Notification = {
      type: 'session_booking', // Default type, can be customized
      userId,
      title,
      message,
      data,
    };

    return this.sendNotification(notification);
  }
}

