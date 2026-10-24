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
                  alt="seoulmono 로고"
                  style={{ width: 88, height: 88, objectFit: "contain", borderRadius: "50%", background: "#fff", padding: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 13, color: "#8B5E3C", fontWeight: 600, letterSpacing: "0.1em" }}>좋은가격, 좋은상품</p>
                  <p style={{ margin: 0, fontSize: 36, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-1px", lineHeight: 1.1 }}>
                    seoulmono
                  </p>
                </div>
              </div>
              <h1 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.5px", lineHeight: 1.3 }}>
                seoulmono
              </h1>
              <p style={{ margin: 0, fontSize: 15, color: "#555", lineHeight: 1.7, maxWidth: 400 }}>
                좋은가격, 좋은상품을 고객에게 전달하기 위해<br/>
                매일 노력하는 seoulmono입니다.
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
                  alt="seoulmono 상품"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = "none";
                    const parent = el.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;color:#8B5E3C;opacity:0.6"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><span style="font-size:13px;font-weight:600">프리미엄 식품</span></div>`;
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
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.5px" }}>회사 소개</h2>
        </div>

        {/* 본문 */}
        <div style={{ maxWidth: 760, lineHeight: 1.95, color: "#444", fontSize: 15.5 }}>
          <p style={{ margin: "0 0 20px" }}>
            경기도 양주에서 설립된 <strong style={{ color: "#8B5E3C" }}>seoulmono</strong>은 식품 유통의 중심을 지키기 위해 탄생했습니다.
            우리는 언제나 품질, 진심, 신뢰의 중심에 있는 기업을 지향해 왔습니다.
          </p>
          <p style={{ margin: "0 0 20px" }}>
            빠르고 정확한 유통 시스템으로 서비스를 제공하고 있으며, 자사 PB상품 유통에 주력하여
            고객이 믿고 선택할 수 있는 프리미엄 유통 전문 기업으로 성장하였습니다.
            seoulmono은 단순한 유통을 넘어 <strong>좋은 상품을 합리적인 가격으로</strong> 고객에게 전달한다는
            사명감을 가지고 최선을 다하고 있습니다.
          </p>
          <p style={{ margin: "0 0 20px" }}>
            엄선된 브랜드 제품뿐만 아니라, 우리만의 철학이 담긴 PB상품 개발에도 앞장서며
            차별화된 경쟁력을 갖추고 있습니다.
          </p>
          <p style={{ margin: "0 0 20px" }}>
            seoulmono은 그동안 쌓아온 노하우와
            정확하고 신속한 유통 시스템으로 고객에게 서비스를 제공합니다.
            유통업의 새로운 기준을 만들고자 하는 seoulmono의 '유통의 끝 결국 고객의 신뢰'라는
            원칙을 증명해 나갑니다.
          </p>
          <p style={{ margin: 0, fontWeight: 600, color: "#1a1a1a" }}>
            오늘도 우리는 좋은가격, 좋은상품을 고객에게 전달하기 위하여 노력하겠습니다.<br/>
            감사합니다.
          </p>
        </div>
      </div>

      {/* ── 핵심 가치 ── */}
      <div style={{ background: "#f8faf9", borderTop: "1px solid #e8f0eb", borderBottom: "1px solid #e8f0eb" }}>
        <div className="page-wrap" style={{ paddingTop: 56, paddingBottom: 56 }}>

          <div style={{ marginBottom: 36, textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#8B5E3C", letterSpacing: "0.12em", textTransform: "uppercase" }}>Core Values</p>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>seoulmono의 핵심 가치</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {[
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
                title: "품질 보증",
                desc: "엄선된 프리미엄 제품만을 취급하며, 품질에 대한 책임을 다합니다.",
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                ),
                title: "빠른 유통",
                desc: "정확하고 신속한 유통 시스템으로 고객에게 신선하고 빠르게 전달합니다.",
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                ),
                title: "합리적 가격",
                desc: "좋은 상품을 가장 합리적인 가격으로 제공하는 것이 우리의 사명입니다.",
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                ),
                title: "고객 신뢰",
                desc: "유통의 끝은 결국 고객의 신뢰. 모든 과정에서 고객을 최우선으로 생각합니다.",
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
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>사업자 정보</h2>
        </div>

        <div style={{
          background: "#f8faf9", borderRadius: 16, border: "1px solid #e8f0eb",
          padding: "32px 36px",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "8px 40px",
        }}>
          {[
            ["법인명", "seoulmono"],
            ["대표이사", "김미희"],
            ["사업장 주소", "경기도 양주시 화합로1710번길 12, B218호(옥정동, 양주옥정 듀클래스 I)"],
            ["사업자등록번호", "597-51-00016"],
            ["전화번호", "010-2051-5692"],
            ["통신판매업 신고번호", "2024-서울중랑-1470"],
            ["개인정보 책임관리자", "김미희"],
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
