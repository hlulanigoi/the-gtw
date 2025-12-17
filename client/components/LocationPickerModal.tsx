import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";

type LocationResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

type SelectedLocation = {
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: SelectedLocation) => void;
  type: "origin" | "destination";
  initialQuery?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SearchResultItem({
  item,
  onPress,
  theme,
}: {
  item: LocationResult;
  onPress: () => void;
  theme: any;
}) {
  const scale = useSharedValue(1);

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
        styles.resultItem,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.resultIcon,
          { backgroundColor: `${Colors.primary}15` },
        ]}
      >
        <Feather name="map-pin" size={18} color={Colors.primary} />
      </View>
      <View style={styles.resultTextContainer}>
        <ThemedText type="body" numberOfLines={1} style={{ fontWeight: "500" }}>
          {item.name || item.display_name.split(",")[0]}
        </ThemedText>
        <ThemedText
          type="caption"
          numberOfLines={2}
          style={{ color: theme.textSecondary }}
        >
          {item.display_name}
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </AnimatedPressable>
  );
}

export function LocationPickerModal({
  visible,
  onClose,
  onSelectLocation,
  type,
  initialQuery = "",
}: Props) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const webViewRef = useRef<WebView>(null);

  const handleUseCurrentLocation = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not Available",
        "GPS location is not available on web. Please run this app in Expo Go on your mobile device to use your current location."
      );
      return;
    }

    setIsGettingLocation(true);

    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        if (!canAskAgain) {
          Alert.alert(
            "Permission Required",
            "Location permission is required to use your current location. Please enable it in Settings.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error("Failed to open settings:", error);
                  }
                },
              },
            ]
          );
        } else {
          Alert.alert(
            "Permission Denied",
            "Location permission is required to use your current location."
          );
        }
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await reverseGeocode(latitude, longitude);
      setShowMap(true);
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(
        "Location Error",
        "Could not get your current location. Please try again or search for a location."
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  useEffect(() => {
    if (visible && initialQuery) {
      setSearchQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [visible]);

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=8&addressdetails=1`,
        {
          headers: {
            "User-Agent": "TheGTW/1.0",
          },
        }
      );
      const data: LocationResult[] = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(query);
      }, 400);
    },
    [handleSearch]
  );

  const handleQueryChange = (text: string) => {
    setSearchQuery(text);
    setSelectedLocation(null);
    setShowMap(false);
    debouncedSearch(text);
  };

  const handleSelectResult = (result: LocationResult) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const shortName =
      result.name ||
      result.address?.city ||
      result.address?.town ||
      result.address?.village ||
      result.address?.suburb ||
      result.display_name.split(",")[0];

    const location: SelectedLocation = {
      name: shortName,
      fullAddress: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };

    setSelectedLocation(location);
    setSearchQuery(shortName);
    setShowMap(true);
    setResults([]);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onSelectLocation(selectedLocation);
      onClose();
    }
  };

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "mapClick") {
        reverseGeocode(data.lat, data.lng);
      }
    } catch (e) {}
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            "User-Agent": "TheGTW/1.0",
          },
        }
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

        const location: SelectedLocation = {
          name: shortName,
          fullAddress: data.display_name,
          lat,
          lng,
        };
        setSelectedLocation(location);
        setSearchQuery(shortName);
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    } catch (error) {
      console.error("Reverse geocode error:", error);
    }
  };

  const mapHtml = useMemo(() => {
    const center = selectedLocation
      ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
      : { lat: -26.2041, lng: 28.0473 };
    const zoom = selectedLocation ? 14 : 6;

    const markerColor = type === "origin" ? Colors.primary : Colors.secondary;
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

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
      width: 40px;
      height: 40px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      background: ${markerColor};
    }
    .marker-inner {
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      transform: rotate(45deg);
    }
    .tap-hint {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      z-index: 1000;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="tap-hint">Tap map to select location</div>
  <script>
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([${center.lat}, ${center.lng}], ${zoom});
    
    L.tileLayer('${tileUrl}', {
      maxZoom: 19
    }).addTo(map);

    let marker = null;

    function addMarker(lat, lng) {
      if (marker) {
        map.removeLayer(marker);
      }
      const icon = L.divIcon({
        className: '',
        html: '<div class="custom-marker"><div class="marker-inner"></div></div>',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });
      marker = L.marker([lat, lng], { icon }).addTo(map);
    }

    ${selectedLocation ? `addMarker(${selectedLocation.lat}, ${selectedLocation.lng});` : ""}

    map.on('click', function(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      addMarker(lat, lng);
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'mapClick', lat, lng }));
    });
  </script>
</body>
</html>
    `;
  }, [selectedLocation, isDark, type]);

  const handleClose = () => {
    setSearchQuery("");
    setResults([]);
    setSelectedLocation(null);
    setShowMap(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: Platform.OS === "ios" ? Spacing.lg : insets.top + Spacing.sm,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <Pressable onPress={handleClose} hitSlop={8}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h3" style={styles.headerTitle}>
            {type === "origin" ? "Pickup Location" : "Delivery Location"}
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: selectedLocation ? Colors.primary : theme.border,
              },
            ]}
          >
            <Feather
              name="search"
              size={20}
              color={selectedLocation ? Colors.primary : theme.textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search for a location..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={handleQueryChange}
              autoFocus={!initialQuery}
            />
            {searchQuery ? (
              <Pressable
                onPress={() => {
                  setSearchQuery("");
                  setResults([]);
                  setSelectedLocation(null);
                  setShowMap(false);
                }}
                hitSlop={8}
              >
                <Feather name="x-circle" size={20} color={theme.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <ThemedText type="small" style={{ marginTop: Spacing.md, color: theme.textSecondary }}>
              Searching...
            </ThemedText>
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.place_id.toString()}
            renderItem={({ item }) => (
              <SearchResultItem
                item={item}
                onPress={() => handleSelectResult(item)}
                theme={theme}
              />
            )}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
          />
        ) : showMap && selectedLocation ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.mapSection}
          >
            <View style={styles.selectedLocationCard}>
              <View style={styles.selectedLocationInfo}>
                <View
                  style={[
                    styles.locationTypeIndicator,
                    {
                      backgroundColor:
                        type === "origin" ? Colors.primary : Colors.secondary,
                    },
                  ]}
                />
                <View style={styles.selectedLocationText}>
                  <ThemedText type="h4">{selectedLocation.name}</ThemedText>
                  <ThemedText
                    type="caption"
                    numberOfLines={2}
                    style={{ color: theme.textSecondary, marginTop: 2 }}
                  >
                    {selectedLocation.fullAddress}
                  </ThemedText>
                </View>
              </View>
              <Feather name="check-circle" size={24} color={Colors.success} />
            </View>

            <View style={styles.mapContainer}>
              {Platform.OS === "web" ? (
                <iframe
                  srcDoc={mapHtml}
                  style={{ width: "100%", height: "100%", border: "none", borderRadius: 16 }}
                />
              ) : (
                <WebView
                  ref={webViewRef}
                  source={{ html: mapHtml }}
                  style={styles.map}
                  scrollEnabled={false}
                  onMessage={handleMapMessage}
                  javaScriptEnabled
                  domStorageEnabled
                  originWhitelist={["*"]}
                />
              )}
            </View>
          </Animated.View>
        ) : !searchQuery ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyStateIcon,
                { backgroundColor: `${Colors.primary}15` },
              ]}
            >
              <Feather name="map-pin" size={32} color={Colors.primary} />
            </View>
            <ThemedText type="h3" style={styles.emptyStateTitle}>
              {type === "origin" ? "Where to pick up?" : "Where to deliver?"}
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.emptyStateText, { color: theme.textSecondary }]}
            >
              Search for a city, address, or landmark
            </ThemedText>

            <Pressable
              style={[
                styles.currentLocationButton,
                {
                  backgroundColor: `${Colors.primary}15`,
                  borderColor: Colors.primary,
                },
              ]}
              onPress={handleUseCurrentLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Feather name="navigation" size={20} color={Colors.primary} />
              )}
              <ThemedText
                type="body"
                style={{ color: Colors.primary, fontWeight: "600", marginLeft: Spacing.sm }}
              >
                {isGettingLocation ? "Getting location..." : "Use My Current Location"}
              </ThemedText>
            </Pressable>

            {Platform.OS === "web" ? (
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary, marginTop: Spacing.sm, textAlign: "center" }}
              >
                GPS available in Expo Go on your device
              </ThemedText>
            ) : null}
          </View>
        ) : null}

        {selectedLocation ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[
              styles.footer,
              {
                paddingBottom: insets.bottom + Spacing.lg,
                backgroundColor: theme.backgroundRoot,
                borderTopColor: theme.border,
              },
            ]}
          >
            <Button onPress={handleConfirm}>
              Confirm {type === "origin" ? "Pickup" : "Delivery"} Location
            </Button>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    textAlign: "center",
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  resultsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTextContainer: {
    flex: 1,
  },
  mapSection: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  selectedLocationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  selectedLocationInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  locationTypeIndicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
  },
  selectedLocationText: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  map: {
    flex: 1,
    backgroundColor: "transparent",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyStateText: {
    textAlign: "center",
  },
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.xl,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
});
