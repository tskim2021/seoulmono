import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

interface Inquiry {
  wr_id: number;
  wr_subject: string;
  wr_content: string;
  wr_datetime: string;
  has_reply: boolean;
}

function formatDate(dt: string) {
  if (!dt) return "";
  return dt.slice(0, 10);
}

export default function InquiryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [expanded, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["inquiries"],
    queryFn: () => api.get<{ inquiries: Inquiry[] }>("/shop/inquiries"),
  });

  const inquiries: Inquiry[] = data?.inquiries ?? [];

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => api.post("/shop/inquiries", { subject: subject.trim(), content: content.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      setShowForm(false);
      setSubject("");
      setContent("");
      Alert.alert("完了", "お問い合わせが登録されました。");
    },
    onError: (e: any) => {
      Alert.alert("エラー", e?.message ?? "登録に失敗しました。");
    },
  });

  const handleSubmit = () => {
    if (!subject.trim()) { Alert.alert("お知らせ", "件名を入力してください。"); return; }
    if (!content.trim()) { Alert.alert("お知らせ", "内容を入力してください。"); return; }
    submit();
  };

  const renderItem = ({ item }: { item: Inquiry }) => {
    const isOpen = expanded === item.wr_id;
    return (
      <Pressable
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setExpanded(isOpen ? null : item.wr_id)}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={[
              styles.badge,
              { backgroundColor: item.has_reply ? "#d1fae5" : "#fef3c7" },
            ]}>
              <Text style={[styles.badgeText, { color: item.has_reply ? "#065f46" : "#92400e" }]}>
                {item.has_reply ? "回答済み" : "回答待ち"}
              </Text>
            </View>
            <Text style={[styles.cardSubject, { color: colors.foreground }]} numberOfLines={isOpen ? undefined : 1}>
              {item.wr_subject}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>{formatDate(item.wr_datetime)}</Text>
            <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
          </View>
        </View>

        {isOpen && (
          <View style={[styles.cardBody, { borderTopColor: colors.border }]}>
            <Text style={[styles.bodyLabel, { color: colors.mutedForeground }]}>お問い合わせ内容</Text>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{item.wr_content}</Text>
            {item.has_reply && (
              <View style={[styles.replyBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Text style={[styles.bodyLabel, { color: colors.primary }]}>💬 ご回答が登録されました。</Text>
                <Text style={[styles.bodyText, { color: colors.mutedForeground, fontSize: 13 }]}>
                  ご回答内容はウェブサイトでご確認ください。
                </Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ヘッダー */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>1:1お問い合わせ</Text>
        <Pressable
          style={[styles.writeBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowForm(true)}
        >
          <Feather name="edit-3" size={14} color="#fff" />
          <Text style={styles.writeBtnText}>お問い合わせ登録</Text>
        </Pressable>
      </View>

      {/* お問い合わせ一覧 */}
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={inquiries}
          keyExtractor={(item) => String(item.wr_id)}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="message-circle" size={44} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>登録されたお問い合わせはありません。</Text>
              <Pressable
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowForm(true)}
              >
                <Text style={styles.emptyBtnText}>最初のお問い合わせを登録</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* お問い合わせ登録モーダル */}
      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView
          style={[styles.root, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowForm(false)} style={styles.backBtn}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.title, { color: colors.foreground }]}>お問い合わせ登録</Text>
            <View style={{ width: 80 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>件名 *</Text>
              <TextInput
                style={[styles.inp, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                placeholder="お問い合わせの件名を入力してください"
                placeholderTextColor={colors.mutedForeground}
                value={subject}
                onChangeText={setSubject}
                maxLength={100}
              />
            </View>
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>内容 *</Text>
              <TextInput
                style={[styles.textarea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                placeholder="お問い合わせ内容を詳しくご記入ください"
                placeholderTextColor={colors.mutedForeground}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                maxLength={2000}
              />
              <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{content.length} / 2000</Text>
            </View>

            <Pressable
              style={[styles.submitBtn, { backgroundColor: isPending ? colors.muted : colors.primary }]}
              onPress={handleSubmit}
              disabled={isPending}
            >
              {isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitBtnText}>お問い合わせを登録</Text>
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
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  writeBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
  },
  writeBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  card: { borderRadius: 12, borderWidth: 1, padding: 14 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  cardLeft: { flex: 1, gap: 6 },
  cardRight: { alignItems: "flex-end", gap: 4, flexShrink: 0 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  cardSubject: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  cardDate: { fontSize: 12 },
  cardBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 8 },
  bodyLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  bodyText: { fontSize: 14, lineHeight: 22 },
  replyBox: { marginTop: 8, borderRadius: 8, borderWidth: 1, padding: 12, gap: 4 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, marginTop: 4 },
  emptyBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  emptyBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  inp: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, fontSize: 15 },
  textarea: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, fontSize: 15, minHeight: 160 },
  charCount: { fontSize: 12, textAlign: "right", marginTop: 4 },
  submitBtn: { paddingVertical: 15, borderRadius: 10, alignItems: "center", marginTop: 8 },
  submitBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
