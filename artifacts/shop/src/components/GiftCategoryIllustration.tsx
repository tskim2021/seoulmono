const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export type GiftCaId = "10" | "20" | "30" | string;

export const CAT_META: Record<string, {
  grad: string; accent: string; accent2: string;
  label: string; sub: string; tag: string;
}> = {
  "10": {
    grad: "linear-gradient(135deg,#f6a623 0%,#f05a28 100%)",
    accent: "#c05621", accent2: "#f6ad55",
    label: "お菓子ギフトセット", sub: "甘いお菓子のギフト", tag: "SNACK",
  },
  "20": {
    grad: "linear-gradient(135deg,#2d9e6b 0%,#1a6b3c 100%)",
    accent: "#047857", accent2: "#34d399",
    label: "油脂ギフトセット", sub: "健康的なオイルのギフト", tag: "OIL",
  },
  "30": {
    grad: "linear-gradient(135deg,#1e4db7 0%,#2176ae 100%)",
    accent: "#1e40af", accent2: "#60a5fa",
    label: "缶詰ギフトセット", sub: "頼れる缶詰のギフト", tag: "CAN",
  },
};

/* ── 과자류 배너 ── 선물박스 + 과자 3종 */
function SnackBanner() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 배경 장식 원 */}
      <circle cx="320" cy="30" r="80" fill="rgba(255,255,255,0.08)" />
      <circle cx="20" cy="180" r="60" fill="rgba(255,255,255,0.07)" />
      <circle cx="160" cy="-10" r="50" fill="rgba(255,255,255,0.06)" />

      {/* 리본 (가로) */}
      <rect x="0" y="88" width="360" height="14" fill="rgba(255,255,255,0.22)" />
      <rect x="0" y="93" width="360" height="4" fill="rgba(255,255,255,0.35)" />

      {/* 리본 (세로) - 세 박스 위 각각 */}
      <rect x="72" y="0" width="14" height="200" fill="rgba(255,255,255,0.18)" />
      <rect x="77" y="0" width="4" height="200" fill="rgba(255,255,255,0.30)" />
      <rect x="172" y="0" width="14" height="200" fill="rgba(255,255,255,0.18)" />
      <rect x="177" y="0" width="4" height="200" fill="rgba(255,255,255,0.30)" />
      <rect x="272" y="0" width="14" height="200" fill="rgba(255,255,255,0.18)" />
      <rect x="277" y="0" width="4" height="200" fill="rgba(255,255,255,0.30)" />

      {/* 박스 1 - 꼬북칩 스타일 */}
      <rect x="18" y="30" width="108" height="140" rx="12" fill="rgba(255,255,255,0.92)" />
      <rect x="18" y="30" width="108" height="52" rx="12" fill="#FFD166" />
      <rect x="18" y="68" width="108" height="14" fill="#FFD166" />
      <rect x="26" y="38" width="92" height="36" rx="6" fill="rgba(255,255,255,0.35)" />
      <text x="72" y="62" textAnchor="middle" fontSize="13" fontWeight="900" fill="#c05621" fontFamily="sans-serif">コブクチップ</text>
      <rect x="26" y="96" width="92" height="62" rx="8" fill="#fff8f0" />
      <text x="72" y="117" textAnchor="middle" fontSize="9" fontWeight="700" fill="#888" fontFamily="sans-serif">オリジナル</text>
      <text x="72" y="131" textAnchor="middle" fontSize="10" fontWeight="800" fill="#c05621" fontFamily="sans-serif">65g × 3袋</text>
      <text x="72" y="148" textAnchor="middle" fontSize="8" fontWeight="600" fill="#bbb" fontFamily="sans-serif">ORION</text>
      <ellipse cx="72" cy="172" rx="44" ry="6" fill="rgba(0,0,0,0.10)" />

      {/* 박스 2 - 먹뚜 스타일 (가운데, 약간 더 큼) */}
      <rect x="120" y="18" width="120" height="158" rx="14" fill="rgba(255,255,255,0.95)" />
      <rect x="120" y="18" width="120" height="58" rx="14" fill="#EF8C00" />
      <rect x="120" y="62" width="120" height="14" fill="#EF8C00" />
      <rect x="130" y="26" width="100" height="42" rx="8" fill="rgba(255,255,255,0.30)" />
      <text x="180" y="55" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fff" fontFamily="sans-serif">モクトゥトゥ</text>
      <rect x="130" y="90" width="100" height="70" rx="8" fill="#fff8f0" />
      <text x="180" y="112" textAnchor="middle" fontSize="9" fontWeight="700" fill="#888" fontFamily="sans-serif">もちもち菓子</text>
      <text x="180" y="127" textAnchor="middle" fontSize="11" fontWeight="900" fill="#EF8C00" fontFamily="sans-serif">80g × 3袋</text>
      <text x="180" y="143" textAnchor="middle" fontSize="8" fontWeight="600" fill="#bbb" fontFamily="sans-serif">LOTTE</text>
      <ellipse cx="180" cy="180" rx="50" ry="7" fill="rgba(0,0,0,0.12)" />

      {/* 박스 3 - 나바티 스타일 */}
      <rect x="234" y="30" width="108" height="140" rx="12" fill="rgba(255,255,255,0.92)" />
      <rect x="234" y="30" width="108" height="52" rx="12" fill="#FF7B2C" />
      <rect x="234" y="68" width="108" height="14" fill="#FF7B2C" />
      <rect x="242" y="38" width="92" height="36" rx="6" fill="rgba(255,255,255,0.30)" />
      <text x="288" y="62" textAnchor="middle" fontSize="13" fontWeight="900" fill="#fff" fontFamily="sans-serif">ナバティ</text>
      <rect x="242" y="96" width="92" height="62" rx="8" fill="#fff8f0" />
      <text x="288" y="117" textAnchor="middle" fontSize="9" fontWeight="700" fill="#888" fontFamily="sans-serif">チーズクリーム</text>
      <text x="288" y="131" textAnchor="middle" fontSize="10" fontWeight="800" fill="#FF7B2C" fontFamily="sans-serif">55g × 3袋</text>
      <text x="288" y="148" textAnchor="middle" fontSize="8" fontWeight="600" fill="#bbb" fontFamily="sans-serif">HAITAI</text>
      <ellipse cx="288" cy="172" rx="44" ry="6" fill="rgba(0,0,0,0.10)" />

      {/* 리본 매듭 - 박스 1 */}
      <circle cx="79" cy="95" r="11" fill="rgba(255,255,255,0.55)" />
      <circle cx="79" cy="95" r="6" fill="rgba(255,255,255,0.85)" />
      {/* 리본 매듭 - 박스 2 */}
      <circle cx="180" cy="95" r="13" fill="rgba(255,255,255,0.55)" />
      <circle cx="180" cy="95" r="7" fill="rgba(255,255,255,0.90)" />
      {/* 리본 매듭 - 박스 3 */}
      <circle cx="279" cy="95" r="11" fill="rgba(255,255,255,0.55)" />
      <circle cx="279" cy="95" r="6" fill="rgba(255,255,255,0.85)" />

      {/* 반짝이 장식 */}
      <circle cx="22" cy="22" r="3" fill="rgba(255,255,255,0.75)" />
      <circle cx="340" cy="40" r="2.5" fill="rgba(255,255,255,0.65)" />
      <circle cx="355" cy="160" r="3.5" fill="rgba(255,255,255,0.55)" />
      <circle cx="8" cy="140" r="2.5" fill="rgba(255,255,255,0.60)" />
      <text x="15" y="58" fontSize="14" fill="rgba(255,255,255,0.7)">✦</text>
      <text x="338" y="130" fontSize="11" fill="rgba(255,255,255,0.55)">✦</text>
      <text x="350" y="80" fontSize="9" fill="rgba(255,255,255,0.50)">✦</text>
    </svg>
  );
}

/* ── 유지류 배너 ── 기름병 3종 선물세트 */
function OilBanner() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 배경 원형 장식 */}
      <circle cx="310" cy="20" r="90" fill="rgba(255,255,255,0.07)" />
      <circle cx="30" cy="185" r="65" fill="rgba(255,255,255,0.06)" />
      <circle cx="180" cy="-15" r="55" fill="rgba(255,255,255,0.06)" />

      {/* 배경 리본 (가로) */}
      <rect x="0" y="84" width="360" height="14" fill="rgba(255,255,255,0.18)" />
      <rect x="0" y="89" width="360" height="4" fill="rgba(255,255,255,0.28)" />

      {/* 병 1 - 해표 카놀라유 */}
      <rect x="30" y="50" width="72" height="128" rx="14" fill="rgba(255,255,255,0.88)" />
      {/* 병 목 */}
      <rect x="44" y="36" width="44" height="18" rx="8" fill="rgba(255,255,255,0.80)" />
      <rect x="50" y="24" width="32" height="16" rx="6" fill="rgba(255,255,255,0.90)" />
      {/* 뚜껑 */}
      <rect x="56" y="14" width="20" height="13" rx="5" fill="#FFB800" />
      {/* 라벨 */}
      <rect x="36" y="70" width="60" height="88" rx="8" fill="#FDF6EE" />
      <rect x="36" y="70" width="60" height="28" rx="8" fill="#8B5E3C" />
      <rect x="36" y="86" width="60" height="12" fill="#8B5E3C" />
      <text x="66" y="88" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="sans-serif">ヘピョ</text>
      <text x="66" y="108" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#155e2f" fontFamily="sans-serif">キャノーラ油</text>
      <text x="66" y="121" textAnchor="middle" fontSize="8" fontWeight="600" fill="#8B5E3C" fontFamily="sans-serif">900ml</text>
      <text x="66" y="135" textAnchor="middle" fontSize="7" fontWeight="600" fill="#aaa" fontFamily="sans-serif">HAEPYO</text>
      {/* 기름 색상 표시 */}
      <ellipse cx="66" cy="148" rx="22" ry="7" fill="rgba(255,220,100,0.5)" />
      <ellipse cx="66" cy="180" rx="30" ry="5" fill="rgba(0,0,0,0.10)" />

      {/* 병 2 - 참기름 (중앙, 더 큼) */}
      <rect x="132" y="34" width="96" height="148" rx="16" fill="rgba(255,255,255,0.93)" />
      {/* 병 목 */}
      <rect x="150" y="18" width="60" height="20" rx="10" fill="rgba(255,255,255,0.82)" />
      <rect x="158" y="4" width="44" height="18" rx="7" fill="rgba(255,255,255,0.92)" />
      {/* 뚜껑 */}
      <rect x="168" y="0" width="24" height="8" rx="4" fill="#c0392b" />
      {/* 라벨 */}
      <rect x="138" y="56" width="84" height="110" rx="10" fill="#f5fff8" />
      <rect x="138" y="56" width="84" height="36" rx="10" fill="#1a8a50" />
      <rect x="138" y="80" width="84" height="12" fill="#1a8a50" />
      <text x="180" y="77" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" fontFamily="sans-serif">ソウルモノ</text>
      <text x="180" y="103" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0d5c2e" fontFamily="sans-serif">ごま油</text>
      <text x="180" y="117" textAnchor="middle" fontSize="9" fontWeight="700" fill="#8B5E3C" fontFamily="sans-serif">330ml × 3本</text>
      <text x="180" y="130" textAnchor="middle" fontSize="8" fontWeight="600" fill="#999" fontFamily="sans-serif">PREMIUM</text>
      {/* 골드 스티커 */}
      <circle cx="180" cy="148" r="16" fill="rgba(255,200,0,0.18)" />
      <text x="180" y="153" textAnchor="middle" fontSize="8" fontWeight="800" fill="#b8860b" fontFamily="sans-serif">ギフト用</text>
      <ellipse cx="180" cy="185" rx="40" ry="6" fill="rgba(0,0,0,0.11)" />

      {/* 병 3 - 들기름 */}
      <rect x="258" y="50" width="72" height="128" rx="14" fill="rgba(255,255,255,0.88)" />
      <rect x="272" y="36" width="44" height="18" rx="8" fill="rgba(255,255,255,0.80)" />
      <rect x="278" y="24" width="32" height="16" rx="6" fill="rgba(255,255,255,0.90)" />
      <rect x="285" y="14" width="18" height="13" rx="5" fill="#8e44ad" />
      <rect x="264" y="70" width="60" height="88" rx="8" fill="#f5fff8" />
      <rect x="264" y="70" width="60" height="28" rx="8" fill="#6c3483" />
      <rect x="264" y="86" width="60" height="12" fill="#6c3483" />
      <text x="294" y="88" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="sans-serif">オットギ</text>
      <text x="294" y="108" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#4a235a" fontFamily="sans-serif">えごま油</text>
      <text x="294" y="121" textAnchor="middle" fontSize="8" fontWeight="600" fill="#7d3c98" fontFamily="sans-serif">900ml</text>
      <text x="294" y="135" textAnchor="middle" fontSize="7" fontWeight="600" fill="#aaa" fontFamily="sans-serif">OTTOGI</text>
      <ellipse cx="294" cy="148" rx="22" ry="7" fill="rgba(180,120,255,0.3)" />
      <ellipse cx="294" cy="180" rx="30" ry="5" fill="rgba(0,0,0,0.10)" />

      {/* 리본 매듭 */}
      <circle cx="66" cy="91" r="10" fill="rgba(255,255,255,0.50)" />
      <circle cx="66" cy="91" r="5.5" fill="rgba(255,255,255,0.82)" />
      <circle cx="180" cy="91" r="13" fill="rgba(255,255,255,0.52)" />
      <circle cx="180" cy="91" r="7" fill="rgba(255,255,255,0.88)" />
      <circle cx="294" cy="91" r="10" fill="rgba(255,255,255,0.50)" />
      <circle cx="294" cy="91" r="5.5" fill="rgba(255,255,255,0.82)" />

      {/* 잎사귀 장식 */}
      <text x="18" y="50" fontSize="18" fill="rgba(255,255,255,0.55)">🌿</text>
      <text x="330" y="155" fontSize="16" fill="rgba(255,255,255,0.45)">🌿</text>

      {/* 반짝이 */}
      <circle cx="20" cy="20" r="3" fill="rgba(255,255,255,0.75)" />
      <circle cx="345" cy="30" r="2.5" fill="rgba(255,255,255,0.65)" />
      <text x="345" y="110" fontSize="11" fill="rgba(255,255,255,0.50)">✦</text>
      <text x="10" y="135" fontSize="10" fill="rgba(255,255,255,0.48)">✦</text>
    </svg>
  );
}

/* ── 캔통조림 배너 ── 캔 3종 선물세트 */
function CanBanner() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 배경 */}
      <circle cx="305" cy="18" r="85" fill="rgba(255,255,255,0.07)" />
      <circle cx="25" cy="185" r="60" fill="rgba(255,255,255,0.06)" />

      {/* 리본 가로 */}
      <rect x="0" y="90" width="360" height="14" fill="rgba(255,255,255,0.20)" />
      <rect x="0" y="95" width="360" height="4" fill="rgba(255,255,255,0.32)" />

      {/* 캔 1 - 동원 참치 */}
      {/* 캔 몸통 */}
      <rect x="22" y="52" width="88" height="124" rx="10" fill="rgba(255,255,255,0.90)" />
      {/* 캔 위 덮개 */}
      <ellipse cx="66" cy="52" rx="44" ry="12" fill="rgba(220,230,250,0.90)" />
      <ellipse cx="66" cy="52" rx="38" ry="9" fill="rgba(200,215,245,0.80)" />
      {/* 캔 아래 */}
      <ellipse cx="66" cy="176" rx="44" ry="11" fill="rgba(180,200,235,0.70)" />
      {/* 라벨 */}
      <rect x="26" y="70" width="80" height="88" rx="4" fill="#1a4fa0" />
      <rect x="26" y="70" width="80" height="32" rx="4" fill="#0d3278" />
      <text x="66" y="90" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#fff" fontFamily="sans-serif">トンウォン</text>
      <text x="66" y="103" textAnchor="middle" fontSize="8" fontWeight="600" fill="#a0c4ff" fontFamily="sans-serif">DONGWON</text>
      <rect x="30" y="108" width="72" height="1.5" fill="rgba(255,255,255,0.25)" />
      <text x="66" y="125" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff" fontFamily="sans-serif">ツナ(赤身)</text>
      <text x="66" y="140" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#a0c4ff" fontFamily="sans-serif">85g × 18缶</text>
      <text x="66" y="153" textAnchor="middle" fontSize="8" fontWeight="600" fill="rgba(255,255,255,0.55)" fontFamily="sans-serif">TUNA</text>
      {/* 캔 고리 */}
      <ellipse cx="66" cy="44" rx="14" ry="4" fill="rgba(180,200,230,0.90)" />
      <rect x="60" y="36" width="12" height="10" rx="3" fill="rgba(160,185,225,0.85)" />
      <ellipse cx="66" cy="188" rx="36" ry="5" fill="rgba(0,0,0,0.11)" />

      {/* 캔 2 - 오뚜기죽 (중앙, 더 큼) */}
      <rect x="128" y="36" width="104" height="144" rx="12" fill="rgba(255,255,255,0.93)" />
      <ellipse cx="180" cy="36" rx="52" ry="14" fill="rgba(255,230,180,0.90)" />
      <ellipse cx="180" cy="36" rx="44" ry="10" fill="rgba(255,220,150,0.85)" />
      <ellipse cx="180" cy="180" rx="52" ry="13" fill="rgba(240,200,130,0.70)" />
      {/* 라벨 */}
      <rect x="132" y="56" width="96" height="104" rx="5" fill="#f59e0b" />
      <rect x="132" y="56" width="96" height="38" rx="5" fill="#d97706" />
      <text x="180" y="79" textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff" fontFamily="sans-serif">オットギ</text>
      <text x="180" y="93" textAnchor="middle" fontSize="8" fontWeight="600" fill="rgba(255,255,255,0.75)" fontFamily="sans-serif">OTTOGI</text>
      <rect x="136" y="100" width="88" height="1.5" fill="rgba(255,255,255,0.30)" />
      <text x="180" y="118" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" fontFamily="sans-serif">かぼちゃ粥</text>
      <text x="180" y="133" textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(255,255,255,0.85)" fontFamily="sans-serif">285g × 6個</text>
      <text x="180" y="148" textAnchor="middle" fontSize="8" fontWeight="600" fill="rgba(255,255,255,0.60)" fontFamily="sans-serif">PORRIDGE</text>
      {/* 고리 */}
      <ellipse cx="180" cy="27" rx="16" ry="4.5" fill="rgba(240,200,130,0.90)" />
      <rect x="173" y="17" width="14" height="12" rx="3.5" fill="rgba(220,185,115,0.90)" />
      <ellipse cx="180" cy="195" rx="44" ry="6" fill="rgba(0,0,0,0.12)" />

      {/* 캔 3 - 스팸 / 런천미트 */}
      <rect x="250" y="52" width="88" height="124" rx="10" fill="rgba(255,255,255,0.90)" />
      <ellipse cx="294" cy="52" rx="44" ry="12" fill="rgba(255,210,210,0.90)" />
      <ellipse cx="294" cy="52" rx="38" ry="9" fill="rgba(255,195,195,0.82)" />
      <ellipse cx="294" cy="176" rx="44" ry="11" fill="rgba(235,185,185,0.70)" />
      {/* 라벨 */}
      <rect x="254" y="70" width="80" height="88" rx="4" fill="#c0392b" />
      <rect x="254" y="70" width="80" height="32" rx="4" fill="#922b21" />
      <text x="294" y="90" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" fontFamily="sans-serif">SPAM</text>
      <text x="294" y="103" textAnchor="middle" fontSize="8" fontWeight="600" fill="rgba(255,200,200,0.85)" fontFamily="sans-serif">クラシック</text>
      <rect x="258" y="108" width="72" height="1.5" fill="rgba(255,255,255,0.25)" />
      <text x="294" y="126" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff" fontFamily="sans-serif">ランチョンミート</text>
      <text x="294" y="141" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="rgba(255,200,200,0.90)" fontFamily="sans-serif">340g × 12缶</text>
      <text x="294" y="154" textAnchor="middle" fontSize="8" fontWeight="600" fill="rgba(255,255,255,0.55)" fontFamily="sans-serif">LUNCHEON</text>
      <ellipse cx="294" cy="40" rx="14" ry="4" fill="rgba(210,170,170,0.90)" />
      <rect x="288" y="30" width="12" height="12" rx="3" fill="rgba(195,155,155,0.88)" />
      <ellipse cx="294" cy="188" rx="36" ry="5" fill="rgba(0,0,0,0.11)" />

      {/* 리본 매듭 */}
      <circle cx="66" cy="97" r="11" fill="rgba(255,255,255,0.50)" />
      <circle cx="66" cy="97" r="6" fill="rgba(255,255,255,0.85)" />
      <circle cx="180" cy="97" r="13" fill="rgba(255,255,255,0.52)" />
      <circle cx="180" cy="97" r="7.5" fill="rgba(255,255,255,0.90)" />
      <circle cx="294" cy="97" r="11" fill="rgba(255,255,255,0.50)" />
      <circle cx="294" cy="97" r="6" fill="rgba(255,255,255,0.85)" />

      {/* 물고기/바다 장식 */}
      <text x="338" y="158" fontSize="18" fill="rgba(255,255,255,0.40)">🐟</text>
      <text x="6" y="58" fontSize="15" fill="rgba(255,255,255,0.42)">🐟</text>

      {/* 반짝이 */}
      <circle cx="20" cy="20" r="3" fill="rgba(255,255,255,0.75)" />
      <circle cx="342" cy="28" r="2.5" fill="rgba(255,255,255,0.65)" />
      <text x="348" y="80" fontSize="11" fill="rgba(255,255,255,0.48)">✦</text>
      <text x="8" y="140" fontSize="10" fill="rgba(255,255,255,0.48)">✦</text>
    </svg>
  );
}

interface Props {
  caId: GiftCaId;
  height?: number;
  showLogo?: boolean;
  showLabel?: boolean;
}

export default function GiftCategoryIllustration({
  caId,
  height = 180,
  showLogo = true,
  showLabel = false,
}: Props) {
  const meta = CAT_META[caId] ?? {
    grad: "linear-gradient(135deg,#a1c4fd,#c2e9fb)",
    accent: "#8B5E3C", accent2: "#34d399",
    label: "ギフトセット", sub: "心を込めたギフト", tag: "GIFT",
  };

  const Banner =
    caId === "10" ? SnackBanner :
    caId === "20" ? OilBanner :
    caId === "30" ? CanBanner :
    SnackBanner;

  return (
    <div style={{
      width: "100%",
      height,
      background: meta.grad,
      position: "relative",
      overflow: "hidden",
      display: "flex",
      alignItems: "stretch",
      flexShrink: 0,
    }}>
      <Banner />

      {showLogo && (
        <div style={{
          position: "absolute",
          top: 10,
          left: 12,
          zIndex: 4,
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(6px)",
          borderRadius: 20,
          padding: "4px 10px 4px 6px",
        }}>
          <img
            src={`${BASE}fogo_round.png`}
            alt="ソウルモノ"
            style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }}
          />
          <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.95)", letterSpacing: "0.02em" }}>
            ソウルモノ
          </span>
        </div>
      )}

      {showLabel && (
        <div style={{
          position: "absolute",
          bottom: 10,
          left: 12,
          zIndex: 4,
          background: meta.accent,
          color: "#fff",
          fontSize: 11,
          fontWeight: 800,
          borderRadius: 20,
          padding: "4px 11px",
          letterSpacing: "0.03em",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}>
          {meta.label}
        </div>
      )}
    </div>
  );
}
