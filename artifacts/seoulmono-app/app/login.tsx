import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert("お知らせ", "携帯電話番号とパスワードを入力してください。");
      return;
    }
    setLoading(true);
    try {
      await login(phone.trim(), password);
      router.back();
    } catch (e: any) {
      Alert.alert("ログイン失敗", e.message ?? "携帯電話番号またはパスワードをご確認ください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>ログイン</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Text style={[styles.logo, { color: colors.primary }]}>seoulmono</Text>
          <Text style={[styles.logoSub, { color: colors.mutedForeground }]}>良い商品を、納得の価格で</Text>
        </View>

        {/* 案内メッセージ */}
        <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="smartphone" size={15} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            携帯電話番号がIDです
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>携帯電話番号</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="smartphone" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="090-0000-0000"
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>パスワード</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="パスワードを入力してください"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPw(!showPw)}>
                <Feather name={showPw ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.loginBtn, { backgroundColor: loading ? colors.muted : colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>ログイン</Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={[styles.divLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.divText, { color: colors.mutedForeground }]}>または</Text>
            <View style={[styles.divLine, { backgroundColor: colors.border }]} />
          </View>

          <Pressable
            style={[styles.registerBtn, { borderColor: colors.border }]}
            onPress={() => router.push("/register")}
          >
            <Feather name="user-plus" size={16} color={colors.primary} />
            <Text style={[styles.registerBtnText, { color: colors.primary }]}>会員登録</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  body: { paddingHorizontal: 24, paddingVertical: 32, gap: 24 },
  logoWrap: { alignItems: "center", gap: 8 },
  logo: { fontSize: 32, fontFamily: "Inter_700Bold" },
  logoSub: { fontSize: 14 },
  infoBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
  },
  infoText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium" },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  input: { flex: 1, fontSize: 15, padding: 0 },
  loginBtn: { paddingVertical: 15, borderRadius: 10, alignItems: "center", marginTop: 4 },
  loginBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  divLine: { flex: 1, height: 1 },
  divText: { fontSize: 13 },
  registerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 10, borderWidth: 1 },
  registerBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
