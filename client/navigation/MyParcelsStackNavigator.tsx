import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MyParcelsScreen from "@/screens/MyParcelsScreen";
import ParcelDetailScreen from "@/screens/ParcelDetailScreen";
import EditParcelScreen from "@/screens/EditParcelScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type MyParcelsStackParamList = {
  MyParcels: undefined;
  ParcelDetail: { parcelId: string };
  EditParcel: { parcelId: string };
};

const Stack = createNativeStackNavigator<MyParcelsStackParamList>();

export default function MyParcelsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="MyParcels"
        component={MyParcelsScreen}
        options={{
          headerTitle: "My Parcels",
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
        name="EditParcel"
        component={EditParcelScreen}
        options={{
          headerTitle: "Edit Parcel",
        }}
      />
    </Stack.Navigator>
  );
}
