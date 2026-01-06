import React, { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import type { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setEmailSent(true);
    } catch (error: any) {
      let message = "Failed to send reset email. Please try again.";
      if (error.code === "auth/user-not-found") {
        message = "No account found with this email address.";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Too many attempts. Please try again later.";
      }
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.scrollContent,
            {
              paddingTop: insets.top + Spacing["3xl"],
              paddingBottom: insets.bottom + Spacing.xl,
            },
          ]}
        >
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>

          <View style={styles.successContainer}>
            <View style={[styles.iconContainer, { backgroundColor: Colors.success + "20" }]}>
              <Feather name="check-circle" size={48} color={Colors.success} />
            </View>
            <ThemedText type="h1" style={styles.title}>
              Check Your Email
            </ThemedText>
            <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
              We've sent password reset instructions to
            </ThemedText>
            <ThemedText type="body" style={[styles.email, { color: Colors.primary }]}>
              {email}
            </ThemedText>

            <View style={styles.instructionContainer}>
              <View style={styles.instructionItem}>
                <View style={[styles.stepNumber, { backgroundColor: Colors.primary }]}>
                  <ThemedText type="caption" style={styles.stepNumberText}>1</ThemedText>
                </View>
                <ThemedText type="body" style={{ color: theme.textSecondary, flex: 1 }}>
                  Open the email and tap the reset link
                </ThemedText>
              </View>
              <View style={styles.instructionItem}>
                <View style={[styles.stepNumber, { backgroundColor: Colors.primary }]}>
                  <ThemedText type="caption" style={styles.stepNumberText}>2</ThemedText>
                </View>
                <ThemedText type="body" style={{ color: theme.textSecondary, flex: 1 }}>
                  Create a new secure password
                </ThemedText>
              </View>
              <View style={styles.instructionItem}>
                <View style={[styles.stepNumber, { backgroundColor: Colors.primary }]}>
                  <ThemedText type="caption" style={styles.stepNumberText}>3</ThemedText>
                </View>
                <ThemedText type="body" style={{ color: theme.textSecondary, flex: 1 }}>
                  Return here to sign in with your new password
                </ThemedText>
              </View>
            </View>

            <Pressable
              onPress={() => navigation.navigate("Login")}
              style={({ pressed }) => [
                styles.backToLoginButton,
                { backgroundColor: Colors.primary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <ThemedText type="body" style={styles.backToLoginButtonText}>
                Back to Sign In
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => {
                setEmailSent(false);
                setEmail("");
              }}
              style={styles.resendLink}
            >
              <ThemedText type="body" style={{ color: Colors.primary }}>
                Didn't receive the email? Try again
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>

        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: Colors.primary + "20" }]}>
            <Feather name="lock" size={40} color={Colors.primary} />
          </View>
          <ThemedText type="h1" style={styles.title}>
            Forgot Password?
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            No worries! Enter your email and we'll send you reset instructions.
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <ThemedText type="small" style={styles.label}>
              Email Address
            </ThemedText>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              ]}
            >
              <Feather name="mail" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your email"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          <Pressable
            onPress={handleResetPassword}
            disabled={loading}
            style={({ pressed }) => [
              styles.resetButton,
              { backgroundColor: Colors.primary, opacity: pressed || loading ? 0.8 : 1 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText type="body" style={styles.resetButtonText}>
                Send Reset Link
              </ThemedText>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Remember your password?{" "}
          </ThemedText>
          <Pressable onPress={() => navigation.navigate("Login")}>
            <ThemedText type="body" style={{ color: Colors.primary, fontWeight: "600" }}>
              Sign In
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  backButton: {
    marginBottom: Spacing.xl,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
    lineHeight: 22,
  },
  email: {
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  resetButton: {
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: Spacing["2xl"],
  },
  instructionContainer: {
    width: "100%",
    marginTop: Spacing["2xl"],
    marginBottom: Spacing["2xl"],
    gap: Spacing.lg,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  backToLoginButton: {
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: Spacing.md,
  },
  backToLoginButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  resendLink: {
    padding: Spacing.sm,
  },
});
