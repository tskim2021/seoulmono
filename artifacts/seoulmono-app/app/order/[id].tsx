import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { api, Order } from "@/lib/api";

function formatPrice(n: number) {
  return n.toLocaleString("ja-JP") + "円";
}

const STATUS_LABELS: Record<string, string> = {
  pending: "注文待ち",
  paid: "決済完了",
  preparing: "商品準備中",
  shipping: "配送中",
  delivered: "配送完了",
  cancelled: "キャンセル済み",
};

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api.get<any>(`/shop/my-orders/${id}`),
    enabled: !!id,
  });

  const order = data?.order ?? data;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>注文詳細</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : !order ? (
        <View style={styles.empty}>
          <Feather name="package" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>注文情報が見つかりません</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.orderRow}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>注文番号</Text>
              <Text style={[styles.value, { color: colors.foreground }]}>{order.od_id}</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>注文日時</Text>
              <Text style={[styles.value, { color: colors.foreground }]}>
                {order.od_time ? new Date(order.od_time).toLocaleDateString("ja-JP") : "-"}
              </Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>注文状況</Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.statusText, { color: colors.primary }]}>
                  {STATUS_LABELS[order.od_status] ?? order.od_status ?? "処理中"}
                </Text>
              </View>
            </View>
          </View>

          {order.items && order.items.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>注文商品</Text>
              {order.items.map((item: any, idx: number) => (
                <View key={idx} style={[styles.itemRow, { borderTopColor: colors.border }]}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.itemName, { color: colors.foreground }]}>{item.it_name}</Text>
                    <Text style={[styles.itemDetail, { color: colors.mutedForeground }]}>
                      {item.ct_qty}個 · {formatPrice(item.ct_price)}
                    </Text>
                  </View>
                  <Text style={[styles.itemTotal, { color: colors.primary }]}>
                    {formatPrice(item.ct_price * item.ct_qty)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>お支払い情報</Text>
            <View style={styles.orderRow}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>お支払い金額</Text>
              <Text style={[styles.total, { color: colors.primary }]}>{formatPrice(order.od_price ?? 0)}</Text>
            </View>
          </View>
        </ScrollView>
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
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  section: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  orderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontFamily: "Inter_500Medium" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1 },
  itemName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  itemDetail: { fontSize: 12 },
  itemTotal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  total: { fontSize: 18, fontFamily: "Inter_700Bold" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 15 },
});
