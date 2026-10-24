import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { api, getImageUrl } from "@/lib/api";

interface Order {
  od_id: string;
  od_status: string;
  od_receipt_price: number;
  od_cart_price: number;
  od_send_cost: number;
  od_settle_case: string;
  od_time: string;
  first_item: string;
  first_img: string;
  first_it_id: string;
  first_qty: number;
  item_count: number;
}

const STATUS_LABEL: Record<string, string> = {
  "": "決済完了",
  "결제": "決済完了",
  "입금": "入金待ち",
  "준비": "発送準備中",
  "배송": "配送中",
  "완료": "配送完了",
  "취소": "キャンセル",
  "반품": "返品",
  "교환": "交換",
};

const STATUS_COLOR: Record<string, string> = {
  "配送完了": "#10b981",
  "配送中": "#3b82f6",
  "発送準備中": "#8b5cf6",
  "決済完了": "#f59e0b",
  "入金待ち": "#f59e0b",
  "キャンセル": "#ef4444",
  "返品": "#ef4444",
  "交換": "#f59e0b",
};

function getStatusLabel(status: string): string {
  if (!status) return "決済完了";
  for (const key of Object.keys(STATUS_LABEL)) {
    if (status.includes(key)) return STATUS_LABEL[key];
  }
  return status;
}

function formatDate(dt: string) {
  if (!dt) return "";
  return dt.slice(0, 10);
}

function formatPrice(n: number) {
  return n.toLocaleString("ja-JP") + "円";
}

const DAYS_OPTIONS = [
  { label: "1ヶ月", value: 30 },
  { label: "3ヶ月", value: 90 },
  { label: "6ヶ月", value: 180 },
];

export default function OrderHistoryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const [days, setDays] = useState(30);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-orders", days],
    queryFn: () => api.get<{ orders: Order[] }>(`/shop/my-orders?days=${days}`),
  });

  const orders: Order[] = data?.orders ?? [];

  const renderItem = ({ item }: { item: Order }) => {
    const label = getStatusLabel(item.od_status);
    const color = STATUS_COLOR[label] ?? colors.primary;
    const imgSrc = getImageUrl(item.first_img);

    return (
      <Pressable
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/order/${item.od_id}`)}
      >
        <View style={styles.cardTop}>
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
            {formatDate(item.od_time)}
          </Text>
          <View style={[styles.badge, { backgroundColor: color + "22" }]}>
            <Text style={[styles.badgeText, { color }]}>{label}</Text>
          </View>
        </View>

        <View style={styles.itemRow}>
          {imgSrc ? (
            <Image
              source={{ uri: imgSrc }}
              style={styles.thumb}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder, { backgroundColor: colors.secondary }]}>
              <Feather name="package" size={20} color={colors.mutedForeground} />
            </View>
          )}
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
              {item.first_item}
              {item.item_count > 1 ? ` 他${item.item_count - 1}件` : ""}
            </Text>
            <Text style={[styles.itemQty, { color: colors.mutedForeground }]}>
              数量 {item.first_qty}個
            </Text>
          </View>
        </View>

        <View style={[styles.cardBottom, { borderTopColor: colors.border }]}>
          <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>お支払い金額</Text>
          <Text style={[styles.price, { color: colors.foreground }]}>
            {formatPrice(item.od_receipt_price)}
          </Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>注文履歴</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {DAYS_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[
              styles.filterBtn,
              days === opt.value && { backgroundColor: colors.primary },
            ]}
            onPress={() => setDays(opt.value)}
          >
            <Text style={[
              styles.filterText,
              { color: days === opt.value ? "#fff" : colors.mutedForeground },
            ]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.od_id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="package" size={48} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>注文履歴がありません</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                この期間にご注文はありません。
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  filterRow: {
    flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "transparent",
  },
  filterText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dateText: { fontSize: 13 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  itemRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  thumb: { width: 68, height: 68, borderRadius: 10 },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  itemInfo: { flex: 1, gap: 4 },
  itemName: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  itemQty: { fontSize: 13 },
  cardBottom: {
    flexDirection: "row", alignItems: "center", borderTopWidth: 1,
    paddingTop: 10, gap: 4,
  },
  priceLabel: { fontSize: 13, flex: 1 },
  price: { fontSize: 15, fontFamily: "Inter_700Bold" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 8 },
  emptyDesc: { fontSize: 14, textAlign: "center" },
});
