import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "@/screens/ProfileScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import ConnectionsScreen from "@/screens/ConnectionsScreen";
import ReviewsScreen from "@/screens/ReviewsScreen";
<<<<<<< HEAD
import PaymentHistoryScreen from "@/screens/PaymentHistoryScreen";
import ReceiptScreen from "@/screens/ReceiptScreen";
=======
>>>>>>> origin/payments
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Connections: undefined;
  Reviews: undefined;
<<<<<<< HEAD
  PaymentHistory: undefined;
  Receipt: { payment: any };
=======
>>>>>>> origin/payments
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerTitle: "Profile",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: "Settings",
        }}
      />
      <Stack.Screen
        name="Connections"
        component={ConnectionsScreen}
        options={{
          headerTitle: "My Connections",
        }}
      />
      <Stack.Screen
        name="Reviews"
        component={ReviewsScreen}
        options={{
          headerTitle: "My Reviews",
        }}
      />
<<<<<<< HEAD
      <Stack.Screen
        name="PaymentHistory"
        component={PaymentHistoryScreen}
        options={{
          headerTitle: "Transaction History",
        }}
      />
      <Stack.Screen
        name="Receipt"
        component={ReceiptScreen}
        options={{
          headerTitle: "Receipt",
        }}
      />
=======
>>>>>>> origin/payments
    </Stack.Navigator>
  );
}
