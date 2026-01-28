import { db } from "./storage";
import { notificationQueue, pushTokens } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class NotificationService {
  /**
   * Queue a notification for a user
   */
  static async queueNotification(
    userId: string,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      await db.insert(notificationQueue).values({
        userId,
        title: payload.title,
        body: payload.body,
        data: payload.data ? JSON.stringify(payload.data) : null,
      });
    } catch (error) {
      console.error("Failed to queue notification:", error);
    }
  }

  /**
   * Send notification immediately to all user's devices
   */
  static async sendImmediateNotification(
    userId: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      // Get user's push tokens
      const tokens = await db
        .select()
        .from(pushTokens)
        .where(eq(pushTokens.userId, userId));

      if (tokens.length === 0) {
        console.log(`No push tokens found for user ${userId}`);
        return false;
      }

      // In a real implementation, you would send via Expo Push Notifications
      // For now, we'll just log and queue it
      console.log(
        `Would send notification to ${tokens.length} devices:`,
        payload
      );

      // Queue for processing
      await this.queueNotification(userId, payload);

      return true;
    } catch (error) {
      console.error("Failed to send immediate notification:", error);
      return false;
    }
  }

  /**
   * Send status update notification
   */
  static async notifyStatusChange(
    userId: string,
    parcelId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      Pending: "Your parcel is waiting for a carrier",
      Paid: "Payment confirmed for your parcel",
      "In Transit": "Your parcel is on its way! 🚚",
      Delivered: "Your parcel has been delivered! 📦",
      Expired: "Your parcel listing has expired",
    };

    await this.sendImmediateNotification(userId, {
      title: "Parcel Status Update",
      body: statusMessages[newStatus] || `Status changed to ${newStatus}`,
      data: {
        type: "status_change",
        parcelId,
        oldStatus,
        newStatus,
      },
    });
  }

  /**
   * Notify receiver about new incoming parcel
   */
  static async notifyNewIncomingParcel(
    receiverId: string,
    parcelId: string,
    senderName: string
  ): Promise<void> {
    await this.sendImmediateNotification(receiverId, {
      title: "Incoming Parcel",
      body: `${senderName} is sending you a parcel`,
      data: {
        type: "new_incoming_parcel",
        parcelId,
      },
    });
  }

  /**
   * Notify when carrier is nearby
   */
  static async notifyCarrierNearby(
    receiverId: string,
    parcelId: string,
    estimatedMinutes: number
  ): Promise<void> {
    await this.sendImmediateNotification(receiverId, {
      title: "Carrier is Nearby! 📍",
      body: `Your delivery will arrive in approximately ${estimatedMinutes} minutes`,
      data: {
        type: "carrier_nearby",
        parcelId,
        estimatedMinutes,
      },
    });
  }

  /**
   * Request delivery confirmation
   */
  static async requestDeliveryConfirmation(
    receiverId: string,
    parcelId: string
  ): Promise<void> {
    await this.sendImmediateNotification(receiverId, {
      title: "Confirm Delivery",
      body: "Have you received your parcel? Please confirm delivery.",
      data: {
        type: "confirm_delivery",
        parcelId,
      },
    });
  }
}
