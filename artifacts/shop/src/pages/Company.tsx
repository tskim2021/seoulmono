const BASE = import.meta.env.BASE_URL;

export default function Company() {
  return (
    <div style={{ background: "#fff", minHeight: "60vh" }}>

      {/* ── 히어로 배너 ── */}
      <div style={{
        background: "linear-gradient(135deg, #F2E4D0 0%, #c9ead8 50%, #b2dfc8 100%)",
        position: "relative", overflow: "hidden",
      }}>
        {/* 배경 패턴 */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.08 }} preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="cp" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="20" fill="none" stroke="#8B5E3C" strokeWidth="1.5"/>
              <circle cx="30" cy="30" r="8" fill="#8B5E3C"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cp)"/>
        </svg>

        <div className="page-wrap" style={{ position: "relative", zIndex: 1, paddingTop: 60, paddingBottom: 60 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>

            {/* 왼쪽: 브랜드 */}
            <div style={{ flex: "1 1 300px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
                <img
                  src={`${BASE}fogo_round.png`}
                  alt="ソウルモノ ロゴ"
                  style={{ width: 88, height: 88, objectFit: "contain", borderRadius: "50%", background: "#fff", padding: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 13, color: "#8B5E3C", fontWeight: 600, letterSpacing: "0.1em" }}>良い価格、良い商品</p>
                  <p style={{ margin: 0, fontSize: 36, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-1px", lineHeight: 1.1 }}>
                    ソウルモノ
                  </p>
                </div>
              </div>
              <h1 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.5px", lineHeight: 1.3 }}>
                ソウルモノ
              </h1>
              <p style={{ margin: 0, fontSize: 15, color: "#555", lineHeight: 1.7, maxWidth: 400 }}>
                良い価格、良い商品をお客様にお届けするために<br/>
                毎日努力を続けるソウルモノです。
              </p>
            </div>

            {/* 오른쪽: 제품 이미지 영역 */}
            <div style={{ flex: "0 0 auto", textAlign: "center" }}>
              <div style={{
                width: 280, height: 200,
                background: "rgba(255,255,255,0.5)",
                borderRadius: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
                overflow: "hidden",
              }}>
                <img
                  src={`${BASE}cat_40.png`}
                  alt="ソウルモノ 商品"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = "none";
                    const parent = el.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;color:#8B5E3C;opacity:0.6"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><span style="font-size:13px;font-weight:600">プレミアム食品</span></div>`;
                    }
                  }}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── 회사 스토리 ── */}
      <div className="page-wrap" style={{ paddingTop: 64, paddingBottom: 64 }}>

        {/* 섹션 타이틀 */}
        <div style={{ marginBottom: 40, borderLeft: "4px solid #8B5E3C", paddingLeft: 18 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#8B5E3C", letterSpacing: "0.12em", textTransform: "uppercase" }}>Our Story</p>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.5px" }}>会社紹介</h2>
        </div>

        {/* 본문 */}
        <div style={{ maxWidth: 760, lineHeight: 1.95, color: "#444", fontSize: 15.5 }}>
          <p style={{ margin: "0 0 20px" }}>
            韓国・京畿道楊州市で設立された<strong style={{ color: "#8B5E3C" }}>ソウルモノ</strong>は、食品流通の中心を担うために誕生しました。
            私たちは常に、品質・誠意・信頼を何よりも大切にする企業を目指してきました。
          </p>
          <p style={{ margin: "0 0 20px" }}>
            迅速かつ正確な流通システムでサービスを提供し、自社PB商品の流通に注力して、
            お客様に安心してお選びいただけるプレミアム流通専門企業へと成長しました。
            ソウルモノは単なる流通を超えて、<strong>良い商品を適正な価格で</strong>お客様にお届けするという
            使命感を持って全力を尽くしています。
          </p>
          <p style={{ margin: "0 0 20px" }}>
            厳選されたブランド製品だけでなく、私たちならではの哲学を込めたPB商品の開発にも率先して取り組み、
            差別化された競争力を備えています。
          </p>
          <p style={{ margin: "0 0 20px" }}>
            ソウルモノはこれまで培ってきたノウハウと、
            正確で迅速な流通システムでお客様にサービスを提供します。
            流通業の新しい基準を創ろうとするソウルモノの「流通の終着点は、結局お客様の信頼」という
            原則を証明してまいります。
          </p>
          <p style={{ margin: 0, fontWeight: 600, color: "#1a1a1a" }}>
            本日も私たちは、良い価格、良い商品をお客様にお届けするために努力してまいります。<br/>
            ありがとうございます。
          </p>
        </div>
      </div>

      {/* ── 핵심 가치 ── */}
      <div style={{ background: "#f8faf9", borderTop: "1px solid #e8f0eb", borderBottom: "1px solid #e8f0eb" }}>
        <div className="page-wrap" style={{ paddingTop: 56, paddingBottom: 56 }}>

          <div style={{ marginBottom: 36, textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#8B5E3C", letterSpacing: "0.12em", textTransform: "uppercase" }}>Core Values</p>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>ソウルモノの価値観</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {[
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
                title: "品質保証",
                desc: "厳選されたプレミアム製品のみを取り扱い、品質に責任を持ちます。",
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                ),
                title: "スピーディーな流通",
                desc: "正確で迅速な流通システムで、新鮮な商品をすばやくお届けします。",
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                ),
                title: "適正な価格",
                desc: "良い商品を最も適正な価格で提供することが私たちの使命です。",
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                ),
                title: "お客様の信頼",
                desc: "流通の終着点は結局お客様の信頼。すべての過程でお客様を最優先に考えます。",
              },
            ].map((v, i) => (
              <div key={i} style={{
                background: "#fff",
                borderRadius: 16,
                padding: "28px 24px",
                border: "1px solid #e8f0eb",
                boxShadow: "0 2px 12px rgba(29,138,90,0.06)",
                display: "flex", flexDirection: "column", gap: 12,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: "#F2E4D0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {v.icon}
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>{v.title}</h3>
                <p style={{ margin: 0, fontSize: 13.5, color: "#666", lineHeight: 1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 사업자 정보 ── */}
      <div className="page-wrap" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div style={{ marginBottom: 28, borderLeft: "4px solid #8B5E3C", paddingLeft: 18 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#8B5E3C", letterSpacing: "0.12em", textTransform: "uppercase" }}>Company Info</p>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>事業者情報</h2>
        </div>

        <div style={{
          background: "#f8faf9", borderRadius: 16, border: "1px solid #e8f0eb",
          padding: "32px 36px",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "8px 40px",
        }}>
          {[
            ["法人名", "ソウルモノ"],
            ["代表取締役", "キム・ミヒ"],
            ["事業所所在地", "韓国 京畿道 楊州市 和合路1710番キル12 B218号（玉井洞・楊州玉井デュクラスI）"],
            ["事業者登録番号", "597-51-00016"],
            ["電話番号", "010-2051-5692"],
            ["通信販売業届出番号", "2024-서울중랑-1470"],
            ["個人情報管理責任者", "キム・ミヒ"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid #eef3ef" }}>
              <span style={{ fontSize: 13, color: "#888", fontWeight: 600, whiteSpace: "nowrap", minWidth: 130 }}>{label}</span>
              <span style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
