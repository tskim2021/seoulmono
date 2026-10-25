import { parseDocument } from 'htmlparser2';

export type DescriptionBlock =
  | { type: 'text'; text: string; heading: boolean; bold: boolean }
  | { type: 'image'; uri: string; alt: string; ratio?: number }
  | { type: 'table'; rows: string[][] };
type HtmlNode = { type: string; name?: string; data?: string; attribs?: Record<string, string>; children?: HtmlNode[] };
const ignored = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'video', 'audio', 'noscript', 'head', 'svg']);
const paragraphs = new Set(['p', 'div', 'section', 'article', 'li', 'ul', 'ol', 'blockquote', 'header', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

export function descriptionImageUrl(value: string): string | undefined {
  if (!value.trim()) return;
  try {
    const url = new URL(value.trim(), 'https://seoulmono.com/');
    if (url.protocol !== 'https:' || url.username || url.password) return;
    return url.href;
  } catch { return; }
}

// HTML is parsed as data only; rendering uses React Native Text, View and Image.
export function descriptionBlocks(html: string): DescriptionBlock[] {
  const root = parseDocument(html || '', { decodeEntities: true });
  const blocks: DescriptionBlock[] = [];
  let text = '';
  let heading = false;
  let bold = false;
  const flush = () => {
    const normalized = text.replace(/[\t\r ]+/g, ' ').replace(/ *\n */g, '\n').trim();
    if (normalized) blocks.push({ type: 'text', text: normalized, heading, bold });
    text = ''; heading = false; bold = false;
  };
  function plain(node: HtmlNode): string {
    if (ignored.has(node.name || '')) return '';
    if (node.type === 'text') return node.data || '';
    if (node.name === 'br') return '\n';
    return (node.children || []).map(plain).join('');
  }
  function walk(node: HtmlNode, depth = 0) {
    if (depth > 80 || ignored.has(node.name || '')) return;
    if (node.type === 'text') { text += (node.data || '').replace(/\s+/g, ' '); return; }
    const name = node.name || '';
    if (name === 'br') { text += '\n'; return; }
    if (name === 'img') {
      flush();
      const attrs = node.attribs || {};
      const uri = descriptionImageUrl(attrs['data-src'] || attrs.src || '');
      if (!uri) return;
      const width = Number(attrs.width); const height = Number(attrs.height);
      blocks.push({ type: 'image', uri, alt: attrs.alt || '商品詳細画像', ratio: width > 0 && height > 0 ? width / height : undefined });
      return;
    }
    if (name === 'table') {
      const hasImage = (n: HtmlNode): boolean => n.name === 'img' || (n.children || []).some(hasImage);
      if (hasImage(node)) { flush(); (node.children || []).forEach(n => walk(n, depth + 1)); flush(); return; }
      flush();
      const rows: string[][] = [];
      function row(n: HtmlNode) {
        if (n.name === 'tr') {
          const cells = (n.children || []).filter(c => c.name === 'td' || c.name === 'th').map(c => plain(c).trim());
          if (cells.some(Boolean)) rows.push(cells);
        } else (n.children || []).forEach(row);
      }
      row(node);
      if (rows.length) blocks.push({ type: 'table', rows });
      return;
    }
    const paragraph = paragraphs.has(name);
    if (paragraph) flush();
    if (/^h[1-6]$/.test(name)) heading = true;
    if (name === 'strong' || name === 'b') bold = true;
    if (name === 'li') text += '• ';
    (node.children || []).forEach(n => walk(n, depth + 1));
    if (paragraph) flush();
  }
  (root.children as HtmlNode[]).forEach(node => walk(node));
  flush();
  return blocks;
}
