import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { registerPush, pushPath } from "@/lib/push";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
export default function PushCoordinator() {
  const router = useRouter();
  const { user } = useAuth();
  useEffect(() => {
    if (Platform.OS === "web") return;
    let alive = true;
    let lastId = "";
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!alive || !response || response.notification.request.identifier === lastId) return;
      lastId = response.notification.request.identifier;
      const path = pushPath(response.notification.request.content.data?.path);
      router.push((path === "/" ? "/(tabs)" : path) as never);
      Notifications.clearLastNotificationResponseAsync().catch(() => {});
    };
    Notifications.getLastNotificationResponseAsync().then(open).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => { alive = false; sub.remove(); };
  }, [router]);
  useEffect(() => {
    if (!user || Platform.OS === "web") return;
    const sync = () => { registerPush().catch(() => {}); };
    sync();
    const state = AppState.addEventListener("change", value => { if (value === "active") sync(); });
    const token = Notifications.addPushTokenListener(sync);
    return () => { state.remove(); token.remove(); };
  }, [user?.mb_id]);
  return null;
}
