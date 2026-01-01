import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MyRoutesScreen from "@/screens/MyRoutesScreen";
import RouteDetailScreen from "@/screens/RouteDetailScreen";
import CreateRouteScreen from "@/screens/CreateRouteScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type MyRoutesStackParamList = {
  MyRoutes: undefined;
  RouteDetail: { routeId: string };
  CreateRoute: undefined;
};

const Stack = createNativeStackNavigator<MyRoutesStackParamList>();

export default function MyRoutesStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="MyRoutes"
        component={MyRoutesScreen}
        options={{
          headerTitle: "My Routes",
        }}
      />
      <Stack.Screen
        name="RouteDetail"
        component={RouteDetailScreen}
        options={{
          headerTitle: "Route Details",
        }}
      />
      <Stack.Screen
        name="CreateRoute"
        component={CreateRouteScreen}
        options={{
          headerTitle: "Create Route",
        }}
      />
    </Stack.Navigator>
  );
}
