import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SectionCard({
  title,
  icon,
  children,
  theme,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  theme: any;
}) {
  return (
    <View
      style={[styles.sectionCard, { backgroundColor: theme.backgroundDefault }]}
    >
      <View style={styles.sectionHeader}>
        <View
          style={[styles.sectionIconContainer, { backgroundColor: `${Colors.primary}15` }]}
        >
          <Feather name={icon as any} size={18} color={Colors.primary} />
        </View>
        <ThemedText type="h3" style={styles.sectionTitle}>
          {title}
        </ThemedText>
      </View>
      {children}
    </View>
  );
}

function SelectableChip({
  selected,
  label,
  onPress,
  theme,
  icon,
}: {
  selected: boolean;
  label: string;
  onPress: () => void;
  theme: any;
  icon?: string;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={() => {
        onPress();
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.chip,
        animatedStyle,
        {
          backgroundColor: selected ? Colors.primary : theme.backgroundSecondary,
          borderColor: selected ? Colors.primary : theme.border,
        },
      ]}
    >
      {icon ? (
        <Feather
          name={icon as any}
          size={16}
          color={selected ? "#FFFFFF" : theme.textSecondary}
          style={{ marginRight: Spacing.xs }}
        />
      ) : null}
      <ThemedText
        type="small"
        style={{
          color: selected ? "#FFFFFF" : theme.text,
          fontWeight: selected ? "600" : "400",
        }}
      >
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

function SizeCard({
  selected,
  label,
  icon,
  description,
  onPress,
  theme,
}: {
  selected: boolean;
  label: string;
  icon: string;
  description: string;
  onPress: () => void;
  theme: any;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={() => {
        onPress();
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.sizeCard,
        animatedStyle,
        {
          backgroundColor: selected
            ? `${Colors.primary}15`
            : theme.backgroundSecondary,
          borderColor: selected ? Colors.primary : theme.border,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.sizeIconContainer,
          {
            backgroundColor: selected ? Colors.primary : theme.backgroundTertiary,
          },
        ]}
      >
        <Feather
          name={icon as any}
          size={24}
          color={selected ? "#FFFFFF" : theme.textSecondary}
        />
      </View>
      <ThemedText
        type="body"
        style={{
          fontWeight: "600",
          color: selected ? Colors.primary : theme.text,
          marginTop: Spacing.sm,
        }}
      >
        {label}
      </ThemedText>
      <ThemedText
        type="caption"
        style={{
          color: theme.textSecondary,
          marginTop: Spacing.xs,
          textAlign: "center",
        }}
      >
        {description}
      </ThemedText>
    </AnimatedPressable>
  );
}

export default function CreateRouteScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { addRoute } = useRoutes();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [intermediateStops, setIntermediateStops] = useState<string[]>([]);
  const [newStop, setNewStop] = useState("");
  const [departureDate, setDepartureDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [departureTime, setDepartureTime] = useState("");
  const [frequency, setFrequency] = useState<FrequencyType>("one_time");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [maxParcelSize, setMaxParcelSize] = useState<SizeType | null>(null);
  const [maxWeight, setMaxWeight] = useState("");
  const [availableCapacity, setAvailableCapacity] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRecurring = frequency !== "one_time";
  const isValid = origin.trim() && destination.trim() && departureDate;

  const addIntermediateStop = () => {
    if (newStop.trim()) {
      setIntermediateStops([...intermediateStops, newStop.trim()]);
      setNewStop("");
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const removeIntermediateStop = (index: number) => {
    setIntermediateStops(intermediateStops.filter((_, i) => i !== index));
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleCreate = async () => {
    if (isSubmitting) return;

    if (!isValid) {
      Alert.alert("Missing Information", "Please fill in the origin, destination, and departure date.");
      return;
    }

    setIsSubmitting(true);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await addRoute({
        origin: origin.trim(),
        destination: destination.trim(),
        intermediateStops: intermediateStops.length > 0 ? intermediateStops : null,
        departureDate: new Date(departureDate),
        departureTime: departureTime || null,
        frequency,
        recurrenceEndDate: isRecurring && recurrenceEndDate ? new Date(recurrenceEndDate) : null,
        maxParcelSize,
        maxWeight: maxWeight ? parseFloat(maxWeight) : null,
        availableCapacity: availableCapacity
          ? parseInt(availableCapacity, 10)
          : null,
        pricePerKg: pricePerKg ? parseInt(pricePerKg, 10) : null,
        notes: notes || null,
        expiresAt: null,
      });

      Alert.alert("Route Created", "Your route is now visible to senders!", [
        {
          text: "View My Routes",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      Alert.alert("Something went wrong", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const frequencyOptions: { key: FrequencyType; label: string; icon: string }[] = [
    { key: "one_time", label: "One-time", icon: "calendar" },
    { key: "daily", label: "Daily", icon: "repeat" },
    { key: "weekly", label: "Weekly", icon: "calendar" },
    { key: "monthly", label: "Monthly", icon: "calendar" },
  ];

  const sizeOptions: { key: SizeType; label: string; icon: string; description: string }[] = [
    { key: "small", label: "Small", icon: "package", description: "Fits in a backpack" },
    { key: "medium", label: "Medium", icon: "box", description: "Fits in a car trunk" },
    { key: "large", label: "Large", icon: "truck", description: "Needs vehicle space" },
  ];

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: Spacing.lg,
        paddingBottom: insets.bottom + Spacing["3xl"],
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <SectionCard title="Route Details" icon="map" theme={theme}>
        <View style={styles.routeInputs}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputLabelRow}>
              <View style={[styles.dotIndicator, { backgroundColor: Colors.primary }]} />
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                FROM
              </ThemedText>
            </View>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="e.g., Johannesburg"
                placeholderTextColor={theme.textSecondary}
                value={origin}
                onChangeText={setOrigin}
              />
            </View>
          </View>

          <View style={styles.routeConnector}>
            <View style={[styles.connectorLine, { backgroundColor: theme.border }]} />
            <View style={[styles.connectorIcon, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="arrow-down" size={16} color={theme.textSecondary} />
            </View>
            <View style={[styles.connectorLine, { backgroundColor: theme.border }]} />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputLabelRow}>
              <View style={[styles.dotIndicator, { backgroundColor: Colors.secondary }]} />
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                TO
              </ThemedText>
            </View>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="e.g., Cape Town"
                placeholderTextColor={theme.textSecondary}
                value={destination}
                onChangeText={setDestination}
              />
            </View>
          </View>
        </View>

        <View style={styles.stopsSection}>
          <View style={styles.stopsHeader}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              STOPS ALONG THE WAY (OPTIONAL)
            </ThemedText>
          </View>
          
          {intermediateStops.map((stop, index) => (
            <View key={index} style={[styles.stopItem, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <View style={[styles.stopNumber, { backgroundColor: `${Colors.primary}20` }]}>
                <ThemedText type="caption" style={{ color: Colors.primary, fontWeight: "600" }}>
                  {index + 1}
                </ThemedText>
              </View>
              <ThemedText type="body" style={{ flex: 1, color: theme.text }}>
                {stop}
              </ThemedText>
              <Pressable onPress={() => removeIntermediateStop(index)} hitSlop={8}>
                <Feather name="x-circle" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
          ))}

          <View style={[styles.addStopRow, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <Feather name="map-pin" size={16} color={theme.textSecondary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Add a stop (e.g., Bloemfontein)"
              placeholderTextColor={theme.textSecondary}
              value={newStop}
              onChangeText={setNewStop}
              onSubmitEditing={addIntermediateStop}
              returnKeyType="done"
            />
            <Pressable onPress={addIntermediateStop} hitSlop={8}>
              <Feather name="plus-circle" size={22} color={Colors.primary} />
            </Pressable>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Schedule" icon="clock" theme={theme}>
        <View style={styles.scheduleRow}>
          <View style={styles.scheduleField}>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
              DATE
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
              ]}
            >
              <Feather name="calendar" size={16} color={Colors.primary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textSecondary}
                value={departureDate}
                onChangeText={setDepartureDate}
              />
            </View>
          </View>
          <View style={styles.scheduleField}>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
              TIME (OPTIONAL)
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
              ]}
            >
              <Feather name="clock" size={16} color={Colors.primary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="08:00"
                placeholderTextColor={theme.textSecondary}
                value={departureTime}
                onChangeText={setDepartureTime}
              />
            </View>
          </View>
        </View>

        <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
          FREQUENCY
        </ThemedText>
        <View style={styles.chipContainer}>
          {frequencyOptions.map((option) => (
            <SelectableChip
              key={option.key}
              selected={frequency === option.key}
              label={option.label}
              onPress={() => setFrequency(option.key)}
              theme={theme}
            />
          ))}
        </View>

        {isRecurring ? (
          <View style={styles.recurrenceEndSection}>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
              REPEAT UNTIL (OPTIONAL)
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
              ]}
            >
              <Feather name="calendar" size={16} color={Colors.secondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="YYYY-MM-DD (leave empty for indefinite)"
                placeholderTextColor={theme.textSecondary}
                value={recurrenceEndDate}
                onChangeText={setRecurrenceEndDate}
              />
            </View>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
              {frequency === "daily" && "Route will repeat every day until end date"}
              {frequency === "weekly" && "Route will repeat every week until end date"}
              {frequency === "monthly" && "Route will repeat every month until end date"}
            </ThemedText>
          </View>
        ) : null}
      </SectionCard>

      <SectionCard title="Capacity" icon="package" theme={theme}>
        <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
          MAXIMUM PARCEL SIZE
        </ThemedText>
        <View style={styles.sizeCardsContainer}>
          {sizeOptions.map((option) => (
            <SizeCard
              key={option.key}
              selected={maxParcelSize === option.key}
              label={option.label}
              icon={option.icon}
              description={option.description}
              onPress={() =>
                setMaxParcelSize(maxParcelSize === option.key ? null : option.key)
              }
              theme={theme}
            />
          ))}
        </View>

        <View style={[styles.capacityRow, { marginTop: Spacing.xl }]}>
          <View style={styles.capacityField}>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
              MAX WEIGHT (KG)
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
              ]}
            >
              <Feather name="activity" size={16} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="20"
                placeholderTextColor={theme.textSecondary}
                value={maxWeight}
                onChangeText={setMaxWeight}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.capacityField}>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
              AVAILABLE SPOTS
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
              ]}
            >
              <Feather name="layers" size={16} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="5"
                placeholderTextColor={theme.textSecondary}
                value={availableCapacity}
                onChangeText={setAvailableCapacity}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Pricing" icon="dollar-sign" theme={theme}>
        <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
          PRICE PER KILOGRAM
        </ThemedText>
        <View
          style={[
            styles.priceInputContainer,
            { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
          ]}
        >
          <View style={[styles.currencyBadge, { backgroundColor: `${Colors.success}20` }]}>
            <ThemedText type="body" style={{ color: Colors.success, fontWeight: "700" }}>
              R
            </ThemedText>
          </View>
          <TextInput
            style={[styles.priceInput, { color: theme.text }]}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            value={pricePerKg}
            onChangeText={setPricePerKg}
            keyboardType="numeric"
          />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            per kg
          </ThemedText>
        </View>
      </SectionCard>

      <SectionCard title="Additional Notes" icon="file-text" theme={theme}>
        <View
          style={[
            styles.textAreaContainer,
            { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
          ]}
        >
          <TextInput
            style={[styles.textArea, { color: theme.text }]}
            placeholder="Any special instructions or details about your route..."
            placeholderTextColor={theme.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </SectionCard>

      <Button
        onPress={handleCreate}
        disabled={!isValid || isSubmitting}
        style={styles.submitButton}
      >
        {isSubmitting ? "Creating..." : "Create Route"}
      </Button>

      <ThemedText
        type="caption"
        style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.md }}
      >
        Your route will be visible to senders looking for carriers
      </ThemedText>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  sectionTitle: {
    flex: 1,
  },
  routeInputs: {
    gap: 0,
  },
  inputWrapper: {
    gap: Spacing.xs,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  routeConnector: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.xl,
  },
  connectorLine: {
    flex: 1,
    height: 1,
  },
  connectorIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  scheduleField: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  sizeCardsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sizeCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  sizeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  capacityRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  capacityField: {
    flex: 1,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 56,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.md,
  },
  currencyBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  priceInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    height: "100%",
  },
  textAreaContainer: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.md,
  },
  textArea: {
    fontSize: 16,
    minHeight: 100,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
  stopsSection: {
    marginTop: Spacing.lg,
  },
  stopsHeader: {
    marginBottom: Spacing.sm,
  },
  stopItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  stopNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addStopRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: Spacing.sm,
  },
  recurrenceEndSection: {
    marginTop: Spacing.lg,
  },
});
