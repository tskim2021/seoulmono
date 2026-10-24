import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { api, ShopItem, getImageUrl, discountRate } from "@/lib/api";
import PurchaseSheet from "@/components/PurchaseSheet";

const { width: W } = Dimensions.get("window");

function formatPrice(n: number) {
  return n.toLocaleString("ja-JP") + "円";
}

const RANK_COLORS = ["#FFD700", "#C8C8D0", "#E8935A"];

function ProductCard({ item, rank }: { item: ShopItem; rank?: number }) {
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
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/product/${item.it_id}`)}
    >
      <View style={styles.cardImgWrap}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.cardImg} contentFit="cover" />
        ) : (
          <View style={[styles.cardImg, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
            <Feather name="image" size={32} color={colors.mutedForeground} />
          </View>
        )}

        {rank && rank <= 10 && (
          <>
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.28)"]}
              style={styles.rankGradient}
            />
            <Text style={[styles.rankText, { color: rank <= 3 ? RANK_COLORS[rank - 1] : "#fff", fontSize: rank <= 3 ? 28 : 22 }]}>
              {rank}
            </Text>
          </>
        )}

        {disc > 0 && (
          <View style={styles.discBadge}>
            <Text style={styles.discText}>-{disc}%</Text>
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

      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={2}>{item.it_name}</Text>
        <View style={styles.priceRow}>
          {disc > 0 && item.it_cust_price && item.it_cust_price > item.it_price && (
            <Text style={[styles.origPrice, { color: colors.mutedForeground }]}>{formatPrice(item.it_cust_price)}</Text>
          )}
          <View style={styles.priceInner}>
            {disc > 0 && <Text style={styles.discPct}>{disc}%</Text>}
            <Text style={[styles.price, { color: colors.foreground }]}>{formatPrice(item.it_price)}</Text>
          </View>
        </View>
        {(item.it_use_cnt ?? 0) > 0 && (
          <View style={styles.ratingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
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
          style={[
            styles.cartBtn,
            {
              borderTopColor: colors.border,
              backgroundColor: isSoldout ? colors.muted : colors.card,
            },
          ]}
          onPress={(e) => { e.stopPropagation(); handleCart(); }}
          disabled={isSoldout}
        >
          <Feather
            name="shopping-bag"
            size={13}
            color={isSoldout ? colors.mutedForeground : colors.mutedForeground}
          />
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

function Section({ title, items }: { title: string; items: ShopItem[]; onMore?: () => void }) {
  const colors = useColors();
  const router = useRouter();
  if (!items?.length) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        <Pressable onPress={() => router.push("/(tabs)/products")} style={styles.moreBtn}>
          <Text style={[styles.moreText, { color: colors.mutedForeground }]}>もっと見る</Text>
          <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <FlatList
        data={items.slice(0, 10)}
        keyExtractor={(i) => String(i.it_id)}
        renderItem={({ item, index }) => <ProductCard item={item} rank={index + 1} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      />
    </View>
  );
}

function BannerCarousel({ banners }: { banners: any[] }) {
  const [active, setActive] = useState(0);
  const ref = useRef<FlatList>(null);
  if (!banners?.length) return null;

  return (
    <View style={styles.bannerWrap}>
      <FlatList
        ref={ref}
        data={banners}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setActive(Math.round(e.nativeEvent.contentOffset.x / W));
        }}
        renderItem={({ item }) => {
          // アプリ専用画像 → なければ image_url → なければ pc_img の順にフォールバック
          const raw = item.app_img || item.image_url || item.pc_img || item.mo_img || "";
          const imgUrl = raw.startsWith("http") ? raw : raw ? `https://seoulmono.com${raw}` : "";
          return (
            <View style={{ width: W, height: 200 }}>
              {imgUrl ? (
                <Image source={{ uri: imgUrl }} style={{ width: W, height: 200 }} contentFit="cover" />
              ) : (
                <LinearGradient colors={["#0758E8", "#003EAC"]} style={{ width: W, height: 200, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700" }}>ソウルモノ</Text>
                </LinearGradient>
              )}
            </View>
          );
        }}
      />
      <View style={styles.dots}>
        {banners.map((_, i) => (
          <View key={i} style={[styles.dot, { opacity: i === active ? 1 : 0.4, backgroundColor: "#fff" }]} />
        ))}
      </View>
    </View>
  );
}

function CategoryBar({ categories }: { categories: any[] }) {
  const router = useRouter();
  const colors = useColors();
  if (!categories?.length) return null;
  return (
    <FlatList
      data={categories}
      keyExtractor={(c) => c.ca_id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      renderItem={({ item }) => (
        <Pressable
          style={[styles.catChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={() => router.push({ pathname: "/(tabs)/products", params: { ca_id: item.ca_id } })}
        >
          <Text style={[styles.catText, { color: colors.primaryDark }]}>{item.ca_name}</Text>
        </Pressable>
      )}
    />
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["home"],
    queryFn: () => api.get<any>("/shop/home"),
  });
  const { data: bannerData } = useQuery({
    queryKey: ["banners"],
    queryFn: () => api.get<any>("/shop/banners"),
  });
  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<any>("/shop/categories"),
  });

  const banners: any[] = bannerData?.banners ?? [];
  const categories: any[] = (catData?.categories ?? [])
    .filter((c: any) => c.ca_id && c.ca_id.length <= 2 && c.ca_id !== "ZZ");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: "#0758E8" }]}>
        <Image source={require("@/assets/images/seoulmono-puppy.png")} style={{ width: 44, height: 44 }} contentFit="contain" /><Text style={styles.logo}>ソウルモノ</Text>
        <Pressable onPress={() => router.push("/(tabs)/products")} style={styles.searchBtn}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={styles.searchPlaceholder}>商品を検索...</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        <BannerCarousel banners={banners} />
        <CategoryBar categories={categories} />

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            <Section title="🏆 ベスト商品" items={data?.best ?? []} />
            <Section title="✨ 新商品" items={data?.newItems ?? []} />
            <Section title="🎁 ブランド" items={data?.brand ?? []} />
            <Section title="🍱 食品" items={data?.food ?? []} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: { fontSize: 20, fontWeight: "700", color: "#fff", flexShrink: 0 },
  searchBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  searchPlaceholder: { fontSize: 14, flex: 1, color: "rgba(255,255,255,0.7)" },
  bannerWrap: { position: "relative" },
  dots: { position: "absolute", bottom: 10, alignSelf: "center", flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  section: { marginTop: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 22, fontWeight: "900" },
  moreBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  moreText: { fontSize: 12 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  catText: { fontSize: 13, fontWeight: "500" },

  card: { width: 184, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  cardImgWrap: { position: "relative" },
  cardImg: { width: 184, height: 184 },

  rankGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 56 },
  rankText: {
    position: "absolute",
    bottom: 8,
    left: 10,
    fontWeight: "900",
    fontStyle: "italic",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  discBadge: { position: "absolute", top: 8, left: 8, backgroundColor: "#EF4444", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  discText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  soldoutOverlay: { position: "absolute", inset: 0, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  soldoutBadge: { backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  soldoutText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  cardBody: { padding: 10, gap: 2 },
  cardName: { fontSize: 14, fontWeight: "600", lineHeight: 21, minHeight: 42 },
  priceRow: { marginTop: 2, gap: 1 },
  priceInner: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  origPrice: { fontSize: 10, textDecorationLine: "line-through" },
  discPct: { fontSize: 13, fontWeight: "700", color: "#EF4444" },
  price: { fontSize: 20, fontWeight: "900" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  star: { color: "#F59E0B", fontSize: 11 },
  ratingText: { fontSize: 10 },

  cartBtn: { borderTopWidth: 1, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  cartBtnText: { fontSize: 11, fontWeight: "600" },
});
