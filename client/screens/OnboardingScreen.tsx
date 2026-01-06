import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { setOnboardingComplete } from "@/lib/onboarding";
import type { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type OnboardingSlide = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  title: string;
  description: string;
};

const slides: OnboardingSlide[] = [
  {
    id: "1",
    icon: "package",
    iconColor: Colors.primary,
    title: "Send Parcels Anywhere",
    description:
      "Need to send a package? Post your parcel and connect with trusted travelers heading your way.",
  },
  {
    id: "2",
    icon: "users",
    iconColor: Colors.secondary,
    title: "Travel & Earn",
    description:
      "Going somewhere? Pick up parcels along your route and earn money while you travel.",
  },
  {
    id: "3",
    icon: "shield",
    iconColor: Colors.success,
    title: "Safe & Secure",
    description:
      "Verified users, secure messaging, and real-time tracking keep your parcels protected every step of the way.",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const buttonScale = useSharedValue(1);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== currentPage && page >= 0 && page < slides.length) {
      setCurrentPage(page);
    }
  };

  const scrollToPage = (page: number) => {
    scrollRef.current?.scrollTo({ x: page * SCREEN_WIDTH, animated: true });
  };

  const handleNext = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentPage < slides.length - 1) {
      scrollToPage(currentPage + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    await setOnboardingComplete();
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const handleDotPress = (index: number) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    scrollToPage(index);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const isLastSlide = currentPage === slides.length - 1;

  const renderSlide = (slide: OnboardingSlide) => (
    <View key={slide.id} style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Animated.View
        entering={FadeIn.duration(600).delay(200)}
        style={styles.slideContent}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${slide.iconColor}15` },
          ]}
        >
          <Feather name={slide.icon} size={80} color={slide.iconColor} />
        </View>

        <ThemedText type="h1" style={styles.slideTitle}>
          {slide.title}
        </ThemedText>

        <ThemedText
          type="body"
          style={[styles.slideDescription, { color: theme.textSecondary }]}
        >
          {slide.description}
        </ThemedText>
      </Animated.View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.logoRow}>
          <View style={[styles.logoIcon, { backgroundColor: Colors.primary }]}>
            <Feather name="package" size={20} color="#FFFFFF" />
          </View>
          <ThemedText type="h3" style={styles.logoText}>
            The GTW
          </ThemedText>
        </View>
        {!isLastSlide ? (
          <Pressable onPress={handleSkip} hitSlop={12}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Skip
            </ThemedText>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {slides.map((slide) => renderSlide(slide))}
      </ScrollView>

      <Animated.View
        entering={FadeInDown.duration(400).delay(400)}
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => handleDotPress(index)}
              hitSlop={8}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === currentPage ? Colors.primary : theme.border,
                    width: index === currentPage ? 24 : 8,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>

        <Animated.View style={buttonAnimatedStyle}>
          <Pressable
            onPress={handleNext}
            onPressIn={() => {
              buttonScale.value = withSpring(0.95);
            }}
            onPressOut={() => {
              buttonScale.value = withSpring(1);
            }}
            style={({ pressed }) => [
              styles.nextButton,
              { backgroundColor: Colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <ThemedText type="body" style={styles.nextButtonText}>
              {isLastSlide ? "Get Started" : "Next"}
            </ThemedText>
            <Feather
              name={isLastSlide ? "arrow-right" : "chevron-right"}
              size={20}
              color="#FFFFFF"
              style={styles.nextButtonIcon}
            />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  logoText: {
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  slideContent: {
    alignItems: "center",
    maxWidth: 320,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["3xl"],
  },
  slideTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  slideDescription: {
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 17,
  },
  nextButtonIcon: {
    marginLeft: Spacing.xs,
  },
});
