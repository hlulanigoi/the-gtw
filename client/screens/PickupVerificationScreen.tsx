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

type PickupVerificationScreenParams = {
  parcelId: string;
};

type RouteType = RouteProp<{ PickupVerification: PickupVerificationScreenParams }, 'PickupVerification'>;

export default function PickupVerificationScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const route = useRoute<RouteType>();
  const navigation = useNavigation();
  const { parcelId } = route.params;
  const { parcels, updateParcel } = useParcels();

  const parcel = parcels.find((p) => p.id === parcelId);

  const handlePhotoSuccess = async () => {
    try {
      // Update parcel status to In Transit after pickup photo
      await updateParcel(parcelId, {
        status: 'In Transit',
      });

      Alert.alert(
        'Pickup Verified',
        'Parcel pickup has been verified. You can now start delivery.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to update parcel status:', error);
      navigation.goBack();
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Verification',
      'Are you sure you want to cancel pickup verification?',
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
              { backgroundColor: Colors.warning + '20' },
            ]}
          >
            <Feather name="camera" size={48} color={Colors.warning} />
          </View>
          <ThemedText type="h2" style={styles.title}>
            Verify Pickup
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
            Take a photo of the parcel to verify pickup
          </ThemedText>
        </View>

        {/* Parcel Info */}
        <Card elevation={1} style={styles.parcelCard}>
          <View style={styles.parcelHeader}>
            <Feather name="package" size={20} color={Colors.primary} />
            <ThemedText type="h4">Parcel Details</ThemedText>
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
            <View style={styles.infoRow}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Size:
              </ThemedText>
              <ThemedText type="body">{parcel.size}</ThemedText>
            </View>
            {parcel.description ? (
              <View style={styles.infoRow}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Description:
                </ThemedText>
                <ThemedText type="small" style={{ flex: 1, textAlign: 'right' }}>
                  {parcel.description}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </Card>

        {/* Instructions */}
        <Card elevation={1} style={[styles.instructionsCard, { backgroundColor: Colors.info + '10' }]}>
          <View style={styles.instructionsHeader}>
            <Feather name="info" size={20} color={Colors.info} />
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              Pickup Instructions
            </ThemedText>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
            1. Verify the parcel matches the description{' \n'}
            2. Take a clear photo showing the parcel{' \n'}
            3. Ensure good lighting and focus{' \n'}
            4. Include any identifying labels or markings{' \n'}
            5. Photo will be timestamped and GPS-tagged
          </ThemedText>
        </Card>

        {/* Photo Capture */}
        <PhotoCapture
          parcelId={parcelId}
          photoType="pickup"
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
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  instructionsCard: {
    marginBottom: Spacing.xl,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
