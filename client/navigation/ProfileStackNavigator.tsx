import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '@/screens/ProfileScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import ConnectionsScreen from '@/screens/ConnectionsScreen';
import ReviewsScreen from '@/screens/ReviewsScreen';
import PaymentHistoryScreen from '@/screens/PaymentHistoryScreen';
import WalletScreen from '@/screens/WalletScreen';
import WalletTopupScreen from '@/screens/WalletTopupScreen';
import DisputesScreen from '@/screens/DisputesScreen';
import CreateDisputeScreen from '@/screens/CreateDisputeScreen';
import DisputeDetailScreen from '@/screens/DisputeDetailScreen';
import { useScreenOptions } from '@/hooks/useScreenOptions';

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Connections: undefined;
  Reviews: undefined;
  PaymentHistory: undefined;
  Wallet: undefined;
  WalletTopup: undefined;
  Disputes: undefined;
  CreateDispute: {
    parcelId: string;
    respondentId: string;
    parcelInfo?: {
      origin: string;
      destination: string;
      compensation: number;
    };
  };
  DisputeDetail: { disputeId: string };
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
          headerTitle: 'Profile',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: 'Settings',
        }}
      />
      <Stack.Screen
        name="Connections"
        component={ConnectionsScreen}
        options={{
          headerTitle: 'My Connections',
        }}
      />
      <Stack.Screen
        name="Reviews"
        component={ReviewsScreen}
        options={{
          headerTitle: 'My Reviews',
        }}
      />
      <Stack.Screen
        name="PaymentHistory"
        component={PaymentHistoryScreen}
        options={{
          headerTitle: 'Payment History',
        }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          headerTitle: 'My Wallet',
        }}
      />
      <Stack.Screen
        name="WalletTopup"
        component={WalletTopupScreen}
        options={{
          headerTitle: 'Top Up Wallet',
        }}
      />
      <Stack.Screen
        name="Disputes"
        component={DisputesScreen}
        options={{
          headerTitle: 'My Disputes',
        }}
      />
      <Stack.Screen
        name="CreateDispute"
        component={CreateDisputeScreen}
        options={{
          headerTitle: 'File Dispute',
        }}
      />
    </Stack.Navigator>
  );
}
