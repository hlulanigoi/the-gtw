import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BrowseScreen from "@/screens/BrowseScreen";
import ParcelDetailScreen from "@/screens/ParcelDetailScreen";
import ParcelChatScreen from "@/screens/ParcelChatScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type BrowseStackParamList = {
  Browse: undefined;
  ParcelDetail: { parcelId: string };
  ParcelChat: { parcelId: string; userRole: "sender" | "carrier" | "receiver" };
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
    </Stack.Navigator>
  );
}
