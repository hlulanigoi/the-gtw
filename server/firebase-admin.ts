import * as admin from 'firebase-admin';
import logger from './logger';

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 * Uses environment variables for configuration
 */
export function initializeFirebaseAdmin() {
  // Check if already initialized
  if (firebaseApp) {
    return firebaseApp;
  }

  // Prevent multiple initializations
  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0] as admin.app.App;
    return firebaseApp;
  }

  try {
    // Check if service account is provided as JSON string
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccount) {
      // Parse service account JSON from environment variable
      const serviceAccountConfig = JSON.parse(serviceAccount);
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountConfig),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      
      logger.info('Firebase Admin initialized with service account');
    } else {
      // For development, use minimal configuration
      logger.warn('Firebase Admin initialized in minimal mode - service account not provided');
      logger.warn('Some features may be limited. Set FIREBASE_SERVICE_ACCOUNT in production.');
      
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }

    return firebaseApp;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin', { error });
    throw error;
  }
}

/**
 * Get Firebase Admin instance
 */
export function getFirebaseAdmin(): admin.app.App {
  if (!firebaseApp) {
    firebaseApp = initializeFirebaseAdmin();
  }
  return firebaseApp;
}

/**
 * Get Firebase Auth instance
 */
export function getAuth(): admin.auth.Auth {
  const app = getFirebaseAdmin();
  return admin.auth(app);
}

/**
 * Get Firebase Messaging instance
 */
export function getMessaging(): admin.messaging.Messaging {
  const app = getFirebaseAdmin();
  return admin.messaging(app);
}

/**
 * Verify Firebase ID token
 */
export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error('Failed to verify Firebase token', { error });
    throw new Error('Invalid authentication token');
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<admin.auth.UserRecord | null> {
  try {
    const auth = getAuth();
    const user = await auth.getUserByEmail(email);
    return user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}

/**
 * Get user by UID
 */
export async function getUserByUid(uid: string): Promise<admin.auth.UserRecord | null> {
  try {
    const auth = getAuth();
    const user = await auth.getUser(uid);
    return user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}

/**
 * Send push notification to a single device
 */
export async function sendPushNotification(
  fcmToken: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<string> {
  try {
    const messaging = getMessaging();
    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const messageId = await messaging.send(message);
    logger.info('Push notification sent successfully', { messageId });
    return messageId;
  } catch (error) {
    logger.error('Failed to send push notification', { error, fcmToken });
    throw error;
  }
}

/**
 * Send push notification to multiple devices
 */
export async function sendMulticastNotification(
  fcmTokens: string[],
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<admin.messaging.BatchResponse> {
  try {
    const messaging = getMessaging();
    const message: admin.messaging.MulticastMessage = {
      tokens: fcmTokens,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);
    logger.info('Multicast notification sent', {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
    return response;
  } catch (error) {
    logger.error('Failed to send multicast notification', { error });
    throw error;
  }
}

/**
 * Send notification to a topic
 */
export async function sendTopicNotification(
  topic: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<string> {
  try {
    const messaging = getMessaging();
    const message: admin.messaging.Message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
    };

    const messageId = await messaging.send(message);
    logger.info('Topic notification sent successfully', { messageId, topic });
    return messageId;
  } catch (error) {
    logger.error('Failed to send topic notification', { error, topic });
    throw error;
  }
}

/**
 * Subscribe tokens to a topic
 */
export async function subscribeToTopic(
  tokens: string[],
  topic: string
): Promise<admin.messaging.MessagingTopicManagementResponse> {
  try {
    const messaging = getMessaging();
    const response = await messaging.subscribeToTopic(tokens, topic);
    logger.info('Tokens subscribed to topic', {
      topic,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
    return response;
  } catch (error) {
    logger.error('Failed to subscribe to topic', { error, topic });
    throw error;
  }
}

/**
 * Unsubscribe tokens from a topic
 */
export async function unsubscribeFromTopic(
  tokens: string[],
  topic: string
): Promise<admin.messaging.MessagingTopicManagementResponse> {
  try {
    const messaging = getMessaging();
    const response = await messaging.unsubscribeFromTopic(tokens, topic);
    logger.info('Tokens unsubscribed from topic', {
      topic,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
    return response;
  } catch (error) {
    logger.error('Failed to unsubscribe from topic', { error, topic });
    throw error;
  }
}
