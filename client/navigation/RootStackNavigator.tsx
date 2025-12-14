import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import CreateParcelScreen from "@/screens/CreateParcelScreen";
import RouteFilterScreen from "@/screens/RouteFilterScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  CreateParcel: undefined;
  RouteFilter: undefined;
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
    </Stack.Navigator>
  );
}
