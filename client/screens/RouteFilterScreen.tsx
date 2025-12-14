import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";

type TimeFilter = "any" | "today" | "week" | "month";
type SizeFilter = "any" | "small" | "medium" | "large";
type SortOption = "newest" | "price_low" | "price_high" | "date";

export default function RouteFilterScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("any");
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>("any");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const handleApply = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleReset = () => {
    setTimeFilter("any");
    setSizeFilter("any");
    setSortBy("newest");
  };

  const timeOptions: { key: TimeFilter; label: string }[] = [
    { key: "any", label: "Any Time" },
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
  ];

  const sizeOptions: { key: SizeFilter; label: string }[] = [
    { key: "any", label: "Any Size" },
    { key: "small", label: "Small" },
    { key: "medium", label: "Medium" },
    { key: "large", label: "Large" },
  ];

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: "newest", label: "Newest First" },
    { key: "price_low", label: "Price: Low to High" },
    { key: "price_high", label: "Price: High to Low" },
    { key: "date", label: "Pickup Date" },
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
      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Pickup Time
        </ThemedText>
        <View style={styles.optionsGrid}>
          {timeOptions.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setTimeFilter(option.key)}
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    timeFilter === option.key
                      ? Colors.primary
                      : theme.backgroundDefault,
                  borderColor:
                    timeFilter === option.key ? Colors.primary : theme.border,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color: timeFilter === option.key ? "#FFFFFF" : theme.text,
                  fontWeight: "600",
                }}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Parcel Size
        </ThemedText>
        <View style={styles.optionsGrid}>
          {sizeOptions.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setSizeFilter(option.key)}
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    sizeFilter === option.key
                      ? Colors.primary
                      : theme.backgroundDefault,
                  borderColor:
                    sizeFilter === option.key ? Colors.primary : theme.border,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color: sizeFilter === option.key ? "#FFFFFF" : theme.text,
                  fontWeight: "600",
                }}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Sort By
        </ThemedText>
        <View style={styles.sortList}>
          {sortOptions.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setSortBy(option.key)}
              style={[
                styles.sortItem,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <ThemedText type="body">{option.label}</ThemedText>
              {sortBy === option.key ? (
                <Feather name="check" size={20} color={Colors.primary} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          onPress={handleReset}
          style={[styles.resetButton, { borderColor: theme.border }]}
        >
          <ThemedText type="body" style={{ color: theme.text }}>
            Reset
          </ThemedText>
        </Pressable>
        <View style={styles.applyButton}>
          <Button onPress={handleApply}>Apply Filters</Button>
        </View>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  optionButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  sortList: {
    gap: Spacing.sm,
  },
  sortItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  resetButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  applyButton: {
    flex: 2,
  },
});
