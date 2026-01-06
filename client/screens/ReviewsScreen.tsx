import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useReviews, Review } from "@/hooks/useReviews";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Feather
          key={star}
          name="star"
          size={14}
          color={star <= rating ? Colors.warning : "#E0E0E0"}
        />
      ))}
    </View>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const { theme } = useTheme();
  const formattedDate = new Date(review.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card elevation={1} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={[styles.reviewerAvatar, { backgroundColor: Colors.primary }]}>
          <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            {review.reviewer.name.charAt(0)}
          </ThemedText>
        </View>
        <View style={styles.reviewerInfo}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {review.reviewer.name}
          </ThemedText>
          <View style={styles.reviewMeta}>
            <StarDisplay rating={review.rating} />
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {formattedDate}
            </ThemedText>
          </View>
        </View>
      </View>
      {review.comment ? (
        <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
          {review.comment}
        </ThemedText>
      ) : null}
      <View style={[styles.reviewTypeBadge, { backgroundColor: theme.backgroundSecondary }]}>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {review.reviewType === "sender_to_transporter" ? "As Sender" : "As Carrier"}
        </ThemedText>
      </View>
    </Card>
  );
}

export default function ReviewsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { reviews, isLoading, averageRating, reviewCount } = useReviews();

  const renderItem = ({ item }: { item: Review }) => <ReviewItem review={item} />;

  const ListHeader = () => (
    <View style={styles.statsContainer}>
      <Card elevation={1} style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText type="h1" style={{ color: Colors.primary }}>
              {averageRating !== null ? averageRating.toFixed(1) : "-"}
            </ThemedText>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Feather
                  key={star}
                  name="star"
                  size={16}
                  color={averageRating && star <= Math.round(averageRating) ? Colors.warning : "#E0E0E0"}
                />
              ))}
            </View>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Average Rating
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <ThemedText type="h1" style={{ color: Colors.primary }}>
              {reviewCount}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Total Reviews
            </ThemedText>
          </View>
        </View>
      </Card>
      <ThemedText type="h4" style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }}>
        Recent Reviews
      </ThemedText>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="star" size={48} color={theme.textSecondary} />
      <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
        No Reviews Yet
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
        Reviews from your completed deliveries will appear here
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Loading reviews...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={reviews}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={!isLoading ? ListEmpty : null}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    marginBottom: Spacing.md,
  },
  statsCard: {
    paddingVertical: Spacing.xl,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 60,
    marginHorizontal: Spacing.lg,
  },
  starRow: {
    flexDirection: "row",
    gap: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
  },
  reviewCard: {
    marginBottom: Spacing.md,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewerInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  reviewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  reviewTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
});
