import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { useDisputes, Dispute } from '@/hooks/useDisputes';

function DisputeStatusBadge({ status }: { status: Dispute['status'] }) {
  const statusConfig = {
    open: { color: Colors.warning, label: 'Open', icon: 'alert-circle' as const },
    in_review: { color: Colors.info, label: 'In Review', icon: 'eye' as const },
    resolved: { color: Colors.success, label: 'Resolved', icon: 'check-circle' as const },
    closed: { color: Colors.textSecondary, label: 'Closed', icon: 'x-circle' as const },
  };

  const config = statusConfig[status];

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
      <Feather name={config.icon} size={12} color={config.color} />
      <ThemedText type="caption" style={{ color: config.color, fontWeight: '600' }}>
        {config.label}
      </ThemedText>
    </View>
  );
}

function DisputeCard({ dispute, onPress, theme }: { dispute: Dispute; onPress: () => void; theme: any }) {
  return (
    <Card elevation={1} style={styles.disputeCard} onPress={onPress}>
      <View style={styles.disputeHeader}>
        <View style={[styles.disputeIcon, { backgroundColor: Colors.error + '15' }]}>
          <Feather name="alert-triangle" size={20} color={Colors.error} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="body" style={{ fontWeight: '600' }}>
            {dispute.subject}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: 2 }}>
            {new Date(dispute.createdAt).toLocaleDateString()}
          </ThemedText>
        </View>
        <DisputeStatusBadge status={dispute.status} />
      </View>
      <ThemedText
        type="small"
        numberOfLines={2}
        style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
      >
        {dispute.description}
      </ThemedText>
      {dispute.refundAmount ? (
        <View style={styles.refundBadge}>
          <Feather name="dollar-sign" size={14} color={Colors.success} />
          <ThemedText type="caption" style={{ color: Colors.success }}>
            Refund: ₦{(dispute.refundAmount / 100).toFixed(2)}
          </ThemedText>
        </View>
      ) : null}
    </Card>
  );
}

export default function DisputesScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { disputes, isLoading } = useDisputes();

  const [refreshing, setRefreshing] = React.useState(false);
  const [filter, setFilter] = React.useState<'all' | 'open' | 'resolved'>('all');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredDisputes = disputes.filter((dispute) => {
    if (filter === 'all') return true;
    if (filter === 'open') return dispute.status === 'open' || dispute.status === 'in_review';
    if (filter === 'resolved') return dispute.status === 'resolved' || dispute.status === 'closed';
    return true;
  });

  const statusCounts = {
    all: disputes.length,
    open: disputes.filter((d) => d.status === 'open' || d.status === 'in_review').length,
    resolved: disputes.filter((d) => d.status === 'resolved' || d.status === 'closed').length,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'open', 'resolved'] as const).map((filterOption) => {
            const isActive = filter === filterOption;
            return (
              <Pressable
                key={filterOption}
                onPress={() => setFilter(filterOption)}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: isActive ? Colors.primary : theme.backgroundDefault,
                    borderColor: isActive ? Colors.primary : theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="body"
                  style={{
                    color: isActive ? '#FFFFFF' : theme.text,
                    fontWeight: '600',
                  }}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </ThemedText>
                {statusCounts[filterOption] > 0 ? (
                  <View
                    style={[
                      styles.countBadge,
                      {
                        backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : theme.backgroundSecondary,
                      },
                    ]}
                  >
                    <ThemedText
                      type="caption"
                      style={{
                        color: isActive ? '#FFFFFF' : theme.text,
                        fontWeight: '700',
                      }}
                    >
                      {statusCounts[filterOption]}
                    </ThemedText>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Disputes List */}
        {isLoading ? (
          <Card elevation={1} style={styles.emptyCard}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Loading disputes...
            </ThemedText>
          </Card>
        ) : filteredDisputes.length === 0 ? (
          <Card elevation={1} style={styles.emptyCard}>
            <Feather name="inbox" size={48} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              No {filter !== 'all' ? filter : ''} disputes
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
              {filter === 'all'
                ? 'Your disputes will appear here'
                : `You don't have any ${filter} disputes`}
            </ThemedText>
          </Card>
        ) : (
          filteredDisputes.map((dispute) => (
            <DisputeCard
              key={dispute.id}
              dispute={dispute}
              onPress={() => navigation.navigate('DisputeDetail', { disputeId: dispute.id })}
              theme={theme}
            />
          ))
        )}
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
  filterContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  countBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  disputeCard: {
    marginBottom: Spacing.sm,
  },
  disputeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  disputeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  refundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
});
