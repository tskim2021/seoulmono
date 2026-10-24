import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { api, CartItem, ItemOption, ShopItem, getImageUrl } from "@/lib/api";

type Mode = "cart" | "buy";

type DetailItem = ShopItem & {
  images?: string[];
  options?: ItemOption[];
};

function formatPrice(n: number) {
  return n.toLocaleString("ja-JP") + "円";
}

function optionLabel(id: string) {
  return id.split("\u001e").join(" / ");
}

export default function PurchaseSheet({
  itemId,
  mode,
  onClose,
}: {
  itemId: string | number;
  mode: Mode;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem, setBuyNowItem } = useCart();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["item", String(itemId)],
    queryFn: () => api.get<any>(`/shop/items/${itemId}`),
  });

  const item: DetailItem | undefined = data?.item ?? data;
  const options = item?.options ?? [];
  const chosen = options.find((o) => o.io_id === selected);
  const basePrice = item ? item.it_sale_price ?? item.it_price : 0;
  const unit = basePrice + (chosen?.io_price ?? 0);
  const soldOut = item?.it_soldout === "1";
  const preparing = item?.it_soldout === "2";
  const stockCap = chosen?.io_stock_qty ?? item?.it_stock_qty;
  const maxQty = stockCap && stockCap > 0 ? Math.min(stockCap, 99) : 99;
  const needsOption = options.length > 0 && !chosen;
  const canConfirm = !!item && !soldOut && !preparing && !needsOption;

  const imgUrl = item ? getImageUrl(item.it_img1 || item.images?.[0]) : null;

  const buildCartItem = (): ShopItem => {
    const rawImg = item!.it_img1 || item!.images?.[0] || "";
    return { ...item!, it_img1: getImageUrl(rawImg) || rawImg };
  };

  const confirm = () => {
    if (!canConfirm || !item) return;
    const opt = chosen ? { option: chosen.io_id, option_price: chosen.io_price } : undefined;

    if (mode === "cart") {
      addItem(buildCartItem(), qty, opt);
      onClose();
      Alert.alert("カート", `${item.it_name}をカートに追加しました。`, [
        { text: "買い物を続ける", style: "cancel" },
        { text: "カートを見る", onPress: () => router.push("/(tabs)/cart") },
      ]);
      return;
    }

    if (!user) {
      onClose();
      Alert.alert("ログインが必要です", "注文するにはログインが必要です。", [
        { text: "キャンセル", style: "cancel" },
        { text: "ログイン", onPress: () => router.push("/login") },
      ]);
      return;
    }
    const buyItem: CartItem = {
      ...buildCartItem(),
      quantity: qty,
      option: opt?.option,
      option_price: opt?.option_price,
    };
    setBuyNowItem(buyItem);
    onClose();
    router.push({ pathname: "/checkout", params: { buy: "1" } });
  };

  const confirmLabel = soldOut
    ? "品切れ"
    : preparing
    ? "販売準備中"
    : needsOption
    ? "オプションを選択してください"
    : mode === "cart"
    ? "カートに入れる"
    : "購入する";

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.background, paddingBottom: insets.bottom + 12 },
          ]}
        >
          <View style={styles.handle} />

          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 48 }} />
          ) : error || !item ? (
            <View style={{ alignItems: "center", gap: 12, paddingVertical: 32 }}>
              <Text style={{ color: colors.foreground }}>商品を読み込めませんでした</Text>
              <Pressable onPress={onClose}>
                <Text style={{ color: colors.primary }}>閉じる</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.headRow}>
                {imgUrl ? (
                  <Image source={{ uri: imgUrl }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: colors.muted }]} />
                )}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
                    {item.it_name}
                  </Text>
                  <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(unit)}</Text>
                </View>
                <Pressable onPress={onClose} hitSlop={10}>
                  <Feather name="x" size={22} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                {options.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.foreground }]}>オプション</Text>
                    <View style={styles.chips}>
                      {options.map((o) => {
                        const on = o.io_id === selected;
                        const out = o.io_stock_qty !== undefined && o.io_stock_qty <= 0;
                        return (
                          <Pressable
                            key={o.io_id}
                            disabled={out}
                            onPress={() => {
                              setSelected(o.io_id);
                              setQty(1);
                            }}
                            style={[
                              styles.chip,
                              {
                                borderColor: on ? colors.primary : colors.border,
                                backgroundColor: on ? colors.secondary : colors.card,
                                opacity: out ? 0.4 : 1,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                { color: on ? colors.primary : colors.foreground },
                              ]}
                            >
                              {optionLabel(o.io_id)}
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                              {out ? "品切れ" : formatPrice(basePrice + o.io_price)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                <View style={[styles.section, styles.qtyRow]}>
                  <Text style={[styles.sectionLabel, { color: colors.foreground }]}>数量</Text>
                  <View style={styles.qtyControl}>
                    <Pressable
                      style={[styles.qtyBtn, { borderColor: colors.border }]}
                      onPress={() => setQty(Math.max(1, qty - 1))}
                    >
                      <Feather name="minus" size={16} color={colors.foreground} />
                    </Pressable>
                    <Text style={[styles.qtyNum, { color: colors.foreground }]}>{qty}</Text>
                    <Pressable
                      style={[styles.qtyBtn, { borderColor: colors.border }]}
                      onPress={() => setQty(Math.min(maxQty, qty + 1))}
                    >
                      <Feather name="plus" size={16} color={colors.foreground} />
                    </Pressable>
                  </View>
                </View>
              </ScrollView>

              <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>合計</Text>
                <Text style={[styles.total, { color: colors.primary }]}>{formatPrice(unit * qty)}</Text>
              </View>

              <Pressable
                disabled={!canConfirm}
                onPress={confirm}
                style={[
                  styles.confirmBtn,
                  { backgroundColor: canConfirm ? colors.primary : colors.muted },
                ]}
              >
                <Text style={[styles.confirmText, { color: canConfirm ? "#fff" : colors.mutedForeground }]}>
                  {confirmLabel}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    marginBottom: 4,
  },
  headRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumb: { width: 64, height: 64, borderRadius: 10 },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold", lineHeight: 21 },
  price: { fontSize: 17, fontFamily: "Inter_700Bold" },
  section: { gap: 10, paddingVertical: 8 },
  sectionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minWidth: 96,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    gap: 2,
  },
  chipText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: 12 },
  qtyBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  qtyNum: { fontSize: 18, fontFamily: "Inter_700Bold", minWidth: 28, textAlign: "center" },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 12,
  },
  total: { fontSize: 22, fontFamily: "Inter_700Bold" },
  confirmBtn: { paddingVertical: 15, borderRadius: 12, alignItems: "center" },
  confirmText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
