import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { useInsurance, InsuranceTier } from '@/hooks/useInsurance';

interface InsuranceSelectorProps {
  declaredValue: number; // in kobo
  selectedTier: 'none' | 'basic' | 'standard' | 'premium';
  onSelectTier: (tier: 'none' | 'basic' | 'standard' | 'premium', fee: number, coverage: number) => void;
}

export function InsuranceSelector({ declaredValue, selectedTier, onSelectTier }: InsuranceSelectorProps) {
  const { theme } = useTheme();
  const { tiers, calculateInsurance } = useInsurance();
  const [recommendedTier, setRecommendedTier] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (declaredValue > 0) {
      setIsCalculating(true);
      calculateInsurance(declaredValue)
        .then((result) => {
          setRecommendedTier(result.recommendedTier);
        })
        .catch((error) => {
          console.error('Failed to calculate insurance:', error);
        })
        .finally(() => {
          setIsCalculating(false);
        });
    } else {
      setRecommendedTier(null);
    }
  }, [declaredValue]);

  const tierColors = {
    none: Colors.textSecondary,
    basic: Colors.info,
    standard: Colors.primary,
    premium: Colors.warning,
  };

  const tierIcons = {
    none: 'shield-off' as const,
    basic: 'shield' as const,
    standard: 'shield' as const,
    premium: 'award' as const,
  };

  const filteredTiers = tiers.filter((tier) => tier.tier !== 'none');

  if (filteredTiers.length === 0) {
    return (
      <Card elevation={1} style={styles.emptyCard}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
          Loading insurance options...
        </ThemedText>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="h4">Select Insurance Coverage</ThemedText>
        {declaredValue > 0 && isCalculating ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : null}
      </View>

      {/* No Insurance Option */}
      <Card
        elevation={selectedTier === 'none' ? 2 : 1}
        style={[
          styles.tierCard,
          selectedTier === 'none' && {
            borderColor: Colors.textSecondary,
            borderWidth: 2,
          },
        ]}
        onPress={() => onSelectTier('none', 0, 0)}
      >
        <View style={styles.tierHeader}>
          <View style={[styles.tierIcon, { backgroundColor: Colors.textSecondary + '15' }]}>
            <Feather name="shield-off" size={24} color={Colors.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="body" style={{ fontWeight: '700' }}>
              No Insurance
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Proceed without coverage
            </ThemedText>
          </View>
          {selectedTier === 'none' ? (
            <View style={[styles.checkIcon, { backgroundColor: Colors.textSecondary }]}>
              <Feather name="check" size={16} color="#FFFFFF" />
            </View>
          ) : null}
        </View>
        <View style={[styles.tierFooter, { borderTopColor: theme.border }]}>
          <ThemedText type="h4" style={{ color: Colors.textSecondary }}>
            ₦0
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            No coverage
          </ThemedText>
        </View>
      </Card>

      {/* Insurance Tiers */}
      {filteredTiers.map((tier) => {
        const isSelected = selectedTier === tier.tier;
        const isRecommended = recommendedTier === tier.tier;
        const tierColor = tierColors[tier.tier];

        return (
          <Card
            key={tier.tier}
            elevation={isSelected ? 2 : 1}
            style={[
              styles.tierCard,
              isSelected && {
                borderColor: tierColor,
                borderWidth: 2,
              },
            ]}
            onPress={() => onSelectTier(tier.tier, tier.fee, tier.coverage)}
          >
            {isRecommended ? (
              <View style={[styles.recommendedBadge, { backgroundColor: Colors.success }]}>
                <Feather name="star" size={12} color="#FFFFFF" />
                <ThemedText type="caption" style={{ color: '#FFFFFF', fontWeight: '700', marginLeft: 4 }}>
                  RECOMMENDED
                </ThemedText>
              </View>
            ) : null}
            <View style={styles.tierHeader}>
              <View style={[styles.tierIcon, { backgroundColor: tierColor + '15' }]}>
                <Feather name={tierIcons[tier.tier]} size={24} color={tierColor} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="body" style={{ fontWeight: '700', color: tierColor }}>
                  {tier.name}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {tier.description}
                </ThemedText>
              </View>
              {isSelected ? (
                <View style={[styles.checkIcon, { backgroundColor: tierColor }]}>
                  <Feather name="check" size={16} color="#FFFFFF" />
                </View>
              ) : null}
            </View>
            <View style={[styles.tierBody, { backgroundColor: theme.backgroundSecondary }]}>
              <View style={styles.coverageRow}>
                <Feather name="shield" size={16} color={tierColor} />
                <ThemedText type="small" style={{ fontWeight: '600' }}>
                  Coverage: ₦{(tier.coverage / 100).toLocaleString()}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.tierFooter, { borderTopColor: theme.border }]}>
              <ThemedText type="h4" style={{ color: tierColor }}>
                ₦{(tier.fee / 100).toFixed(2)}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Insurance fee
              </ThemedText>
            </View>
          </Card>
        );
      })}

      {/* Info Card */}
      <Card elevation={1} style={[styles.infoCard, { backgroundColor: Colors.info + '10' }]}>
        <View style={styles.infoHeader}>
          <Feather name="info" size={18} color={Colors.info} />
          <ThemedText type="small" style={{ fontWeight: '600' }}>
            About Insurance
          </ThemedText>
        </View>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
          Insurance protects your parcel value during transit. Fee is one-time and non-refundable.
          Coverage applies to loss, damage, or theft during delivery.
        </ThemedText>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  tierCard: {
    position: 'relative',
    overflow: 'visible',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  tierIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBody: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  coverageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tierFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  infoCard: {
    marginTop: Spacing.sm,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
