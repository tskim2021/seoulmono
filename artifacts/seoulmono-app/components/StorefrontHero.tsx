import React, { useState } from 'react';
import { Dimensions, FlatList, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const width = Dimensions.get('window').width;
const selections = [
  { tag: '毎日のビタミン習慣', title: '明日の私に、\nいい習慣。', note: '韓国のビタミンを、毎日の定番に。', label: 'ビタミンを見る', category: '190', id: '1785119103', color: '#E8F4FF' },
  { tag: 'インナービューティー', title: '内側から、\n私らしく。', note: '毎日に取り入れたい、韓国のインナーケア。', label: 'インナーケアを見る', category: '220', id: '1785120996', color: '#FFF0E8' },
  { tag: 'ソウルモノ セレクト', title: '暮らしに、\nいいものを。', note: '気になる韓国サプリを、ひとつずつ。', label: 'サプリメントを見る', category: '200', id: '1785119644', color: '#EAF5EF' },
];

export default function StorefrontHero() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const { data } = useQuery({ queryKey: ['hero-banners'], queryFn: () => api.get<any>('/shop/hero-banners') });
  const banners = [...(data?.banners || []).filter((b: any) => b.imageUrl).map((b: any) => ({ ...b, admin: true })), ...selections];
  function go(url: string) {
    try {
      const u = new URL(url || '/products', 'https://seoulmono.com');
      const product = u.pathname.match(/^\/item\/([^/]+)$/);
      if (product) router.push(`/product/${product[1]}`);
      else router.push({ pathname: '/(tabs)/products', params: { ca_id: u.searchParams.get('ca_id') || '' } });
    } catch { router.push('/(tabs)/products'); }
  }
  return <View style={{ paddingTop: 12 }}>
    <FlatList horizontal pagingEnabled data={banners} keyExtractor={(_, i) => String(i)} showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={event => setActive(Math.round(event.nativeEvent.contentOffset.x / width))}
      renderItem={({ item }) => item.admin ? <Pressable onPress={() => go(item.linkUrl)} style={{ width, paddingHorizontal: 16 }}>
        <Image source={{ uri: new URL(item.mobileImageUrl || item.imageUrl, 'https://seoulmono.com').href }} style={{ width: width - 32, height: 310, borderRadius: 12 }} contentFit="contain" />
      </Pressable> : <View style={{ width, paddingHorizontal: 16 }}>
        <Pressable accessibilityLabel={item.label} onPress={() => router.push({ pathname: '/(tabs)/products', params: { ca_id: item.category } })}
          style={{ minHeight: 310, padding: 22, backgroundColor: item.color, borderRadius: 12, overflow: 'hidden' }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#397AA3', marginBottom: 20 }}>{item.tag}</Text>
          <Text style={{ fontSize: 30, lineHeight: 42, fontWeight: '900', color: '#18354B', zIndex: 1 }}>{item.title}</Text>
          <Text style={{ fontSize: 13, lineHeight: 21, color: '#47667C', marginTop: 12, maxWidth: '62%', zIndex: 1 }}>{item.note}</Text>
          <View style={{ alignSelf: 'flex-start', marginTop: 20, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#FFFFFF', borderRadius: 6, zIndex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#18354B' }}>{item.label} →</Text>
          </View>
          <Image source={{ uri: `https://seoulmono.com/api/product-image/${item.id}/${item.id}.jpg` }}
            style={{ width: 112, height: 155, position: 'absolute', right: 8, bottom: 20, borderRadius: 10 }} contentFit="contain" />
        </Pressable>
      </View>}
    />
    <Text style={{ textAlign: 'right', marginRight: 20, marginTop: 10, color: '#47667C', fontWeight: '700', fontSize: 12 }}>{String(active + 1).padStart(2, '0')} / {String(banners.length).padStart(2, '0')}</Text>
  </View>;
}
