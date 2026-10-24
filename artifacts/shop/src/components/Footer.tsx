import { useState, useEffect } from "react";
import { getFooterConfig, type FooterConfig } from "@/lib/api";
import {
  Truck, CreditCard, HelpCircle, MessageSquare, ShoppingCart,
  Eye, Search, Award, Clock
} from "lucide-react";
const BASE = import.meta.env.BASE_URL;

const DEFAULTS: FooterConfig = {
  company: "seoulmono",
  ceo: "김미희",
  address: "경기도 양주시 화합로1710번길 12, B218호(옥정동, 양주옥정 듀클래스 I)",
  business_num: "597-51-00016",
  tel: "010-2051-5692",
  online_num: "2024-서울중랑-1470",
  privacy: "김미희",
  cs_tel: "010-2051-5692",
  cs_hours: "평일 10:00 ~ 18:00",
  cs_lunch: "점심시간 : 12:00 ~ 13:00 일요일/공휴일 휴무",
  bank_name: "",
  bank_num: "",
  bank_holder: "",
};

function QuickMenu() {
  const menuItems = [
    { icon: Truck, label: "주문/배송", href: `${BASE}mypage` },
    { icon: CreditCard, label: "결제안내", href: `${BASE}cs` },
    { icon: HelpCircle, label: "FAQ", href: `${BASE}faq` },
    { icon: MessageSquare, label: "1:1 문의", href: `${BASE}cs` },
    { icon: ShoppingCart, label: "장바구니", href: `${BASE}cart` },
    { icon: Eye, label: "최근상품", href: `${BASE}list` },
    { icon: Search, label: "상품찾기", href: `${BASE}search` },
    { icon: Award, label: "베스트", href: `${BASE}products?sort=popular` },
  ];
  return (
    <div>
      <h3 className="text-sm font-bold mb-4">Quick Menu</h3>
      <div className="grid grid-cols-4 gap-2">
        {menuItems.map(item => (
          <a
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-accent transition-colors group text-center no-underline"
          >
            <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
              <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
              {item.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function CSCenter({ cfg }: { cfg: FooterConfig }) {
  return (
    <div>
      <h3 className="text-sm font-bold mb-4">CS Center</h3>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">고객상담</p>
            <a
              href="mailto:cs@seoulmono.com"
              className="text-lg sm:text-xl font-bold text-foreground hover:text-primary transition-colors break-all no-underline"
            >
              cs@seoulmono.com
            </a>
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">결제안내</p>
            <p className="text-sm font-medium">신용/체크 카드결제 가능합니다.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 pt-3 border-t border-border/60">
          <div className="flex-1">
            <p className="text-xs font-semibold mb-1.5">· 상담안내</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{cfg.cs_hours}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{cfg.cs_lunch}</p>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold mb-1.5">· 주문마감시간</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xl font-bold">10:00</span>
                <span className="text-xs text-muted-foreground">AM</span>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                <p>평일오전 10시까지</p>
                <p>주문시 당일 출고 요청됩니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  const [cfg, setCfg] = useState<FooterConfig>(DEFAULTS);

  useEffect(() => {
    getFooterConfig().then(d => setCfg(d)).catch(() => {});
  }, []);

  return (
    <footer className="bg-secondary/50 border-t border-border/60 mt-auto">
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <QuickMenu />
          <CSCenter cfg={cfg} />
        </div>
      </div>

      {/* Business info */}
      <div className="border-t border-border/60">
        <div className="container py-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-4">
              <a href={`${BASE}cs`} className="hover:text-foreground transition-colors">이용안내</a>
              <span className="text-border">/</span>
              <a href={`${BASE}cs`} className="hover:text-foreground transition-colors">문의하기</a>
              <span className="text-border">/</span>
              <a href={`${BASE}notice`} className="hover:text-foreground transition-colors">공지사항</a>
              <span className="text-border">/</span>
              <a href={`${BASE}privacy`} className="hover:text-foreground transition-colors">개인정보처리방침</a>
              <span className="text-border">/</span>
              <a href={`${BASE}terms`} className="hover:text-foreground transition-colors">이용약관</a>
              <span className="text-border">/</span>
              <a href={`${BASE}tokushoho`} className="hover:text-foreground transition-colors">特定商取引法に基づく表記</a>
            </div>
            <p className="text-[11px] text-muted-foreground">&copy; 2025 seoulmono. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
