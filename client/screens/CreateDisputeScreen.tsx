import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Picker } from '@react-native-picker/picker';

import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useDisputes } from '@/hooks/useDisputes';

type CreateDisputeScreenParams = {
  parcelId: string;
  respondentId: string;
  parcelInfo?: {
    origin: string;
    destination: string;
    compensation: number;
  };
};

type RouteType = RouteProp<{ CreateDispute: CreateDisputeScreenParams }, 'CreateDispute'>;

const DISPUTE_SUBJECTS = [
  'Item not received',
  'Item damaged',
  'Wrong item delivered',
  'Delayed delivery',
  'Poor communication',
  'Payment issue',
  'Other',
];

export default function CreateDisputeScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const route = useRoute<RouteType>();
  const navigation = useNavigation();
  const { parcelId, respondentId, parcelInfo } = route.params;
  const { createDispute } = useDisputes();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject || !description.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (description.trim().length < 20) {
      Alert.alert('Description Too Short', 'Please provide more details about the issue (minimum 20 characters)');
      return;
    }

    setIsSubmitting(true);
    try {
      await createDispute({
        parcelId,
        respondentId,
        subject,
        description: description.trim(),
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Dispute Filed',
        'Your dispute has been submitted. Our team will review it shortly.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Disputes'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to file dispute');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: Spacing.xl,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: Spacing.lg,
        }}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: Colors.error + '20' },
            ]}
          >
            <Feather name="alert-circle" size={48} color={Colors.error} />
          </View>
          <ThemedText type="h2" style={styles.title}>
            File a Dispute
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
            Report an issue with this delivery. Our team will investigate and help resolve it.
          </ThemedText>
        </View>

        {parcelInfo ? (
          <Card elevation={1} style={styles.parcelCard}>
            <View style={styles.parcelHeader}>
              <Feather name="package" size={20} color={Colors.primary} />
              <ThemedText type="h4">Parcel Information</ThemedText>
            </View>
            <View style={styles.parcelInfo}>
              <View style={styles.parcelRow}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Route:
                </ThemedText>
                <ThemedText type="small">
                  {parcelInfo.origin} → {parcelInfo.destination}
                </ThemedText>
              </View>
              <View style={styles.parcelRow}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Compensation:
                </ThemedText>
                <ThemedText type="small">₦{parcelInfo.compensation}</ThemedText>
              </View>
            </View>
          </Card>
        ) : null}

        <View style={styles.formSection}>
          <ThemedText type="body" style={styles.label}>
            Subject *
          </ThemedText>
          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
              },
            ]}
          >
            <Picker
              selectedValue={subject}
              onValueChange={(value) => setSubject(value)}
              style={[styles.picker, { color: theme.text }]}
            >
              <Picker.Item label="Select an issue" value="" />
              {DISPUTE_SUBJECTS.map((subj) => (
                <Picker.Item key={subj} label={subj} value={subj} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formSection}>
          <ThemedText type="body" style={styles.label}>
            Description *
          </ThemedText>
          <View
            style={[
              styles.textAreaContainer,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
              },
            ]}
          >
            <TextInput
              style={[styles.textArea, { color: theme.text }]}
              placeholder="Describe the issue in detail (minimum 20 characters)..."
              placeholderTextColor={theme.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
          <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            {description.length} / 20 characters minimum
          </ThemedText>
        </View>

        <Card elevation={1} style={[styles.warningCard, { backgroundColor: Colors.warning + '10' }]}>
          <View style={styles.warningHeader}>
            <Feather name="info" size={20} color={Colors.warning} />
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              Dispute Guidelines
            </ThemedText>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
            • Be specific and provide accurate details{' \n'}
            • Upload evidence if available{' \n'}
            • Respond promptly to admin inquiries{' \n'}
            • False claims may result in account suspension{' \n'}
            • Disputes auto-close after 7 days if unresolved
          </ThemedText>
        </Card>
      </KeyboardAwareScrollViewCompat>

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
        <Button
          onPress={handleSubmit}
          disabled={isSubmitting || !subject || description.trim().length < 20}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
        </Button>
      </View>
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
    marginBottom: Spacing.xl,
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
  parcelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  pickerContainer: {
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  textAreaContainer: {
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  textArea: {
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  warningCard: {
    marginBottom: Spacing.lg,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
});
