import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { PhotoCapture } from '@/components/PhotoCapture';
import { useParcels } from '@/hooks/useParcels';

type DeliveryVerificationScreenParams = {
  parcelId: string;
};

type RouteType = RouteProp<
  { DeliveryVerification: DeliveryVerificationScreenParams },
  'DeliveryVerification'
>;

export default function DeliveryVerificationScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const route = useRoute<RouteType>();
  const navigation = useNavigation();
  const { parcelId } = route.params;
  const { parcels, confirmDelivery } = useParcels();

  const parcel = parcels.find((p) => p.id === parcelId);

  const handlePhotoSuccess = async () => {
    try {
      // Confirm delivery after photo upload
      await confirmDelivery(parcelId);

      Alert.alert(
        'Delivery Verified',
        'Parcel delivery has been verified. The sender will be notified.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MyParcels' as never),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to confirm delivery:', error);
      Alert.alert('Error', 'Failed to confirm delivery. Please try again.');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Verification',
      'Are you sure you want to cancel delivery verification?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (!parcel) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.emptyContainer}>
          <Feather name="alert-circle" size={48} color={theme.textSecondary} />
          <ThemedText type="h3">Parcel not found</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: Colors.success + '20' },
            ]}
          >
            <Feather name="camera" size={48} color={Colors.success} />
          </View>
          <ThemedText type="h2" style={styles.title}>
            Verify Delivery
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
            Take a photo to verify successful delivery
          </ThemedText>
        </View>

        {/* Parcel Info */}
        <Card elevation={1} style={styles.parcelCard}>
          <View style={styles.parcelHeader}>
            <Feather name="check-circle" size={20} color={Colors.success} />
            <ThemedText type="h4">Delivery Details</ThemedText>
          </View>
          <View style={styles.parcelInfo}>
            <View style={styles.infoRow}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                From:
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                {parcel.origin}
              </ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                To:
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                {parcel.destination}
              </ThemedText>
            </View>
            {parcel.receiverName ? (
              <View style={styles.infoRow}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Receiver:
                </ThemedText>
                <ThemedText type="body">{parcel.receiverName}</ThemedText>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Compensation:
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: '600', color: Colors.success }}>
                ₦{parcel.compensation}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Instructions */}
        <Card elevation={1} style={[styles.instructionsCard, { backgroundColor: Colors.success + '10' }]}>
          <View style={styles.instructionsHeader}>
            <Feather name="check" size={20} color={Colors.success} />
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              Delivery Instructions
            </ThemedText>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
            1. Confirm parcel delivered to correct recipient{' \n'}
            2. Take a clear photo of the delivered parcel{' \n'}
            3. Include delivery location or recipient if possible{' \n'}
            4. Photo serves as proof of delivery{' \n'}
            5. You'll receive compensation after verification
          </ThemedText>
        </Card>

        {/* Warning */}
        <Card elevation={1} style={[styles.warningCard, { backgroundColor: Colors.warning + '10' }]}>
          <View style={styles.warningHeader}>
            <Feather name="alert-triangle" size={18} color={Colors.warning} />
            <ThemedText type="small" style={{ fontWeight: '600' }}>
              Important
            </ThemedText>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            Make sure the parcel is in good condition and delivered to the correct location. False delivery
            claims may result in account suspension.
          </ThemedText>
        </Card>

        {/* Photo Capture */}
        <PhotoCapture
          parcelId={parcelId}
          photoType="delivery"
          onSuccess={handlePhotoSuccess}
          onCancel={handleCancel}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  parcelCard: {
    marginBottom: Spacing.lg,
  },
  parcelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  parcelInfo: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instructionsCard: {
    marginBottom: Spacing.lg,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  warningCard: {
    marginBottom: Spacing.xl,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
