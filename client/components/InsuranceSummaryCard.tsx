import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';

interface InsuranceSummaryCardProps {
  insuranceTier: 'none' | 'basic' | 'standard' | 'premium';
  insuranceFee?: number; // in kobo
  insuranceCoverage?: number; // in kobo
}

export function InsuranceSummaryCard({
  insuranceTier,
  insuranceFee = 0,
  insuranceCoverage = 0,
}: InsuranceSummaryCardProps) {
  const { theme } = useTheme();

  if (insuranceTier === 'none' || !insuranceFee) {
    return (
      <Card elevation={1} style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: Colors.textSecondary + '15' }]}>
            <Feather name="shield-off" size={20} color={Colors.textSecondary} />
          </View>
          <ThemedText type="body" style={{ fontWeight: '600' }}>
            No Insurance
          </ThemedText>
        </View>
        <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
          This parcel is not insured
        </ThemedText>
      </Card>
    );
  }

  const tierConfig = {
    basic: {
      name: 'Basic Coverage',
      color: Colors.info,
      icon: 'shield' as const,
    },
    standard: {
      name: 'Standard Coverage',
      color: Colors.primary,
      icon: 'shield' as const,
    },
    premium: {
      name: 'Premium Coverage',
      color: Colors.warning,
      icon: 'award' as const,
    },
  };

  const config = tierConfig[insuranceTier as keyof typeof tierConfig];

  return (
    <Card elevation={2} style={[styles.card, { borderLeftColor: config.color, borderLeftWidth: 4 }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: config.color + '15' }]}>
          <Feather name={config.icon} size={20} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="body" style={{ fontWeight: '700', color: config.color }}>
            {config.name}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Protected parcel
          </ThemedText>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <View style={styles.detailLabel}>
            <Feather name="shield" size={14} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Coverage Amount
            </ThemedText>
          </View>
          <ThemedText type="body" style={{ fontWeight: '700', color: config.color }}>
            ₦{(insuranceCoverage / 100).toLocaleString()}
          </ThemedText>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLabel}>
            <Feather name="dollar-sign" size={14} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Insurance Fee
            </ThemedText>
          </View>
          <ThemedText type="body" style={{ fontWeight: '600' }}>
            ₦{(insuranceFee / 100).toFixed(2)}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.footer, { backgroundColor: config.color + '10' }]}>
        <Feather name="info" size={14} color={config.color} />
        <ThemedText type="caption" style={{ color: theme.textSecondary, flex: 1 }}>
          Covers loss, damage, or theft during transit
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  detailsContainer: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
});
