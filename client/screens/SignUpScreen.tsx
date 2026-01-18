import React, { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Image,
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

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { signUp, signInWithGoogle, googleLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
    } catch (error: any) {
      console.error("SignUp component error:", error);
      let message = "Failed to create account. Please try again.";
      const code = error.code || error.message;

      if (code === "auth/email-already-in-use") {
        message = "An account with this email already exists.";
      } else if (code === "auth/invalid-email") {
        message = "Invalid email address.";
      } else if (code === "auth/weak-password" || code?.includes("password-does-not-meet-requirements")) {
        message = "Password is too weak or does not meet requirements.";
      } else if (code?.includes("network-request-failed")) {
        message = "Network error. Please check your connection.";
      } else if (error.message) {
        message = error.message;
      }
      
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // @ts-ignore - Argument required in type but we are handling placeholder in context
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert("Error", "Failed to sign in with Google. Please try again.");
    }
  };

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
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: Colors.primary }]}>
            <Feather name="user-plus" size={40} color="#FFFFFF" />
          </View>
          <ThemedText type="h1" style={styles.title}>
            Create Account
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Join The GTW community today
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <ThemedText type="small" style={styles.label}>
              Full Name
            </ThemedText>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              ]}
            >
              <Feather name="user" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your full name"
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={setName}
                autoComplete="name"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText type="small" style={styles.label}>
              Email
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

          <View style={styles.inputContainer}>
            <ThemedText type="small" style={styles.label}>
              Password
            </ThemedText>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              ]}
            >
              <Feather name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Create a password"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText type="small" style={styles.label}>
              Confirm Password
            </ThemedText>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              ]}
            >
              <Feather name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirm your password"
                placeholderTextColor={theme.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>
          </View>

          <Pressable
            onPress={handleSignUp}
            disabled={loading}
            style={({ pressed }) => [
              styles.signUpButton,
              { backgroundColor: Colors.primary, opacity: pressed || loading ? 0.8 : 1 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText type="body" style={styles.signUpButtonText}>
                Create Account
              </ThemedText>
            )}
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ThemedText type="small" style={[styles.dividerText, { color: theme.textSecondary }]}>
              OR
            </ThemedText>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </View>

          <Pressable
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            style={({ pressed }) => [
              styles.googleButton,
              { 
                backgroundColor: theme.backgroundDefault, 
                borderColor: theme.border,
                opacity: pressed || googleLoading ? 0.8 : 1 
              },
            ]}
          >
            {googleLoading ? (
              <ActivityIndicator color={theme.text} />
            ) : (
              <>
                <Image
                  source={{ uri: "https://www.google.com/favicon.ico" }}
                  style={styles.googleIcon}
                />
                <ThemedText type="body" style={styles.googleButtonText}>
                  Continue with Google
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Already have an account?{" "}
          </ThemedText>
          <Pressable onPress={() => navigation.navigate("Login")}>
            <ThemedText type="body" style={{ color: Colors.primary, fontWeight: "600" }}>
              Sign In
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.termsContainer}>
          <ThemedText type="caption" style={[styles.termsText, { color: theme.textSecondary }]}>
            By creating an account, you agree to our{" "}
          </ThemedText>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") {
                try {
                  Linking.openURL("https://example.com/terms");
                } catch {}
              }
            }}
          >
            <ThemedText type="caption" style={{ color: Colors.primary }}>
              Terms of Service
            </ThemedText>
          </Pressable>
          <ThemedText type="caption" style={[styles.termsText, { color: theme.textSecondary }]}>
            {" "}and{" "}
          </ThemedText>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") {
                try {
                  Linking.openURL("https://example.com/privacy");
                } catch {}
              }
            }}
          >
            <ThemedText type="caption" style={{ color: Colors.primary }}>
              Privacy Policy
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
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: "center",
  },
  form: {
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.md,
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
  eyeButton: {
    padding: Spacing.xs,
  },
  signUpButton: {
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  signUpButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
  },
  googleButton: {
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderWidth: 1,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: Spacing.sm,
  },
  googleButtonText: {
    fontWeight: "600",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  termsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  termsText: {
    textAlign: "center",
  },
});
