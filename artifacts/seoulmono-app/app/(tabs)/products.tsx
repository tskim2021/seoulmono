import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { api, ShopItem, getImageUrl, discountRate } from "@/lib/api";
import PurchaseSheet from "@/components/PurchaseSheet";

const { width: W } = Dimensions.get("window");
const CARD_W = (W - 16 * 2 - 12) / 2;

function formatPrice(n: number) {
  return n.toLocaleString("ja-JP") + "円";
}

function ProductGrid({ item }: { item: ShopItem }) {
  const router = useRouter();
  const colors = useColors();
  const [sheetOpen, setSheetOpen] = useState(false);

  const disc = discountRate(item.it_cust_price, item.it_price);
  const isSoldout = item.it_soldout === "1";
  const isReady = item.it_soldout === "2";
  const imgUrl = getImageUrl(item.it_img1);

  const handleCart = () => {
    if (isSoldout || isReady) return;
    setSheetOpen(true);
  };

  return (
    <>
    <Pressable
      style={[styles.card, { width: CARD_W, backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/product/${item.it_id}`)}
    >
      <View style={{ position: "relative" }}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={[styles.img, { width: CARD_W }]} contentFit="cover" />
        ) : (
          <View style={[styles.img, { width: CARD_W, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
            <Feather name="image" size={28} color={colors.mutedForeground} />
          </View>
        )}

        {disc > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{disc}%</Text>
          </View>
        )}

        {isSoldout && (
          <View style={styles.soldoutOverlay}>
            <View style={styles.soldoutBadge}>
              <Text style={styles.soldoutText}>売り切れ</Text>
            </View>
          </View>
        )}
        {isReady && (
          <View style={[styles.soldoutOverlay, { backgroundColor: "rgba(255,255,255,0.55)" }]}>
            <View style={[styles.soldoutBadge, { backgroundColor: "rgba(255,255,255,0.92)", borderWidth: 1, borderColor: colors.border }]}>
              <Text style={[styles.soldoutText, { color: "#666" }]}>販売準備中</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>{item.it_name}</Text>
        <View style={{ gap: 1, marginTop: 2 }}>
          {disc > 0 && item.it_cust_price && item.it_cust_price > item.it_price && (
            <Text style={[styles.orig, { color: colors.mutedForeground }]}>{formatPrice(item.it_cust_price)}</Text>
          )}
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
            {disc > 0 && <Text style={styles.discPct}>{disc}%</Text>}
            <Text style={[styles.price, { color: colors.foreground }]}>{formatPrice(item.it_price)}</Text>
          </View>
        </View>
        {(item.it_use_cnt ?? 0) > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 }}>
            <Text style={{ color: "#F59E0B", fontSize: 10 }}>★</Text>
            <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
              {(item.it_use_avg ?? 0).toFixed(1)} ({item.it_use_cnt})
            </Text>
          </View>
        )}
      </View>

      {isReady ? (
        <View style={[styles.cartBtn, { backgroundColor: colors.muted, borderTopColor: colors.border }]}>
          <Text style={[styles.cartBtnText, { color: colors.mutedForeground }]}>販売準備中</Text>
        </View>
      ) : (
        <Pressable
          style={[styles.cartBtn, {
            borderTopColor: colors.border,
            backgroundColor: isSoldout ? colors.muted : colors.card,
          }]}
          onPress={(e) => { e.stopPropagation(); handleCart(); }}
          disabled={isSoldout}
        >
          <Feather name="shopping-bag" size={12} color={isSoldout ? colors.mutedForeground : colors.mutedForeground} />
          <Text style={[styles.cartBtnText, {
            color: isSoldout ? colors.mutedForeground : colors.mutedForeground,
          }]}>
            {isSoldout ? "売り切れ" : "カートに入れる"}
          </Text>
        </Pressable>
      )}
    </Pressable>
    {sheetOpen && (
      <PurchaseSheet itemId={item.it_id} mode="cart" onClose={() => setSheetOpen(false)} />
    )}
    </>
  );
}

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const params = useLocalSearchParams<{ ca_id?: string }>();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selCat, setSelCat] = useState(params.ca_id ?? "");

  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<any>("/shop/categories"),
  });

  const { data, isLoading, isFetchingNextPage } = useQuery({
    queryKey: ["items", selCat, query],
    queryFn: () =>
      api.get<any>(
        `/shop/items?${new URLSearchParams({
          ...(selCat ? { category: selCat } : {}),
          ...(query ? { search: query } : {}),
          limit: "20",
        })}`
      ),
  });

  const items: ShopItem[] = data?.items ?? [];
  const categories: any[] = (catData?.categories ?? [])
    .filter((c: any) => c.ca_id && c.ca_id.length <= 2 && c.ca_id !== "ZZ");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: "#5C3D2E" }]}>
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.input}
            placeholder="商品を検索..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => setQuery(search)}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => { setSearch(""); setQuery(""); }}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}
        </View>
      </View>

      <View style={{ height: 50 }}>
        <FlatList
          data={[{ ca_id: "", ca_name: "すべて" }, ...categories]}
          keyExtractor={(c) => c.ca_id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
          renderItem={({ item }) => {
            const active = selCat === item.ca_id;
            return (
              <Pressable
                style={[styles.catChip, {
                  backgroundColor: active ? "#5C3D2E" : colors.secondary,
                  borderColor: active ? "#5C3D2E" : colors.border,
                }]}
                onPress={() => setSelCat(item.ca_id)}
              >
                <Text
                  style={[styles.catText, { color: active ? "#fff" : colors.primaryDark }]}
                  numberOfLines={1}
                >
                  {item.ca_name}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="package" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>商品がありません</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.it_id)}
          renderItem={({ item }) => <ProductGrid item={item} />}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  input: { flex: 1, fontSize: 14, padding: 0, color: "#fff" },
  catChip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  catText: { fontSize: 13, fontWeight: "500" },

  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  img: { height: 180 },
  badge: { position: "absolute", top: 8, left: 8, backgroundColor: "#EF4444", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  soldoutOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  soldoutBadge: { backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  soldoutText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  body: { padding: 10, gap: 1 },
  name: { fontSize: 12, fontWeight: "500", lineHeight: 17, minHeight: 34 },
  orig: { fontSize: 10, textDecorationLine: "line-through" },
  discPct: { fontSize: 13, fontWeight: "700", color: "#EF4444" },
  price: { fontSize: 14, fontWeight: "700" },

  cartBtn: { borderTopWidth: 1, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  cartBtnText: { fontSize: 11, fontWeight: "600" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 16 },
});
