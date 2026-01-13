import React, { useState } from 'react';
import { View, StyleSheet, Image, Pressable, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useParcelPhotos } from '@/hooks/useParcelPhotos';

interface PhotoCaptureProps {
  parcelId: string;
  photoType: 'pickup' | 'delivery';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PhotoCapture({ parcelId, photoType, onSuccess, onCancel }: PhotoCaptureProps) {
  const { theme } = useTheme();
  const { capturePhoto, uploadPhoto, isUploading } = useParcelPhotos(parcelId);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

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
      Alert.alert('Camera Error', error.message || 'Failed to capture photo');
    }
  };

  const handleUpload = async () => {
    if (!photoData) return;

    try {
      await uploadPhoto({
        photoData,
        photoType,
        caption: caption || undefined,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Photo Uploaded',
        `${photoType === 'pickup' ? 'Pickup' : 'Delivery'} photo uploaded successfully`,
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error: any) {
      Alert.alert('Upload Error', error.message || 'Failed to upload photo');
    }
  };

  const handleRetake = () => {
    setPhotoData(null);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  if (!photoData) {
    return (
      <Card elevation={2} style={styles.captureCard}>
        <View style={[styles.captureArea, { backgroundColor: theme.backgroundSecondary }]}>
          <View
            style={[
              styles.cameraIconContainer,
              {
                backgroundColor: Colors.primary + '20',
                borderColor: Colors.primary,
              },
            ]}
          >
            <Feather name="camera" size={64} color={Colors.primary} />
          </View>
          <ThemedText type="h3" style={{ marginTop: Spacing.lg, textAlign: 'center' }}>
            {photoType === 'pickup' ? 'Capture Pickup Photo' : 'Capture Delivery Photo'}
          </ThemedText>
          <ThemedText
            type="body"
            style={{ color: theme.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }}
          >
            Take a clear photo of the parcel {photoType === 'pickup' ? 'before pickup' : 'after delivery'}
          </ThemedText>
        </View>
        <View style={styles.captureActions}>
          <Button onPress={handleCapturePhoto} size="large">
            <View style={styles.buttonContent}>
              <Feather name="camera" size={20} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.sm, fontWeight: '600' }}>
                Take Photo
              </ThemedText>
            </View>
          </Button>
          {onCancel ? (
            <Button onPress={onCancel} variant="outline" size="large" style={{ marginTop: Spacing.md }}>
              Cancel
            </Button>
          ) : null}
        </View>
      </Card>
    );
  }

  return (
    <Card elevation={2} style={styles.previewCard}>
      <Image source={{ uri: photoData }} style={styles.photoPreview} resizeMode="cover" />
      <View style={styles.previewOverlay}>
        <View style={styles.previewBadge}>
          <Feather name="check-circle" size={20} color={Colors.success} />
          <ThemedText type="body" style={{ color: Colors.success, marginLeft: Spacing.xs, fontWeight: '600' }}>
            Photo Captured
          </ThemedText>
        </View>
      </View>
      <View style={styles.previewActions}>
        <Button onPress={handleRetake} variant="outline" style={{ flex: 1 }}>
          <View style={styles.buttonContent}>
            <Feather name="rotate-ccw" size={18} color={Colors.primary} />
            <ThemedText type="body" style={{ color: Colors.primary, marginLeft: Spacing.xs, fontWeight: '600' }}>
              Retake
            </ThemedText>
          </View>
        </Button>
        <Button onPress={handleUpload} disabled={isUploading} style={{ flex: 1 }}>
          <View style={styles.buttonContent}>
            <Feather name="upload" size={18} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.xs, fontWeight: '600' }}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </ThemedText>
          </View>
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  captureCard: {
    overflow: 'hidden',
  },
  captureArea: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  cameraIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureActions: {
    padding: Spacing.lg,
  },
  previewCard: {
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 400,
  },
  previewOverlay: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  previewActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
