import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { lineKey, unitPrice, useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { CartItem, getImageUrl } from "@/lib/api";
import { useShipping } from '@/hooks/useShipping';
import { shippingFee, productName } from '@/lib/catalog';

function formatPrice(n: number) {
  return n.toLocaleString("ja-JP") + "円";
}

function CartRow({ item }: { item: CartItem }) {
  const colors = useColors();
  const { removeItem, updateQty } = useCart();
  const price = unitPrice(item);
  const key = lineKey(item);
  const rawSrc = item.it_img1 || (item as any).images?.[0];
  const imgUrl = getImageUrl(rawSrc);
  console.log("[CartRow] it_img1=", item.it_img1, "images[0]=", (item as any).images?.[0], "imgUrl=", imgUrl);

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.rowImg}>
        {imgUrl ? (
          <Image
            source={{ uri: imgUrl }}
            style={styles.img}
            contentFit="cover"
            onError={(e) => console.log("[CartRow] img load error:", imgUrl, e.error)}
          />
        ) : (
          <View style={[styles.img, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
            <Feather name="image" size={20} color={colors.mutedForeground} />
          </View>
        )}
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={2}>{productName(item)}</Text>
        {item.option ? (
          <Text style={{ fontSize: 12, color: colors.mutedForeground }} numberOfLines={1}>オプション：{item.option.split("\u001e").join(" / ")}</Text>
        ) : null}
        <Text style={[styles.rowPrice, { color: colors.primary }]}>{formatPrice(price)}</Text>
        <View style={styles.qtyRow}>
          <Pressable
            style={[styles.qtyBtn, { borderColor: colors.border }]}
            onPress={() => updateQty(key, item.quantity - 1)}
          >
            <Feather name="minus" size={14} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.qty, { color: colors.foreground }]}>{item.quantity}</Text>
          <Pressable
            style={[styles.qtyBtn, { borderColor: colors.border }]}
            onPress={() => updateQty(key, item.quantity + 1)}
          >
            <Feather name="plus" size={14} color={colors.foreground} />
          </Pressable>
        </View>
      </View>
      <View style={styles.rowRight}>
        <Pressable onPress={() => removeItem(key)}>
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </Pressable>
        <Text style={[styles.rowTotal, { color: colors.primary }]}>{formatPrice(price * item.quantity)}</Text>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { items, totalPrice, totalCount, clearCart } = useCart();
  const { user } = useAuth();

  const shipping = useShipping();
  const deliveryFee = shipping.data ? shippingFee(items, shipping.data) : null;
  const finalPrice = deliveryFee === null ? null : totalPrice + deliveryFee;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>カート</Text>
        {items.length > 0 && (
          <Pressable onPress={clearCart}>
            <Text style={[styles.clearText, { color: colors.mutedForeground }]}>すべて削除</Text>
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="shopping-bag" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>カートが空です</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>気に入った商品を入れてみましょう</Text>
          <Pressable
            style={[styles.shopBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/products")}
          >
            <Text style={styles.shopBtnText}>ショッピングを続ける</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => lineKey(i)}
            renderItem={({ item }) => <CartRow item={item} />}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>商品金額</Text>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatPrice(totalPrice)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>送料</Text>
                  <Text style={[styles.summaryValue, { color: deliveryFee === 0 ? colors.success : colors.foreground }]}>
                    {deliveryFee === null ? '送料を確認中' : deliveryFee === 0 ? "無料" : formatPrice(deliveryFee)}
                  </Text>
                </View>
                {shipping.isError && <Pressable onPress={() => shipping.refetch()}><Text style={{ color: colors.primary }}>送料を取得できませんでした。再試行</Text></Pressable>}
                {shipping.data && (
                  <Text style={[styles.freeShipNote, { color: colors.mutedForeground }]}>
                    送料は商品の種類数に応じて計算されます。
                  </Text>
                )}
                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.totalLabel, { color: colors.foreground }]}>お支払い合計</Text>
                  <Text style={[styles.totalValue, { color: colors.primary }]}>{finalPrice === null ? '送料を確認中' : formatPrice(finalPrice)}</Text>
                </View>
              </View>
            }
          />
          <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: insets.bottom + 8, borderTopColor: colors.border }]}>
            <Pressable
              disabled={finalPrice === null}
              style={[styles.orderBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (!user) {
                  Alert.alert(
                    "ログインが必要です",
                    "注文するにはログインが必要です。",
                    [
                      { text: "キャンセル", style: "cancel" },
                      { text: "ログイン", onPress: () => router.push("/login") },
                    ]
                  );
                  return;
                }
                router.push("/checkout");
              }}
            >
              <Text style={styles.orderBtnText}>注文する（{totalCount}点） — {finalPrice === null ? '送料を確認中' : formatPrice(finalPrice)}</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  clearText: { fontSize: 13 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyDesc: { fontSize: 14, textAlign: "center" },
  shopBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  shopBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  row: { flexDirection: "row", borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  rowImg: {},
  img: { width: 90, height: 90 },
  rowBody: { flex: 1, padding: 10, gap: 4 },
  rowName: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  rowPrice: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  qty: { fontSize: 15, fontFamily: "Inter_600SemiBold", minWidth: 20, textAlign: "center" },
  rowRight: { padding: 10, alignItems: "flex-end", justifyContent: "space-between" },
  rowTotal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  summary: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 10, marginBottom: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontFamily: "Inter_500Medium" },
  freeShipNote: { fontSize: 12, textAlign: "right" },
  summaryDivider: { height: 1, marginVertical: 4 },
  totalLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  totalValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  orderBtn: { paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  orderBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
