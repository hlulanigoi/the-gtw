import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';

import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useWallet } from '@/hooks/useWallet';

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000]; // in kobo (₦500, ₦1000, ₦2000, ₦5000)

export default function WalletTopupScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { initializeTopup } = useWallet();

  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleCustomAmountChange = (text: string) => {
    setCustomAmount(text);
    setSelectedAmount(null);
  };

  const handleTopup = async () => {
    let amount = selectedAmount;
    if (!amount && customAmount) {
      amount = parseFloat(customAmount) * 100; // Convert naira to kobo
    }

    if (!amount || amount < 50000) {
      Alert.alert('Invalid Amount', 'Minimum top-up amount is ₦500');
      return;
    }

    setIsProcessing(true);
    try {
      const paymentData = await initializeTopup(amount);

      // Open Paystack payment page
      const result = await WebBrowser.openAuthSessionAsync(
        paymentData.authorizationUrl,
        'parcelpeer://payment-callback'
      );

      if (result.type === 'success') {
        Alert.alert(
          'Payment Initiated',
          'Please complete the payment in the opened browser window',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to initialize payment');
    } finally {
      setIsProcessing(false);
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
              { backgroundColor: Colors.primary + '20' },
            ]}
          >
            <Feather name="plus" size={48} color={Colors.primary} />
          </View>
          <ThemedText type="h2" style={styles.title}>
            Top Up Wallet
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
            Add money to your wallet for faster transactions
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Quick Amounts
          </ThemedText>
          <View style={styles.presetAmountsGrid}>
            {PRESET_AMOUNTS.map((amount) => {
              const isSelected = selectedAmount === amount;
              return (
                <Card
                  key={amount}
                  elevation={isSelected ? 2 : 1}
                  style={[
                    styles.amountCard,
                    isSelected && { borderColor: Colors.primary, borderWidth: 2 },
                  ]}
                  onPress={() => handleSelectAmount(amount)}
                >
                  <ThemedText
                    type="h3"
                    style={{ color: isSelected ? Colors.primary : theme.text }}
                  >
                    ₦{(amount / 100).toLocaleString()}
                  </ThemedText>
                  {isSelected ? (
                    <View style={[styles.checkIcon, { backgroundColor: Colors.primary }]}>
                      <Feather name="check" size={14} color="#FFFFFF" />
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          <ThemedText type="caption" style={{ color: theme.textSecondary, paddingHorizontal: Spacing.md }}>
            or enter custom amount
          </ThemedText>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Custom Amount
          </ThemedText>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: customAmount ? Colors.primary : theme.border,
              },
            ]}
          >
            <ThemedText type="h3" style={{ color: theme.textSecondary }}>
              ₦
            </ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Enter amount (min ₦500)"
              placeholderTextColor={theme.textSecondary}
              value={customAmount}
              onChangeText={handleCustomAmountChange}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Card elevation={1} style={[styles.infoCard, { backgroundColor: Colors.info + '10' }]}>
          <View style={styles.infoRow}>
            <Feather name="info" size={20} color={Colors.info} />
            <View style={{ flex: 1 }}>
              <ThemedText type="body" style={{ fontWeight: '600', marginBottom: Spacing.xs }}>
                Payment Information
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                • Minimum top-up: ₦500{' \n'}
                • Secure payment via Paystack{' \n'}
                • Instant wallet credit{' \n'}
                • Transaction fee may apply
              </ThemedText>
            </View>
          </View>
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
        <Button onPress={handleTopup} disabled={isProcessing || (!selectedAmount && !customAmount)}>
          {isProcessing ? 'Processing...' : 'Proceed to Payment'}
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  presetAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  amountCard: {
    width: '47%',
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    position: 'relative',
  },
  checkIcon: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
  },
  infoCard: {
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
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
