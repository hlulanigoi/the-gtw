import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useParcelPhotos } from '@/hooks/useParcelPhotos';

type PhotoVerificationScreenParams = {
  parcelId: string;
  photoType: 'pickup' | 'delivery';
  parcelOrigin?: string;
  parcelDestination?: string;
};

type RouteType = RouteProp<{ PhotoVerification: PhotoVerificationScreenParams }, 'PhotoVerification'>;

export default function PhotoVerificationScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const route = useRoute<RouteType>();
  const navigation = useNavigation();
  const { parcelId, photoType, parcelOrigin, parcelDestination } = route.params;
  const { capturePhoto, uploadPhoto, isUploading } = useParcelPhotos(parcelId);

  const [photoData, setPhotoData] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  const isPickup = photoType === 'pickup';

  const handleCapturePhoto = async () => {
    try {
      const photo = await capturePhoto();
      if (photo) {
        setPhotoData(photo);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to capture photo');
    }
  };

  const handleRetake = () => {
    setPhotoData(null);
    setCaption('');
  };

  const handleUpload = async () => {
    if (!photoData) {
      Alert.alert('No Photo', 'Please capture a photo first');
      return;
    }

    try {
      await uploadPhoto({
        photoData,
        photoType,
        caption: caption.trim() || undefined,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Success',
        isPickup
          ? 'Pickup verified! The parcel is now in transit.'
          : 'Delivery verified! The parcel has been marked as delivered.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload photo');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
            paddingHorizontal: Spacing.lg,
          },
        ]}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isPickup ? Colors.warning + '20' : Colors.success + '20' },
            ]}
          >
            <Feather
              name={isPickup ? 'camera' : 'check-circle'}
              size={48}
              color={isPickup ? Colors.warning : Colors.success}
            />
          </View>
          <ThemedText type="h2" style={styles.title}>
            {isPickup ? 'Verify Pickup' : 'Verify Delivery'}
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
            {isPickup
              ? 'Take a photo of the parcel at pickup location'
              : 'Take a photo of the parcel at delivery location'}
          </ThemedText>
        </View>

        {parcelOrigin && parcelDestination ? (
          <Card elevation={1} style={styles.routeCard}>
            <View style={styles.routeInfo}>
              <Feather name="package" size={20} color={Colors.primary} />
              <View style={styles.routeText}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {isPickup ? 'FROM' : 'TO'}
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  {isPickup ? parcelOrigin : parcelDestination}
                </ThemedText>
              </View>
            </View>
          </Card>
        ) : null}

        <View style={styles.photoSection}>
          {photoData ? (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: photoData }} style={styles.photoPreview} resizeMode="cover" />
              <View style={styles.photoOverlay}>
                <View
                  style={[
                    styles.photoSuccessIcon,
                    { backgroundColor: Colors.success + 'DD' },
                  ]}
                >
                  <Feather name="check" size={32} color="#FFFFFF" />
                </View>
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.photoPlaceholder,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                },
              ]}
            >
              <Feather name="camera" size={64} color={theme.textSecondary} />
              <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                No photo captured yet
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.instructions}>
          <ThemedText type="h4" style={styles.instructionsTitle}>
            Instructions
          </ThemedText>
          <View style={styles.instructionItem}>
            <View style={[styles.instructionDot, { backgroundColor: Colors.primary }]} />
            <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1 }}>
              Ensure the parcel is clearly visible in the photo
            </ThemedText>
          </View>
          <View style={styles.instructionItem}>
            <View style={[styles.instructionDot, { backgroundColor: Colors.primary }]} />
            <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1 }}>
              Take the photo in good lighting conditions
            </ThemedText>
          </View>
          <View style={styles.instructionItem}>
            <View style={[styles.instructionDot, { backgroundColor: Colors.primary }]} />
            <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1 }}>
              GPS location will be automatically recorded
            </ThemedText>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.backgroundRoot,
            paddingBottom: insets.bottom + Spacing.lg,
            borderTopColor: theme.border,
          },
        ]}
      >
        {photoData ? (
          <View style={styles.buttonRow}>
            <Button
              onPress={handleRetake}
              variant="secondary"
              style={{ flex: 1 }}
              disabled={isUploading}
            >
              Retake
            </Button>
            <View style={{ width: Spacing.md }} />
            <Button
              onPress={handleUpload}
              style={{ flex: 1 }}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                `Upload & ${isPickup ? 'Start Transit' : 'Complete'}`
              )}
            </Button>
          </View>
        ) : (
          <Button onPress={handleCapturePhoto}>
            <View style={styles.buttonContent}>
              <Feather name="camera" size={20} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.sm }}>
                Capture Photo
              </ThemedText>
            </View>
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
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
  routeCard: {
    marginBottom: Spacing.xl,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  routeText: {
    flex: 1,
  },
  photoSection: {
    marginBottom: Spacing.xl,
  },
  photoPreviewContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSuccessIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructions: {
    marginTop: 'auto',
  },
  instructionsTitle: {
    marginBottom: Spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  instructionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
