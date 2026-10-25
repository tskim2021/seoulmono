import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { descriptionBlocks } from '@/lib/description';

function DetailImage({ uri, alt, ratio: initialRatio }: { uri: string; alt: string; ratio?: number }) {
  const [ratio, setRatio] = useState(initialRatio || 1);
  const [failed, setFailed] = useState(false);
  if (failed) return <Text style={styles.notice}>詳細画像を読み込めませんでした。</Text>;
  return <Image source={{ uri }} accessibilityLabel={alt} contentFit="contain" cachePolicy="memory-disk"
    style={{ width: '100%', aspectRatio: ratio, backgroundColor: '#f5f8fa' }}
    onLoad={({ source }) => { if (source.width > 0 && source.height > 0) setRatio(source.width / source.height); }}
    onError={() => setFailed(true)} />;
}

export default function ProductDescription({ html }: { html?: string }) {
  const blocks = useMemo(() => descriptionBlocks(html || ''), [html]);
  if (!blocks.length) return <Text style={styles.notice}>商品説明は準備中です。</Text>;
  return <View testID="native-product-description" style={styles.root}>
    {blocks.map((block, index) => {
      if (block.type === 'image') return <DetailImage key={`${index}:${block.uri}`} {...block} />;
      if (block.type === 'table') return <ScrollView horizontal key={index} contentContainerStyle={styles.table}>
        <View>{block.rows.map((row, r) => <View key={r} style={styles.row}>
          {row.map((cell, c) => <Text selectable key={c} style={[styles.cell, r === 0 && styles.tableHeading]}>{cell}</Text>)}
        </View>)}</View>
      </ScrollView>;
      return <Text selectable key={index} style={[styles.text, block.heading && styles.heading, block.bold && styles.bold]}>{block.text}</Text>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  text: { color: '#172b3a', fontSize: 16, lineHeight: 27 },
  heading: { fontSize: 21, lineHeight: 31, fontWeight: '800', marginTop: 8 },
  bold: { fontWeight: '700' },
  notice: { color: '#526b7d', paddingVertical: 20, fontSize: 15 },
  table: { paddingVertical: 6 },
  row: { flexDirection: 'row' },
  cell: { width: 165, padding: 12, borderWidth: 0.5, borderColor: '#d5e1e9', color: '#172b3a', fontSize: 14, lineHeight: 23 },
  tableHeading: { backgroundColor: '#edf5fa', fontWeight: '700' },
});
