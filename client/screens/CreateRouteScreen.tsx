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
import { useRoutes } from "@/hooks/useRoutes";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FrequencyType = "one_time" | "daily" | "weekly" | "monthly";
type SizeType = "small" | "medium" | "large";

export default function CreateRouteScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { addRoute } = useRoutes();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [departureTime, setDepartureTime] = useState("");
  const [frequency, setFrequency] = useState<FrequencyType>("one_time");
  const [maxParcelSize, setMaxParcelSize] = useState<SizeType | null>(null);
  const [maxWeight, setMaxWeight] = useState("");
  const [availableCapacity, setAvailableCapacity] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [notes, setNotes] = useState("");

  const isValid = origin.trim() && destination.trim() && departureDate;

  const handleCreate = async () => {
    if (!isValid) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await addRoute({
        origin: origin.trim(),
        destination: destination.trim(),
        departureDate: new Date(departureDate),
        departureTime: departureTime || null,
        frequency,
        maxParcelSize,
        maxWeight: maxWeight ? parseFloat(maxWeight) : null,
        availableCapacity: availableCapacity
          ? parseInt(availableCapacity, 10)
          : null,
        pricePerKg: pricePerKg ? parseInt(pricePerKg, 10) : null,
        notes: notes || null,
        expiresAt: null,
      });

      Alert.alert("Success", "Your route has been created!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      Alert.alert("Error", "Failed to create route. Please try again.");
    }
  };

  const frequencyOptions: { key: FrequencyType; label: string }[] = [
    { key: "one_time", label: "One-time" },
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
  ];

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
            placeholder="e.g., Johannesburg"
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
            placeholder="e.g., Cape Town"
            placeholderTextColor={theme.textSecondary}
            value={destination}
            onChangeText={setDestination}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText type="body" style={styles.label}>
          Departure Date *
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
            value={departureDate}
            onChangeText={setDepartureDate}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText type="body" style={styles.label}>
          Departure Time
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
          <Feather name="clock" size={18} color={Colors.primary} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="e.g., 08:00"
            placeholderTextColor={theme.textSecondary}
            value={departureTime}
            onChangeText={setDepartureTime}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText type="body" style={styles.label}>
          Frequency
        </ThemedText>
        <View style={styles.frequencyContainer}>
          {frequencyOptions.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => {
                setFrequency(option.key);
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              style={[
                styles.frequencyOption,
                {
                  backgroundColor:
                    frequency === option.key
                      ? Colors.primary
                      : theme.backgroundDefault,
                  borderColor:
                    frequency === option.key ? Colors.primary : theme.border,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color: frequency === option.key ? "#FFFFFF" : theme.text,
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
          Max Parcel Size
        </ThemedText>
        <View style={styles.sizeContainer}>
          {sizeOptions.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => {
                setMaxParcelSize(
                  maxParcelSize === option.key ? null : option.key
                );
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              style={[
                styles.sizeOption,
                {
                  backgroundColor:
                    maxParcelSize === option.key
                      ? Colors.primary
                      : theme.backgroundDefault,
                  borderColor:
                    maxParcelSize === option.key
                      ? Colors.primary
                      : theme.border,
                },
              ]}
            >
              <Feather
                name={option.icon as any}
                size={24}
                color={maxParcelSize === option.key ? "#FFFFFF" : theme.text}
              />
              <ThemedText
                type="small"
                style={{
                  color:
                    maxParcelSize === option.key ? "#FFFFFF" : theme.text,
                  marginTop: Spacing.xs,
                }}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, styles.halfWidth]}>
          <ThemedText type="body" style={styles.label}>
            Max Weight (kg)
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
              placeholder="e.g., 20"
              placeholderTextColor={theme.textSecondary}
              value={maxWeight}
              onChangeText={setMaxWeight}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={[styles.formGroup, styles.halfWidth]}>
          <ThemedText type="body" style={styles.label}>
            Available Spots
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
              placeholder="e.g., 5"
              placeholderTextColor={theme.textSecondary}
              value={availableCapacity}
              onChangeText={setAvailableCapacity}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText type="body" style={styles.label}>
          Price per kg (R)
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
            placeholder="e.g., 10"
            placeholderTextColor={theme.textSecondary}
            value={pricePerKg}
            onChangeText={setPricePerKg}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText type="body" style={styles.label}>
          Notes
        </ThemedText>
        <View
          style={[
            styles.inputContainer,
            styles.textArea,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              styles.textAreaInput,
              { color: theme.text },
            ]}
            placeholder="Any additional information about your route..."
            placeholderTextColor={theme.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <Button
        onPress={handleCreate}
        disabled={!isValid}
        style={styles.button}
      >
        Create Route
      </Button>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  textArea: {
    alignItems: "flex-start",
    paddingVertical: Spacing.md,
  },
  textAreaInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  frequencyContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  frequencyOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  sizeContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sizeOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  button: {
    marginTop: Spacing.lg,
  },
});
