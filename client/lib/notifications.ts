import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get FCM token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return null;
    }

    // Get FCM token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      console.error('Project ID not found. Make sure to configure EAS in app.json');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('FCM Token:', token.data);

    // Set notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Send FCM token to backend
 */
export async function syncFCMTokenWithBackend(fcmToken: string): Promise<void> {
  try {
    const authToken = await AsyncStorage.getItem('firebaseToken');
    
    if (!authToken) {
      console.log('No auth token found, skipping FCM sync');
      return;
    }

    const response = await fetch(`${API_URL}/firebase/fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ fcmToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync FCM token with backend');
    }

    console.log('FCM token synced with backend');
  } catch (error) {
    console.error('Error syncing FCM token:', error);
  }
}

/**
 * Remove FCM token from backend (on logout)
 */
export async function removeFCMTokenFromBackend(): Promise<void> {
  try {
    const authToken = await AsyncStorage.getItem('firebaseToken');
    
    if (!authToken) {
      return;
    }

    const response = await fetch(`${API_URL}/firebase/fcm-token`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to remove FCM token from backend');
    }

    console.log('FCM token removed from backend');
  } catch (error) {
    console.error('Error removing FCM token:', error);
  }
}

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
  listener: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}
