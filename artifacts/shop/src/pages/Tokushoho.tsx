const ROWS: { label: string; value: string[] }[] = [
  { label: "販売業者", value: ["株式会社KG Inicis Japan"] },
  { label: "責任者", value: ["キム・ジュンウ"] },
  { label: "住所", value: ["東京都港区新橋２丁目１番１０号"] },
  { label: "電話番号", value: ["03-6825-5531"] },
  { label: "メールアドレス", value: ["cs@seoulmono.com"] },
  { label: "ホームページ", value: ["https://seoulmono.com"] },
  { label: "サイト名", value: ["seoulmono"] },
  { label: "商品の販売価格", value: ["商品ごとに表示"] },
  { label: "商品以外の必要料金", value: [
    "配送料：3,000円（40,000円以上のご注文で送料無料）",
    "済州島・離島地域は追加配送料3,000円が発生する場合があります。",
  ] },
  { label: "支払方法", value: [
    "クレジットカード（NHN KCP 海外カード決済 / VISA・Mastercard・JCB）",
    "銀行振込（無通帳入金）",
  ] },
  { label: "支払時期", value: [
    "クレジットカード決済の場合、決済と同時に確定いたします。",
    "銀行振込の場合、ご入金確認後に処理されます。",
  ] },
  { label: "商品の引渡時期", value: [
    "ご注文確定後、通常1〜3営業日以内に発送いたします（土日・祝日を除く）。",
  ] },
  { label: "返品・交換", value: [
    "商品到着後7日以内にお申し出ください。商品の欠陥・不良または誤配送の場合は30日以内に受け付けます。",
    "お客様のご都合による返品の場合、使用済みまたは梱包が破損した商品、賞味期限が経過した食品、セット商品の一部のみの返品はお受けできません。",
    "返金は返送商品の確認後、2〜3営業日以内に処理されます。",
  ] },
];

export default function Tokushoho() {
  return (
    <div style={{ background: "#fff", minHeight: "60vh" }}>

      {/* 페이지 헤더 */}
      <div style={{ background: "#f8faf9", borderBottom: "1px solid #e8f0eb" }}>
        <div className="page-wrap" style={{ paddingTop: 40, paddingBottom: 40 }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#8B5E3C", letterSpacing: "0.12em", textTransform: "uppercase" }}>Legal</p>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.5px" }}>特定商取引法に基づく表記</h1>
          <p style={{ margin: 0, fontSize: 13, color: "#888" }}>
            seoulmono（seoulmono.com）における特定商取引法に基づく表示です。
          </p>
        </div>
      </div>

      <div className="page-wrap" style={{ paddingTop: 48, paddingBottom: 72 }}>
        <div style={{ maxWidth: 860 }}>
          <div style={{ border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
            {ROWS.map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  borderTop: i === 0 ? "none" : "1px solid #f0f0f0",
                  background: i % 2 === 0 ? "#fff" : "#fafafa",
                }}
              >
                <div style={{
                  flex: "0 0 200px",
                  padding: "16px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#8B5E3C",
                }}>
                  {row.label}
                </div>
                <div style={{ flex: "1 1 300px", padding: "16px 20px" }}>
                  {row.value.map((line, li) => (
                    <p key={li} style={{ margin: li === 0 ? 0 : "6px 0 0", fontSize: 14, color: "#333", lineHeight: 1.8 }}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
