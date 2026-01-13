import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { useParcels } from '@/hooks/useParcels';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type LiveTrackingScreenParams = {
  parcelId: string;
};

type RouteType = RouteProp<{ LiveTracking: LiveTrackingScreenParams }, 'LiveTracking'>;

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export default function LiveTrackingScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const route = useRoute<RouteType>();
  const { parcelId } = route.params;
  const { parcels } = useParcels();
  const { user } = useAuth();

  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);

  const parcel = parcels.find((p) => p.id === parcelId);

  useEffect(() => {
    if (!parcel || parcel.status !== 'In Transit') return;

    // Fetch location history
    const fetchLocationHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/parcels/${parcelId}/location/history?limit=50`);
        if (response.ok) {
          const data = await response.json();
          setLocationHistory(data);
          if (data.length > 0) {
            setCurrentLocation(data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch location history:', error);
      }
    };

    fetchLocationHistory();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchLocationHistory, 30000);

    return () => clearInterval(interval);
  }, [parcelId, parcel]);

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

  if (parcel.status !== 'In Transit') {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.emptyContainer}>
          <Feather name="map-pin" size={48} color={theme.textSecondary} />
          <ThemedText type="h3">Tracking Not Available</ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
            Live tracking is only available when parcel is in transit
          </ThemedText>
        </View>
      </View>
    );
  }

  const mapHtml = `
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
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .origin-marker { background: ${Colors.primary}; }
    .destination-marker { background: ${Colors.secondary}; }
    .current-marker { 
      background: ${Colors.warning};
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
      70% { box-shadow: 0 0 0 15px rgba(245, 158, 11, 0); }
      100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
    }
    .route-line {
      stroke: ${Colors.primary};
      stroke-width: 3;
      stroke-opacity: 0.6;
    }
    .traveled-line {
      stroke: ${Colors.success};
      stroke-width: 4;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const parcel = ${JSON.stringify(parcel)};
    const currentLocation = ${JSON.stringify(currentLocation)};
    const locationHistory = ${JSON.stringify(locationHistory)};
    
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: false,
    }).setView([${parcel.originLat || 0}, ${parcel.originLng || 0}], 12);
    
    L.tileLayer('${
      isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    }', { maxZoom: 19 }).addTo(map);

    const bounds = [];
    
    // Origin marker
    if (parcel.originLat && parcel.originLng) {
      const originIcon = L.divIcon({
        className: '',
        html: '<div class="custom-marker origin-marker"></div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      L.marker([parcel.originLat, parcel.originLng], { icon: originIcon })
        .bindPopup('<b>Origin</b><br>' + parcel.origin)
        .addTo(map);
      bounds.push([parcel.originLat, parcel.originLng]);
    }

    // Destination marker
    if (parcel.destinationLat && parcel.destinationLng) {
      const destIcon = L.divIcon({
        className: '',
        html: '<div class="custom-marker destination-marker"></div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      L.marker([parcel.destinationLat, parcel.destinationLng], { icon: destIcon })
        .bindPopup('<b>Destination</b><br>' + parcel.destination)
        .addTo(map);
      bounds.push([parcel.destinationLat, parcel.destinationLng]);
    }

    // Current location marker
    if (currentLocation) {
      const currentIcon = L.divIcon({
        className: '',
        html: '<div class="custom-marker current-marker"></div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      L.marker([currentLocation.latitude, currentLocation.longitude], { icon: currentIcon })
        .bindPopup('<b>Current Location</b><br>Last updated: ' + new Date(currentLocation.timestamp).toLocaleTimeString())
        .addTo(map);
      bounds.push([currentLocation.latitude, currentLocation.longitude]);

      // Draw traveled path
      if (locationHistory.length > 1) {
        const pathCoords = locationHistory.map(loc => [loc.latitude, loc.longitude]).reverse();
        L.polyline(pathCoords, {
          color: '${Colors.success}',
          weight: 4,
          opacity: 0.7,
        }).addTo(map);
      }
    }

    // Fit bounds
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  </script>
</body>
</html>
  `;

  const timeSinceUpdate = currentLocation
    ? Math.floor((Date.now() - new Date(currentLocation.timestamp).getTime()) / 1000)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe srcDoc={mapHtml} style={{ width: '100%', height: '100%', border: 'none' }} />
        ) : (
          <WebView
            source={{ html: mapHtml }}
            style={styles.map}
            scrollEnabled={false}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
          />
        )}
      </View>

      <ScrollView
        style={styles.infoContainer}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.lg,
        }}
      >
        <Card elevation={2} style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: Colors.success + '20' }]}>
              <Feather name="navigation" size={24} color={Colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="h4">Parcel In Transit</ThemedText>
              {currentLocation && timeSinceUpdate !== null ? (
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Last updated {timeSinceUpdate < 60 ? `${timeSinceUpdate}s ago` : `${Math.floor(timeSinceUpdate / 60)}m ago`}
                </ThemedText>
              ) : (
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Waiting for location update...
                </ThemedText>
              )}
            </View>
          </View>
        </Card>

        <View style={styles.routeInfo}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
            <View style={styles.routeTextContainer}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                FROM
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                {parcel.origin}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.routeLine, { backgroundColor: theme.border }]} />

          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: Colors.secondary }]} />
            <View style={styles.routeTextContainer}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                TO
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                {parcel.destination}
              </ThemedText>
            </View>
          </View>
        </View>

        {currentLocation && (
          <Card elevation={1} style={styles.detailsCard}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
              Location Details
            </ThemedText>
            <View style={styles.detailRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Coordinates:
              </ThemedText>
              <ThemedText type="small">
                {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}
              </ThemedText>
            </View>
            {currentLocation.accuracy ? (
              <View style={styles.detailRow}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Accuracy:
                </ThemedText>
                <ThemedText type="small">{currentLocation.accuracy.toFixed(0)}m</ThemedText>
              </View>
            ) : null}
            {currentLocation.speed ? (
              <View style={styles.detailRow}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Speed:
                </ThemedText>
                <ThemedText type="small">{(currentLocation.speed * 3.6).toFixed(1)} km/h</ThemedText>
              </View>
            ) : null}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  mapContainer: {
    height: Dimensions.get('window').height * 0.5,
  },
  map: {
    flex: 1,
  },
  infoContainer: {
    flex: 1,
  },
  statusCard: {
    marginBottom: Spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeInfo: {
    marginBottom: Spacing.lg,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeTextContainer: {
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: 24,
    marginLeft: 5,
    marginVertical: Spacing.xs,
  },
  detailsCard: {
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
});
