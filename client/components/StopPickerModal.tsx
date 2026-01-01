import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import * as Haptics from "expo-haptics";
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

type LocationData = {
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
};

type SuggestedStop = {
  id: string;
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
  distance?: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onAddStop: (stop: LocationData) => void;
  origin: LocationData;
  destination: LocationData;
  existingStops: LocationData[];
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SuggestionChip({
  suggestion,
  onPress,
  theme,
  isAdded,
}: {
  suggestion: SuggestedStop;
  onPress: () => void;
  theme: any;
  isAdded: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      }}
      disabled={isAdded}
      style={[
        styles.suggestionChip,
        {
          backgroundColor: isAdded ? `${Colors.success}15` : theme.backgroundSecondary,
          borderColor: isAdded ? Colors.success : theme.border,
          opacity: isAdded ? 0.7 : 1,
        },
        animatedStyle,
      ]}
    >
      <Feather
        name={isAdded ? "check-circle" : "map-pin"}
        size={14}
        color={isAdded ? Colors.success : Colors.primary}
      />
      <ThemedText
        type="small"
        style={{
          color: isAdded ? Colors.success : theme.text,
          fontWeight: "500",
          marginLeft: Spacing.xs,
        }}
        numberOfLines={1}
      >
        {suggestion.name}
      </ThemedText>
      {!isAdded ? (
        <Feather
          name="plus"
          size={14}
          color={Colors.primary}
          style={{ marginLeft: Spacing.xs }}
        />
      ) : null}
    </AnimatedPressable>
  );
}

export function StopPickerModal({
  visible,
  onClose,
  onAddStop,
  origin,
  destination,
  existingStops,
}: Props) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [suggestedStops, setSuggestedStops] = useState<SuggestedStop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingStop, setPendingStop] = useState<LocationData | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const webViewRef = useRef<WebView>(null);

  const fetchRouteAndCities = useCallback(async () => {
    if (!origin || !destination) return;

    setIsLoading(true);
    try {
      const routeResponse = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
      );
      const routeData = await routeResponse.json();

      if (routeData.routes && routeData.routes.length > 0) {
        const coords = routeData.routes[0].geometry.coordinates as [number, number][];
        setRouteCoords(coords);

        const samplePoints: [number, number][] = [];
        if (coords.length >= 10) {
          const step = Math.max(1, Math.floor(coords.length / 6));
          for (let i = step; i < coords.length - step; i += step) {
            if (samplePoints.length < 5) {
              samplePoints.push(coords[i]);
            }
          }
        } else if (coords.length >= 3) {
          const midIndex = Math.floor(coords.length / 2);
          samplePoints.push(coords[midIndex]);
        }

        const cityPromises = samplePoints.map(async ([lng, lat], index) => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
              {
                headers: {
                  "User-Agent": "TheGTW/1.0",
                },
              }
            );
            const data = await response.json();

            if (data && data.address) {
              const cityName =
                data.address.city ||
                data.address.town ||
                data.address.village ||
                data.address.municipality ||
                data.address.county;

              if (cityName) {
                return {
                  id: `suggested-${index}`,
                  name: cityName,
                  fullAddress: data.display_name,
                  lat,
                  lng,
                };
              }
            }
            return null;
          } catch {
            return null;
          }
        });

        const cities = (await Promise.all(cityPromises)).filter(
          (c): c is SuggestedStop => c !== null
        );

        const uniqueCities = cities.reduce((acc: SuggestedStop[], city) => {
          const exists = acc.some(
            (c) =>
              c.name.toLowerCase() === city.name.toLowerCase() ||
              (Math.abs(c.lat - city.lat) < 0.05 &&
                Math.abs(c.lng - city.lng) < 0.05)
          );
          if (!exists) {
            acc.push(city);
          }
          return acc;
        }, []);

        const filteredCities = uniqueCities.filter((city) => {
          const isOrigin =
            city.name.toLowerCase() === origin.name.toLowerCase() ||
            (Math.abs(city.lat - origin.lat) < 0.1 &&
              Math.abs(city.lng - origin.lng) < 0.1);
          const isDest =
            city.name.toLowerCase() === destination.name.toLowerCase() ||
            (Math.abs(city.lat - destination.lat) < 0.1 &&
              Math.abs(city.lng - destination.lng) < 0.1);
          return !isOrigin && !isDest;
        });

        setSuggestedStops(filteredCities);
      }
    } catch (error) {
      console.error("Route fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [origin, destination]);

  useEffect(() => {
    if (visible && origin && destination) {
      fetchRouteAndCities();
    }
  }, [visible, origin, destination, fetchRouteAndCities]);

  const handleMapMessage = useCallback(
    async (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "mapClick") {
          const { lat, lng } = data;

          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
              {
                headers: {
                  "User-Agent": "TheGTW/1.0",
                },
              }
            );
            const locationData = await response.json();

            if (locationData && locationData.display_name) {
              const shortName =
                locationData.name ||
                locationData.address?.city ||
                locationData.address?.town ||
                locationData.address?.village ||
                locationData.address?.suburb ||
                locationData.display_name.split(",")[0];

              setPendingStop({
                name: shortName,
                fullAddress: locationData.display_name,
                lat,
                lng,
              });
            }
          } catch (error) {
            console.error("Reverse geocode error:", error);
          }
        }
      } catch (e) {}
    },
    []
  );

  const handleAddSuggestion = (suggestion: SuggestedStop) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onAddStop({
      name: suggestion.name,
      fullAddress: suggestion.fullAddress,
      lat: suggestion.lat,
      lng: suggestion.lng,
    });
  };

  const handleConfirmPendingStop = () => {
    if (pendingStop) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onAddStop(pendingStop);
      setPendingStop(null);
    }
  };

  const isStopAdded = (suggestion: SuggestedStop) => {
    return existingStops.some(
      (stop) =>
        stop.name.toLowerCase() === suggestion.name.toLowerCase() ||
        (Math.abs(stop.lat - suggestion.lat) < 0.05 &&
          Math.abs(stop.lng - suggestion.lng) < 0.05)
    );
  };

  const mapHtml = useMemo(() => {
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const markers = [
      { lat: origin.lat, lng: origin.lng, title: origin.name, type: "origin" },
      {
        lat: destination.lat,
        lng: destination.lng,
        title: destination.name,
        type: "destination",
      },
    ];

    existingStops.forEach((stop, index) => {
      markers.push({
        lat: stop.lat,
        lng: stop.lng,
        title: stop.name,
        type: "stop",
      } as any);
    });

    const markersJson = JSON.stringify(markers);
    const routeCoordsJson = JSON.stringify(
      routeCoords.map(([lng, lat]) => [lat, lng])
    );
    const suggestionsJson = JSON.stringify(
      suggestedStops.map((s) => ({ lat: s.lat, lng: s.lng, name: s.name }))
    );
    const pendingJson = pendingStop
      ? JSON.stringify({ lat: pendingStop.lat, lng: pendingStop.lng, name: pendingStop.name })
      : "null";

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
      box-shadow: 0 3px 8px rgba(0,0,0,0.3);
    }
    .origin-marker { background: ${Colors.primary}; }
    .destination-marker { background: ${Colors.secondary}; }
    .stop-marker { 
      background: ${Colors.warning}; 
      width: 24px;
      height: 24px;
    }
    .suggestion-marker {
      width: 16px;
      height: 16px;
      background: ${Colors.primary};
      opacity: 0.5;
      border: 2px solid white;
    }
    .pending-marker {
      background: ${Colors.success};
      animation: pulse 1s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    .tap-hint {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.75);
      color: white;
      padding: 10px 20px;
      border-radius: 24px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      pointer-events: none;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="tap-hint">Tap anywhere on the route to add a stop</div>
  <script>
    const markers = ${markersJson};
    const routeCoords = ${routeCoordsJson};
    const suggestions = ${suggestionsJson};
    const pending = ${pendingJson};
    
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([${origin.lat}, ${origin.lng}], 6);
    
    L.tileLayer('${tileUrl}', { maxZoom: 19 }).addTo(map);

    // Draw route line
    if (routeCoords.length > 0) {
      const routeLine = L.polyline(routeCoords, {
        color: '${Colors.primary}',
        weight: 4,
        opacity: 0.8
      }).addTo(map);
      map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
    }

    // Add suggestion markers (smaller, faded)
    suggestions.forEach(s => {
      const icon = L.divIcon({
        className: '',
        html: '<div class="custom-marker suggestion-marker"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      L.marker([s.lat, s.lng], { icon }).addTo(map)
        .bindPopup('<b>' + s.name + '</b><br>Suggested stop');
    });

    // Add main markers
    markers.forEach(marker => {
      let markerClass = 'origin-marker';
      if (marker.type === 'destination') markerClass = 'destination-marker';
      else if (marker.type === 'stop') markerClass = 'stop-marker';
      
      const size = marker.type === 'stop' ? 24 : 32;
      const icon = L.divIcon({
        className: '',
        html: '<div class="custom-marker ' + markerClass + '"></div>',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
      });
      
      L.marker([marker.lat, marker.lng], { icon }).addTo(map)
        .bindPopup('<b>' + marker.title + '</b>');
    });

    // Add pending marker if exists
    if (pending) {
      const icon = L.divIcon({
        className: '',
        html: '<div class="custom-marker pending-marker"></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([pending.lat, pending.lng], { icon }).addTo(map)
        .bindPopup('<b>' + pending.name + '</b><br>Tap confirm to add');
    }

    // Fit bounds to show all markers
    if (markers.length > 1 && routeCoords.length === 0) {
      const bounds = markers.map(m => [m.lat, m.lng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Handle map click
    map.on('click', function(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'mapClick', lat, lng }));
    });
  </script>
</body>
</html>
    `;
  }, [origin, destination, existingStops, routeCoords, suggestedStops, pendingStop, isDark]);

  const handleClose = () => {
    setPendingStop(null);
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
            Add Stops
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.mapContainer}>
          {Platform.OS === "web" ? (
            <iframe
              srcDoc={mapHtml}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          ) : (
            <WebView
              ref={webViewRef}
              source={{ html: mapHtml }}
              style={styles.map}
              onMessage={handleMapMessage}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
            />
          )}
        </View>

        {pendingStop ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={[
              styles.pendingStopCard,
              { backgroundColor: theme.backgroundDefault, borderColor: Colors.success },
            ]}
          >
            <View style={styles.pendingStopInfo}>
              <View style={[styles.pendingDot, { backgroundColor: Colors.success }]} />
              <View style={styles.pendingTextContainer}>
                <ThemedText type="h4">{pendingStop.name}</ThemedText>
                <ThemedText
                  type="caption"
                  numberOfLines={1}
                  style={{ color: theme.textSecondary, marginTop: 2 }}
                >
                  {pendingStop.fullAddress}
                </ThemedText>
              </View>
            </View>
            <View style={styles.pendingActions}>
              <Pressable
                onPress={() => setPendingStop(null)}
                style={[styles.pendingButton, { backgroundColor: theme.backgroundSecondary }]}
              >
                <Feather name="x" size={18} color={theme.textSecondary} />
              </Pressable>
              <Pressable
                onPress={handleConfirmPendingStop}
                style={[styles.pendingButton, { backgroundColor: Colors.success }]}
              >
                <Feather name="check" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </Animated.View>
        ) : null}

        <View
          style={[
            styles.suggestionsSection,
            {
              backgroundColor: theme.backgroundRoot,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
        >
          <View style={styles.suggestionsHeader}>
            <Feather name="zap" size={16} color={Colors.primary} />
            <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>
              Suggested Stops
            </ThemedText>
          </View>
          <ThemedText
            type="caption"
            style={{ color: theme.textSecondary, marginBottom: Spacing.md }}
          >
            Cities and towns detected along your route
          </ThemedText>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <ThemedText
                type="small"
                style={{ marginLeft: Spacing.md, color: theme.textSecondary }}
              >
                Finding stops along your route...
              </ThemedText>
            </View>
          ) : suggestedStops.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            >
              {suggestedStops.map((suggestion) => (
                <SuggestionChip
                  key={suggestion.id}
                  suggestion={suggestion}
                  onPress={() => handleAddSuggestion(suggestion)}
                  theme={theme}
                  isAdded={isStopAdded(suggestion)}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noSuggestions}>
              <Feather name="info" size={16} color={theme.textSecondary} />
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}
              >
                No cities found along this route. Tap the map to add stops manually.
              </ThemedText>
            </View>
          )}
        </View>
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
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
    backgroundColor: "transparent",
  },
  pendingStopCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  pendingStopInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pendingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  pendingTextContainer: {
    flex: 1,
  },
  pendingActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  pendingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },
  suggestionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  suggestionsScroll: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  noSuggestions: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
});
