import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  Modal,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useParcels, Parcel } from "@/hooks/useParcels";
import { useCarrierLocation } from "@/hooks/useCarrierLocation";
import { useReceiverLocation } from "@/hooks/useReceiverLocation";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { IncomingStackParamList } from "@/navigation/IncomingStackNavigator";
import { formatCurrency } from "@/lib/currency";
import { ETACard } from "@/components/ETACard";
import { DeliveryProofUpload } from "@/components/DeliveryProofUpload";
import { ImprovedLocationSharing } from "@/components/ImprovedLocationSharing";

type RouteProps = RouteProp<IncomingStackParamList, "IncomingParcelDetail">;
type NavigationProp = NativeStackNavigationProp<IncomingStackParamList>;

function InfoRow({
  icon,
  label,
  value,
  theme,
}: {
  icon: string;
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        <Feather name={icon as any} size={16} color={theme.textSecondary} />
        <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
          {label}
        </ThemedText>
      </View>
      <ThemedText type="body" style={{ color: theme.text }}>
        {value}
      </ThemedText>
    </View>
  );
}

function StarRating({
  rating,
  onRatingChange,
  size = 32,
}: {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
}) {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => {
            onRatingChange(star);
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
        >
          <Feather
            name={star <= rating ? "star" : "star"}
            size={size}
            color={star <= rating ? Colors.warning : "#E5E7EB"}
            style={{ marginHorizontal: 4 }}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function IncomingParcelDetailScreenEnhanced() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const { parcels, confirmDelivery, rateCarrierAsReceiver, refetch } = useParcels();
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { parcelId } = route.params;
  const parcel = parcels.find((p) => p.id === parcelId);
  const { carrierLocation } = useCarrierLocation(parcelId);
  const { receiverLocation } = useReceiverLocation(parcelId);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const mapHtml = useMemo(() => {
    if (!parcel?.originLat || !parcel?.destinationLat) return null;

    const markers: { lat: number; lng: number; title: string; type: string }[] = [
      {
        lat: parcel.originLat!,
        lng: parcel.originLng!,
        title: parcel.origin,
        type: "origin",
      },
      {
        lat: parcel.destinationLat!,
        lng: parcel.destinationLng!,
        title: parcel.destination,
        type: "destination",
      },
    ];

    if (carrierLocation && parcel.status === "In Transit") {
      markers.push({
        lat: carrierLocation.lat,
        lng: carrierLocation.lng,
        title: "Carrier",
        type: "carrier",
      });
    }

    if (receiverLocation) {
      markers.push({
        lat: receiverLocation.lat,
        lng: receiverLocation.lng,
        title: "Your Location",
        type: "receiver",
      });
    }

    const center = carrierLocation && parcel.status === "In Transit" 
      ? { lat: carrierLocation.lat, lng: carrierLocation.lng }
      : { lat: parcel.originLat, lng: parcel.originLng };
    
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
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.4);
      font-size: 16px;
    }
    .origin-marker { background: ${Colors.primary}; }
    .destination-marker { background: ${Colors.secondary}; }
    .carrier-marker { 
      background: ${Colors.success}; 
      animation: pulse 2s infinite;
    }
    .receiver-marker { 
      background: ${Colors.warning}; 
      animation: pulse-receiver 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    @keyframes pulse-receiver {
      0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
      70% { box-shadow: 0 0 0 12px rgba(245, 158, 11, 0); }
      100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const markers = ${markersJson};
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: false,
    }).setView([${center.lat}, ${center.lng}], 10);
    
    L.tileLayer('${tileUrl}', { maxZoom: 19 }).addTo(map);

    const bounds = [];
    
    markers.forEach(marker => {
      let markerClass = 'destination-marker';
      let emoji = '📍';
      if (marker.type === 'origin') { markerClass = 'origin-marker'; emoji = '📦'; }
      else if (marker.type === 'carrier') { markerClass = 'carrier-marker'; emoji = '🚚'; }
      else if (marker.type === 'receiver') { markerClass = 'receiver-marker'; emoji = '📍'; }
      
      const icon = L.divIcon({
        className: '',
        html: '<div class="custom-marker ' + markerClass + '">' + emoji + '</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      
      L.marker([marker.lat, marker.lng], { icon }).addTo(map)
        .bindPopup(marker.title);
      bounds.push([marker.lat, marker.lng]);
    });

    if (bounds.length > 1) {
      const line = L.polyline(bounds, { 
        color: '${Colors.primary}', 
        weight: 3, 
        dashArray: '10, 10', 
        opacity: 0.7 
      }).addTo(map);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  </script>
</body>
</html>
    `;
  }, [parcel, isDark, carrierLocation, receiverLocation]);

  if (!parcel) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="body">Parcel not found</ThemedText>
      </ThemedView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return Colors.success;
      case "In Transit":
        return Colors.primary;
      case "Pending":
        return Colors.warning;
      default:
        return theme.textSecondary;
    }
  };

  const handleConfirmDelivery = async () => {
    setIsConfirming(true);
    try {
      await confirmDelivery(parcelId);
      setConfirmModalVisible(false);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Delivery Confirmed", "Thank you for confirming receipt of your parcel!", [
        {
          text: "Rate Carrier",
          onPress: () => setRatingModalVisible(true),
        },
        { text: "Done" },
      ]);
      refetch();
    } catch (error) {
      Alert.alert("Error", "Failed to confirm delivery. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a star rating.");
      return;
    }
    try {
      await rateCarrierAsReceiver(parcelId, rating);
      setRatingModalVisible(false);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Thank You", "Your rating has been submitted!");
      refetch();
    } catch (error) {
      Alert.alert("Error", "Failed to submit rating. Please try again.");
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.md,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ETA Card - New! */}
        <ETACard parcelId={parcelId} parcelStatus={parcel.status} />

        {mapHtml ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.mapContainer}
          >
            {Platform.OS === "web" ? (
              <iframe
                srcDoc={mapHtml}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  borderRadius: 16,
                }}
              />
            ) : (
              <WebView
                source={{ html: mapHtml }}
                style={styles.map}
                scrollEnabled={false}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={["*"]}
              />
            )}
          </Animated.View>
        ) : null}

        <Animated.View
          entering={FadeInDown.delay(100).duration(300)}
          style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
        >
          <View style={styles.sectionHeader}>
            <ThemedText type="h4">Route</ThemedText>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor(parcel.status)}15` },
              ]}
            >
              <ThemedText type="caption" style={{ color: getStatusColor(parcel.status) }}>
                {parcel.status}
              </ThemedText>
            </View>
          </View>

          <View style={styles.routeDisplay}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
              <View style={styles.routeText}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  FROM
                </ThemedText>
                <ThemedText type="body">{parcel.origin}</ThemedText>
              </View>
            </View>
            <View style={styles.routeConnector}>
              <View style={[styles.routeLine, { borderColor: theme.border }]} />
            </View>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: Colors.secondary }]} />
              <View style={styles.routeText}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  TO
                </ThemedText>
                <ThemedText type="body">{parcel.destination}</ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(300)}
          style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
        >
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Sender
          </ThemedText>
          <View style={styles.personCard}>
            <View style={[styles.avatar, { backgroundColor: Colors.primary + "20" }]}>
              <Feather name="user" size={24} color={Colors.primary} />
            </View>
            <View style={styles.personInfo}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {parcel.senderName}
              </ThemedText>
              {parcel.senderRating ? (
                <View style={styles.ratingRow}>
                  <Feather name="star" size={14} color={Colors.warning} />
                  <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                    {parcel.senderRating.toFixed(1)}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).duration(300)}
          style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
        >
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Parcel Details
          </ThemedText>
          <InfoRow icon="package" label="Size" value={parcel.size} theme={theme} />
          {parcel.weight ? (
            <InfoRow icon="box" label="Weight" value={`${parcel.weight} kg`} theme={theme} />
          ) : null}
          <InfoRow icon="calendar" label="Pickup Date" value={formatDate(parcel.pickupDate)} theme={theme} />
          <InfoRow icon="dollar-sign" label="Compensation" value={formatCurrency(parcel.compensation)} theme={theme} />
          {parcel.isFragile ? (
            <InfoRow icon="alert-triangle" label="Fragile" value="Yes" theme={theme} />
          ) : null}
          {parcel.description ? (
            <View style={styles.descriptionSection}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Description
              </ThemedText>
              <ThemedText type="body">{parcel.description}</ThemedText>
            </View>
          ) : null}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(350).duration(300)}
          style={styles.buttonContainer}
        >
          <Pressable
            onPress={() => navigation.navigate("ParcelChat", { parcelId, userRole: "receiver" })}
            style={[
              styles.chatButton,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            ]}
          >
            <Feather name="message-circle" size={20} color={Colors.primary} />
            <ThemedText type="body" style={{ color: Colors.primary, marginLeft: Spacing.sm }}>
              Chat with Sender & Carrier
            </ThemedText>
          </Pressable>
        </Animated.View>

        {/* Improved Location Sharing - New! */}
        <ImprovedLocationSharing parcelId={parcelId} parcelStatus={parcel.status} />

        {/* Delivery Proof Upload - New! */}
        {(parcel.status === "In Transit" || parcel.status === "Delivered") && !parcel.deliveryConfirmed && (
          <DeliveryProofUpload parcelId={parcelId} onUploadSuccess={() => refetch()} />
        )}

        {parcel.deliveryConfirmed ? (
          <Animated.View
            entering={FadeInDown.delay(400).duration(300)}
            style={[styles.confirmedBanner, { backgroundColor: Colors.success + "15" }]}
          >
            <Feather name="check-circle" size={24} color={Colors.success} />
            <View style={{ marginLeft: Spacing.md }}>
              <ThemedText type="body" style={{ color: Colors.success, fontWeight: "600" }}>
                Delivery Confirmed
              </ThemedText>
              {parcel.deliveryConfirmedAt ? (
                <ThemedText type="caption" style={{ color: Colors.success }}>
                  {formatDate(parcel.deliveryConfirmedAt)}
                </ThemedText>
              ) : null}
            </View>
          </Animated.View>
        ) : (parcel.status === "In Transit" || parcel.status === "Delivered") ? (
          <View style={styles.buttonContainer}>
            <Button onPress={() => setConfirmModalVisible(true)}>
              Confirm Delivery
            </Button>
          </View>
        ) : null}

        {parcel.deliveryConfirmed && !parcel.receiverRating ? (
          <View style={styles.buttonContainer}>
            <Button onPress={() => setRatingModalVisible(true)}>
              Rate Carrier
            </Button>
          </View>
        ) : null}

        {parcel.receiverRating ? (
          <Animated.View
            entering={FadeInDown.delay(400).duration(300)}
            style={[styles.ratingBanner, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
          >
            <ThemedText type="body" style={{ marginBottom: Spacing.sm }}>
              Your Rating
            </ThemedText>
            <View style={styles.starDisplayRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Feather
                  key={star}
                  name="star"
                  size={24}
                  color={star <= parcel.receiverRating! ? Colors.warning : "#E5E7EB"}
                  style={{ marginHorizontal: 2 }}
                />
              ))}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h3" style={{ textAlign: "center", marginBottom: Spacing.md }}>
              Confirm Delivery
            </ThemedText>
            <ThemedText type="body" style={{ textAlign: "center", color: theme.textSecondary, marginBottom: Spacing.xl }}>
              Are you sure you want to confirm that you have received this parcel?
            </ThemedText>
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setConfirmModalVisible(false)}
                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
              >
                <ThemedText type="body">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleConfirmDelivery}
                disabled={isConfirming}
                style={[styles.modalButton, { backgroundColor: Colors.success }]}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                  {isConfirming ? "Confirming..." : "Confirm"}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={ratingModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h3" style={{ textAlign: "center", marginBottom: Spacing.md }}>
              Rate Your Carrier
            </ThemedText>
            <ThemedText type="body" style={{ textAlign: "center", color: theme.textSecondary, marginBottom: Spacing.lg }}>
              How was your delivery experience?
            </ThemedText>
            <StarRating rating={rating} onRatingChange={setRating} />
            <View style={[styles.modalButtons, { marginTop: Spacing.xl }]}>
              <Pressable
                onPress={() => setRatingModalVisible(false)}
                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
              >
                <ThemedText type="body">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSubmitRating}
                style={[styles.modalButton, { backgroundColor: Colors.primary }]}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                  Submit
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    height: 250,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  map: {
    flex: 1,
    borderRadius: BorderRadius.md,
  },
  section: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  routeDisplay: {
    marginLeft: Spacing.xs,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeText: {
    flex: 1,
  },
  routeConnector: {
    marginLeft: 5,
    height: 24,
  },
  routeLine: {
    width: 2,
    height: "100%",
    borderLeftWidth: 2,
    borderStyle: "dashed",
  },
  personCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  personInfo: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.1)",
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  descriptionSection: {
    paddingTop: Spacing.md,
  },
  confirmedBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  ratingBanner: {
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  starDisplayRow: {
    flexDirection: "row",
  },
  buttonContainer: {
    marginTop: Spacing.md,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
});
