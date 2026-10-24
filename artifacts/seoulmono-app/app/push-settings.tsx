import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { disablePush, PUSH_ENABLED, registerPush } from "@/lib/push";
export default function PushSettings() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => { AsyncStorage.getItem(PUSH_ENABLED).then(value => setEnabled(value === "true")); }, []);
  async function change() {
    if (!user) { router.push("/login"); return; }
    setBusy(true);
    try {
      if (enabled) { await disablePush(); setEnabled(false); }
      else setEnabled(await registerPush(true));
    } catch (error) { Alert.alert("通知設定", error instanceof Error ? error.message : "設定を確認してください。"); }
    finally { setBusy(false); }
  }
  return <><Stack.Screen options={{ headerShown: true, title: "通知設定" }} /><ScrollView contentContainerStyle={{ padding: 24, gap: 20, backgroundColor: "#fff", flexGrow: 1 }}>
    <Text style={{ fontSize: 26, fontWeight: "800", color: "#294E66" }}>ソウルモノのお知らせ</Text>
    <Text style={{ fontSize: 16, lineHeight: 27, color: "#47667C" }}>新商品やイベントなどのお知らせを、プッシュ通知でお届けします。いつでも停止できます。</Text>
    <Text style={{ fontSize: 18, fontWeight: "700" }}>{enabled ? "通知：有効" : "通知：無効"}</Text>
    <Pressable disabled={busy} onPress={change} style={{ padding: 18, borderRadius: 12, backgroundColor: "#397AA3", alignItems: "center" }}>
      {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>{!user ? "ログインして設定する" : enabled ? "通知を停止する" : "通知を有効にする"}</Text>}
    </Pressable>
    <Pressable onPress={() => Linking.openSettings()}><Text style={{ color: "#397AA3", fontSize: 15 }}>端末の通知設定を開く</Text></Pressable>
  </ScrollView></>;
}
