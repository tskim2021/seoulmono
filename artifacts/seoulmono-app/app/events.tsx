import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
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

const { width: W } = Dimensions.get("window");

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => api.get<any>("/shop/events"),
  });

  const events = data?.events ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>イベント</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(i: any) => String(i.id ?? i.ev_id)}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="gift" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>開催中のイベントがありません</Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => {
            const finalImg = getImageUrl(item.ev_img ?? item.image);
            const isActive = item.ev_status === "active" || !item.ev_status;
            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {finalImg ? (
                  <Image source={{ uri: finalImg }} style={styles.cardImg} contentFit="cover" />
                ) : (
                  <View style={[styles.cardImg, { backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }]}>
                    <Feather name="gift" size={32} color={colors.primary} />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={[styles.statusBadge, { backgroundColor: isActive ? "#22C55E" : colors.muted }]}>
                      <Text style={styles.statusText}>{isActive ? "開催中" : "終了"}</Text>
                    </View>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.ev_subject ?? item.title ?? "イベント"}</Text>
                  </View>
                  {(item.ev_sdate || item.start_date) && (
                    <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
                      {item.ev_sdate ?? item.start_date} ~ {item.ev_edate ?? item.end_date ?? "常時"}
                    </Text>
                  )}
                  {(item.ev_content ?? item.description) && (
                    <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {(item.ev_content ?? item.description ?? "").replace(/<[^>]+>/g, "")}
                    </Text>
                  )}
                </View>
              </View>
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
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardImg: { width: "100%", height: 180 },
  cardBody: { padding: 14, gap: 6 },
  cardTop: { gap: 6 },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", lineHeight: 22 },
  cardDate: { fontSize: 12 },
  cardDesc: { fontSize: 13, lineHeight: 19 },
  empty: { alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 15 },
});
