import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { api } from "@/lib/api";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [mbName, setMbName] = useState("");
  const [mbHp, setMbHp] = useState("");
  const [mbEmail, setMbEmail] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [showPwSection, setShowPwSection] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["auth-profile"],
    queryFn: () => api.get<any>("/auth/profile"),
  });

  useEffect(() => {
    if (profile) {
      setMbName(profile.mb_name ?? "");
      setMbHp(profile.mb_hp ?? "");
      setMbEmail(profile.mb_email ?? "");
    }
  }, [profile]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (body: any) => api.put("/auth/profile", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-profile"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      Alert.alert("完了", "会員情報が更新されました。", [
        { text: "確認", onPress: () => router.back() },
      ]);
    },
    onError: (e: any) => {
      Alert.alert("エラー", e?.message ?? "更新に失敗しました。");
    },
  });

  const handleSave = () => {
    if (!mbName.trim()) { Alert.alert("お知らせ", "お名前を入力してください。"); return; }
    if (!mbHp.trim()) { Alert.alert("お知らせ", "携帯電話番号を入力してください。"); return; }

    if (showPwSection && newPw) {
      if (!currentPw) { Alert.alert("お知らせ", "現在のパスワードを入力してください。"); return; }
      if (newPw !== newPwConfirm) { Alert.alert("お知らせ", "新しいパスワードが一致しません。"); return; }
      if (newPw.length < 6) { Alert.alert("お知らせ", "パスワードは6文字以上で入力してください。"); return; }
    }

    const body: any = { mb_name: mbName.trim(), mb_hp: mbHp.trim(), mb_email: mbEmail.trim() };
    if (showPwSection && newPw) {
      body.current_password = currentPw;
      body.new_password = newPw;
    }
    save(body);
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ヘッダー */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>会員情報編集</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }}>
        {/* 基本情報 */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>基本情報</Text>

          <Field label="ID">
            <TextInput
              style={[styles.inp, styles.inpDisabled, { borderColor: colors.border, color: colors.mutedForeground, backgroundColor: colors.secondary }]}
              value={profile?.mb_id ?? ""}
              editable={false}
            />
          </Field>

          <Field label="お名前 *">
            <TextInput
              style={[styles.inp, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="お名前"
              placeholderTextColor={colors.mutedForeground}
              value={mbName}
              onChangeText={setMbName}
            />
          </Field>

          <Field label="メールアドレス">
            <TextInput
              style={[styles.inp, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="メールアドレス"
              placeholderTextColor={colors.mutedForeground}
              value={mbEmail}
              onChangeText={setMbEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Field>

          <Field label="携帯電話番号 *">
            <TextInput
              style={[styles.inp, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="090-0000-0000"
              placeholderTextColor={colors.mutedForeground}
              value={mbHp}
              onChangeText={setMbHp}
              keyboardType="phone-pad"
            />
          </Field>
        </View>

        {/* パスワード変更 */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Pressable
            style={styles.sectionToggle}
            onPress={() => { setShowPwSection(!showPwSection); setCurrentPw(""); setNewPw(""); setNewPwConfirm(""); }}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>パスワード変更</Text>
            <Feather name={showPwSection ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
          </Pressable>

          {showPwSection && (
            <View style={{ gap: 12, marginTop: 4 }}>
              <Field label="現在のパスワード">
                <TextInput
                  style={[styles.inp, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                  placeholder="現在のパスワード"
                  placeholderTextColor={colors.mutedForeground}
                  value={currentPw}
                  onChangeText={setCurrentPw}
                  secureTextEntry
                />
              </Field>
              <Field label="新しいパスワード">
                <TextInput
                  style={[styles.inp, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                  placeholder="新しいパスワード（6文字以上）"
                  placeholderTextColor={colors.mutedForeground}
                  value={newPw}
                  onChangeText={setNewPw}
                  secureTextEntry
                />
              </Field>
              <Field label="新しいパスワード（確認）">
                <TextInput
                  style={[styles.inp, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                  placeholder="新しいパスワード（確認）"
                  placeholderTextColor={colors.mutedForeground}
                  value={newPwConfirm}
                  onChangeText={setNewPwConfirm}
                  secureTextEntry
                />
              </Field>
            </View>
          )}
        </View>

        {/* 保存ボタン */}
        <Pressable
          style={[styles.saveBtn, { backgroundColor: isPending ? colors.muted : colors.primary }]}
          onPress={handleSave}
          disabled={isPending}
        >
          {isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>保存する</Text>
          }
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground }}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  section: {
    borderWidth: 1, borderRadius: 12, padding: 16, gap: 14,
  },
  sectionToggle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  inp: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, fontSize: 15 },
  inpDisabled: { opacity: 0.7 },
  saveBtn: { paddingVertical: 15, borderRadius: 10, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
