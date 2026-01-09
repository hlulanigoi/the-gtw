import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import CreateParcelScreen from "@/screens/CreateParcelScreen";
import RouteFilterScreen from "@/screens/RouteFilterScreen";
<<<<<<< HEAD
=======
import PaymentScreen from "@/screens/PaymentScreen";
import PaymentHistoryScreen from "@/screens/PaymentHistoryScreen";
>>>>>>> origin/payments
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  CreateParcel: undefined;
  RouteFilter: undefined;
<<<<<<< HEAD
=======
  Payment: {
    authorizationUrl: string;
    reference: string;
    parcelId: string;
  };
  PaymentHistory: undefined;
>>>>>>> origin/payments
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateParcel"
        component={CreateParcelScreen}
        options={{
          presentation: "modal",
          headerTitle: "Create Parcel",
        }}
      />
      <Stack.Screen
        name="RouteFilter"
        component={RouteFilterScreen}
        options={{
          presentation: "modal",
          headerTitle: "Filter Routes",
        }}
      />
<<<<<<< HEAD
=======
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PaymentHistory"
        component={PaymentHistoryScreen}
        options={{
          headerShown: false,
        }}
      />
>>>>>>> origin/payments
    </Stack.Navigator>
  );
}
