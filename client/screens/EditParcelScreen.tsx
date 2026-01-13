import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Alert, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { MyParcelsStackParamList } from "@/navigation/MyParcelsStackNavigator";
import { useParcels } from "@/hooks/useParcels";

type NavigationProp = NativeStackNavigationProp<MyParcelsStackParamList>;
type RouteType = RouteProp<MyParcelsStackParamList, "EditParcel">;

export default function EditParcelScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { parcelId } = route.params;
  const { parcels, updateParcel } = useParcels();

  const parcel = parcels.find((p) => p.id === parcelId);

  const [weight, setWeight] = useState(parcel?.weight?.toString() || "");
  const [description, setDescription] = useState(parcel?.description || "");
  const [specialInstructions, setSpecialInstructions] = useState(
    parcel?.specialInstructions || ""
  );
  const [isFragile, setIsFragile] = useState(parcel?.isFragile || false);
  const [compensation, setCompensation] = useState(
    parcel?.compensation?.toString() || ""
  );

  const handleSave = () => {
    if (!parcel) return;

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    updateParcel(parcelId, {
      weight: weight ? parseFloat(weight) : undefined,
      description: description.trim() || undefined,
      specialInstructions: specialInstructions.trim() || undefined,
      isFragile,
      compensation: compensation ? parseFloat(compensation) : parcel.compensation,
    });

    Alert.alert("Success", "Parcel details updated!", [
      {
        text: "OK",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

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
          <Feather name="package" size={18} color={Colors.primary} />
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
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>

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
            placeholder="Any special handling requirements..."
            placeholderTextColor={theme.textSecondary}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={styles.switchGroup}>
        <View style={styles.switchRow}>
          <View>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              Fragile
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Handle with care
            </ThemedText>
          </View>
          <Switch
            value={isFragile}
            onValueChange={setIsFragile}
            trackColor={{ false: theme.border, true: Colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button onPress={handleSave}>Save Changes</Button>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
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
    padding: Spacing.md,
  },
  textArea: {
    fontSize: 16,
    minHeight: 80,
  },
  switchGroup: {
    marginBottom: Spacing.xl,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonContainer: {
    marginTop: Spacing.lg,
  },
});
