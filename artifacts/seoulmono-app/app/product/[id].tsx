import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { api, ShopItem, getImageUrl } from "@/lib/api";
import PurchaseSheet from "@/components/PurchaseSheet";
import ProductDescription from '@/components/ProductDescription';
import { useShipping } from '@/hooks/useShipping';

const { width: W } = Dimensions.get("window");

function formatPrice(n: number) {
  return n.toLocaleString("ja-JP") + "円";
}

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sheetMode, setSheetMode] = useState<"cart" | "buy" | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const shipping = useShipping();

  type DetailItem = ShopItem & { images?: string[]; it_explan?: string; it_explan_ja?: string; it_cust_price?: number; item?: any };

  const { data, isLoading, error } = useQuery({
    queryKey: ["item", id],
    queryFn: () => api.get<DetailItem>(`/shop/items/${id}`),
    enabled: !!id,
  });

  const { data: relatedData } = useQuery({
    queryKey: ["related", id],
    queryFn: () => api.get<{ items: ShopItem[] }>(`/shop/items/${id}/related`),
    enabled: !!id,
  });

  // APIが { item: {...} } または直接 {...} のどちらの形式でも処理
  const item = data?.item ?? data;
  const images: string[] = (item?.images ?? [])
    .map((img: string) => getImageUrl(img))
    .filter((u: string | null): u is string => u !== null);

  // it_price = 実販売価格, it_cust_price = 定価(希望小売価格)
  const price = item?.it_price ?? 0;
  const origPrice = item?.it_cust_price ?? 0;

  const soldOut = item?.it_soldout === "1";
  const preparing = item?.it_soldout === "2";
  const canBuy = !soldOut && !preparing && item?.it_stock_qty !== 0;

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center", gap: 12 }]}>
        <Feather name="alert-circle" size={48} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>商品を読み込めませんでした</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>戻る</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 4, backgroundColor: colors.background }]}>
        <Pressable style={[styles.backBtn, { backgroundColor: colors.secondary }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Pressable style={[styles.backBtn, { backgroundColor: colors.secondary }]} onPress={() => router.push("/(tabs)/cart")}>
          <Feather name="shopping-bag" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 48, paddingBottom: 120 }}>
        {images.length > 0 ? (
          <>
            <FlatList
              data={images}
              keyExtractor={(_, i) => String(i)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
              renderItem={({ item: imgUri }) => (
                <Image source={{ uri: imgUri }} style={{ width: W, height: W }} contentFit="contain" />
              )}
            />
            {images.length > 1 && (
              <View style={styles.imgDots}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.imgDot, { backgroundColor: i === imgIdx ? colors.primary : colors.border }]} />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={{ width: W, height: W, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
            <Feather name="image" size={64} color={colors.mutedForeground} />
          </View>
        )}

        <View style={styles.info}>
          {item.ca_name && (
            <Text style={[styles.catLabel, { color: colors.primary }]}>{item.ca_name}</Text>
          )}
          <Text style={[styles.itemName, { color: colors.foreground }]}>{item.it_name}</Text>

          <View style={styles.priceRow}>
            {origPrice > price ? (
              <View style={styles.priceStack}>
                <Text style={[styles.origPrice, { color: colors.mutedForeground }]}>{formatPrice(origPrice)}</Text>
                <View style={styles.priceWithBadge}>
                  {origPrice > 0 ? (
                    <View style={styles.discBadge}>
                      <Text style={styles.discText}>{Math.round((origPrice - price) / origPrice * 100)}%</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.salePrice, { color: colors.primary }]}>{formatPrice(price)}</Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.salePrice, { color: colors.primary }]}>{formatPrice(price)}</Text>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={[styles.deliveryBox, { backgroundColor: colors.secondary }]}>
            <Feather name="truck" size={16} color={colors.primary} />
            <Text style={[styles.deliveryText, { color: colors.foreground }]}>
              {shipping.data ? `送料 ${formatPrice(shipping.data.fee)}・別商品を追加するごとに ${formatPrice(shipping.data.additionalFee)}` : '送料は注文画面でご確認ください'}
            </Text>
          </View>
        </View>

        <View style={{ padding: 20, backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 20, color: '#172b3a' }}>商品詳細</Text>
          <ProductDescription key={String(id)} html={item.it_explan_ja || item.it_explan} />
        </View>

        {relatedData?.items && relatedData.items.length > 0 && (
          <View style={styles.related}>
            <Text style={[styles.relatedTitle, { color: colors.foreground }]}>あわせて見たい商品</Text>
            <FlatList
              data={relatedData.items.slice(0, 5)}
              keyExtractor={(i) => String(i.it_id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              renderItem={({ item: rel }) => {
                const relImg = getImageUrl(rel.it_img1);
                return (
                  <Pressable
                    style={[styles.relCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push(`/product/${rel.it_id}`)}
                  >
                    {relImg ? (
                      <Image
                        source={{ uri: relImg }}
                        style={styles.relImg}
                        contentFit="cover"
                        onError={() => {}}
                        placeholder={null}
                      />
                    ) : (
                      <View style={[styles.relImg, { backgroundColor: colors.muted }]} />
                    )}
                    <Text style={[styles.relName, { color: colors.foreground }]} numberOfLines={2}>{rel.it_name}</Text>
                    <Text style={[styles.relPrice, { color: colors.primary }]}>{formatPrice(rel.it_price)}</Text>
                  </Pressable>
                );
              }}
            />
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.background, paddingBottom: insets.bottom + 8, borderTopColor: colors.border }]}>
        <Pressable
          disabled={!canBuy}
          style={[styles.cartBtn, { borderColor: canBuy ? colors.primary : colors.border }]}
          onPress={() => setSheetMode("cart")}
        >
          <Feather name="shopping-bag" size={18} color={canBuy ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.cartBtnText, { color: canBuy ? colors.primary : colors.mutedForeground }]}>カート</Text>
        </Pressable>
        <Pressable
          disabled={!canBuy}
          style={[styles.buyBtn, { backgroundColor: canBuy ? colors.primary : colors.muted }]}
          onPress={() => setSheetMode("buy")}
        >
          <Text style={[styles.buyBtnText, !canBuy && { color: colors.mutedForeground }]}>
            {soldOut ? "品切れ" : preparing ? "販売準備中" : "購入する"}
          </Text>
        </Pressable>
      </View>

      {sheetMode && (
        <PurchaseSheet itemId={item.it_id} mode={sheetMode} onClose={() => setSheetMode(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  imgDots: { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 10 },
  imgDot: { width: 6, height: 6, borderRadius: 3 },
  info: { padding: 16, gap: 12 },
  catLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  itemName: { fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 28 },
  priceRow: {},
  priceStack: { gap: 4 },
  origPrice: { fontSize: 14, textDecorationLine: "line-through" },
  priceWithBadge: { flexDirection: "row", alignItems: "center", gap: 8 },
  discBadge: { backgroundColor: "#EF4444", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  discText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  salePrice: { fontSize: 24, fontFamily: "Inter_700Bold" },
  divider: { height: 1 },
  deliveryBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 8 },
  deliveryText: { fontSize: 13, flex: 1 },
  related: { marginTop: 8 },
  relatedTitle: { fontSize: 16, fontFamily: "Inter_700Bold", paddingHorizontal: 16, marginBottom: 12 },
  relCard: { width: 130, borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  relImg: { width: 130, height: 130 },
  relName: { fontSize: 12, fontFamily: "Inter_500Medium", padding: 8, lineHeight: 16 },
  relPrice: { fontSize: 13, fontFamily: "Inter_700Bold", paddingHorizontal: 8, paddingBottom: 8 },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, flexDirection: "row", gap: 10 },
  cartBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 10, borderWidth: 2 },
  cartBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  buyBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 10 },
  buyBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  errorText: { fontSize: 16 },
});
