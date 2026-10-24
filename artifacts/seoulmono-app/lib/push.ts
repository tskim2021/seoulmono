import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { BASE_URL } from "./api";

async function pushFetch(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

export const PUSH_ENABLED = "seoulmono_push_enabled";
const TOKEN_KEY = "seoulmono_push_token";
let queue: Promise<unknown> = Promise.resolve();
let generation = 0;
function serial<T>(work: () => Promise<T>): Promise<T> {
  const next = queue.then(work, work);
  queue = next.catch(() => {});
  return next;
}
export function pushPath(value: unknown): string {
  return typeof value === "string" && /^\/(?:$|products(?:\?[^#\s]*)?$|product\/[A-Za-z0-9_-]+$|events$|notices$)/.test(value) && !value.includes("://") ? value : "/";
}
export async function pushStatus() {
  const response = await pushFetch(BASE_URL + "/push/config");
  if (!response.ok) throw new Error("通知サービスに接続できません。");
  return response.json() as Promise<{ ready: { android: boolean; ios: boolean } }>;
}
export function registerPush(requestPermission = false) {
  const current = generation;
  return serial(async () => {
    if (Platform.OS === "web") throw new Error("通知はインストールしたアプリでご利用ください。");
    const auth = await AsyncStorage.getItem("auth_token");
    if (!auth || current !== generation) return false;
    if (!requestPermission && await AsyncStorage.getItem(PUSH_ENABLED) !== "true") return false;
    const status = await pushStatus();
    if (!status.ready[Platform.OS as "android" | "ios"]) {
      if (requestPermission) throw new Error("通知の配信設定を準備中です。完了後にお試しください。");
      return false;
    }
    if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("seoulmono-news", { name: "ソウルモノからのお知らせ", importance: Notifications.AndroidImportance.HIGH, sound: "default" });
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && requestPermission) permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) {
      await unregisterToken(auth);
      await AsyncStorage.removeItem(PUSH_ENABLED);
      if (requestPermission) throw new Error("端末の設定でソウルモノの通知を許可してください。");
      return false;
    }
    const token = String((await Notifications.getDevicePushTokenAsync()).data);
    if (current !== generation) return false;
    const response = await pushFetch(BASE_URL + "/push/devices", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}` }, body: JSON.stringify({ token, platform: Platform.OS }) });
    if (!response.ok) throw new Error("通知の登録に失敗しました。もう一度お試しください。");
    await AsyncStorage.multiSet([[PUSH_ENABLED, "true"], [TOKEN_KEY, token]]);
    return true;
  });
}
async function unregisterToken(auth: string) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) return;
  const response = await pushFetch(BASE_URL + "/push/devices", { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}` }, body: JSON.stringify({ token }) });
  if (!response.ok) throw new Error(response.status === 401 ? "ログインし直して通知設定を変更してください。" : "通知の停止に失敗しました。通信環境を確認してください。");
  await AsyncStorage.removeItem(TOKEN_KEY);
}
export function disablePush() {
  generation++;
  return serial(async () => {
    const auth = await AsyncStorage.getItem("auth_token");
    if (auth) await unregisterToken(auth);
    await AsyncStorage.removeItem(PUSH_ENABLED);
  });
}
