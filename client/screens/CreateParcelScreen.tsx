import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, Switch } from "react-native";
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
        style={[
          styles.advancedToggle,
          { borderColor: theme.border },
        ]}
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
    borderRadius: BorderRadius.sm,
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
