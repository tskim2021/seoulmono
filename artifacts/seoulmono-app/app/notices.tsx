import { useQuery } from "@tanstack/react-query";
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
import { api } from "@/lib/api";

export default function NoticesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: () => api.get<any>("/boards/notice?per_page=30"),
  });

  const notices = data?.notices ?? data?.items ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>お知らせ</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(i: any) => String(i.wr_id ?? i.id)}
          contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="bell" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>お知らせがありません</Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => {
            const isOpen = expanded === (item.wr_id ?? item.id);
            return (
              <Pressable
                style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setExpanded(isOpen ? null : (item.wr_id ?? item.id))}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemLeft}>
                    <View style={[styles.noticeBadge, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.noticeBadgeText, { color: colors.primary }]}>お知らせ</Text>
                    </View>
                    <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={isOpen ? undefined : 1}>
                      {item.wr_subject ?? item.title}
                    </Text>
                  </View>
                  <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                </View>
                <Text style={[styles.itemDate, { color: colors.mutedForeground }]}>
                  {item.wr_datetime ? new Date(item.wr_datetime).toLocaleDateString("ja-JP") : item.created_at ? new Date(item.created_at).toLocaleDateString("ja-JP") : ""}
                </Text>
                {isOpen && item.wr_content && (
                  <Text style={[styles.itemContent, { color: colors.foreground, borderTopColor: colors.border }]}>
                    {item.wr_content.replace(/<[^>]+>/g, "")}
                  </Text>
                )}
              </Pressable>
            );
          }}
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
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  item: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  itemHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  itemLeft: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  noticeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, flexShrink: 0, marginTop: 2 },
  noticeBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  itemTitle: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  itemDate: { fontSize: 12 },
  itemContent: { fontSize: 14, lineHeight: 22, borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
  empty: { alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 15 },
});
