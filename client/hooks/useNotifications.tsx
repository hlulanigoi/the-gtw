import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/query-client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: "message" | "parcel_status" | "review" | "route_match";
  id?: string;
  title?: string;
  body?: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!user) return;

    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notif: Notifications.Notification) => {
        setNotification(notif);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (resp: Notifications.NotificationResponse) => {
        const data = resp.notification.request.content.data as unknown as NotificationData;
        handleNotificationResponse(data);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  const registerForPushNotifications = async () => {
    if (Platform.OS === "web") {
      console.log("Push notifications not supported on web");
      return;
    }

    if (!Device.isDevice) {
      console.log("Push notifications require a physical device");
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Push notification permission not granted");
        setPermissionGranted(false);
        return;
      }

      setPermissionGranted(true);

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      setExpoPushToken(token.data);

      await savePushTokenToServer(token.data);

      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#0A7EA4",
        });
      }
    } catch (error) {
      console.error("Failed to register for push notifications:", error);
    }
  };

  const savePushTokenToServer = async (token: string) => {
    try {
      await apiRequest("POST", "/api/push-tokens", {
        token,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error("Failed to save push token:", error);
    }
  };

  const handleNotificationResponse = (data: NotificationData) => {
    console.log("Notification tapped:", data);
  };

  const requestPermissions = async () => {
    if (Platform.OS === "web") return false;

    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === "granted";
    setPermissionGranted(granted);
    
    if (granted) {
      await registerForPushNotifications();
    }
    
    return granted;
  };

  const scheduleLocalNotification = async (
    title: string,
    body: string,
    data?: Record<string, unknown>
  ) => {
    if (Platform.OS === "web") return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: null,
    });
  };

  return {
    expoPushToken,
    notification,
    permissionGranted,
    requestPermissions,
    scheduleLocalNotification,
  };
}
