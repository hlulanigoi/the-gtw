import * as WebBrowser from "expo-web-browser";
import React, { useState, useMemo } from "react";
import { View, StyleSheet, Pressable, ScrollView, Alert, Modal, TextInput, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
<<<<<<< HEAD
import { useRoute, RouteProp, useNavigation, NativeStackNavigationProp } from "@react-navigation/native";
=======
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
>>>>>>> origin/payments
import { Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";

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
import { useCarrierLocation } from "@/hooks/useCarrierLocation";
import { useReceiverLocation } from "@/hooks/useReceiverLocation";
<<<<<<< HEAD
import { formatCurrency } from "@/lib/currency";
=======
import { usePayments } from "@/hooks/usePayments";
>>>>>>> origin/payments

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
            style={{ marginHorizontal: 2 }}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function ParcelDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const route = useRoute<RouteType>();
<<<<<<< HEAD
  const navigation = useNavigation<NativeStackNavigationProp<BrowseStackParamList>>();
=======
  const navigation = useNavigation<any>();
>>>>>>> origin/payments
  const { parcelId } = route.params;
  const { parcels, acceptParcel } = useParcels();
  const { addConnection, isConnected, isAdding } = useConnections();
  const { submitReview, hasReviewedParcel } = useReviews();
  const { user } = useAuth();
  const { startTracking, isTracking } = useCarrierLocation(parcelId);
  const { receiverLocation } = useReceiverLocation(parcelId);
<<<<<<< HEAD
=======
  const { initializePayment } = usePayments();
>>>>>>> origin/payments
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

  const handleAccept = async () => {
    await acceptParcel(parcelId);
    startTracking(parcelId);
  };

<<<<<<< HEAD
  const handlePayment = () => {
    // Navigate to checkout screen
    navigation.navigate("Checkout", { parcelId });
=======
  const handlePayment = async () => {
    if (!parcel.transporterId) {
      Alert.alert("Error", "No carrier assigned to this parcel yet.");
      return;
    }

    Alert.alert(
      "Confirm Payment",
      `You are about to pay ₦${parcel.compensation} to the carrier. Proceed?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay Now",
          onPress: async () => {
            try {
              const paymentData = await initializePayment(parcelId, parcel.transporterId!);
              
              if (paymentData) {
                navigation.navigate("Payment", {
                  authorizationUrl: paymentData.authorization_url,
                  reference: paymentData.reference,
                  parcelId: parcelId,
                });
              } else {
                Alert.alert("Error", "Failed to initialize payment. Please try again.");
              }
            } catch (error: any) {
              Alert.alert("Payment Error", error.message || "Something went wrong");
            }
          },
        },
      ]
    );
>>>>>>> origin/payments
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

  const showReceiverLocationMap = parcel.isTransporting && (parcel.status === "In Transit" || parcel.status === "Pending");

  const receiverMapHtml = useMemo(() => {
    if (!showReceiverLocationMap || !receiverLocation) return null;
    if (!parcel?.destinationLat || !parcel?.destinationLng) return null;

    const markers = [
      {
        lat: parcel.destinationLat,
        lng: parcel.destinationLng,
        title: parcel.destination,
        type: "destination",
      },
      {
        lat: receiverLocation.lat,
        lng: receiverLocation.lng,
        title: "Receiver Location",
        type: "receiver",
      },
    ];

    const center = { lat: receiverLocation.lat, lng: receiverLocation.lng };
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const markersJson = JSON.stringify(markers);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .custom-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .destination-marker { background: ${Colors.secondary}; }
    .receiver-marker { 
      background: ${Colors.warning}; 
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
      100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const markers = ${markersJson};
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
    }).setView([${center.lat}, ${center.lng}], 14);
    
    L.tileLayer('${tileUrl}', { maxZoom: 19 }).addTo(map);

    const bounds = [];
    
    markers.forEach(marker => {
      let markerClass = 'destination-marker';
      if (marker.type === 'receiver') markerClass = 'receiver-marker';
      
      const icon = L.divIcon({
        className: '',
        html: '<div class="custom-marker ' + markerClass + '"></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      
      L.marker([marker.lat, marker.lng], { icon }).addTo(map);
      bounds.push([marker.lat, marker.lng]);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  </script>
</body>
</html>
    `;
  }, [parcel, isDark, receiverLocation, showReceiverLocationMap]);

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
<<<<<<< HEAD
            {formatCurrency(parcel.compensation)}
=======
            R{parcel.compensation}
>>>>>>> origin/payments
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

        {showReceiverLocationMap ? (
          <Card elevation={1} style={styles.receiverLocationCard}>
            <View style={styles.receiverLocationHeader}>
              <View style={[styles.receiverLocationIcon, { backgroundColor: Colors.warning + "20" }]}>
                <Feather name="map-pin" size={20} color={Colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="h4">Receiver Location</ThemedText>
                {receiverLocation ? (
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Updated {new Date(receiverLocation.timestamp).toLocaleTimeString()}
                  </ThemedText>
                ) : (
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Waiting for receiver to share their location
                  </ThemedText>
                )}
              </View>
            </View>
            
            {receiverMapHtml ? (
              <View style={styles.receiverMapContainer}>
                {Platform.OS === "web" ? (
                  <iframe
                    srcDoc={receiverMapHtml}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      borderRadius: BorderRadius.md,
                    }}
                  />
                ) : (
                  <WebView
                    source={{ html: receiverMapHtml }}
                    style={styles.receiverMap}
                    scrollEnabled={false}
                    javaScriptEnabled
                    domStorageEnabled
                    originWhitelist={["*"]}
                  />
                )}
              </View>
            ) : (
              <View style={[styles.noLocationContainer, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="map" size={32} color={theme.textSecondary} />
                <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                  Receiver has not shared their location yet
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  Once the receiver shares their location, it will appear here so you can find them easily
                </ThemedText>
              </View>
            )}
          </Card>
        ) : null}

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
            <Button onPress={handleLeaveReview}>
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
      ) : parcel.isOwner && parcel.status === "Pending" ? (
        <View
          style={[
            styles.bottomAction,
            {
              backgroundColor: theme.backgroundRoot,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
        >
          <Button onPress={handlePayment}>Pay for Delivery</Button>
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
  receiverLocationCard: {
    marginBottom: Spacing.lg,
  },
  receiverLocationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  receiverLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  receiverMapContainer: {
    height: 180,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  receiverMap: {
    flex: 1,
    borderRadius: BorderRadius.md,
  },
  noLocationContainer: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.xs,
  },
});
