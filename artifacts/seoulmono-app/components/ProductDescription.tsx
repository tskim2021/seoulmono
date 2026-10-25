import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

// Product HTML is inert content. Only our size observer can run scripts.
export default function ProductDescription({ html }: { html?: string }) {
  const [height, setHeight] = useState(360);
  const [nonce] = useState(() => 'sm' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));
  const clean = (html || '').replace(/<(script|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '');
  if (!clean.trim()) return <Text style={{ color: '#526b7d', padding: 20 }}>商品説明は準備中です。</Text>;
  const document = `<!doctype html><html lang="ja"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'"><style>html,body{margin:0;padding:0;color:#172b3a;font:16px/1.7 -apple-system,sans-serif;overflow:hidden}img{max-width:100%!important;height:auto!important;display:block}table{max-width:100%;width:100%!important}*{box-sizing:border-box}p{margin:0 0 12px}a{color:#397aa3}</style></head><body><div id="content">${clean}</div><script nonce="${nonce}">function missing(img){img.style.display='none';const note=document.createElement('p');note.textContent='詳細画像を読み込めませんでした。';img.after(note);size();}document.querySelectorAll('img').forEach(img=>{img.addEventListener('error',()=>missing(img));if(img.complete&&!img.naturalWidth)missing(img);});function size(){window.ReactNativeWebView.postMessage(JSON.stringify({height:document.getElementById('content').scrollHeight}));}new ResizeObserver(size).observe(document.getElementById('content'));window.addEventListener('load',size);size();</script></body></html>`;
  return <View style={{ minHeight: height }}><WebView
    source={{ html: document, baseUrl: 'https://seoulmono.com/' }}
    style={{ height, backgroundColor: '#fff' }} scrollEnabled={false}
    originWhitelist={['https://seoulmono.com', 'about:blank']}
    onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url === 'https://seoulmono.com/'}
    onMessage={event => { try { const n = Number(JSON.parse(event.nativeEvent.data).height); if (Number.isFinite(n) && n > 0) setHeight(Math.min(n + 16, 60000)); } catch {} }}
  /></View>;
}
