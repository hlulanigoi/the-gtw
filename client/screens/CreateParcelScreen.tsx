import React, { useState, useMemo } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, Switch, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { WebView } from "react-native-webview";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useParcels } from "@/hooks/useParcels";
import { LocationPickerModal } from "@/components/LocationPickerModal";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type SizeType = "small" | "medium" | "large";

type LocationData = {
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function LocationCard({
  type,
  location,
  onPress,
  theme,
}: {
  type: "origin" | "destination";
  location: LocationData | null;
  onPress: () => void;
  theme: any;
}) {
  const scale = useSharedValue(1);
  const isOrigin = type === "origin";
  const color = isOrigin ? Colors.primary : Colors.secondary;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      }}
      style={[
        styles.locationCard,
        {
          backgroundColor: location ? `${color}08` : theme.backgroundDefault,
          borderColor: location ? color : theme.border,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.locationCardContent}>
        <View style={[styles.locationDot, { backgroundColor: color }]} />
        <View style={styles.locationTextContainer}>
          <ThemedText
            type="caption"
            style={{ color: theme.textSecondary, marginBottom: 2 }}
          >
            {isOrigin ? "PICKUP FROM" : "DELIVER TO"}
          </ThemedText>
          {location ? (
            <>
              <ThemedText type="h4" style={{ color: theme.text }}>
                {location.name}
              </ThemedText>
              <ThemedText
                type="caption"
                numberOfLines={1}
                style={{ color: theme.textSecondary, marginTop: 2 }}
              >
                {location.fullAddress}
              </ThemedText>
            </>
          ) : (
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Tap to select location
            </ThemedText>
          )}
        </View>
        <View
          style={[
            styles.locationCardIcon,
            { backgroundColor: location ? color : theme.backgroundSecondary },
          ]}
        >
          <Feather
            name={location ? "check" : "map-pin"}
            size={18}
            color={location ? "#FFFFFF" : theme.textSecondary}
          />
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function CreateParcelScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { addParcel } = useParcels();

  const [originLocation, setOriginLocation] = useState<LocationData | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationData | null>(null);
  const [size, setSize] = useState<SizeType>("medium");
  const [pickupDate, setPickupDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [compensation, setCompensation] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isFragile, setIsFragile] = useState(false);
  const [pickupWindowEnd, setPickupWindowEnd] = useState("");
  const [deliveryWindowStart, setDeliveryWindowStart] = useState("");
  const [deliveryWindowEnd, setDeliveryWindowEnd] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [declaredValue, setDeclaredValue] = useState("");
  const [insuranceNeeded, setInsuranceNeeded] = useState(false);
  const [contactPhone, setContactPhone] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [showOriginPicker, setShowOriginPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);

  const isValid = originLocation && destinationLocation && size && pickupDate;

  const handleCreate = () => {
    if (!isValid) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    addParcel({
      origin: originLocation!.name,
      destination: destinationLocation!.name,
      size,
      pickupDate: new Date(pickupDate),
      compensation: compensation ? parseFloat(compensation) : 50,
      description: description.trim() || null,
      weight: weight ? parseFloat(weight) : null,
      specialInstructions: specialInstructions.trim() || null,
      isFragile,
      pickupWindowEnd: pickupWindowEnd ? new Date(pickupWindowEnd) : null,
      deliveryWindowStart: deliveryWindowStart ? new Date(deliveryWindowStart) : null,
      deliveryWindowEnd: deliveryWindowEnd ? new Date(deliveryWindowEnd) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      declaredValue: declaredValue ? parseInt(declaredValue) : null,
      insuranceNeeded,
      contactPhone: contactPhone.trim() || null,
      originLat: originLocation!.lat,
      originLng: originLocation!.lng,
      destinationLat: destinationLocation!.lat,
      destinationLng: destinationLocation!.lng,
    });

    Alert.alert("Success", "Your parcel has been created!", [
      {
        text: "OK",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const sizeOptions: { key: SizeType; label: string; icon: string; desc: string }[] = [
    { key: "small", label: "Small", icon: "package", desc: "Fits in a bag" },
    { key: "medium", label: "Medium", icon: "box", desc: "Fits in a backpack" },
    { key: "large", label: "Large", icon: "archive", desc: "Needs both hands" },
  ];

  const mapHtml = useMemo(() => {
    if (!originLocation && !destinationLocation) return null;

    const markers = [];
    if (originLocation) {
      markers.push({
        lat: originLocation.lat,
        lng: originLocation.lng,
        title: originLocation.name,
        type: "origin",
      });
    }
    if (destinationLocation) {
      markers.push({
        lat: destinationLocation.lat,
        lng: destinationLocation.lng,
        title: destinationLocation.name,
        type: "destination",
      });
    }

    const center = originLocation
      ? { lat: originLocation.lat, lng: originLocation.lng }
      : { lat: destinationLocation!.lat, lng: destinationLocation!.lng };

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
    .origin-marker { background: ${Colors.primary}; }
    .destination-marker { background: ${Colors.secondary}; }
    .route-line {
      stroke: ${Colors.primary};
      stroke-width: 3;
      stroke-dasharray: 8, 8;
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
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false
    }).setView([${center.lat}, ${center.lng}], 8);
    
    L.tileLayer('${tileUrl}', { maxZoom: 19 }).addTo(map);

    const bounds = [];
    
    markers.forEach(marker => {
      const isOrigin = marker.type === 'origin';
      const icon = L.divIcon({
        className: '',
        html: '<div class="custom-marker ' + (isOrigin ? 'origin-marker' : 'destination-marker') + '"></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      
      L.marker([marker.lat, marker.lng], { icon }).addTo(map);
      bounds.push([marker.lat, marker.lng]);
    });

    if (bounds.length > 1) {
      const line = L.polyline(bounds, { color: '${Colors.primary}', weight: 3, dashArray: '8, 8', opacity: 0.7 }).addTo(map);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 12);
    }
  </script>
</body>
</html>
    `;
  }, [originLocation, destinationLocation, isDark]);

  return (
    <>
      <KeyboardAwareScrollViewCompat
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.routeSection}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Route Details
          </ThemedText>

          <View style={styles.routeContainer}>
            <LocationCard
              type="origin"
              location={originLocation}
              onPress={() => setShowOriginPicker(true)}
              theme={theme}
            />

            <View style={styles.routeConnector}>
              <View style={[styles.connectorLine, { backgroundColor: theme.border }]} />
              <View
                style={[
                  styles.connectorIcon,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <Feather name="arrow-down" size={16} color={theme.textSecondary} />
              </View>
              <View style={[styles.connectorLine, { backgroundColor: theme.border }]} />
            </View>

            <LocationCard
              type="destination"
              location={destinationLocation}
              onPress={() => setShowDestinationPicker(true)}
              theme={theme}
            />
          </View>

          {mapHtml ? (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={styles.miniMapContainer}
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
                  style={styles.miniMap}
                  scrollEnabled={false}
                  javaScriptEnabled
                  domStorageEnabled
                  originWhitelist={["*"]}
                />
              )}
            </Animated.View>
          ) : null}
        </View>

        <View style={styles.formGroup}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Parcel Size
          </ThemedText>
          <View style={styles.sizeContainer}>
            {sizeOptions.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => {
                  setSize(option.key);
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                style={[
                  styles.sizeOption,
                  {
                    backgroundColor:
                      size === option.key
                        ? Colors.primary
                        : theme.backgroundDefault,
                    borderColor:
                      size === option.key ? Colors.primary : theme.border,
                  },
                ]}
              >
                <Feather
                  name={option.icon as any}
                  size={28}
                  color={size === option.key ? "#FFFFFF" : theme.text}
                />
                <ThemedText
                  type="body"
                  style={{
                    color: size === option.key ? "#FFFFFF" : theme.text,
                    marginTop: Spacing.sm,
                    fontWeight: "600",
                  }}
                >
                  {option.label}
                </ThemedText>
                <ThemedText
                  type="caption"
                  style={{
                    color: size === option.key ? "rgba(255,255,255,0.8)" : theme.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {option.desc}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <ThemedText type="body" style={styles.label}>
            Pickup Date
          </ThemedText>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
              },
            ]}
          >
            <Feather name="calendar" size={18} color={Colors.primary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textSecondary}
              value={pickupDate}
              onChangeText={setPickupDate}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <ThemedText type="body" style={styles.label}>
            Compensation (R)
          </ThemedText>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              R
            </ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="50"
              placeholderTextColor={theme.textSecondary}
              value={compensation}
              onChangeText={setCompensation}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <ThemedText type="body" style={styles.label}>
            Description
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
              placeholder="Describe your parcel..."
              placeholderTextColor={theme.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <ThemedText type="body" style={styles.label}>
            Weight (kg)
          </ThemedText>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
              },
            ]}
          >
            <Feather name="package" size={18} color={theme.textSecondary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="e.g., 2.5"
              placeholderTextColor={theme.textSecondary}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Feather name="alert-triangle" size={18} color={Colors.warning} />
            <ThemedText type="body" style={styles.switchLabel}>
              Fragile Item
            </ThemedText>
          </View>
          <Switch
            value={isFragile}
            onValueChange={setIsFragile}
            trackColor={{ false: theme.border, true: Colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Pressable
          style={[styles.advancedToggle, { borderColor: theme.border }]}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <ThemedText type="body" style={{ color: Colors.primary }}>
            {showAdvanced ? "Hide" : "Show"} Advanced Options
          </ThemedText>
          <Feather
            name={showAdvanced ? "chevron-up" : "chevron-down"}
            size={20}
            color={Colors.primary}
          />
        </Pressable>

        {showAdvanced ? (
          <View style={styles.advancedSection}>
            <View style={styles.formGroup}>
              <ThemedText type="body" style={styles.label}>
                Special Instructions
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
                  placeholder="Any special handling instructions..."
                  placeholderTextColor={theme.textSecondary}
                  value={specialInstructions}
                  onChangeText={setSpecialInstructions}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="body" style={styles.label}>
                Pickup Window End
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Feather name="clock" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="YYYY-MM-DD (latest pickup)"
                  placeholderTextColor={theme.textSecondary}
                  value={pickupWindowEnd}
                  onChangeText={setPickupWindowEnd}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <ThemedText type="body" style={styles.label}>
                  Delivery Start
                </ThemedText>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textSecondary}
                    value={deliveryWindowStart}
                    onChangeText={setDeliveryWindowStart}
                  />
                </View>
              </View>
              <View style={{ width: Spacing.sm }} />
              <View style={[styles.formGroup, { flex: 1 }]}>
                <ThemedText type="body" style={styles.label}>
                  Delivery End
                </ThemedText>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textSecondary}
                    value={deliveryWindowEnd}
                    onChangeText={setDeliveryWindowEnd}
                  />
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="body" style={styles.label}>
                Listing Expiry Date
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Feather name="x-circle" size={18} color={Colors.error} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="YYYY-MM-DD (auto-expire listing)"
                  placeholderTextColor={theme.textSecondary}
                  value={expiresAt}
                  onChangeText={setExpiresAt}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="body" style={styles.label}>
                Declared Value (R)
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Feather name="shield" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Value for insurance purposes"
                  placeholderTextColor={theme.textSecondary}
                  value={declaredValue}
                  onChangeText={setDeclaredValue}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Feather name="shield" size={18} color={Colors.primary} />
                <ThemedText type="body" style={styles.switchLabel}>
                  Insurance Needed
                </ThemedText>
              </View>
              <Switch
                value={insuranceNeeded}
                onValueChange={setInsuranceNeeded}
                trackColor={{ false: theme.border, true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="body" style={styles.label}>
                Contact Phone
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Feather name="phone" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="+27 XX XXX XXXX"
                  placeholderTextColor={theme.textSecondary}
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.buttonContainer}>
          <Button onPress={handleCreate} disabled={!isValid}>
            Create Parcel
          </Button>
        </View>
      </KeyboardAwareScrollViewCompat>

      <LocationPickerModal
        visible={showOriginPicker}
        onClose={() => setShowOriginPicker(false)}
        onSelectLocation={(location) => setOriginLocation(location)}
        type="origin"
        initialQuery={originLocation?.name || ""}
      />

      <LocationPickerModal
        visible={showDestinationPicker}
        onClose={() => setShowDestinationPicker(false)}
        onSelectLocation={(location) => setDestinationLocation(location)}
        type="destination"
        initialQuery={destinationLocation?.name || ""}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  routeSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  routeContainer: {
    marginBottom: Spacing.md,
  },
  locationCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    padding: Spacing.md,
  },
  locationCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  routeConnector: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.md + 4,
  },
  connectorLine: {
    width: 2,
    height: 12,
  },
  connectorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: -11,
  },
  miniMapContainer: {
    height: 180,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginTop: Spacing.sm,
  },
  miniMap: {
    flex: 1,
    backgroundColor: "transparent",
  },
  formGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  textAreaContainer: {
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  textArea: {
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: "top",
  },
  sizeContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sizeOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  switchInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  switchLabel: {
    fontWeight: "500",
  },
  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: Spacing.xs,
  },
  advancedSection: {
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
  },
  buttonContainer: {
    marginTop: Spacing.lg,
  },
});
