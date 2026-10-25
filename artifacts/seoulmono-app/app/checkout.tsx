import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useCart, unitPrice, lineKey } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { api, getImageUrl } from '@/lib/api';
import { shippingFee } from '@/lib/catalog';
import { useShipping } from '@/hooks/useShipping';

type Delivery = { name: string; kana: string; phone: string; email: string; postcode: string; address: string; detail: string; memo: string };
type SavedAddress = { ma_id: number; ma_name: string; ma_hp: string; ma_zip1: string; ma_addr1: string; ma_addr2: string; ma_addr3: string; ma_default: boolean };
const yen = (value: number) => `${value.toLocaleString('ja-JP')}円`;

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { buy } = useLocalSearchParams<{ buy?: string }>();
  const { items: cartItems, buyNowItem } = useCart();
  const items = buy === '1' ? (buyNowItem ? [buyNowItem] : []) : cartItems;
  const { user } = useAuth();
  const shipping = useShipping();
  const { data: saved } = useQuery({ queryKey: ['addresses', user?.mb_id], queryFn: () => api.get<{ addresses: SavedAddress[] }>('/shop/addresses'), enabled: !!user });
  const [form, setForm] = useState<Delivery>({ name: user?.mb_name || '', kana: '', phone: user?.mb_hp || '', email: user?.mb_email || '', postcode: '', address: '', detail: '', memo: '' });
  const edited = useRef(false);
  const applyAddress = (address: SavedAddress) => {
    edited.current = true;
    setForm(previous => ({ ...previous, name: address.ma_name || previous.name, phone: address.ma_hp || previous.phone, postcode: address.ma_zip1 || '', address: address.ma_addr1 || '', detail: [address.ma_addr2, address.ma_addr3].filter(Boolean).join(' ') }));
  };
  useEffect(() => {
    if (!edited.current && saved?.addresses.length) applyAddress(saved.addresses.find(address => address.ma_default) || saved.addresses[0]);
  }, [saved]);
  const subtotal = items.reduce((total, item) => total + unitPrice(item) * item.quantity, 0);
  const deliveryFee = shipping.data ? shippingFee(items, shipping.data) : null;
  const fields: { key: keyof Delivery; label: string; placeholder: string; keyboard?: 'default' | 'email-address' | 'phone-pad' | 'number-pad' }[] = [
    { key: 'name', label: 'お名前', placeholder: '山田 太郎' },
    { key: 'kana', label: 'フリガナ', placeholder: 'ヤマダ タロウ' },
    { key: 'phone', label: '電話番号', placeholder: '09012345678', keyboard: 'phone-pad' },
    { key: 'email', label: 'メールアドレス', placeholder: 'example@email.com', keyboard: 'email-address' },
    { key: 'postcode', label: '郵便番号', placeholder: '100-0001', keyboard: 'number-pad' },
    { key: 'address', label: '都道府県・市区町村・番地', placeholder: '東京都千代田区…' },
    { key: 'detail', label: '建物名・部屋番号', placeholder: 'マンション名・部屋番号' },
    { key: 'memo', label: '配送メモ（任意）', placeholder: '配送に関するご希望' },
  ];
  return <KeyboardAvoidingView testID="native-checkout" behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Pressable accessibilityLabel="戻る" onPress={() => router.back()} style={styles.back}><Feather name="arrow-left" size={24} color="#18354b" /></Pressable>
      <Text style={styles.title}>ご注文内容</Text><View style={styles.back} />
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30, gap: 24 }}>
      <View style={styles.notice}><Text style={styles.noticeTitle}>お支払いは現在準備中です</Text><Text style={styles.body}>商品の内容とお届け先をご確認いただけます。現在、注文の確定・決済はできません。</Text></View>
      {!items.length ? <View style={styles.section}><Text style={styles.body}>注文する商品がありません。</Text><Pressable onPress={() => router.replace('/(tabs)/products')}><Text style={styles.link}>商品を見る →</Text></Pressable></View> : <>
        <View style={styles.section}><Text style={styles.heading}>注文商品</Text>{items.map(item => <View key={lineKey(item)} style={styles.item}>
          <Image source={{ uri: getImageUrl(item.it_img1) || undefined }} style={styles.image} contentFit="contain" />
          <View style={{ flex: 1, gap: 6 }}><Text style={styles.itemName}>{item.it_name}</Text>{!!item.option && <Text style={styles.body}>{item.option}</Text>}<Text style={styles.body}>{yen(unitPrice(item))} × {item.quantity}</Text><Text style={styles.price}>{yen(unitPrice(item) * item.quantity)}</Text></View>
        </View>)}</View>
        <View style={styles.section}><Text style={styles.heading}>お届け先</Text>
          {!!saved?.addresses.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{saved.addresses.map(address => <Pressable key={address.ma_id} onPress={() => applyAddress(address)} style={styles.address}><Text style={styles.link}>{address.ma_name} · {address.ma_zip1}</Text><Text numberOfLines={1} style={styles.body}>{address.ma_addr1}</Text></Pressable>)}</ScrollView>}
          {fields.map(field => <View key={field.key} style={{ gap: 8 }}><Text style={styles.label}>{field.label}</Text><TextInput accessibilityLabel={field.label} value={form[field.key]} placeholder={field.placeholder} placeholderTextColor="#7a8c9a" autoCapitalize="none" autoCorrect={false} keyboardType={field.keyboard} multiline={field.key === 'memo'} maxLength={field.key === 'memo' ? 500 : 200} onChangeText={value => { edited.current = true; setForm(previous => ({ ...previous, [field.key]: value })); }} style={[styles.input, field.key === 'memo' && { minHeight: 90 }]} /></View>)}
        </View>
        <View style={styles.section}><Text style={styles.heading}>お支払い金額</Text><View style={styles.totalRow}><Text style={styles.body}>商品合計</Text><Text style={styles.price}>{yen(subtotal)}</Text></View><View style={styles.totalRow}><Text style={styles.body}>送料</Text>{shipping.isLoading ? <ActivityIndicator /> : <Text style={styles.price}>{deliveryFee === null ? '確認できません' : yen(deliveryFee)}</Text>}</View>
          {shipping.isError && <Pressable onPress={() => shipping.refetch()}><Text style={styles.link}>送料を再確認</Text></Pressable>}
          <View style={[styles.totalRow, styles.total]}><Text style={styles.heading}>合計</Text><Text style={styles.totalPrice}>{deliveryFee === null ? '—' : yen(subtotal + deliveryFee)}</Text></View>
          <View accessibilityRole="button" accessibilityState={{ disabled: true }} style={styles.disabled}><Text style={styles.disabledText}>お支払い準備中</Text></View>
        </View>
      </>}
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#dce7ef' }, back: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }, title: { color: '#18354b', fontSize: 21, fontWeight: '800' },
  section: { gap: 18 }, heading: { color: '#18354b', fontSize: 21, fontWeight: '800' }, notice: { backgroundColor: '#edf6fc', padding: 18, gap: 8, borderRadius: 10 }, noticeTitle: { color: '#245d84', fontSize: 17, fontWeight: '800' }, body: { color: '#526b7d', fontSize: 14, lineHeight: 23 }, link: { color: '#397aa3', fontSize: 15, fontWeight: '700', paddingVertical: 6 }, item: { flexDirection: 'row', gap: 14, borderBottomWidth: 1, borderColor: '#edf1f5', paddingBottom: 16 }, image: { width: 84, height: 100, backgroundColor: '#f6f8fa', borderRadius: 8 }, itemName: { color: '#18354b', fontSize: 16, fontWeight: '700', lineHeight: 25 }, price: { color: '#18354b', fontSize: 17, fontWeight: '700' }, label: { color: '#18354b', fontSize: 15, fontWeight: '700' }, input: { borderWidth: 1, borderColor: '#cbdce8', borderRadius: 8, padding: 14, minHeight: 52, fontSize: 16, color: '#18354b' }, address: { borderWidth: 1, borderColor: '#cbdce8', padding: 12, borderRadius: 8, maxWidth: 240 }, totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, total: { borderTopWidth: 1, borderColor: '#dce7ef', paddingTop: 18 }, totalPrice: { fontSize: 28, fontWeight: '800', color: '#18354b' }, disabled: { padding: 18, borderRadius: 8, alignItems: 'center', backgroundColor: '#e6edf2' }, disabledText: { color: '#657c8d', fontSize: 17, fontWeight: '700' },
});
