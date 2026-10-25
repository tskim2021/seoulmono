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
import { api, User } from "@/lib/api";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { loginWithToken } = useAuth();

  const [name, setName] = useState("");
  const [hp, setHp] = useState("");
  const [pw, setPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const normalizedEmail = email.trim().toLowerCase();
  const verifyEmail = async (send: boolean) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) { Alert.alert('お知らせ', '正しいメールアドレスを入力してください。'); return; }
    setVerifying(true);
    try {
      await api.post(send ? '/auth/email-send-code' : '/auth/email-verify-code', { email: normalizedEmail, ...(send ? {} : { code }) });
      if (!send) setVerifiedEmail(normalizedEmail);
      Alert.alert('メール認証', send ? '認証コードを送信しました。' : 'メール認証が完了しました。');
    } catch (error: any) { Alert.alert('メール認証', error.message); }
    finally { setVerifying(false); }
  };

  const handleRegister = async () => {
    if (!/^[a-z0-9]{4,16}$/.test(loginId)) { Alert.alert('お知らせ', 'IDは半角英小文字・数字4〜16文字で入力してください。'); return; }
    if (verifiedEmail !== normalizedEmail || !verifiedEmail) { Alert.alert('お知らせ', 'メール認証を完了してください。'); return; }
    if (!name.trim() || !hp.trim() || !pw) {
      Alert.alert("お知らせ", "お名前、携帯電話番号、パスワードをすべて入力してください。"); return;
    }
    if (pw !== pwConfirm) {
      Alert.alert("お知らせ", "パスワードが一致しません。"); return;
    }
    if (pw.length < 6) {
      Alert.alert("お知らせ", "パスワードは6文字以上で入力してください。"); return;
    }
    const cleanHp = hp.replace(/[^0-9]/g, "");
    if (cleanHp.length < 10) {
      Alert.alert("お知らせ", "正しい携帯電話番号を入力してください。"); return;
    }

    setLoading(true);
    try {
      const res = await api.post<any>("/auth/register-shop", {
        mb_id: loginId,
        mb_email: normalizedEmail,
        mb_name: name.trim(),
        mb_nick: name.trim(),
        mb_hp: hp.trim(),
        mb_password: pw,
      });
      if (res.token && res.user) {
        await loginWithToken(res.token, res.user as User);
        Alert.alert("登録完了", "会員登録が完了しました！", [
          { text: "確認", onPress: () => router.replace("/(tabs)/my") },
        ]);
      } else {
        Alert.alert("登録完了", "ログインしてください。", [
          { text: "確認", onPress: () => router.replace("/login") },
        ]);
      }
    } catch (e: any) {
      Alert.alert("登録失敗", e.message ?? "もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const inp = [styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>会員登録</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

        {/* 案内メッセージ */}
        <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="smartphone" size={15} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            ウェブと同じID・メール認証で登録できます
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>ログインID *</Text>
            <TextInput style={inp} value={loginId} onChangeText={setLoginId} placeholder="半角英小文字・数字4〜16文字" autoCapitalize="none" autoCorrect={false} />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>メールアドレス *</Text>
            <TextInput style={inp} value={email} onChangeText={value => { setEmail(value); setVerifiedEmail(''); }} placeholder="メールアドレス" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            <Pressable disabled={verifying} onPress={() => verifyEmail(true)} style={[styles.submitBtn, { backgroundColor: colors.primary }]}><Text style={styles.submitBtnText}>認証コードを送信</Text></Pressable>
            <TextInput style={inp} value={code} onChangeText={setCode} placeholder="6桁の認証コード" keyboardType="number-pad" maxLength={6} />
            <Pressable disabled={verifying || code.length !== 6} onPress={() => verifyEmail(false)} style={[styles.submitBtn, { backgroundColor: colors.primary }]}><Text style={styles.submitBtnText}>{verifiedEmail === normalizedEmail && verifiedEmail ? '認証済み' : 'メールを認証する'}</Text></Pressable>
          </View>

          {/* お名前 */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>お名前 *</Text>
            <TextInput
              style={inp}
              placeholder="お名前を入力してください"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* 携帯電話番号 (= ID) */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              携帯電話番号 * <Text style={[styles.labelNote, { color: colors.primary }]}>（IDとして使用されます）</Text>
            </Text>
            <TextInput
              style={inp}
              placeholder="090-0000-0000"
              placeholderTextColor={colors.mutedForeground}
              value={hp}
              onChangeText={setHp}
              keyboardType="phone-pad"
            />
          </View>

          {/* パスワード */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>パスワード *</Text>
            <View style={[styles.pwWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.pwInput, { color: colors.foreground }]}
                placeholder="パスワード（6文字以上）"
                placeholderTextColor={colors.mutedForeground}
                value={pw}
                onChangeText={setPw}
                secureTextEntry={!showPw}
              />
              <Pressable onPress={() => setShowPw(!showPw)}>
                <Feather name={showPw ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          {/* パスワード確認 */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>パスワード（確認）*</Text>
            <TextInput
              style={inp}
              placeholder="パスワードをもう一度入力してください"
              placeholderTextColor={colors.mutedForeground}
              value={pwConfirm}
              onChangeText={setPwConfirm}
              secureTextEntry={!showPw}
            />
            {pwConfirm.length > 0 && (
              <Text style={{ fontSize: 12, color: pw === pwConfirm ? "#16a34a" : "#dc2626", marginTop: 4 }}>
                {pw === pwConfirm ? "✓ パスワードが一致します。" : "✗ パスワードが一致しません。"}
              </Text>
            )}
          </View>

          <Pressable
            style={[styles.submitBtn, { backgroundColor: loading ? colors.muted : colors.primary }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>登録する</Text>
            }
          </Pressable>

          <Pressable onPress={() => router.back()} style={{ alignItems: "center" }}>
            <Text style={[styles.backLink, { color: colors.mutedForeground }]}>
              すでにアカウントをお持ちですか？ <Text style={{ color: colors.primary }}>ログイン</Text>
            </Text>
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
  body: { paddingHorizontal: 24, paddingVertical: 28, gap: 24 },
  infoBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
  },
  infoText: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  form: { gap: 20 },
  field: { gap: 6 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  labelNote: { fontSize: 12, fontFamily: "Inter_500Medium" },
  input: { paddingHorizontal: 14, paddingVertical: 13, borderRadius: 10, borderWidth: 1, fontSize: 15 },
  pwWrap: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, borderRadius: 10, borderWidth: 1, gap: 8 },
  pwInput: { flex: 1, fontSize: 15, padding: 0 },
  submitBtn: { paddingVertical: 15, borderRadius: 10, alignItems: "center", marginTop: 8 },
  submitBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  backLink: { fontSize: 14 },
});
