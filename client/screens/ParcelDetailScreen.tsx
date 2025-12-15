import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView, Alert, Modal, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { BrowseStackParamList } from "@/navigation/BrowseStackNavigator";
import { useParcels } from "@/hooks/useParcels";
import { useConnections } from "@/hooks/useConnections";
import { useReviews } from "@/hooks/useReviews";
import { useAuth } from "@/contexts/AuthContext";

type RouteType = RouteProp<BrowseStackParamList, "ParcelDetail">;

function StarRating({ rating, onRatingChange }: { rating: number; onRatingChange: (r: number) => void }) {
  const { theme } = useTheme();
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onRatingChange(star)}>
          <Feather
            name="star"
            size={36}
            color={star <= rating ? Colors.warning : theme.border}
            style={star <= rating ? { fill: Colors.warning } : undefined}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function ParcelDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const route = useRoute<RouteType>();
  const { parcelId } = route.params;
  const { parcels, acceptParcel } = useParcels();
  const { addConnection, isConnected, isAdding } = useConnections();
  const { submitReview, hasReviewedParcel } = useReviews();
  const { user } = useAuth();
  const [savedCarrier, setSavedCarrier] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const parcel = parcels.find((p) => p.id === parcelId);

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

  const handleAccept = () => {
    acceptParcel(parcelId);
  };

  const handleSaveCarrier = async () => {
    if (!parcel.transporterId) return;
    try {
      await addConnection(parcel.transporterId, "trusted_carrier");
      setSavedCarrier(true);
      Alert.alert("Success", "Carrier saved to your trusted connections!");
    } catch (error) {
      Alert.alert("Error", "Failed to save carrier. Please try again.");
    }
  };

  const handleLeaveReview = () => {
    setReviewRating(0);
    setReviewComment("");
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      Alert.alert("Rating Required", "Please select a star rating.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const revieweeId = parcel.isOwner ? parcel.transporterId : parcel.senderId;
      const reviewType = parcel.isOwner ? "sender_to_transporter" : "transporter_to_sender";
      
      if (!revieweeId) {
        Alert.alert("Error", "Cannot determine who to review.");
        return;
      }

      await submitReview(parcelId, revieweeId, reviewRating, reviewComment, reviewType);
      setReviewModalVisible(false);
      Alert.alert("Thank You", "Your review has been submitted successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const canSaveCarrier =
    parcel.status === "Delivered" &&
    !parcel.isOwner &&
    parcel.transporterId &&
    !isConnected(parcel.transporterId) &&
    !savedCarrier;

  const alreadyReviewed = hasReviewedParcel(parcelId);
  const canLeaveReview =
    parcel.status === "Delivered" &&
    !alreadyReviewed &&
    ((parcel.isOwner && parcel.transporterId) || (parcel.isTransporting && parcel.senderId));

  const sizeLabels: Record<string, string> = {
    small: "Small",
    medium: "Medium",
    large: "Large",
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: Spacing.xl,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Card elevation={1} style={styles.routeCard}>
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
              <View style={styles.routeTextContainer}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  From
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {parcel.origin}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.routeLine, { backgroundColor: theme.border }]} />

            {parcel.intermediateStops?.map((stop, index) => (
              <React.Fragment key={index}>
                <View style={styles.routePoint}>
                  <View
                    style={[styles.routeDot, { backgroundColor: theme.textSecondary }]}
                  />
                  <View style={styles.routeTextContainer}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      Stop {index + 1}
                    </ThemedText>
                    <ThemedText type="small">{stop}</ThemedText>
                  </View>
                </View>
                <View style={[styles.routeLine, { backgroundColor: theme.border }]} />
              </React.Fragment>
            ))}

            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: Colors.secondary }]} />
              <View style={styles.routeTextContainer}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  To
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {parcel.destination}
                </ThemedText>
              </View>
            </View>
          </View>
        </Card>

        <View style={styles.compensationContainer}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Compensation
          </ThemedText>
          <ThemedText type="h1" style={{ color: Colors.primary }}>
            R{parcel.compensation}
          </ThemedText>
        </View>

        <View style={styles.detailsGrid}>
          <Card elevation={1} style={styles.detailCard}>
            <Feather name="box" size={24} color={Colors.primary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Size
            </ThemedText>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {sizeLabels[parcel.size] || parcel.size}
            </ThemedText>
          </Card>

          <Card elevation={1} style={styles.detailCard}>
            <Feather name="package" size={24} color={Colors.primary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Weight
            </ThemedText>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {parcel.weight ? `${parcel.weight} kg` : "Not specified"}
            </ThemedText>
          </Card>

          <Card elevation={1} style={styles.detailCard}>
            <Feather name="calendar" size={24} color={Colors.primary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Pickup
            </ThemedText>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {new Date(parcel.pickupDate).toLocaleDateString()}
            </ThemedText>
          </Card>

          <Card elevation={1} style={styles.detailCard}>
            <Feather name="clock" size={24} color={Colors.primary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Status
            </ThemedText>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {parcel.status}
            </ThemedText>
          </Card>
        </View>

        {parcel.description ? (
          <Card elevation={1} style={styles.descriptionCard}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Description
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {parcel.description}
            </ThemedText>
          </Card>
        ) : null}

        {parcel.specialInstructions ? (
          <Card elevation={1} style={styles.descriptionCard}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Special Instructions
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {parcel.specialInstructions}
            </ThemedText>
          </Card>
        ) : null}

        <Card elevation={1} style={styles.senderCard}>
          <View style={styles.senderHeader}>
            <View
              style={[styles.senderAvatar, { backgroundColor: theme.backgroundSecondary }]}
            >
              <ThemedText type="h4">{parcel.senderName.charAt(0)}</ThemedText>
            </View>
            <View style={styles.senderInfo}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {parcel.senderName}
              </ThemedText>
              <View style={styles.ratingRow}>
                <Feather name="star" size={14} color={Colors.warning} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {parcel.senderRating} Rating
                </ThemedText>
              </View>
            </View>
          </View>
        </Card>

        {canLeaveReview ? (
          <Card elevation={1} style={styles.reviewCard}>
            <View style={styles.reviewCardContent}>
              <View style={styles.reviewCardIcon}>
                <Feather name="star" size={24} color={Colors.warning} />
              </View>
              <View style={styles.reviewCardText}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  Leave a Review
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Share your experience with {parcel.isOwner ? "the carrier" : "the sender"}
                </ThemedText>
              </View>
            </View>
            <Button onPress={handleLeaveReview} variant="secondary">
              Write Review
            </Button>
          </Card>
        ) : null}

        {alreadyReviewed ? (
          <Card elevation={1} style={styles.reviewCard}>
            <View style={styles.reviewCardContent}>
              <View style={[styles.reviewCardIcon, { backgroundColor: Colors.success + "20" }]}>
                <Feather name="check-circle" size={24} color={Colors.success} />
              </View>
              <View style={styles.reviewCardText}>
                <ThemedText type="body" style={{ fontWeight: "600", color: Colors.success }}>
                  Review Submitted
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Thank you for your feedback
                </ThemedText>
              </View>
            </View>
          </Card>
        ) : null}

        {canSaveCarrier ? (
          <Card elevation={1} style={styles.trustedCarrierCard}>
            <View style={styles.trustedCarrierContent}>
              <View style={styles.trustedCarrierIcon}>
                <Feather name="user-check" size={24} color={Colors.primary} />
              </View>
              <View style={styles.trustedCarrierText}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  Save as Trusted Carrier
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Add this carrier to your trusted connections for future deliveries
                </ThemedText>
              </View>
            </View>
            <Pressable
              onPress={handleSaveCarrier}
              disabled={isAdding}
              style={[
                styles.trustedCarrierButton,
                {
                  backgroundColor: theme.backgroundSecondary,
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.lg,
                  borderRadius: BorderRadius.md,
                  alignItems: "center",
                },
              ]}
            >
              <ThemedText type="body" style={{ fontWeight: "600", color: Colors.primary }}>
                {isAdding ? "Saving..." : "Save Carrier"}
              </ThemedText>
            </Pressable>
          </Card>
        ) : null}

        {savedCarrier || (parcel.transporterId && isConnected(parcel.transporterId)) ? (
          <Card elevation={1} style={styles.trustedCarrierCard}>
            <View style={styles.trustedCarrierContent}>
              <View style={[styles.trustedCarrierIcon, { backgroundColor: Colors.success + "20" }]}>
                <Feather name="check-circle" size={24} color={Colors.success} />
              </View>
              <View style={styles.trustedCarrierText}>
                <ThemedText type="body" style={{ fontWeight: "600", color: Colors.success }}>
                  Trusted Carrier
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  This carrier is in your trusted connections
                </ThemedText>
              </View>
            </View>
          </Card>
        ) : null}
      </ScrollView>

      {!parcel.isOwner && !parcel.isTransporting ? (
        <View
          style={[
            styles.bottomAction,
            {
              backgroundColor: theme.backgroundRoot,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
        >
          <Button onPress={handleAccept}>Accept to Transport</Button>
        </View>
      ) : null}

      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Leave a Review</ThemedText>
              <Pressable onPress={() => setReviewModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
              How was your experience with {parcel.isOwner ? "the carrier" : "the sender"}?
            </ThemedText>

            <StarRating rating={reviewRating} onRatingChange={setReviewRating} />

            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Write a comment (optional)"
              placeholderTextColor={theme.textSecondary}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setReviewModalVisible(false)}
                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
              >
                <ThemedText type="body" style={{ fontWeight: "600" }}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSubmitReview}
                disabled={isSubmittingReview || reviewRating === 0}
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: reviewRating === 0 ? theme.border : Colors.primary,
                    opacity: isSubmittingReview ? 0.7 : 1,
                  },
                ]}
              >
                <ThemedText type="body" style={{ fontWeight: "600", color: "#FFFFFF" }}>
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  routeCard: {
    marginBottom: Spacing.lg,
  },
  routeContainer: {
    paddingVertical: Spacing.sm,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeTextContainer: {
    marginLeft: Spacing.md,
  },
  routeLine: {
    width: 2,
    height: 24,
    marginLeft: 5,
    marginVertical: Spacing.xs,
  },
  compensationContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  detailCard: {
    width: "48%",
    flexGrow: 1,
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.lg,
  },
  descriptionCard: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  senderCard: {
    marginBottom: Spacing.lg,
  },
  senderHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  senderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  senderInfo: {
    marginLeft: Spacing.md,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  bottomAction: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  trustedCarrierCard: {
    marginBottom: Spacing.lg,
  },
  trustedCarrierContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  trustedCarrierIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  trustedCarrierText: {
    flex: 1,
    marginLeft: Spacing.md,
    gap: Spacing.xs,
  },
  trustedCarrierButton: {
    marginTop: Spacing.sm,
  },
  reviewCard: {
    marginBottom: Spacing.lg,
  },
  reviewCardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  reviewCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.warning + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewCardText: {
    flex: 1,
    marginLeft: Spacing.md,
    gap: Spacing.xs,
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing["2xl"],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 100,
    marginBottom: Spacing.xl,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
});
