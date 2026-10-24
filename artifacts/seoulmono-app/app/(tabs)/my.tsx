import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
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
import { api } from "@/lib/api";

function MenuItem({ icon, label, value, onPress }: { icon: string; label: string; value?: string; onPress?: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.menuLeft}>
        <Feather name={icon as any} size={18} color={colors.primary} />
        <Text style={[styles.menuLabel, { color: colors.foreground }]}>{label}</Text>
      </View>
      <View style={styles.menuRight}>
        {value ? <Text style={[styles.menuValue, { color: colors.mutedForeground }]}>{value}</Text> : null}
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function MyScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  const { data: dashboard } = useQuery({
    queryKey: ["my-dashboard"],
    queryFn: () => api.get<any>("/shop/my-dashboard"),
    enabled: !!user,
  });

  const handleLogout = () => {
    Alert.alert("ログアウト", "ログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ログアウト",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>MY</Text>
        </View>
        <View style={styles.loginPrompt}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.secondary }]}>
            <Feather name="user" size={48} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.loginTitle, { color: colors.foreground }]}>ログインが必要です</Text>
          <Text style={[styles.loginDesc, { color: colors.mutedForeground }]}>ログインして様々な特典をご利用ください</Text>
          <Pressable
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginBtnText}>ログイン</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/register")}>
            <Text style={[styles.registerLink, { color: colors.mutedForeground }]}>
              まだ会員登録がお済みでない方は <Text style={{ color: colors.primary }}>会員登録</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>MY</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.profile, { backgroundColor: colors.primary }]}>
          <View style={styles.profileInner}>
            <View style={[styles.avatar, { backgroundColor: "rgba(255,255,255,0.3)" }]}>
              <Feather name="user" size={32} color="#fff" />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={styles.profileName}>{user.mb_name} 様</Text>
              <Text style={styles.profileId}>@{user.mb_id}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{dashboard?.orderCount ?? 0}</Text>
              <Text style={styles.statLabel}>注文</Text>
            </View>
            <View style={[styles.statDivider]} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{(user.mb_point ?? 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>ポイント</Text>
            </View>
            <View style={[styles.statDivider]} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{dashboard?.couponCount ?? 0}</Text>
              <Text style={styles.statLabel}>クーポン</Text>
            </View>
          </View>
        </View>

        <View style={{ gap: 12, padding: 16 }}>
          <MenuSection title="注文">
            <MenuItem icon="package" label="注文履歴" onPress={() => router.push("/order-history")} />
            <MenuItem icon="map-pin" label="お届け先管理" onPress={() => router.push("/addresses")} />
            <MenuItem icon="heart" label="お気に入り" />
            <MenuItem icon="star" label="マイレビュー" />
          </MenuSection>

          <MenuSection title="特典">
            <MenuItem icon="tag" label="保有クーポン" value={`${dashboard?.couponCount ?? 0}枚`} />
            <MenuItem icon="gift" label="ポイント" value={`${(user.mb_point ?? 0).toLocaleString()}P`} />
          </MenuSection>

          <MenuSection title="カスタマーサポート">
            <MenuItem icon="file-text" label="お知らせ" onPress={() => router.push("/notices")} />
            <MenuItem icon="help-circle" label="イベント" onPress={() => router.push("/events")} />
            <MenuItem icon="message-circle" label="1:1お問い合わせ" onPress={() => router.push("/inquiry")} />
            <MenuItem icon="globe" label="ウェブサイトを見る" onPress={() => router.push("/webshop")} />
          </MenuSection>

          <MenuSection title="アカウント">
            <MenuItem icon="settings" label="会員情報編集" onPress={() => router.push("/edit-profile")} />
            <MenuItem icon="log-out" label="ログアウト" onPress={handleLogout} />
          </MenuSection>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  loginPrompt: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  loginTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  loginDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  loginBtn: { width: "100%", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 8 },
  loginBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  registerLink: { fontSize: 14 },
  profile: { padding: 20, gap: 20 },
  profileInner: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  profileName: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  profileId: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingVertical: 14 },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  statNum: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  section: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  menuValue: { fontSize: 13 },
});
