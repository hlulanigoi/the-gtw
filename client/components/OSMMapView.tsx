import React, { useMemo } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing } from "@/constants/theme";

type Marker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  type: "origin" | "destination";
};

type Props = {
  markers: Marker[];
  onMarkerPress?: (id: string) => void;
  style?: any;
};

export function OSMMapView({ markers, onMarkerPress, style }: Props) {
  const { theme, isDark } = useTheme();

  const html = useMemo(() => {
    const validMarkers = markers.filter(
      (m) => m.lat && m.lng && !isNaN(m.lat) && !isNaN(m.lng)
    );

    const center =
      validMarkers.length > 0
        ? { lat: validMarkers[0].lat, lng: validMarkers[0].lng }
        : { lat: 48.8566, lng: 2.3522 };

    const markersJson = JSON.stringify(validMarkers);
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
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .origin-marker { background: ${Colors.primary}; }
    .destination-marker { background: ${Colors.secondary}; }
    .marker-popup {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .popup-title {
      font-weight: 600;
      font-size: 14px;
      color: #333;
    }
    .popup-subtitle {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const markers = ${markersJson};
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${center.lat}, ${center.lng}], 6);
    
    L.tileLayer('${tileUrl}', {
      maxZoom: 19
    }).addTo(map);

    const bounds = [];
    
    markers.forEach(marker => {
      const isOrigin = marker.type === 'origin';
      const icon = L.divIcon({
        className: '',
        html: '<div class="custom-marker ' + (isOrigin ? 'origin-marker' : 'destination-marker') + '"></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      
      const m = L.marker([marker.lat, marker.lng], { icon })
        .addTo(map)
        .bindPopup('<div class="marker-popup"><div class="popup-title">' + marker.title + '</div>' + 
          (marker.subtitle ? '<div class="popup-subtitle">' + marker.subtitle + '</div>' : '') + '</div>');
      
      m.on('click', () => {
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'markerPress', id: marker.id }));
      });
      
      bounds.push([marker.lat, marker.lng]);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 10);
    }
  </script>
</body>
</html>
    `;
  }, [markers, isDark]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "markerPress" && onMarkerPress) {
        onMarkerPress(data.id);
      }
    } catch (e) {}
  };

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, style]}>
        <iframe
          srcDoc={html}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 12,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
