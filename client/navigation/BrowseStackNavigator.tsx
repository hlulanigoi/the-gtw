import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BrowseScreen from "@/screens/BrowseScreen";
import ParcelDetailScreen from "@/screens/ParcelDetailScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type BrowseStackParamList = {
  Browse: undefined;
  ParcelDetail: { parcelId: string };
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
    </Stack.Navigator>
  );
}
