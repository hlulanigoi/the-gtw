import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Colors } from "@/constants/theme";
import { usePayments } from "@/hooks/usePayments";
import { Ionicons } from "@expo/vector-icons";

type PaymentScreenRouteProp = RouteProp<
  {
    Payment: {
      authorizationUrl: string;
      reference: string;
      parcelId: string;
    };
  },
  "Payment"
>;

export default function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute<PaymentScreenRouteProp>();
  const { authorizationUrl, reference, parcelId } = route.params;
  
  const { verifyPayment, isLoading: isVerifying } = usePayments();
  const [isLoading, setIsLoading] = useState(true);
  const [hasVerified, setHasVerified] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const handleVerifyPayment = async () => {
    if (hasVerified) return;
    
    setHasVerified(true);
    const result = await verifyPayment(reference);

    if (result?.success) {
      Alert.alert(
        "Payment Successful! ✅",
        "Your payment has been processed successfully. The carrier can now start transporting your parcel.",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.goBack();
              // Navigate to parcel detail or my parcels
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "Payment Verification",
        result?.message || "Please check your payment status in the app.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    
    // Check if payment was completed
    if (url.includes("callback") || url.includes("verify") || url.includes("success")) {
      handleVerifyPayment();
    }
  };

  const handleClose = () => {
    Alert.alert(
      "Cancel Payment?",
      "Are you sure you want to cancel this payment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          data-testid="payment-close-button"
        >
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={{ width: 28 }} />
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading payment page...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: authorizationUrl }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        data-testid="payment-webview"
      />

      {isVerifying && (
        <View style={styles.verifyingOverlay}>
          <View style={styles.verifyingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.verifyingText}>Verifying payment...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text,
  },
  verifyingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  verifyingCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  verifyingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
});
