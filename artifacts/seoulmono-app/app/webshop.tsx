import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/lib/api";

const DOMAIN =
  (process.env.EXPO_PUBLIC_DOMAIN as string) || "seoulmono.com";
const SHOP_URL = `https://${DOMAIN}/`;

export default function WebShopScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { loginWithToken, logout } = useAuth();
  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "login" && data.token) {
        const token = data.token;
        const meRes = await fetch(`https://${DOMAIN}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) {
          const user: User = await meRes.json();
          await loginWithToken(token, user);
        }
      }

      if (data.type === "logout") {
        await logout();
      }
    } catch {}
  };

  const handleBack = () => {
    if (canGoBack) {
      webviewRef.current?.goBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>
          ソウルモノ
        </Text>
        <Pressable
          style={styles.backBtn}
          onPress={() => webviewRef.current?.reload()}
        >
          <Feather name="refresh-cw" size={18} color={colors.foreground} />
        </Pressable>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}

      <WebView
        ref={webviewRef}
        source={{ uri: SHOP_URL }}
        style={{ flex: 1 }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(state) => setCanGoBack(state.canGoBack)}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        mixedContentMode="always"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
});
