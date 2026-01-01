import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MessagesScreen from "@/screens/MessagesScreen";
import ConversationScreen from "@/screens/ConversationScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type MessagesStackParamList = {
  Messages: undefined;
  Conversation: { conversationId: string; userName: string };
};

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export default function MessagesStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          headerTitle: "Messages",
        }}
      />
      <Stack.Screen
        name="Conversation"
        component={ConversationScreen}
        options={({ route }) => ({
          headerTitle: route.params.userName,
        })}
      />
    </Stack.Navigator>
  );
}
