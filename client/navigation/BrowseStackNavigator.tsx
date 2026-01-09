import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BrowseScreen from "@/screens/BrowseScreen";
import ParcelDetailScreen from "@/screens/ParcelDetailScreen";
import ParcelChatScreen from "@/screens/ParcelChatScreen";
<<<<<<< HEAD
import CheckoutScreen from "@/screens/CheckoutScreen";
=======
>>>>>>> origin/payments
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type BrowseStackParamList = {
  Browse: undefined;
  ParcelDetail: { parcelId: string };
  ParcelChat: { parcelId: string; userRole: "sender" | "carrier" | "receiver" };
<<<<<<< HEAD
  Checkout: { parcelId: string };
=======
>>>>>>> origin/payments
};

const Stack = createNativeStackNavigator<BrowseStackParamList>();

export default function BrowseStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Browse"
        component={BrowseScreen}
        options={{
          headerTitle: () => <HeaderTitle title="The GTW" />,
        }}
      />
      <Stack.Screen
        name="ParcelDetail"
        component={ParcelDetailScreen}
        options={{
          headerTitle: "Parcel Details",
        }}
      />
      <Stack.Screen
        name="ParcelChat"
        component={ParcelChatScreen}
        options={{
          headerTitle: "Chat",
        }}
      />
<<<<<<< HEAD
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          headerTitle: "Checkout",
        }}
      />
=======
>>>>>>> origin/payments
    </Stack.Navigator>
  );
}
