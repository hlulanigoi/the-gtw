import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
<<<<<<< HEAD
import { apiRequest } from "./query-client";
=======
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
>>>>>>> origin/payments

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (Platform.OS === "web") {
    console.log("Push notifications not supported on web in Expo Go");
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permission not granted for push notifications");
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId 
      ?? Constants.easConfig?.projectId
      ?? process.env.EXPO_PUBLIC_PROJECT_ID;

    if (!projectId) {
      console.log("No project ID found for push notifications");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    const token = tokenData.data;

<<<<<<< HEAD
    try {
      await apiRequest("PATCH", `/api/users/${userId}`, {
        expoPushToken: token,
      });
    } catch (error) {
      console.error("Error syncing push token:", error);
    }
=======
    await setDoc(
      doc(db, "users", userId),
      { expoPushToken: token },
      { merge: true }
    );
>>>>>>> origin/payments

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0A7EA4",
      });
    }

    return token;
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
}

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
    },
    trigger: null,
  });
}

export function addNotificationListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
