import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

interface SavedAddr {
  ma_id: number;
  ma_name: string;
  ma_hp: string;
  ma_zip1: string;
  ma_addr1: string;
  ma_addr2: string;
  ma_addr3: string;
  ma_default: boolean;
}

const emptyForm = { ma_name: "", ma_hp: "", ma_zip1: "", ma_addr1: "", ma_addr2: "", ma_default: false };

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [postcodeError, setPostcodeError] = useState("");
  const [postcodeLoading, setPostcodeLoading] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => api.get<any>("/shop/addresses"),
  });
  const addresses: SavedAddr[] = data?.addresses ?? [];

  const set = (k: keyof typeof emptyForm) => (v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handlePostcodeChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 7);
    const formatted = digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
    setForm((f) => ({ ...f, ma_zip1: formatted }));
    setPostcodeError("");
    if (digits.length === 7) {
      setPostcodeLoading(true);
      fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`)
        .then((r) => r.json())
        .then((data) => {
          const result = data.results?.[0];
          if (result) {
            setForm((f) => ({ ...f, ma_addr1: `${result.address1}${result.address2}${result.address3}` }));
          } else {
            setPostcodeError("郵便番号に該当する住所が見つかりませんでした。手入力してください。");
          }
        })
        .catch(() => setPostcodeError("住所の自動取得に失敗しました。手入力してください。"))
        .finally(() => setPostcodeLoading(false));
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (addr: SavedAddr) => {
    setEditingId(addr.ma_id);
    setForm({
      ma_name: addr.ma_name || "",
      ma_hp: addr.ma_hp || "",
      ma_zip1: addr.ma_zip1 || "",
      ma_addr1: addr.ma_addr1 || "",
      ma_addr2: [addr.ma_addr2, addr.ma_addr3].filter(Boolean).join(" "),
      ma_default: addr.ma_default,
    });
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.ma_name || !form.ma_addr1) throw new Error("受取人と住所を入力してください。");
      const body = { ...form };
      if (editingId) {
        return api.put(`/shop/addresses/${editingId}`, body);
      } else {
        return api.post("/shop/addresses", body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setShowForm(false);
      Alert.alert("完了", editingId ? "お届け先が更新されました。" : "お届け先が保存されました。");
    },
    onError: (e: any) => Alert.alert("エラー", e.message ?? "保存に失敗しました"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/shop/addresses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: (e: any) => Alert.alert("エラー", e.message ?? "削除に失敗しました"),
  });

  const handleDelete = (addr: SavedAddr) => {
    Alert.alert("お届け先削除", `"${addr.ma_name}"のお届け先を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => deleteMutation.mutate(addr.ma_id) },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>お届け先管理</Text>
        <Pressable style={styles.backBtn} onPress={openAdd}>
          <Feather name="plus" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : addresses.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 }}>
          <Feather name="map-pin" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>保存されたお届け先がありません</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>お届け先を追加してみましょう</Text>
          <Pressable style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openAdd}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.addBtnText}>お届け先を追加</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          {addresses.map((addr) => (
            <View
              key={addr.ma_id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: addr.ma_default ? colors.primary : colors.border }]}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardTopLeft}>
                  <Text style={[styles.cardName, { color: colors.foreground }]}>{addr.ma_name}</Text>
                  {addr.ma_default && (
                    <View style={[styles.defaultBadge, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.defaultBadgeText, { color: colors.primary }]}>既定</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardActions}>
                  <Pressable
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                    onPress={() => openEdit(addr)}
                  >
                    <Feather name="edit-2" size={14} color={colors.foreground} />
                    <Text style={[styles.actionText, { color: colors.foreground }]}>編集</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { borderColor: "#EF4444" }]}
                    onPress={() => handleDelete(addr)}
                    disabled={deleteMutation.isPending}
                  >
                    <Feather name="trash-2" size={14} color="#EF4444" />
                    <Text style={[styles.actionText, { color: "#EF4444" }]}>削除</Text>
                  </Pressable>
                </View>
              </View>
              {addr.ma_hp ? (
                <Text style={[styles.cardPhone, { color: colors.mutedForeground }]}>{addr.ma_hp}</Text>
              ) : null}
              <Text style={[styles.cardAddr, { color: colors.foreground }]}>
                [{addr.ma_zip1}] {addr.ma_addr1}
              </Text>
              {addr.ma_addr2 ? (
                <Text style={[styles.cardDetail, { color: colors.mutedForeground }]}>{addr.ma_addr2}</Text>
              ) : null}
            </View>
          ))}

          <Pressable
            style={[styles.addDashedBtn, { borderColor: colors.primary }]}
            onPress={openAdd}
          >
            <Feather name="plus-circle" size={18} color={colors.primary} />
            <Text style={[styles.addDashedText, { color: colors.primary }]}>新しいお届け先を追加</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* ── 配送先の登録/編集モーダル ── */}
      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView
          style={[styles.root, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowForm(false)} style={styles.backBtn}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {editingId ? "お届け先を編集" : "新しいお届け先を追加"}
            </Text>
            <View style={styles.backBtn} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 60 }}>
            <TextInput
              style={[styles.inp, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="受取人のお名前 *"
              placeholderTextColor={colors.mutedForeground}
              value={form.ma_name}
              onChangeText={set("ma_name") as any}
            />
            <TextInput
              style={[styles.inp, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="連絡先"
              placeholderTextColor={colors.mutedForeground}
              value={form.ma_hp}
              onChangeText={set("ma_hp") as any}
              keyboardType="phone-pad"
            />

            <View style={styles.postcodeRow}>
              <Text style={{ fontSize: 15, color: colors.foreground, fontWeight: "700" }}>〒</Text>
              <TextInput
                style={[styles.inp, { flex: 1, borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                placeholder="123-4567"
                placeholderTextColor={colors.mutedForeground}
                value={form.ma_zip1}
                onChangeText={handlePostcodeChange}
                keyboardType="number-pad"
                maxLength={8}
              />
              {postcodeLoading && <ActivityIndicator color={colors.primary} />}
            </View>
            {postcodeError ? (
              <Text style={{ fontSize: 12, color: "#EF4444", marginTop: -6 }}>{postcodeError}</Text>
            ) : null}

            <TextInput
              style={[styles.inp, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="都道府県・市区町村 *（郵便番号入力で自動入力）"
              placeholderTextColor={colors.mutedForeground}
              value={form.ma_addr1}
              onChangeText={set("ma_addr1") as any}
            />
            <TextInput
              style={[styles.inp, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="番地・建物名・部屋番号など"
              placeholderTextColor={colors.mutedForeground}
              value={form.ma_addr2}
              onChangeText={set("ma_addr2") as any}
            />

            <Pressable
              style={styles.checkRow}
              onPress={() => set("ma_default")(!form.ma_default)}
            >
              <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: form.ma_default ? colors.primary : "transparent" }]}>
                {form.ma_default && <Feather name="check" size={12} color="#fff" />}
              </View>
              <Text style={[styles.checkLabel, { color: colors.foreground }]}>既定のお届け先に設定</Text>
            </Pressable>

            <Pressable
              style={[styles.saveBtn, { backgroundColor: saveMutation.isPending ? colors.muted : colors.primary }]}
              onPress={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>{editingId ? "更新完了" : "お届け先を保存"}</Text>
              }
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, textAlign: "center" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  addBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  card: { borderRadius: 12, borderWidth: 1.5, padding: 14, gap: 6 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTopLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  defaultBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  cardActions: { flexDirection: "row", gap: 6 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  actionText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  cardPhone: { fontSize: 13 },
  cardAddr: { fontSize: 14, fontFamily: "Inter_500Medium" },
  cardDetail: { fontSize: 13 },
  addDashedBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", marginTop: 4 },
  addDashedText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  inp: { paddingHorizontal: 14, paddingVertical: 13, borderRadius: 8, borderWidth: 1, fontSize: 15 },
  postcodeRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  searchBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 8 },
  searchBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  checkLabel: { fontSize: 14 },
  saveBtn: { paddingVertical: 15, borderRadius: 10, alignItems: "center", marginTop: 8 },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
