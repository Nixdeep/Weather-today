import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";

export default function SignupScreen() {
  const { signup } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setError("");
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await signup(name, email, password, confirmPassword);
    setLoading(false);
    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/dashboard");
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error ?? "Sign up failed.");
    }
  };

  return (
    <LinearGradient
      colors={["#0A1E3D", "#1A3A6B", "#2B5FA6"]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            {
              paddingTop: insets.top + (Platform.OS === "web" ? 67 : 48),
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 32),
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color="rgba(255,255,255,0.8)" />
          </Pressable>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Feather name="user-plus" size={32} color="#fff" />
            </View>
            <Text style={styles.appName}>Create Account</Text>
            <Text style={styles.tagline}>Join SkyView and check the weather</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <View>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="user" size={18} color="#6B7FA3" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor="#6B7FA3"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="mail" size={18} color="#6B7FA3" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#6B7FA3"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={18} color="#6B7FA3" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#6B7FA3"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#6B7FA3" />
                  </Pressable>
                </View>
              </View>

              <View>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    confirmPassword.length > 0 &&
                      password !== confirmPassword &&
                      styles.inputWrapperError,
                  ]}
                >
                  <Feather name="lock" size={18} color="#6B7FA3" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Repeat your password"
                    placeholderTextColor="#6B7FA3"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
                    <Feather name={showConfirm ? "eye-off" : "eye"} size={18} color="#6B7FA3" />
                  </Pressable>
                </View>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <Text style={styles.fieldError}>Passwords don't match</Text>
                )}
              </View>
            </View>

            {error !== "" && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.signupBtn, pressed && styles.signupBtnPressed]}
              onPress={handleSignup}
              disabled={loading}
            >
              <LinearGradient
                colors={["#1D6FD8", "#3B82F6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signupBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.signupBtnText}>Create Account</Text>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Already have an account?</Text>
              <Pressable onPress={() => router.replace("/login")}>
                <Text style={styles.loginLink}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  container: {
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  appName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },
  inputGroup: {
    gap: 16,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#6B7FA3",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F6FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D0E2FF",
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperError: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#0A1628",
  },
  eyeBtn: {
    padding: 4,
  },
  fieldError: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#EF4444",
    marginTop: 4,
    marginLeft: 2,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#EF4444",
    flex: 1,
  },
  signupBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
  },
  signupBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  signupBtnGradient: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  signupBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 20,
  },
  loginPrompt: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#6B7FA3",
  },
  loginLink: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#1D6FD8",
  },
});
