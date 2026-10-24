import { useLocation } from "wouter";
import { Home, Grid3X3, Award, Search, User } from "lucide-react";

const TABS = [
  { label: "홈", icon: Home, href: "/" },
  { label: "카테고리", icon: Grid3X3, href: "/category" },
  { label: "베스트", icon: Award, href: "/products?sort=popular" },
  { label: "검색", icon: Search, href: "/search" },
  { label: "마이", icon: User, href: "/mypage" },
];

export default function MobileBottomNav() {
  const [location, navigate] = useLocation();

  const isActive = (href: string) => {
    const base = href.split("?")[0];
    if (base === "/") return location === "/";
    return location.startsWith(base);
  };

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .mobile-bottom-nav { display: none !important; }
        }
        @media (max-width: 767px) {
          :root { --mobile-nav-height: calc(64px + env(safe-area-inset-bottom, 0px)); }
        }
      `}</style>

      <nav
        className="mobile-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderTop: "1px solid #efefef",
          display: "flex",
          alignItems: "flex-end",
          zIndex: 200,
          boxShadow: "0 -2px 16px rgba(0,0,0,0.07)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          height: "calc(64px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {TABS.map(({ label, icon: Icon, href }) => {
          const active = isActive(href);
          return (
            <button
              key={label}
              onClick={() => navigate(href)}
              style={{
                flex: 1,
                height: 64,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 3,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0 0 10px",
                position: "relative",
              }}
            >
              {active && (
                <span style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 24,
                  height: 2.5,
                  background: "#8B5E3C",
                  borderRadius: "0 0 3px 3px",
                }} />
              )}
              <Icon
                size={22}
                color={active ? "#8B5E3C" : "#bbb"}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span style={{
                fontSize: 10,
                fontWeight: active ? 700 : 400,
                color: active ? "#8B5E3C" : "#bbb",
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
