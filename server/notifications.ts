import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushErrorReceipt } from 'expo-server-sdk';
import { storage } from './storage';
import logger from './logger';

const expo = new Expo();

interface NotificationPayload {
  type: 'message' | 'parcel_status' | 'review' | 'route_match' | 'payment';
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  async sendToUser(userId: string, notification: NotificationPayload) {
    try {
      const pushTokens = await storage.getUserPushTokens(userId);
      
      if (pushTokens.length === 0) {
        logger.info(`No push tokens found for user: ${userId}`);
        return;
      }

      const messages: ExpoPushMessage[] = [];

      for (const tokenRecord of pushTokens) {
        const token = tokenRecord.token;
        
        // Check if token is valid Expo push token
        if (!Expo.isExpoPushToken(token)) {
          logger.warn(`Invalid Expo push token for user ${userId}: ${token}`);
          continue;
        }

        messages.push({
          to: token,
          sound: 'default',
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          priority: 'high',
          channelId: 'default',
        });
      }

      if (messages.length === 0) {
        logger.info(`No valid push tokens for user: ${userId}`);
        return;
      }

      // Send notifications in chunks
      const chunks = expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          logger.error('Error sending push notification chunk:', error);
        }
      }

      // Check for errors in tickets
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket.status === 'error') {
          logger.error(`Push notification error for user ${userId}:`, {
            message: ticket.message,
            details: ticket.details,
          });
          
          // If token is invalid, remove it
          if (ticket.details?.error === 'DeviceNotRegistered') {
            const token = messages[i].to as string;
            await storage.deletePushToken(token);
            logger.info(`Removed invalid push token: ${token}`);
          }
        }
      }

      logger.info(`Sent ${tickets.length} push notifications to user: ${userId}`);
    } catch (error) {
      logger.error(`Failed to send push notification to user ${userId}:`, error);
    }
  }

  async notifyNewMessage(conversationId: string, senderId: string, senderName: string, messageText: string) {
    try {
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) return;

      // Get the recipient user ID
      const recipientId = conversation.participant1Id === senderId 
        ? conversation.participant2Id 
        : conversation.participant1Id;

      await this.sendToUser(recipientId, {
        type: 'message',
        title: `New message from ${senderName}`,
        body: messageText.length > 100 ? messageText.substring(0, 97) + '...' : messageText,
        data: {
          conversationId,
          senderId,
          type: 'message',
        },
      });
    } catch (error) {
      logger.error('Failed to send new message notification:', error);
    }
  }

  async notifyParcelStatusChange(parcelId: string, status: string, userId: string) {
    try {
      const parcel = await storage.getParcel(parcelId);
      if (!parcel) return;

      let title = 'Parcel Status Update';
      let body = '';

      switch (status) {
        case 'In Transit':
          title = 'Parcel Picked Up';
          body = `Your parcel from ${parcel.origin} to ${parcel.destination} is now in transit!`;
          break;
        case 'Delivered':
          title = 'Parcel Delivered';
          body = `Your parcel has been delivered to ${parcel.destination}!`;
          break;
        case 'Expired':
          title = 'Parcel Expired';
          body = `Your parcel listing has expired. Create a new one to find a carrier.`;
          break;
        default:
          body = `Your parcel status has been updated to: ${status}`;
      }

      await this.sendToUser(userId, {
        type: 'parcel_status',
        title,
        body,
        data: {
          parcelId,
          status,
          type: 'parcel_status',
        },
      });
    } catch (error) {
      logger.error('Failed to send parcel status notification:', error);
    }
  }

  async notifyNewReview(revieweeId: string, reviewerName: string, rating: number, parcelId: string) {
    try {
      const stars = '⭐'.repeat(rating);
      
      await this.sendToUser(revieweeId, {
        type: 'review',
        title: 'New Review Received',
        body: `${reviewerName} left you a ${rating}-star review ${stars}`,
        data: {
          parcelId,
          type: 'review',
        },
      });
    } catch (error) {
      logger.error('Failed to send review notification:', error);
    }
  }

  async notifyRouteMatch(userId: string, matchType: 'parcel' | 'route', count: number) {
    try {
      const title = matchType === 'parcel' ? 'Matching Parcels Found' : 'Matching Routes Found';
      const body = matchType === 'parcel'
        ? `${count} parcel${count > 1 ? 's' : ''} match your route! Check them out.`
        : `${count} route${count > 1 ? 's' : ''} match your parcel! Find a carrier now.`;

      await this.sendToUser(userId, {
        type: 'route_match',
        title,
        body,
        data: {
          matchType,
          count,
          type: 'route_match',
        },
      });
    } catch (error) {
      logger.error('Failed to send route match notification:', error);
    }
  }

  async notifyPaymentSuccess(userId: string, amount: number, parcelId: string) {
    try {
      await this.sendToUser(userId, {
        type: 'payment',
        title: 'Payment Successful',
        body: `Your payment of ₦${amount.toLocaleString()} has been processed successfully!`,
        data: {
          parcelId,
          amount,
          type: 'payment',
        },
      });
    } catch (error) {
      logger.error('Failed to send payment notification:', error);
    }
  }
}

export const notificationService = new NotificationService();
