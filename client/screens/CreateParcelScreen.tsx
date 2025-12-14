import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useParcels } from "@/hooks/useParcels";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type SizeType = "small" | "medium" | "large";

export default function CreateParcelScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { addParcel } = useParcels();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [size, setSize] = useState<SizeType>("medium");
  const [pickupDate, setPickupDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [compensation, setCompensation] = useState("");

  const isValid = origin.trim() && destination.trim() && size && pickupDate;

  const handleCreate = () => {
    if (!isValid) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    addParcel({
      origin: origin.trim(),
      destination: destination.trim(),
      size,
      pickupDate: new Date(pickupDate),
      compensation: compensation ? parseFloat(compensation) : 50,
      isOwner: true,
      isTransporting: false,
      status: "Pending",
      senderName: "You",
      senderRating: 5.0,
    });

    Alert.alert("Success", "Your parcel has been created!", [
      {
        text: "OK",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const sizeOptions: { key: SizeType; label: string; icon: string }[] = [
    { key: "small", label: "Small", icon: "package" },
    { key: "medium", label: "Medium", icon: "box" },
    { key: "large", label: "Large", icon: "archive" },
  ];

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.formGroup}>
        <ThemedText type="body" style={styles.label}>
          From (Origin) *
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
          <Feather name="map-pin" size={18} color={Colors.primary} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="e.g., Boksburg"
            placeholderTextColor={theme.textSecondary}
            value={origin}
            onChangeText={setOrigin}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText type="body" style={styles.label}>
          To (Destination) *
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
          <Feather name="navigation" size={18} color={Colors.secondary} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="e.g., Kempton Park"
            placeholderTextColor={theme.textSecondary}
            value={destination}
            onChangeText={setDestination}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText type="body" style={styles.label}>
          Size *
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
                size={24}
                color={size === option.key ? "#FFFFFF" : theme.text}
              />
              <ThemedText
                type="small"
                style={{
                  color: size === option.key ? "#FFFFFF" : theme.text,
                  marginTop: Spacing.xs,
                }}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText type="body" style={styles.label}>
          Pickup Date *
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

      <View style={styles.buttonContainer}>
        <Button onPress={handleCreate} disabled={!isValid}>
          Create Parcel
        </Button>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  sizeContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sizeOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  buttonContainer: {
    marginTop: Spacing.lg,
  },
});
