import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import IncomingScreen from "@/screens/IncomingScreen";
import IncomingParcelDetailScreen from "@/screens/IncomingParcelDetailScreen";
import ParcelChatScreen from "@/screens/ParcelChatScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type IncomingStackParamList = {
  Incoming: undefined;
  IncomingParcelDetail: { parcelId: string };
  ParcelChat: { parcelId: string; userRole: "sender" | "carrier" | "receiver" };
};

const Stack = createNativeStackNavigator<IncomingStackParamList>();

export default function IncomingStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Incoming"
        component={IncomingScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Incoming" />,
        }}
      />
      <Stack.Screen
        name="IncomingParcelDetail"
        component={IncomingParcelDetailScreen}
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
    </Stack.Navigator>
  );
}
