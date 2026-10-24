import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColors } from "@/hooks/useColors";
import { unitPrice, useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import type { CartItem } from "@/lib/api";

// 決済ロジックはWebのKCP/Stripe/銀行振込チェックアウトをそのまま再利用する。
// ネイティブで決済手段を新たに実装する代わりに、カートをWebViewのチェックアウトページへ
// 渡してWebと同じ決済フローをそのまま通す。
const DOMAIN = (process.env.EXPO_PUBLIC_DOMAIN as string) || "seoulmono.com";
const CHECKOUT_PATH = "/checkout";

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { buy } = useLocalSearchParams<{ buy?: string }>();
  const { items: cartItems, buyNowItem, setBuyNowItem, clearCart } = useCart();
  const isBuyNow = buy === "1";
  const items = isBuyNow ? (buyNowItem ? [buyNowItem] : []) : cartItems;
  const { user } = useAuth();
  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [injectedScript, setInjectedScript] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      router.back();
      return;
    }
    (async () => {
      const token = await AsyncStorage.getItem("auth_token");
      const checkoutItems = items.map((c: CartItem) => ({
        it_id: String(c.it_id),
        it_name: c.it_name,
        it_price: unitPrice(c),
        it_img1: c.it_img1 || "",
        quantity: c.quantity,
        ...(c.option ? { option: c.option, option_price: c.option_price ?? 0 } : {}),
      }));
      const script = `
        (function () {
          try {
            sessionStorage.setItem("allddaom_checkout", ${JSON.stringify(
              JSON.stringify(checkoutItems)
            )});
            ${
              token
                ? `localStorage.setItem("allddaom_token", ${JSON.stringify(
                    token
                  )});`
                : ""
            }
          } catch (e) {}
        })();
        true;
      `;
      setInjectedScript(script);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "order_complete") {
        if (isBuyNow) setBuyNowItem(null);
        else clearCart();
        Alert.alert("注文完了", "ご注文ありがとうございます。", [
          { text: "OK", onPress: () => router.replace("/(tabs)") },
        ]);
      }
    } catch {}
  };

  const checkoutUrl = `https://${DOMAIN}${CHECKOUT_PATH}${
    user ? "" : "?guest=1"
  }`;

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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>
          注文する
        </Text>
        <View style={styles.backBtn} />
      </View>

      {(loading || !injectedScript) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}

      {injectedScript && (
        <WebView
          ref={webviewRef}
          source={{ uri: checkoutUrl }}
          style={{ flex: 1 }}
          injectedJavaScriptBeforeContentLoaded={injectedScript}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          mixedContentMode="always"
        />
      )}
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
