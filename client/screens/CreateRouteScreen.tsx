import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
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
import { useRoutes } from "@/hooks/useRoutes";
import { LocationPickerModal } from "@/components/LocationPickerModal";
import { StopPickerModal } from "@/components/StopPickerModal";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FrequencyType = "one_time" | "daily" | "weekly" | "monthly";
type SizeType = "small" | "medium" | "large";

type LocationData = {
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SectionCard({
  title,
  icon,
  children,
  theme,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  theme: any;
}) {
  return (
    <View
      style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault }]}
    >
      <View style={styles.sectionHeader}>
        <View
          style={[styles.sectionIconContainer, { backgroundColor: `${Colors.primary}15` }]}
        >
          <Feather name={icon as any} size={18} color={Colors.primary} />
        </View>
        <ThemedText type="h3" style={styles.sectionTitle}>
          {title}
        </ThemedText>
      </View>
      {children}
    </View>
  );
}

function SelectableChip({
  selected,
  label,
  onPress,
  theme,
  icon,
}: {
  selected: boolean;
  label: string;
  onPress: () => void;
  theme: any;
  icon?: string;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={() => {
        onPress();
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.chip,
        animatedStyle,
        {
          backgroundColor: selected ? Colors.primary : theme.backgroundSecondary,
          borderColor: selected ? Colors.primary : theme.border,
        },
      ]}
    >
      {icon ? (
        <Feather
          name={icon as any}
          size={16}
          color={selected ? "#FFFFFF" : theme.textSecondary}
          style={{ marginRight: Spacing.xs }}
        />
      ) : null}
      <ThemedText
        type="small"
        style={{
          color: selected ? "#FFFFFF" : theme.text,
          fontWeight: selected ? "600" : "400",
        }}
      >
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

function SizeCard({
  selected,
  label,
  icon,
  description,
  onPress,
  theme,
}: {
  selected: boolean;
  label: string;
  icon: string;
  description: string;
  onPress: () => void;
  theme: any;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={() => {
        onPress();
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.sizeCard,
        animatedStyle,
        {
          backgroundColor: selected
            ? `${Colors.primary}15`
            : theme.backgroundSecondary,
          borderColor: selected ? Colors.primary : theme.border,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.sizeIconContainer,
          {
            backgroundColor: selected ? Colors.primary : theme.backgroundTertiary,
          },
        ]}
      >
        <Feather
          name={icon as any}
          size={24}
          color={selected ? "#FFFFFF" : theme.textSecondary}
        />
      </View>
      <ThemedText
        type="body"
        style={{
          fontWeight: "600",
          color: selected ? Colors.primary : theme.text,
          marginTop: Spacing.sm,
        }}
      >
        {label}
      </ThemedText>
      <ThemedText
        type="caption"
        style={{
          color: theme.textSecondary,
          marginTop: Spacing.xs,
          textAlign: "center",
        }}
      >
        {description}
      </ThemedText>
    </AnimatedPressable>
  );
}

function LocationCard({
  type,
  location,
  onPress,
  theme,
  isLoading,
}: {
  type: "origin" | "destination";
  location: LocationData | null;
  onPress: () => void;
  theme: any;
  isLoading?: boolean;
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
          backgroundColor: location ? `${color}08` : theme.backgroundSecondary,
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
            {isOrigin ? "FROM" : "TO"}
          </ThemedText>
          {isLoading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
              <ActivityIndicator size="small" color={color} />
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Getting your location...
              </ThemedText>
            </View>
          ) : location ? (
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
            { backgroundColor: location ? color : theme.backgroundTertiary },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.textSecondary} />
          ) : (
            <Feather
              name={location ? "check" : "map-pin"}
              size={18}
              color={location ? "#FFFFFF" : theme.textSecondary}
            />
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function CreateRouteScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { addRoute } = useRoutes();

  const [originLocation, setOriginLocation] = useState<LocationData | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationData | null>(null);
  const [intermediateStops, setIntermediateStops] = useState<LocationData[]>([]);
  const [departureDate, setDepartureDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [departureTime, setDepartureTime] = useState("");
  const [frequency, setFrequency] = useState<FrequencyType>("one_time");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [maxParcelSize, setMaxParcelSize] = useState<SizeType | null>(null);
  const [maxWeight, setMaxWeight] = useState("");
  const [availableCapacity, setAvailableCapacity] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [showOriginPicker, setShowOriginPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [showStopPicker, setShowStopPicker] = useState(false);

  useEffect(() => {
    const fetchCurrentLocation = async () => {
      if (Platform.OS === "web" || originLocation) return;

      setIsLoadingLocation(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setIsLoadingLocation(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = location.coords;

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          { headers: { "User-Agent": "ParcelPeer/1.0" } }
        );
        const data = await response.json();

        if (data && data.display_name) {
          const shortName =
            data.name ||
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.suburb ||
            data.display_name.split(",")[0];

          setOriginLocation({
            name: shortName,
            fullAddress: data.display_name,
            lat: latitude,
            lng: longitude,
          });

          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (error) {
        console.log("Auto-location fetch failed:", error);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    fetchCurrentLocation();
  }, []);

  const canAddStops = originLocation && destinationLocation;

  const isRecurring = frequency !== "one_time";
  const isValid = originLocation && destinationLocation && departureDate;

  const addIntermediateStop = (stop: LocationData) => {
    const exists = intermediateStops.some(
      (s) =>
        s.name.toLowerCase() === stop.name.toLowerCase() ||
        (Math.abs(s.lat - stop.lat) < 0.05 && Math.abs(s.lng - stop.lng) < 0.05)
    );
    if (!exists) {
      setIntermediateStops([...intermediateStops, stop]);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const removeIntermediateStop = (index: number) => {
    setIntermediateStops(intermediateStops.filter((_, i) => i !== index));
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleCreate = async () => {
    if (isSubmitting) return;

    if (!isValid) {
      Alert.alert("Missing Information", "Please fill in the origin, destination, and departure date.");
      return;
    }

    setIsSubmitting(true);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await addRoute({
        origin: originLocation!.name,
        destination: destinationLocation!.name,
        intermediateStops: intermediateStops.length > 0 ? intermediateStops.map(s => s.name) : null,
        departureDate: new Date(departureDate),
        departureTime: departureTime || null,
        frequency,
        recurrenceEndDate: isRecurring && recurrenceEndDate ? new Date(recurrenceEndDate) : null,
        maxParcelSize,
        maxWeight: maxWeight ? parseFloat(maxWeight) : null,
        availableCapacity: availableCapacity
          ? parseInt(availableCapacity, 10)
          : null,
        pricePerKg: pricePerKg ? parseInt(pricePerKg, 10) : null,
        notes: notes || null,
        expiresAt: null,
        originLat: originLocation!.lat,
        originLng: originLocation!.lng,
        destinationLat: destinationLocation!.lat,
        destinationLng: destinationLocation!.lng,
      });

      Alert.alert("Route Created", "Your route is now visible to senders!", [
        {
          text: "View My Routes",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      Alert.alert("Something went wrong", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const frequencyOptions: { key: FrequencyType; label: string; icon: string }[] = [
    { key: "one_time", label: "One-time", icon: "calendar" },
    { key: "daily", label: "Daily", icon: "repeat" },
    { key: "weekly", label: "Weekly", icon: "calendar" },
    { key: "monthly", label: "Monthly", icon: "calendar" },
  ];

  const sizeOptions: { key: SizeType; label: string; icon: string; description: string }[] = [
    { key: "small", label: "Small", icon: "package", description: "Fits in a backpack" },
    { key: "medium", label: "Medium", icon: "box", description: "Fits in a car trunk" },
    { key: "large", label: "Large", icon: "truck", description: "Needs vehicle space" },
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
          paddingBottom: insets.bottom + Spacing["3xl"],
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <SectionCard title="Route Details" icon="map" theme={theme}>
          <View style={styles.routeInputs}>
            <LocationCard
              type="origin"
              location={originLocation}
              onPress={() => setShowOriginPicker(true)}
              theme={theme}
              isLoading={isLoadingLocation}
            />

            <View style={styles.routeConnector}>
              <View style={[styles.connectorLine, { backgroundColor: theme.border }]} />
              <View style={[styles.connectorIcon, { backgroundColor: theme.backgroundSecondary }]}>
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
                    borderRadius: 12,
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

          <View style={styles.stopsSection}>
            <View style={styles.stopsHeader}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                STOPS ALONG THE WAY (OPTIONAL)
              </ThemedText>
            </View>
            
            {intermediateStops.map((stop, index) => (
              <View key={index} style={[styles.stopItem, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                <View style={[styles.stopNumber, { backgroundColor: `${Colors.primary}20` }]}>
                  <ThemedText type="caption" style={{ color: Colors.primary, fontWeight: "600" }}>
                    {index + 1}
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="body" style={{ color: theme.text }}>
                    {stop.name}
                  </ThemedText>
                  <ThemedText type="caption" numberOfLines={1} style={{ color: theme.textSecondary, marginTop: 2 }}>
                    {stop.fullAddress}
                  </ThemedText>
                </View>
                <Pressable onPress={() => removeIntermediateStop(index)} hitSlop={8}>
                  <Feather name="x-circle" size={20} color={theme.textSecondary} />
                </Pressable>
              </View>
            ))}

            <AnimatedPressable
              onPress={() => setShowStopPicker(true)}
              disabled={!canAddStops}
              style={[
                styles.addStopButton,
                {
                  backgroundColor: canAddStops ? `${Colors.primary}10` : theme.backgroundSecondary,
                  borderColor: canAddStops ? Colors.primary : theme.border,
                  opacity: canAddStops ? 1 : 0.5,
                },
              ]}
            >
              <Feather name="zap" size={18} color={canAddStops ? Colors.primary : theme.textSecondary} />
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <ThemedText type="body" style={{ color: canAddStops ? Colors.primary : theme.textSecondary, fontWeight: "500" }}>
                  {canAddStops ? "Add stops with auto-detection" : "Select origin and destination first"}
                </ThemedText>
                {canAddStops ? (
                  <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: 2 }}>
                    Tap map or use suggested cities along route
                  </ThemedText>
                ) : null}
              </View>
              <Feather name="chevron-right" size={20} color={canAddStops ? Colors.primary : theme.textSecondary} />
            </AnimatedPressable>
          </View>
        </SectionCard>

        <SectionCard title="Schedule" icon="clock" theme={theme}>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleField}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                DATE
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                ]}
              >
                <Feather name="calendar" size={16} color={Colors.primary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textSecondary}
                  value={departureDate}
                  onChangeText={setDepartureDate}
                />
              </View>
            </View>
            <View style={styles.scheduleField}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                TIME (OPTIONAL)
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                ]}
              >
                <Feather name="clock" size={16} color={Colors.primary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="08:00"
                  placeholderTextColor={theme.textSecondary}
                  value={departureTime}
                  onChangeText={setDepartureTime}
                />
              </View>
            </View>
          </View>

          <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
            FREQUENCY
          </ThemedText>
          <View style={styles.chipContainer}>
            {frequencyOptions.map((option) => (
              <SelectableChip
                key={option.key}
                selected={frequency === option.key}
                label={option.label}
                onPress={() => setFrequency(option.key)}
                theme={theme}
              />
            ))}
          </View>

          {isRecurring ? (
            <View style={styles.recurrenceEndSection}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                REPEAT UNTIL (OPTIONAL)
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                ]}
              >
                <Feather name="calendar" size={16} color={Colors.secondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="YYYY-MM-DD (leave empty for indefinite)"
                  placeholderTextColor={theme.textSecondary}
                  value={recurrenceEndDate}
                  onChangeText={setRecurrenceEndDate}
                />
              </View>
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                {frequency === "daily" && "Route will repeat every day until end date"}
                {frequency === "weekly" && "Route will repeat every week until end date"}
                {frequency === "monthly" && "Route will repeat every month until end date"}
              </ThemedText>
            </View>
          ) : null}
        </SectionCard>

        <SectionCard title="Capacity" icon="package" theme={theme}>
          <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
            MAXIMUM PARCEL SIZE
          </ThemedText>
          <View style={styles.sizeCardsContainer}>
            {sizeOptions.map((option) => (
              <SizeCard
                key={option.key}
                selected={maxParcelSize === option.key}
                label={option.label}
                icon={option.icon}
                description={option.description}
                onPress={() =>
                  setMaxParcelSize(maxParcelSize === option.key ? null : option.key)
                }
                theme={theme}
              />
            ))}
          </View>

          <View style={[styles.capacityRow, { marginTop: Spacing.xl }]}>
            <View style={styles.capacityField}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                MAX WEIGHT (KG)
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                ]}
              >
                <Feather name="activity" size={16} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="20"
                  placeholderTextColor={theme.textSecondary}
                  value={maxWeight}
                  onChangeText={setMaxWeight}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.capacityField}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                AVAILABLE SPOTS
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                ]}
              >
                <Feather name="layers" size={16} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="5"
                  placeholderTextColor={theme.textSecondary}
                  value={availableCapacity}
                  onChangeText={setAvailableCapacity}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Pricing" icon="dollar-sign" theme={theme}>
          <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
            PRICE PER KILOGRAM
          </ThemedText>
          <View
            style={[
              styles.priceInputContainer,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
            ]}
          >
            <View style={[styles.currencyBadge, { backgroundColor: `${Colors.success}20` }]}>
              <ThemedText type="body" style={{ color: Colors.success, fontWeight: "700" }}>
                R
              </ThemedText>
            </View>
            <TextInput
              style={[styles.priceInput, { color: theme.text }]}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              value={pricePerKg}
              onChangeText={setPricePerKg}
              keyboardType="numeric"
            />
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              per kg
            </ThemedText>
          </View>
        </SectionCard>

        <SectionCard title="Additional Notes" icon="file-text" theme={theme}>
          <View
            style={[
              styles.textAreaContainer,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
            ]}
          >
            <TextInput
              style={[styles.textArea, { color: theme.text }]}
              placeholder="Any special instructions or details about your route..."
              placeholderTextColor={theme.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </SectionCard>

        <Button
          onPress={handleCreate}
          disabled={!isValid || isSubmitting}
          style={styles.submitButton}
        >
          {isSubmitting ? "Creating..." : "Create Route"}
        </Button>

        <ThemedText
          type="caption"
          style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.md }}
        >
          Your route will be visible to senders looking for carriers
        </ThemedText>
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

      {canAddStops ? (
        <StopPickerModal
          visible={showStopPicker}
          onClose={() => setShowStopPicker(false)}
          onAddStop={addIntermediateStop}
          origin={originLocation}
          destination={destinationLocation}
          existingStops={intermediateStops}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    flex: 1,
  },
  routeInputs: {
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
    height: 160,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  miniMap: {
    flex: 1,
    backgroundColor: "transparent",
  },
  inputWrapper: {
    marginBottom: Spacing.md,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  dotIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  stopsSection: {
    marginTop: Spacing.md,
  },
  stopsHeader: {
    marginBottom: Spacing.sm,
  },
  stopItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  stopNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addStopButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  scheduleRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  scheduleField: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  recurrenceEndSection: {
    marginTop: Spacing.lg,
  },
  sizeCardsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sizeCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  sizeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  capacityRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  capacityField: {
    flex: 1,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  currencyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  priceInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
  },
  textAreaContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  textArea: {
    fontSize: 16,
    minHeight: 80,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
