/* seoulmono: header + hero redesign layer (2026-10-17). Standalone: does not touch the React bundle.
   Rollback: remove the <script src="/sorosoro-moa.js"> tag from index.html. */
(function () {
  "use strict";
  if (window.__moaLayout) return;
  window.__moaLayout = true;

  window.__seoulmonoLogoHtml = logoHtml;

  var TOKEN_KEY = "allddaom_token";
  var CATEGORIES = [
    { id: "200", name: "サプリメント", sub: "毎日の健康習慣に" },
    { id: "190", name: "ビタミン", sub: "ビタミン・ミネラル" },
    { id: "210", name: "乳酸菌", sub: "うれしい腸活サポート" },
    { id: "220", name: "スリミング・インナービューティー", sub: "内側から整える" }
  ];
  var NAV = [
    { label: "ホーム", href: "/" },
    { label: "新着商品", href: "/products?sort=new" },
    { label: "ランキング", href: "/products?sort=popular" },
    { label: "おすすめ商品", href: "/products?sort=recommended" },
    { label: "イベント", href: "/events" },
    { label: "レビュー", href: "/reviews" },
    { label: "商品Q&A", href: "/product-qna" }
  ];
  var IMG = function (id) { return "/api/product-image/" + id + "/" + id + ".jpg"; };
  var SLIDES = [
    {
      eyebrow: "ソウルモノ セレクション",
      title: ["韓国のいいもの。", "毎日の定番に。"],
      text: ["人気のサプリメントを", "ランキング上位からまとめました。"],
      cta: "サプリメントを見る", href: "/list?ca_id=200",
      bg: "#397aa3",
      imgs: ["1785119643", "1785119646", "1785119648"]
    },
    {
      eyebrow: "毎日のビタミン習慣",
      title: ["忙しい日こそ、", "ビタミンでチャージ"],
      text: ["続けやすい、ビタミン・ミネラルの", "定番アイテムをセレクト。"],
      cta: "ビタミンを見る", href: "/list?ca_id=190",
      bg: "#1047BD",
      imgs: ["1785119101", "1785119099", "1785119103"]
    },
    {
      eyebrow: "内側から、すこやかに",
      title: ["内側から整える、", "韓国のインナーケア"],
      text: ["乳酸菌とスリミングサポートの", "人気アイテムを集めました。"],
      cta: "乳酸菌を見る", href: "/list?ca_id=210",
      bg: "#083E97",
      imgs: ["1785120600", "1785120605", "1785120932"]
    }
  ];
  var CARDS = [
    { eyebrow: "BEAUTY PICK", title: ["内側から叶える", "うるおい習慣"], link: "インナービューティー", href: "/list?ca_id=220", bg: "#E9E3F8", img: "1785120929" },
    { eyebrow: "SMART CHOICE", title: ["毎日に、ひとさじの", "元気をプラス"], link: "ビタミンセレクション", href: "/list?ca_id=190", bg: "#DDEBE6", img: "1785119103" }
  ];

  var QUICK = [
    { label: "今日の特価", href: "/todaydeal", emoji: "⚡", bg: "#FFF0E4", hot: true },
    { label: "ランキング", href: "/products?sort=popular", emoji: "🏆", bg: "#FFF6D9" },
    { label: "新着商品", href: "/products?sort=new", emoji: "✨", bg: "#EEE9FB" },
    { label: "サプリメント", href: "/list?ca_id=200", emoji: "💊", bg: "#FDE9EE" },
    { label: "ビタミン", href: "/list?ca_id=190", emoji: "🍊", bg: "#FFEFD9" },
    { label: "乳酸菌", href: "/list?ca_id=210", emoji: "🥛", bg: "#E8F2F8" },
    { label: "インナーケア", href: "/list?ca_id=220", emoji: "🌸", bg: "#FCE8F1" },
    { label: "おすすめ商品", href: "/products?sort=recommended", emoji: "👍", bg: "#E7F4EC" },
    { label: "イベント", href: "/events", emoji: "🎁", bg: "#FDE8EA" },
    { label: "お気に入り", href: "/mypage?section=wishlist", emoji: "", heart: true, bg: "#E4F3EE", auth: true }
  ];

  var ICON = {
    search: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.4 3.4 4.2 6.7-1.7 4.7-9.2 9.3-9.2 9.3Z"/></svg>',
    bag: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    user: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/></svg>',
    menu: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    out: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m5 5 14 14M19 5 5 19"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>',
    prev: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 4.5v15l12-7.5-12-7.5Z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>'
  };

  var CSS = [
    "@media (min-width:768px){#sorosoro-topbar{display:none!important}header.sticky[data-ssr-header-border]{display:none!important}}",
    "@media (max-width:767px){#moa-header{display:none!important}}",
    "body.moa-fail #sorosoro-topbar{display:block!important}body.moa-fail header.sticky[data-ssr-header-border]{display:block!important}",
    "#moa-header{display:contents}",
    "main>[data-moa-rv]{order:2}body.moa-home main>[data-moa-notice]{order:3}",
    "body.moa-home main>[data-moa-notice] .grid>*:first-child{display:none}body.moa-home main>[data-moa-notice] .grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}",
    "#moa-reviews{padding:64px 0 28px;background:#fff;color:#17142B}",
    ".moa-rv-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}",
    ".moa-rv-eyebrow{font-size:13px;font-weight:800;letter-spacing:.22em;color:var(--moa-p);margin:0}",
    ".moa-rv-title{font-size:clamp(26px,2.8vw,40px);font-weight:800;margin:12px 0 14px;display:flex;align-items:center;gap:12px;line-height:1.25;letter-spacing:-.01em}",
    ".moa-rv-title svg{flex:0 0 auto;color:#3C6BF0}",
    ".moa-rv-sub{color:var(--moa-mut);font-size:16px;margin:0}",
    ".moa-rv-all{font-weight:800;font-size:16px;display:inline-flex;align-items:center;gap:8px;white-space:nowrap;color:#17142B!important}",
    ".moa-rv-all:hover{color:var(--moa-p)!important}",
    ".moa-rv-tools{display:flex;justify-content:space-between;align-items:center;margin:30px 0 24px;gap:12px}",
    ".moa-pill{height:54px;padding:0 28px;border-radius:999px;background:#17142B;color:#fff;font-weight:700;font-size:17px;display:inline-flex;align-items:center}",
    ".moa-rv-note{font-size:14px;color:var(--moa-mut)}",
    ".moa-rv-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px}",
    ".moa-rv-card{display:flex;flex-direction:column;border:1px solid var(--moa-line);border-radius:26px;overflow:hidden;background:#fff;color:#17142B!important;transition:transform .25s,box-shadow .25s}",
    ".moa-rv-card:hover{transform:translateY(-6px);box-shadow:0 18px 40px rgba(60,40,120,.14)}",
    ".moa-rv-img{position:relative;aspect-ratio:1/.92;background:#F1EFF7;overflow:hidden}",
    ".moa-rv-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s}",
    ".moa-rv-card:hover .moa-rv-img img{transform:scale(1.05)}",
    ".moa-rv-badge{position:absolute;left:16px;top:16px;background:#fff;border-radius:10px;padding:8px 14px;font-weight:800;font-size:12px;letter-spacing:.08em;color:#17142B;box-shadow:0 2px 8px rgba(0,0,0,.08)}",
    ".moa-rv-badge.is-sample{background:#FFF1D6;color:#8A5200}",
    ".moa-rv-go{position:absolute;right:16px;bottom:16px;width:46px;height:46px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.14)}",
    ".moa-rv-body{padding:24px 26px 8px;display:flex;flex-direction:column;gap:12px;flex:1}",
    ".moa-rv-meta{display:flex;justify-content:space-between;align-items:center;font-size:14px;color:var(--moa-mut)}",
    ".moa-rv-stars{color:#FFB400;letter-spacing:2px;font-size:19px;line-height:1}",
    ".moa-rv-h{font-size:20px;font-weight:800;line-height:1.4;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
    ".moa-rv-text{font-size:15px;line-height:1.75;color:#5B5873;margin:0;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}",
    ".moa-rv-who{font-size:13px;color:#9A97AE}",
    ".moa-rv-prod{display:flex;align-items:center;gap:12px;margin:14px 26px 22px;padding-top:16px;border-top:1px solid var(--moa-line);font-size:14px;font-weight:600}",
    ".moa-rv-prod img{width:54px;height:54px;border-radius:12px;object-fit:cover;flex:0 0 auto;background:#F1EFF7}",
    ".moa-rv-prod span{flex:1;min-width:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.4}",
    ".moa-rv-foot{margin:18px 0 0;font-size:12.5px;color:#9A97AE}",
    "@media (max-width:1023px){.moa-rv-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}",
    "@media (max-width:767px){#moa-reviews{padding:40px 0 16px}.moa-rv-head{flex-direction:column;align-items:flex-start;gap:14px}.moa-rv-title{font-size:25px;margin:8px 0 10px}.moa-rv-title svg{width:24px;height:24px}.moa-rv-sub{font-size:13px}.moa-rv-all{font-size:13px}.moa-rv-tools{margin:18px 0 16px}.moa-pill{height:42px;padding:0 20px;font-size:14px}.moa-rv-note{font-size:12px}.moa-rv-grid{display:grid;grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:80%;overflow-x:auto;scroll-snap-type:x mandatory;gap:14px;margin:0 -14px;padding:0 14px 14px;scrollbar-width:none}.moa-rv-grid::-webkit-scrollbar{display:none}.moa-rv-card{scroll-snap-align:start;border-radius:22px}.moa-rv-body{padding:18px 20px 4px}.moa-rv-h{font-size:17px}.moa-rv-prod{margin:12px 20px 18px}body.moa-home main>[data-moa-notice] .grid{grid-template-columns:1fr!important}}",
    "main [data-moa-wide]{margin-right:calc(-1 * var(--moa-ext,0px))}main section[data-moa-wide] [class*=grid-cols]{grid-template-columns:repeat(6,minmax(0,1fr))!important}main section[data-moa-wide] [class*=grid-cols]>*:nth-child(n+7){display:none!important}",
    ".moa-m-logo>img{display:none!important}.moa-m-logo .moa-logo-art{height:var(--moa-mh,44px)}",
    ".moa-mascot{animation:moa-bob 3.2s ease-in-out infinite;transform-origin:50% 90%}.moa-logo:hover .moa-mascot{animation:moa-hop .7s ease both}@keyframes moa-bob{0%,100%{transform:translateY(0) rotate(-3.2deg)}50%{transform:translateY(-11%) rotate(3.2deg)}}@keyframes moa-hop{0%{transform:translateY(0) scale(1,1)}28%{transform:translateY(-34%) scale(.94,1.08)}52%{transform:translateY(0) scale(1.1,.9)}72%{transform:translateY(-10%) scale(.98,1.03)}100%{transform:translateY(0) scale(1,1)}}.moa-star{transform-box:fill-box;transform-origin:center;animation:moa-twinkle 3.4s ease-in-out infinite}.moa-star.s2{animation:moa-twinkle2 2.9s ease-in-out .6s infinite}@keyframes moa-twinkle{0%,100%{transform:translate(0,0) scale(1) rotate(0);opacity:1}25%{transform:translate(-34px,-46px) scale(1.3) rotate(40deg);opacity:1}50%{transform:translate(14px,-72px) scale(.5) rotate(95deg);opacity:.5}75%{transform:translate(46px,-22px) scale(1.2) rotate(150deg);opacity:1}}@keyframes moa-twinkle2{0%,100%{transform:translate(0,0) scale(1) rotate(0);opacity:1}30%{transform:translate(30px,40px) scale(1.35) rotate(-45deg);opacity:1}60%{transform:translate(-26px,56px) scale(.5) rotate(-110deg);opacity:.5}80%{transform:translate(-40px,12px) scale(1.15) rotate(-160deg);opacity:1}}.moa-blink{transform-box:fill-box;transform-origin:center;animation:moa-blink 5.2s infinite}@keyframes moa-blink{0%,91%,100%{transform:scaleY(1)}94%{transform:scaleY(.08)}97%{transform:scaleY(1)}}@media (prefers-reduced-motion:reduce){.moa-mascot,.moa-star,.moa-blink{animation:none!important}}",
    "body.moa-home main{display:flex;flex-direction:column}body.moa-home main>[data-moa-strip]{order:1;border-top:1px solid #EAE7F2}body.moa-home main>[data-moa-notice]{order:2}",
    "body.moa-home main>[data-moa-strip]{background:linear-gradient(120deg,#EEE8FD 0%,#E4EBFC 55%,#DDF0F5 100%)!important;border:0!important;margin-top:44px;padding:14px 0}",
    "[data-moa-strip] .grid>div{background:#fff;border-radius:18px;padding:18px 20px!important;box-shadow:0 6px 18px rgba(80,55,170,.10);gap:14px;transition:transform .2s,box-shadow .2s}",
    "[data-moa-strip] .grid>div:hover{transform:translateY(-3px);box-shadow:0 12px 26px rgba(80,55,170,.16)}",
    "[data-moa-strip] .grid>div>div:first-child{background:linear-gradient(135deg,#7A55E6,#5632B8)!important;width:48px;height:48px}",
    "[data-moa-strip] .grid>div>div:first-child svg{color:#fff!important;stroke:#fff!important}",
    "[data-moa-strip] p.font-semibold{color:#17142B!important;font-size:15px;font-weight:800}",
    "[data-moa-strip] p.text-xs{color:#6B6785!important;font-size:12.5px}",
    "@media (max-width:767px){body.moa-home main>[data-moa-strip]{margin-top:28px;padding:10px 0}[data-moa-strip] .grid>div{padding:14px!important}[data-moa-strip] .grid>div>div:first-child{width:40px;height:40px}[data-moa-strip] p.font-semibold{font-size:13px}}",
    "body.moa-home main>section:first-of-type:not(#moa-hero){display:none!important}main>section[data-moa-hid]{display:none!important}",
    "#moa-header,#moa-hero{--moa-p:#6E48D9;--moa-pd:#5632B8;--moa-bar:#EDE8FB;--moa-ink:#17142B;--moa-mut:#7A7690;--moa-line:#EAE7F2;font-family:inherit}",
    "#moa-header a{color:inherit;text-decoration:none}",
    ".moa-wrap{max-width:1440px;margin:0 auto;padding:0 24px;width:100%;box-sizing:border-box}",
    ".moa-announce{background:var(--moa-bar);color:var(--moa-p)}",
    ".moa-announce-in{display:flex;align-items:center;gap:20px;height:48px}",
    ".moa-hello{display:flex;align-items:center;gap:18px;font-size:14px;min-width:0}",
    ".moa-hello b{letter-spacing:.16em;font-size:13px;font-weight:800;white-space:nowrap}",
    ".moa-hello span{color:#4B3A8F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".moa-event{margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:600;white-space:nowrap}",
    ".moa-event:hover{text-decoration:underline!important}",
    ".moa-x{border:0;background:none;color:var(--moa-p);cursor:pointer;padding:4px;display:flex}",
    ".moa-util{background:#fff}",
    ".moa-util-in{display:flex;align-items:center;justify-content:space-between;height:40px;font-size:13px;color:var(--moa-mut)}",
    ".moa-util-links{display:flex;gap:22px}",
    ".moa-util-links a,.moa-util-links button{color:var(--moa-mut);background:none;border:0;padding:0;font:inherit;cursor:pointer}",
    ".moa-util-links a:hover,.moa-util-links button:hover{color:var(--moa-p)}",
    ".moa-sticky{position:sticky;top:0;z-index:55;background:#fff;border-bottom:1px solid var(--moa-line)}",
    ".moa-brand-in{display:flex;align-items:center;gap:44px;height:100px;transition:height .25s ease}.moa-sticky.is-compact .moa-brand-in{height:76px}",
    ".moa-logo{display:flex;align-items:center;flex:0 0 auto}.moa-logo-art{position:relative;display:block;height:80px;aspect-ratio:2100/667;transition:height .25s ease}.moa-sticky.is-compact .moa-logo-art{height:58px}.moa-logo-art>img,.moa-mascot{position:absolute}.moa-lw{display:block;height:auto}.moa-stars{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none}.moa-mascot{display:block}.moa-mascot-in{position:relative;display:block;width:100%;height:100%;transform-origin:50% 85%;transition:transform .3s cubic-bezier(.3,.7,.3,1)}.moa-mascot-in>img{width:100%!important;height:100%!important;max-width:none!important;margin:0!important;display:block;user-select:none;-webkit-user-drag:none}.moa-eyes{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible}.moa-pupil{will-change:transform}",
    ".moa-search{flex:1 1 auto;max-width:700px;position:relative;margin:0}",
    ".moa-search input{width:100%;height:54px;box-sizing:border-box;border:2px solid var(--moa-p);border-radius:999px;padding:0 64px 0 28px;font-size:16px;color:var(--moa-ink);background:#fff;outline:none;font-family:inherit}",
    ".moa-search input::placeholder{color:#A9A4C2}",
    ".moa-search input:focus{box-shadow:0 0 0 4px rgba(110,72,217,.14)}",
    ".moa-search button{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:40px;height:40px;border:0;background:none;color:var(--moa-p);cursor:pointer;display:flex;align-items:center;justify-content:center}",
    ".moa-icons{margin-left:auto;display:flex;gap:28px;align-items:flex-start}",
    ".moa-ic{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;color:var(--moa-ink);position:relative;min-width:48px;cursor:pointer}",
    ".moa-ic:hover{color:var(--moa-p)}",
    ".moa-ic em{font-style:normal;position:absolute;top:-6px;right:2px;min-width:18px;height:18px;border-radius:9px;background:var(--moa-p);color:#fff;font-size:11px;line-height:18px;text-align:center;font-weight:700;padding:0 4px;box-sizing:border-box}",
    ".moa-ic em[hidden]{display:none}",
    ".moa-nav{background:#fff}",
    ".moa-nav-in{display:flex;align-items:center;height:52px;gap:6px;position:relative}",
    ".moa-cat{display:flex;align-items:center;gap:10px;background:none;border:0;font-size:17px;font-weight:800;color:var(--moa-ink);cursor:pointer;padding:0 22px 0 0;margin-right:16px;position:relative;font-family:inherit;height:100%}",
    ".moa-cat:after{content:'';position:absolute;right:0;top:50%;height:22px;width:1px;background:var(--moa-line);transform:translateY(-50%)}",
    ".moa-cat:hover{color:var(--moa-p)}",
    ".moa-nav-link{position:relative;height:100%;display:flex;align-items:center;padding:0 18px;font-size:17px;font-weight:800;color:var(--moa-ink);white-space:nowrap}",
    ".moa-nav-link:hover{color:var(--moa-p)}",
    ".moa-nav-link.is-on{color:var(--moa-p)}",
    ".moa-nav-link.is-on:after{content:'';position:absolute;left:18px;right:18px;bottom:0;height:3px;border-radius:3px;background:var(--moa-p)}",
    ".moa-cat,.moa-nav-side{white-space:nowrap}.moa-nav-side{margin-left:auto;display:inline-flex;gap:6px;align-items:center;font-size:15px;color:var(--moa-mut)}",
    ".moa-nav-side:hover{color:var(--moa-p)}",
    ".moa-catpanel{position:absolute;left:24px;top:52px;width:660px;background:#fff;border:1px solid var(--moa-line);border-radius:18px;box-shadow:0 18px 50px rgba(40,25,90,.16);padding:18px;display:none;z-index:70}",
    ".moa-catpanel.is-open{display:block}",
    ".moa-catpanel a{display:flex;flex-direction:column;gap:3px;padding:14px 16px;border-radius:12px}",
    ".moa-catpanel a:hover{background:#F5F2FD}",
    ".moa-catpanel b{font-size:15px;color:var(--moa-ink)}.moa-catpanel small{font-size:12px;color:var(--moa-mut)}",
    ".moa-catgrid{display:grid;grid-template-columns:1fr 1fr;gap:4px}",
    ".moa-catall{margin-top:8px;border-top:1px solid var(--moa-line);padding-top:8px}",
    "#moa-hero{background:#fff;padding:28px 0 12px}",
    ".moa-hero-grid{display:grid;grid-template-columns:minmax(0,2.05fr) minmax(0,1fr);gap:24px;height:clamp(400px,34.5vw,500px)}",
    ".moa-slider{position:relative;border-radius:28px;overflow:hidden;background:#EEE9F7;min-width:0}",
    ".moa-slide{position:absolute;inset:0;opacity:0;visibility:hidden;transition:opacity .7s ease,visibility .7s;display:flex;align-items:center}",
    ".moa-slide.is-on{opacity:1;visibility:visible;z-index:1}",
    ".moa-slide-copy{position:relative;z-index:2;padding:0 0 0 clamp(28px,4.4vw,60px);max-width:58%}",
    ".moa-eyebrow{font-size:13px;font-weight:700;letter-spacing:.22em;color:#3a2f66;margin:0 0 22px}",
    ".moa-slide h2{font-size:clamp(26px,2.9vw,44px);line-height:1.22;font-weight:800;color:var(--moa-ink);margin:0 0 20px;letter-spacing:-.01em}",
    ".moa-slide p.moa-sub{font-size:clamp(14px,1.25vw,18px);line-height:1.7;color:#4a4566;margin:0 0 30px}",
    ".moa-cta{display:inline-flex;align-items:center;gap:26px;background:#fff;color:var(--moa-ink)!important;border-radius:12px;padding:15px 22px;font-size:15px;font-weight:700;box-shadow:0 6px 18px rgba(60,40,120,.1)}",
    ".moa-cta:hover{background:#F6F3FF}",
    ".moa-tiles{position:absolute;right:3%;top:0;bottom:0;width:46%;z-index:1}",
    ".moa-tile{position:absolute;background:#fff;border-radius:22px;box-shadow:0 18px 40px rgba(50,30,110,.18);overflow:hidden;display:flex;align-items:center;justify-content:center}",
    ".moa-tile img{width:92%;height:92%;object-fit:contain;display:block}",
    ".moa-tile:nth-child(1){width:44%;aspect-ratio:1;left:2%;top:9%;transform:rotate(-5deg)}",
    ".moa-tile:nth-child(2){width:50%;aspect-ratio:1;right:0;top:24%;transform:rotate(4deg);z-index:2}",
    ".moa-tile:nth-child(3){width:38%;aspect-ratio:1;left:22%;bottom:7%;transform:rotate(-2deg);z-index:3}",
    ".moa-slide-img{display:block}.moa-slide-img img{width:100%;height:100%;object-fit:cover;display:block}",
    ".moa-ctrl{position:absolute;right:24px;bottom:24px;z-index:5;display:flex;align-items:center;gap:6px;background:rgba(32,26,52,.58);color:#fff;border-radius:999px;padding:8px 10px 8px 18px;backdrop-filter:blur(6px);font-size:13px}",
    ".moa-ctrl b{font-weight:800;margin-right:2px}.moa-ctrl span{opacity:.75;margin-right:8px}",
    ".moa-ctrl button{width:28px;height:28px;border:0;border-radius:50%;background:transparent;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}",
    ".moa-ctrl button:hover{background:rgba(255,255,255,.18)}",
    ".moa-side{display:grid;grid-template-rows:1fr 1fr;gap:24px;min-width:0}",
    ".moa-card{position:relative;border-radius:28px;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:0 clamp(24px,2.4vw,40px);color:var(--moa-ink)!important;min-width:0}",
    ".moa-card .moa-eyebrow{font-size:11px;margin-bottom:14px}",
    ".moa-card h3{font-size:clamp(20px,2vw,30px);line-height:1.3;font-weight:800;margin:0 0 18px;position:relative;z-index:2}",
    ".moa-card .moa-lnk{font-size:13px;color:#4a4566;display:inline-flex;gap:6px;align-items:center;position:relative;z-index:2}",
    ".moa-card .moa-tile{position:absolute;right:6%;top:50%;width:min(38%,170px);aspect-ratio:1;transform:translateY(-50%) rotate(5deg);left:auto;bottom:auto}",
    ".moa-card:hover .moa-tile{transform:translateY(-52%) rotate(3deg);transition:transform .3s}",
    ".moa-quick-head{display:flex;align-items:center;gap:12px;margin-top:34px;padding-bottom:18px;border-bottom:1px solid var(--moa-line);font-size:15px;font-weight:700;color:var(--moa-ink)}",
    ".moa-badge{width:32px;height:32px;border-radius:10px;background:var(--moa-p);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;flex:0 0 auto}",
    ".moa-quick-head a{margin-left:auto;color:var(--moa-p)!important;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}",
    ".moa-quick{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:8px;padding:36px 0 8px}",
    ".moa-q{display:flex;flex-direction:column;align-items:center;gap:14px;color:var(--moa-ink)!important;font-weight:700;font-size:15px;position:relative;text-align:center;line-height:1.3}",
    ".moa-q i{width:100%;max-width:92px;height:auto;aspect-ratio:1;border-radius:30px;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:40px;transition:transform .2s,box-shadow .2s;color:var(--moa-p)}",
    ".moa-q:hover i{transform:translateY(-4px);box-shadow:0 10px 22px rgba(60,40,120,.12)}",
    ".moa-q .moa-hot{position:absolute;top:-8px;left:calc(50% + 14px);background:#FF5A4D;color:#fff;font-size:11px;font-weight:800;padding:3px 7px;border-radius:7px;letter-spacing:.02em;white-space:nowrap}",
    "@media (max-width:1023px){.moa-quick{grid-template-columns:repeat(5,minmax(0,1fr));row-gap:22px}.moa-q i{width:100%;max-width:76px;height:auto;aspect-ratio:1;border-radius:26px;font-size:34px}.moa-q{font-size:13px}}",
    "@media (max-width:767px){.moa-quick-head{margin-top:22px;font-size:13px}.moa-quick-head a{font-size:12px}.moa-quick{gap:6px;padding-top:22px}.moa-q{gap:8px;font-size:11px}.moa-q i{width:100%;max-width:62px;height:auto;aspect-ratio:1;border-radius:20px;font-size:26px}.moa-q .moa-hot{left:calc(50% + 6px);font-size:9px;padding:2px 5px;top:-6px}}",
    "@media (max-width:1199px){.moa-nav-side{display:none}.moa-nav-link{padding:0 12px;font-size:15px}.moa-nav-link.is-on:after{left:12px;right:12px}.moa-cat{font-size:15px}}",
    "@media (max-width:1279px){.moa-brand-in{height:88px}.moa-logo-art{height:68px}.moa-sticky.is-compact .moa-logo-art{height:54px}.moa-sticky.is-compact .moa-brand-in{height:72px}}",
    "@media (max-width:1023px){.moa-nav-side{display:none}.moa-hero-grid{grid-template-columns:1fr;height:auto}.moa-slider{height:clamp(340px,56vw,440px)}.moa-side{grid-template-columns:1fr 1fr;grid-template-rows:none;height:200px}.moa-brand-in{gap:20px}.moa-icons{gap:16px}.moa-nav-link{padding:0 12px;font-size:15px}.moa-cat{font-size:15px}}",
    "@media (max-width:767px){#moa-hero{padding:14px 0 6px}.moa-wrap{padding:0 14px}.moa-hero-grid{gap:12px}.moa-slider{border-radius:20px;height:450px}.moa-slide{align-items:flex-start}.moa-slide-copy{max-width:100%;padding:70px 22px 0}.moa-eyebrow{font-size:11px;margin-bottom:12px}.moa-slide h2{font-size:27px;margin-bottom:12px}.moa-slide p.moa-sub{font-size:13px;margin-bottom:18px}.moa-cta{padding:12px 16px;font-size:13px;gap:14px}.moa-tiles{right:0;left:0;top:auto;bottom:0;width:auto;height:140px}.moa-tile:nth-child(1){width:30%;left:5%;top:auto;bottom:6px}.moa-tile:nth-child(2){width:33%;right:4%;top:auto;bottom:34px}.moa-tile:nth-child(3){width:27%;left:36%;bottom:4px}.moa-ctrl{right:12px;top:12px;bottom:auto;padding:6px 8px 6px 14px}.moa-side{height:auto;gap:12px}.moa-card{border-radius:20px;height:190px;padding:0 16px}.moa-card h3{font-size:15px;margin-bottom:12px}.moa-card .moa-eyebrow{margin-bottom:10px}.moa-card .moa-lnk{font-size:11px;max-width:60%;line-height:1.5}.moa-card .moa-tile{width:38%;right:-4%;top:auto;bottom:-4%;transform:rotate(8deg)}.moa-card:hover .moa-tile{transform:rotate(8deg)}}",
    "#moa-reviews{padding:44px 0 12px}",
    ".moa-rv-eyebrow{font-size:12px}.moa-rv-title{font-size:clamp(24px,2.2vw,32px);margin:8px 0}.moa-rv-sub{font-size:14px}.moa-rv-all{font-size:14px}",
    ".moa-rv-tools{margin:18px 0 16px}.moa-pill{height:40px;padding:0 20px;font-size:14px}.moa-rv-note{font-size:12.5px}",
    ".moa-rv-grid{grid-template-columns:repeat(6,minmax(0,1fr));gap:16px}",
    ".moa-rv-card{border-radius:18px}.moa-rv-card:hover{transform:translateY(-4px)}",
    ".moa-rv-img{aspect-ratio:1/.78}.moa-rv-badge{left:10px;top:10px;padding:5px 9px;font-size:10px;border-radius:8px}",
    ".moa-rv-go{right:10px;bottom:10px;width:32px;height:32px}.moa-rv-go svg{width:14px;height:14px}",
    ".moa-rv-body{padding:14px 16px 4px;gap:7px}.moa-rv-meta{font-size:12px}.moa-rv-stars{font-size:14px;letter-spacing:1px}",
    ".moa-rv-h{font-size:15px;line-height:1.35}.moa-rv-text{font-size:12.5px;line-height:1.6;-webkit-line-clamp:3}.moa-rv-who{font-size:11.5px}",
    ".moa-rv-prod{margin:10px 16px 14px;padding-top:12px;gap:10px;font-size:12px}.moa-rv-prod img{width:38px;height:38px;border-radius:9px}.moa-rv-foot{margin-top:12px;font-size:12px}",
    "@media (max-width:1279px){.moa-rv-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}",
    "@media (max-width:767px){#moa-reviews{padding:30px 0 10px}.moa-rv-grid{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:64%;gap:12px}.moa-rv-body{padding:14px 16px 4px}.moa-rv-prod{margin:10px 16px 14px}}",
    "main>[data-moa-notice] .grid h3{font-size:19px!important}",
    "main>[data-moa-notice] .grid button{font-size:14px!important}",
    "main>[data-moa-notice] .grid .text-xs{font-size:15.5px!important;line-height:1.5}",
    "main>[data-moa-notice] .grid [class*=\"text-[10px]\"]{font-size:13px!important}",
    "main>[data-moa-notice] .grid li,main>[data-moa-notice] .grid [class*=\"py-\"]{padding-top:.55rem;padding-bottom:.55rem}",
    "footer h3{font-size:17px!important}",
    "footer .text-xs{font-size:14px!important}",
    "footer [class*=\"text-[11px]\"]{font-size:13px!important}",
    "footer .text-sm{font-size:16px!important}",
    "footer a.inline-flex{font-size:15px!important}",
    "footer .text-xl{font-size:24px!important}",
    "@media (max-width:767px){main>[data-moa-notice] .grid .text-xs{font-size:14px!important}footer .text-xs{font-size:13px!important}footer h3{font-size:16px!important}}",
    ".moa-rv-body{padding:18px 16px 4px;gap:9px}",
    ".moa-rv-meta{display:flex;align-items:center;justify-content:space-between;gap:6px;white-space:nowrap}",
    ".moa-rv-rate{display:inline-flex;align-items:center;gap:6px}",
    ".moa-rv-stars{font-size:18px;letter-spacing:0;line-height:1}",
    ".moa-rv-rate b{font-size:15px;font-weight:800;color:#17142B;line-height:1}",
    ".moa-rv-date{font-size:12px;color:var(--moa-mut)}",
    ".moa-rv-tag{background:#FFF1D6;color:#8A5200;font-weight:800;font-size:11px;padding:3px 8px;border-radius:7px;line-height:1.3}",
    ".moa-rv-text{-webkit-line-clamp:4}",
    "#moa-reviews{background:#F5F2FC;padding:48px 0 30px}",
    ".moa-rv-grid{gap:18px}",
    ".moa-rv-card{container-type:inline-size;background:#fff;border:1px solid #E0D9F2;border-radius:18px;box-shadow:0 8px 22px rgba(70,45,150,.10);overflow:hidden}",
    ".moa-rv-card:hover{box-shadow:0 16px 34px rgba(70,45,150,.18);border-color:#C9BCEE;transform:translateY(-4px)}",
    ".moa-rv-body{padding:18px 16px 14px}",
    ".moa-rv-prod{margin:0;margin-top:auto;padding:12px 16px;background:#FAF8FF;border-top:1px solid #ECE7F8}",
    ".moa-rv-stars{font-size:17px}.moa-rv-meta{gap:4px}.moa-rv-rate{gap:5px}.moa-rv-rate b{font-size:14px}.moa-rv-date{font-size:11.5px;flex:0 0 auto}.moa-rv-tag{flex:0 0 auto}",
    "@container (max-width:215px){.moa-rv-date i{display:none}.moa-rv-stars{font-size:15.5px}.moa-rv-tag{padding:3px 6px;font-size:10.5px}}",
    ".moa-rv-foot{color:#8C86A6}",
    ".moa-rv-date i{font-style:normal}",
    "@media (max-width:767px){.list-layout{align-items:stretch!important}.list-layout>*{min-width:0!important;max-width:100%!important;align-self:stretch!important}.list-sort-row{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}}",
    "#moa-intro{position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;background:#fff;display:flex;align-items:center;justify-content:center;transition:background-color .75s ease}",
    "@keyframes moa-intro-in{from{opacity:0}to{opacity:1}}",
    "#moa-intro.is-leaving{background-color:rgba(255,255,255,0)}",
    "#moa-intro .moa-intro-art{width:min(76vw,340px)!important;height:auto!important;transition:none}",
    "body.moa-introing{overflow:hidden}",
    "body.moa-introing .moa-m-logo .moa-logo-art{visibility:hidden}",
    "@media (min-width:768px){main section[data-moa-rank] [class*=grid-cols]{grid-template-columns:repeat(4,minmax(0,1fr))!important}main section[data-moa-rank] [class*=grid-cols]>*:nth-child(n+9){display:none!important}}"
  ].join("\n");

  function qs(s, r) { return (r || document).querySelector(s); }
  function isHome() { return location.pathname === "/" || location.pathname === ""; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function nav(url) {
    history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo(0, 0);
  }
  function loggedIn() { try { return !!localStorage.getItem(TOKEN_KEY); } catch (e) { return false; } }

  function injectCss() {
    if (document.getElementById("moa-style")) return;
    var s = document.createElement("style");
    s.id = "moa-style";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------- header ---------- */
  function logout() {
    var t = ""; try { t = localStorage.getItem(TOKEN_KEY) || ""; } catch (e) {}
    try { fetch("/api/auth/logout", { method: "POST", headers: t ? { Authorization: "Bearer " + t } : {} }).catch(function () {}); } catch (e) {}
    try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem("allddaom_user"); } catch (e) {}
    location.href = "/";
  }

  function utilLinksHtml() {
    var a = loggedIn()
      ? '<a href="/mypage" data-moa>マイページ</a><button type="button" data-moa-logout>ログアウト</button>'
      : '<a href="/login" data-moa>ログイン</a><a href="/register" data-moa>会員登録</a>';
    return a + '<a href="/notice" data-moa>お知らせ</a>';
  }

  /* Original Seoulmono bag mascot; typography remains sharp at every size. */
  function logoHtml() {
    return '<span class="moa-logo-art sm-brand"><img class="sm-bag" src="/seoulmono-puppy.png" alt="" width="72" height="72"><span class="sm-word">ソウルモノ<small>SEOULMONO</small></span></span>';
  }
  function initMascot() {}

  function buildHeader() {
    var anchor = qs("header.sticky[data-ssr-header-border]") || qs("header.sticky");
    if (!anchor || !anchor.parentNode) return false;
    var closed = false; try { closed = sessionStorage.getItem("moa-announce-closed") === "1"; } catch (e) {}
    var root = el("div"); root.id = "moa-header";
    root.innerHTML =
      '<div class="moa-announce"' + (closed ? ' hidden' : '') + '><div class="moa-wrap moa-announce-in">' +
        '<div class="moa-hello"><b>HELLO, SEOULMONO</b><span>韓国の「いいもの」を、毎日の楽しみに</span></div>' +
        '<a class="moa-event" href="/register" data-moa>初回登録で全商品100円イベント実施中 ' + ICON.out + '</a>' +
        '<button type="button" class="moa-x" aria-label="閉じる">' + ICON.x + '</button>' +
      '</div></div>' +
      '<div class="moa-util"><div class="moa-wrap moa-util-in"><span>毎日の発見、気分のいいお買い物</span><nav class="moa-util-links" id="moa-util-links">' + utilLinksHtml() + '</nav></div></div>' +
      '<div class="moa-sticky">' +
        '<div class="moa-brand"><div class="moa-wrap moa-brand-in">' +
          '<a class="moa-logo" href="/" data-moa aria-label="seoulmono">' + logoHtml() + '</a>' +
          '<form class="moa-search" role="search"><input type="text" name="q" autocomplete="off" placeholder="どんな毎日を探していますか？" aria-label="商品を検索"><button type="submit" aria-label="検索">' + ICON.search + '</button></form>' +
          '<div class="moa-icons">' +
            '<a class="moa-ic" href="/mypage?section=wishlist" data-moa data-moa-auth>' + ICON.heart + '<span>お気に入り</span></a>' +
            '<a class="moa-ic" href="/cart" data-moa>' + ICON.bag + '<em id="moa-cart-badge" hidden>0</em><span>カート</span></a>' +
            '<a class="moa-ic" href="/mypage" data-moa data-moa-auth>' + ICON.user + '<span>マイページ</span></a>' +
          '</div>' +
        '</div></div>' +
        '<nav class="moa-nav"><div class="moa-wrap moa-nav-in">' +
          '<button type="button" class="moa-cat" aria-expanded="false" aria-controls="moa-catpanel">' + ICON.menu + '全カテゴリー</button>' +
          NAV.map(function (n) { return '<a class="moa-nav-link" href="' + n.href + '" data-moa data-moa-nav>' + n.label + '</a>'; }).join("") +
          '<a class="moa-nav-side" href="/notice" data-moa>お知らせ ' + ICON.out + '</a>' +
          '<div class="moa-catpanel" id="moa-catpanel"><div class="moa-catgrid">' +
            CATEGORIES.map(function (c) { return '<a href="/list?ca_id=' + c.id + '" data-moa><b>' + c.name + '</b><small>' + c.sub + '</small></a>'; }).join("") +
          '</div><div class="moa-catall"><a href="/list" data-moa><b>すべての商品を見る</b><small>全カテゴリーの商品一覧</small></a></div></div>' +
        '</div></nav>' +
      '</div>';
    // A compact masthead: logo, primary navigation, search and account in one row.
    root.classList.add("sm-masthead");
    var brandRow = qs(".moa-brand-in", root);
    brandRow.insertBefore(qs(".moa-nav", root), qs(".moa-search", root));
    qs(".moa-announce", root).hidden = true;
    qs(".moa-util-in>span", root).innerHTML = '<b class="sm-top-label">ソウル発。</b> 今日のいいものを、日本へ。';
    qs(".moa-search input", root).placeholder = "何をお探しですか？";
    root.querySelectorAll(".moa-ic").forEach(function(a) { a.setAttribute("aria-label", a.querySelector("span").textContent); });
    anchor.parentNode.insertBefore(root, anchor);

    var xbtn = qs(".moa-x", root);
    xbtn.addEventListener("click", function () {
      qs(".moa-announce", root).hidden = true;
      try { sessionStorage.setItem("moa-announce-closed", "1"); } catch (e) {}
    });
    var form = qs(".moa-search", root);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = form.q.value.trim();
      nav(q ? "/list?q=" + encodeURIComponent(q) : "/search");
    });
    var cat = qs(".moa-cat", root), panel = qs(".moa-catpanel", root);
    function closePanel() { panel.classList.remove("is-open"); cat.setAttribute("aria-expanded", "false"); }
    cat.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = panel.classList.toggle("is-open");
      cat.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (e) { if (!panel.contains(e.target)) closePanel(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });
    root.addEventListener("click", function (e) {
      var lo = e.target.closest && e.target.closest("[data-moa-logout]");
      if (lo) { e.preventDefault(); logout(); return; }
      var a = e.target.closest && e.target.closest("a[data-moa]");
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault(); closePanel();
      var href = a.getAttribute("href");
      if (a.hasAttribute("data-moa-auth") && !loggedIn()) href = "/login";
      nav(href);
    });
    return true;
  }

  /* ---------- mobile intro: big centered logo -> shrinks into the header ---------- */
  var INTRO_KEY = "moa-intro-seen";
  var intro = { el: null, done: false, shrinking: false, holdReady: false };
  function introEligible() {
    try { if (sessionStorage.getItem(INTRO_KEY)) return false; } catch (e) {}
    if (window.innerWidth >= 768) return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return true;
  }
  function finishIntro() {
    if (intro.done) return;
    intro.done = true;
    if (intro.el && intro.el.parentNode) intro.el.parentNode.removeChild(intro.el);
    document.body.classList.remove("moa-introing");
  }
  function tryShrink() {
    if (!intro.el || intro.done || intro.shrinking || !intro.holdReady) return;
    var target = qs("header.sticky [data-ssr-logo] .moa-logo-art");
    var art = qs(".moa-intro-art", intro.el);
    if (!target || !art) return;
    var t = target.getBoundingClientRect(), a = art.getBoundingClientRect();
    if (!t.width || !a.width) return;
    intro.shrinking = true;
    var dx = (t.left + t.width / 2) - (a.left + a.width / 2);
    var dy = (t.top + t.height / 2) - (a.top + a.height / 2);
    var sc = t.width / a.width;
    art.style.transition = "transform .9s cubic-bezier(.65,0,.25,1)";
    art.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px) scale(" + sc.toFixed(4) + ")";
    intro.el.classList.add("is-leaving");
    setTimeout(finishIntro, 980);
  }
  function startIntro() {
    return; // Keep shopping immediately accessible; no blocking brand animation.

    if (!introEligible()) return;
    try { sessionStorage.setItem(INTRO_KEY, "1"); } catch (e) {}
    var ov = el("div");
    ov.id = "moa-intro";
    ov.innerHTML = '<div class="moa-intro-stage">' + logoHtml("i").replace('class="moa-logo-art"', 'class="moa-logo-art moa-intro-art"') + '</div>';
    document.body.appendChild(ov);
    document.body.classList.add("moa-introing");
    intro.el = ov;
    ov.addEventListener("click", finishIntro);
    setTimeout(function () { intro.holdReady = true; tryShrink(); }, 1400);
    setTimeout(finishIntro, 5500);
  }

  function fitMobileLogo(box) {
    var ic = qs("header.sticky [data-ssr-icons]");
    var icLeft = ic ? ic.getBoundingClientRect().left : 0;
    var avail = icLeft > 40 ? icLeft - box.getBoundingClientRect().left - 10 : window.innerWidth - 214;
    var h = Math.max(34, Math.min(52, Math.floor(avail / 3.148)));
    var art = box.querySelector(".moa-logo-art");
    if (art && art.getAttribute("data-h") !== String(h)) {
      art.setAttribute("data-h", String(h));
      art.style.setProperty("height", h + "px", "important");
    }
  }

  function ensureMobileLogo() {
    var box = qs("header.sticky [data-ssr-logo]");
    if (!box) return;
    if (box.querySelector(".moa-logo-art")) { fitMobileLogo(box); return; }
    var img = qs("img", box);
    var h = img ? Math.round(img.getBoundingClientRect().height) : 0;
    if (!h) return;
    box.classList.add("moa-m-logo");
    var wrap = document.createElement("span");
    wrap.innerHTML = logoHtml("m");
    box.appendChild(wrap.firstChild);
    fitMobileLogo(box);
  }

  function syncHeader() {
    var root = document.getElementById("moa-header");
    if (!root) return;
    var cur = location.pathname + location.search;
    var on = null;
    [].forEach.call(root.querySelectorAll("[data-moa-nav]"), function (a) {
      var h = a.getAttribute("href"), act;
      if (h === "/") act = location.pathname === "/";
      else if (h.indexOf("?") > -1) act = cur === h || (location.pathname === h.split("?")[0] && location.search.indexOf(h.split("?")[1]) > -1);
      else act = location.pathname === h || location.pathname.indexOf(h + "/") === 0;
      a.classList.toggle("is-on", !!act);
      if (act) on = a;
    });
    var links = document.getElementById("moa-util-links");
    var want = loggedIn() ? "in" : "out";
    if (links && links.getAttribute("data-s") !== want) { links.innerHTML = utilLinksHtml(); links.setAttribute("data-s", want); }
    var old = qs("[data-ssr-cart-badge]"), badge = document.getElementById("moa-cart-badge");
    if (badge) {
      var n = old ? parseInt(old.textContent, 10) || 0 : 0;
      var txt = n > 99 ? "99+" : String(n);
      if (badge.textContent !== txt) badge.textContent = txt;
      badge.hidden = n < 1;
    }
  }

  /* ---------- hero ---------- */
  var heroTimer = null;
  function tile(id) { return '<div class="moa-tile"><img src="' + IMG(id) + '" alt="" loading="eager" onerror="this.parentNode.style.display=\'none\'"></div>'; }

  function quickHtml() {
    return '<div class="moa-quick">' + QUICK.map(function (q) {
        return '<a class="moa-q" href="' + q.href + '" data-moa' + (q.auth ? ' data-moa-auth' : '') + '>' + (q.hot ? '<span class="moa-hot">HOT</span>' : '') +
          '<i style="background:' + q.bg + '">' + (q.heart ? ICON.heart : q.emoji) + '</i><span>' + q.label + '</span></a>';
      }).join("") + '</div>';
  }

  function buildHero(adminBanners) {
    var main = qs("main");
    if (!main) return false;
    var first = qs("section", main);
    if (!first) return false;
    var old = qs("#moa-hero"); if (old) old.remove();
    var slides = [];
    (adminBanners || []).forEach(function (b) {
      var pic = (b.mobileImageUrl ? '<source media="(max-width:767px)" srcset="' + b.mobileImageUrl + '">' : "") + '<img src="' + b.imageUrl + '" alt="' + (b.title || "") + '">';
      slides.push('<' + (b.linkUrl ? 'a href="' + b.linkUrl + '" data-moa' : 'div') + ' class="moa-slide moa-slide-img"><picture>' + pic + '</picture></' + (b.linkUrl ? 'a' : 'div') + '>');
    });
    SLIDES.forEach(function (s) {
      slides.push(
        '<div class="moa-slide" style="background:' + s.bg + '">' +
          '<div class="moa-slide-copy"><p class="moa-eyebrow">' + s.eyebrow + '</p>' +
          '<h2>' + s.title.join("<br>") + '</h2><p class="moa-sub">' + s.text.join("<br>") + '</p>' +
          '<a class="moa-cta" href="' + s.href + '" data-moa>' + s.cta + ICON.chev + '</a></div>' +
          '<div class="moa-tiles">' + s.imgs.map(tile).join("") + '</div></div>'
      );
    });
    var total = slides.length, idx = 0, playing = true;
    var sec = el("section"); sec.id = "moa-hero";
    sec.innerHTML =
      '<div class="moa-wrap"><div class="moa-hero-grid">' +
        '<div class="moa-slider">' + slides.join("") +
          '<div class="moa-ctrl"><b id="moa-cur">01</b><span>/ ' + String(total).padStart(2, "0") + '</span>' +
          '<button type="button" data-d="-1" aria-label="前へ">' + ICON.prev + '</button><button type="button" data-d="1" aria-label="次へ">' + ICON.chev + '</button>' +
          '<button type="button" data-play aria-label="自動再生の切り替え">' + ICON.pause + '</button></div></div>' +
        '<a class="sm-side-banner" href="/products?sort=new" data-moa><span class="sm-side-tag">ソウルから、毎日。</span><h3>いいものに、<br>出会おう。</h3><p>韓国のとっておきを<br>あなたの暮らしへ。</p><img src="/seoulmono-puppy.png" alt="ソウルモノの子犬キャラクター"><span class="sm-side-cta">新着商品を見る ' + ICON.chev + '</span></a>' +
      '</div>' + quickHtml() + '</div>';
    first.parentNode.insertBefore(sec, first);
    first.style.display = "none";

    var nodes = [].slice.call(sec.querySelectorAll(".moa-slide"));
    function show(i) {
      idx = (i + total) % total;
      nodes.forEach(function (n, k) { n.classList.toggle("is-on", k === idx); });
      var c = document.getElementById("moa-cur"); if (c) c.textContent = String(idx + 1).padStart(2, "0");
    }
    function schedule() {
      clearTimeout(heroTimer);
      if (!playing || document.hidden || total < 2) return;
      heroTimer = setTimeout(function () { show(idx + 1); schedule(); }, 5500);
    }
    show(0); schedule();
    document.body.classList.add("moa-ready");
    sec.addEventListener("click", function (e) {
      var d = e.target.closest && e.target.closest("button[data-d]");
      if (d) { show(idx + parseInt(d.getAttribute("data-d"), 10)); schedule(); return; }
      var p = e.target.closest && e.target.closest("button[data-play]");
      if (p) { playing = !playing; p.innerHTML = playing ? ICON.pause : ICON.play; schedule(); return; }
      var a = e.target.closest && e.target.closest("a[data-moa]");
      if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
        e.preventDefault();
        var href = a.getAttribute("href");
        if (a.hasAttribute("data-moa-auth") && !loggedIn()) href = "/login";
        nav(href);
      }
    });
    document.addEventListener("visibilitychange", schedule);
    return true;
  }

  function tagHomeSections() {
    var main = qs("main");
    if (!main || !isHome()) return;
    [].forEach.call(main.children, function (c) {
      if (c.tagName !== "SECTION" || c.id === "moa-hero") return;
      var t = c.textContent || "";
      if (!c.hasAttribute("data-moa-strip") && t.length < 600 && t.indexOf("韓国から発送") > -1 && t.indexOf("カード決済") > -1) c.setAttribute("data-moa-strip", "1");
      if (!c.hasAttribute("data-moa-notice") && t.indexOf("商品レビュー") > -1 && t.indexOf("お知らせ") > -1 && t.indexOf("イベント") > -1) c.setAttribute("data-moa-notice", "1");
    });
  }

  function tagRank() {
    var wrap = qs("main > div.container > div.items-start");
    if (!wrap || !isHome() || !wrap.children.length) return;
    var first = wrap.children[0].children[0];
    if (first && first.tagName === "SECTION" && !first.hasAttribute("data-moa-rank") && /^\s*ランキング/.test(first.textContent || "")) first.setAttribute("data-moa-rank", "1");
  }

  function layoutWide() {
    var wrap = qs("main > div.container > div.items-start");
    if (!wrap || !isHome() || wrap.children.length < 2) return;
    var mainCol = wrap.children[0], side = wrap.children[1];
    var xl = window.innerWidth >= 1280 && getComputedStyle(side).display !== "none";
    var gap = parseFloat(getComputedStyle(wrap).columnGap) || 24;
    var ext = xl ? Math.round(side.getBoundingClientRect().width + gap) : 0;
    if (wrap.style.getPropertyValue("--moa-ext") !== ext + "px") wrap.style.setProperty("--moa-ext", ext + "px");
    var sideBottom = xl ? side.getBoundingClientRect().bottom : 0;
    [].forEach.call(mainCol.children, function (c, i) {
      var already = c.hasAttribute("data-moa-wide");
      var want = xl && i > 0 && (already || c.getBoundingClientRect().top >= sideBottom - 2);
      if (want && !already) c.setAttribute("data-moa-wide", "1");
      else if (!want && already) c.removeAttribute("data-moa-wide");
    });
  }


  /* ---------- reviews block (real JA reviews first, labelled samples fill up to 4) ---------- */
  var RV_SAMPLES = [
    { it: "1785119101", name: "ビタ500 デイリー メガビタミンC 3000 30包", title: "スティックタイプで続けやすい", text: "韓国のビタミンC、スティックを水に溶かして飲んでます。レモンっぽい酸味でさっぱりしてて飲みやすい！パッケージが可愛いので、デスクに置いてるだけで気分が上がります。30包入りで1ヶ月ちょうどなのも◎ また買います♪", who: "さ**", score: 5 },
    { it: "1785119643", name: "デウォンヘルス ぐっすりショット 20g×12", title: "韓国で人気と聞いて試してみました", text: "ひと口サイズのショットで、冷蔵庫で冷やして飲んでます。味は少し甘めでジュースっぽい感じ。小さいから旅行のときも持っていきやすかったです。12本入りなので友達とシェアもできました。", who: "み**", score: 5 },
    { it: "1785119103", name: "ビビラボ マルチビタミン スーパーショット", title: "コンパクトで持ち歩きやすい", text: "小さいボトルだからバッグに入れても邪魔になりません。味はフルーツ系でさっぱり。黄色いパッケージが可愛くて、ついSNSに載せちゃいました（笑）個人的にはもう少し甘さ控えめだと嬉しいかな。", who: "ゆ**", score: 4 },
    { it: "1785119646", name: "セノビス マグネシウム 180錠セット", title: "コスパ良し！家族でシェアしてます", text: "180錠入りで量がたっぷり。粒は思ったより小さめで飲みやすかったです。毎日続けるものだから、この価格はありがたい。注文から届くまでの案内も分かりやすくて安心でした。", who: "は**", score: 5 },
    { it: "1785119099", name: "オーソモル イミューン マルチビタミン&ミネラル 14包入り", title: "個包装だから旅行に便利", text: "1包ずつ分かれてるので、カバンにポンと入れて持ち歩けます。出張や旅行のときに重宝してます。箱もおしゃれだから、ちょっとしたプレゼントにも良さそう。", who: "り**", score: 5 },
    { it: "1785119644", name: "オールザベター ウェルネスグミ 30日分", title: "グミ感覚で食べられて楽しい", text: "サプリはちょっと苦手なんだけど、グミだからおやつ感覚で食べられます。味の種類が選べるのも嬉しい！ちょっとしたギフトにもいいかも。", who: "あ**", score: 4 }
  ];
  var rvCache = null, rvLoading = false;
  function rvDate(iso) { var d = new Date(iso); return isNaN(d) ? "" : d.getFullYear() + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0"); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function stars(n) { n = Math.max(0, Math.min(5, n | 0)); return "★★★★★".slice(0, n) + '<span style="color:#E3E0EC">' + "★★★★★".slice(0, 5 - n) + "</span>"; }
  function rvCard(c) {
    var score = Math.max(0, Math.min(5, Number(c.score) || 0));
    return '<a class="moa-rv-card" href="/item/' + esc(c.it) + '" data-moa>' +
      '<div class="moa-rv-body"><div class="moa-rv-meta"><span class="moa-rv-rate"><span class="moa-rv-stars">' + stars(score) + '</span><b>' + score.toFixed(1) + '</b></span>' +
      (c.sample ? '<span class="moa-rv-tag">サンプル</span>' : '<span class="moa-rv-date"><i>' + esc(String(c.date).slice(0, 5)) + '</i>' + esc(String(c.date).slice(5)) + '</span>') + '</div>' +
      '<h3 class="moa-rv-h">' + esc(c.title) + '</h3><p class="moa-rv-text">' + esc(c.text) + '</p><span class="moa-rv-who">' + esc(c.who) + '</span></div>' +
      '<div class="moa-rv-prod"><img src="' + esc(c.thumb || IMG(c.it)) + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'"><span>' + esc(c.name) + '</span>' + ICON.chev + '</div></a>';
  }
  function rvCards() {
    var real = (rvCache || []).filter(function (r) { return /[぀-ヿ一-鿿]/.test((r.is_subject || "") + (r.is_content || "")); }).slice(0, 6).map(function (r) {
      return { it: r.it_id, thumb: r.it_img1 || "", name: r.it_name || "", img: r.is_img ? r.is_img : (r.it_img1 || ""), title: r.is_subject || "", text: r.is_content || "", who: r.mb_id_masked || "", score: r.is_score, date: rvDate(r.is_time), sample: false };
    });
    var out = real.slice();
    for (var i = 0; out.length < 6 && i < RV_SAMPLES.length; i++) {
      var sm = RV_SAMPLES[i];
      out.push({ it: sm.it, name: sm.name, img: "", title: sm.title, text: sm.text, who: sm.who, score: sm.score, date: "サンプル", sample: true });
    }
    return { cards: out, hasSample: out.some(function (c) { return c.sample; }) };
  }
  function renderReviews(sec) {
    var r = rvCards();
    sec.innerHTML = '<div class="moa-wrap">' +
      '<div class="moa-rv-head"><div><p class="moa-rv-eyebrow">LATEST REVIEWS</p>' +
        '<h2 class="moa-rv-title">写真で出会う、みんなの使い心地 <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><path d="M12 1.5c.6 4.8 3.2 8.4 8.5 10.5-5.3 2.1-7.9 5.7-8.5 10.5C11.4 17.7 8.8 14.1 3.5 12 8.8 9.9 11.4 6.3 12 1.5Z"/></svg></h2>' +
        '<p class="moa-rv-sub">買って、使ってみた、正直な感想をお届けします。</p></div>' +
        '<a class="moa-rv-all" href="/reviews" data-moa>すべてのレビューを見る ' + ICON.out.replace('width="12" height="12"', 'width="16" height="16"') + '</a></div>' +
      '<div class="moa-rv-tools"><span class="moa-pill">すべてのレビュー</span><span class="moa-rv-note">新着順 · 最新' + r.cards.length + '件</span></div>' +
      '<div class="moa-rv-grid">' + r.cards.map(rvCard).join("") + '</div>' +
      (r.hasSample ? '<p class="moa-rv-foot">※「SAMPLE」表示のカードはデザイン確認用のサンプルです。実際のご購入レビューではありません。実際のレビューが増えると自動的に置き換わります。</p>' : '') +
      '</div>';
  }
  function ensureReviews() {
    var main = qs("main");
    var old = qs("#moa-reviews");
    var notice = main && qs("main > [data-moa-notice]");
    if (!isHome() || !notice) { if (old) old.remove(); return; }
    if (old && old.isConnected) return;
    var sec = el("section"); sec.id = "moa-reviews"; sec.setAttribute("data-moa-rv", "1");
    notice.parentNode.insertBefore(sec, notice);
    renderReviews(sec);
    if (rvCache === null && !rvLoading) {
      rvLoading = true;
      fetch("/api/shop/reviews").then(function (r) { return r.json(); }).then(function (d) {
        rvCache = Array.isArray(d) ? d : ((d && d.reviews) || []);
      }).catch(function () { rvCache = []; }).then(function () {
        rvLoading = false;
        var cur = qs("#moa-reviews"); if (cur) renderReviews(cur);
      });
    }
  }

  var heroLoading = false, bannersCache = null;
  function ensureHero() {
    var h = qs("#moa-hero");
    if (!isHome()) { if (h) { h.remove(); clearTimeout(heroTimer); } var m = qs("main > section[data-moa-hid]"); if (m) { m.style.display = ""; m.removeAttribute("data-moa-hid"); } return; }
    if (h && h.isConnected) return;
    if (heroLoading) return;
    var first = qs("main > section");
    if (!first) return;
    first.setAttribute("data-moa-hid", "1");
    if (bannersCache) { buildHero(bannersCache); return; }
    heroLoading = true;
    fetch("/api/shop/hero-banners", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) {
      bannersCache = ((d && d.banners) || []).filter(function (b) { return b && typeof b.imageUrl === "string" && b.imageUrl; });
    }).catch(function () { bannersCache = []; }).then(function () {
      heroLoading = false;
      if (isHome() && !qs("#moa-hero")) buildHero(bannersCache);
    });
  }

  /* ---------- admin-managed exhibitions (企画展): /api/shop/exhibitions ---------- */
  var exhCache = null, exhAt = 0, exhLoading = false, exhWaiters = [], exhSig = "", exhPageSig = "", exhOldTitle = null;
  var EXH_CSS = ".moa-exh-wrap .moa-exh-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}@media (min-width:768px){.moa-exh-wrap .moa-exh-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}@media (min-width:1100px){.moa-exh-wrap .moa-exh-grid{grid-template-columns:repeat(6,minmax(0,1fr))}}.moa-exh-wrap section{padding-top:40px;padding-bottom:8px}.moa-exh-wrap a.group{text-decoration:none;color:inherit}.moa-exh-wrap .moa-exh-so{position:absolute;inset:0;background:rgba(255,255,255,.62);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#555;letter-spacing:.06em;z-index:4}.moa-exh-wrap a.moa-exh-more{text-decoration:none}.moa-exh-crumb{font-size:12.5px;color:#8a86a0;margin-bottom:18px}.moa-exh-crumb a{color:#8a86a0;text-decoration:none}.moa-exh-crumb a:hover{color:#6E48D9}.moa-exh-h1{font-size:clamp(24px,3vw,34px);font-weight:800;letter-spacing:-.01em;color:#17142B;margin:0}.moa-exh-sub{margin:8px 0 0;color:#6B6785;font-size:15px}.moa-exh-count{display:inline-block;margin-top:14px;padding:5px 12px;border-radius:99px;background:#EDE8FB;color:#5632B8;font-size:12.5px;font-weight:700}.moa-exh-empty{padding:90px 0;text-align:center;color:#6B6785}.moa-exh-empty a{display:inline-block;margin-top:16px;padding:12px 24px;border-radius:12px;background:#6E48D9;color:#fff;font-weight:700;text-decoration:none}body.moa-exh-page main > *:not(#moa-exh-page){display:none!important}";
  function exhYen(n) { return Number(n || 0).toLocaleString("en-US") + "円"; }
  function exhCard(it) {
    var pct = it.cust_price > it.price && it.price > 0 ? Math.round((it.cust_price - it.price) / it.cust_price * 100) : 0;
    var img = String(it.img || "");
    if (img.indexOf("/api/product-image/") === 0 && img.indexOf("?") < 0) img += "?w=400";
    return '<a class="group relative bg-card rounded-xl overflow-hidden elegant-shadow hover:elegant-shadow-lg transition-all duration-300 cursor-pointer flex flex-col" href="/item/' + esc(it.it_id) + '" data-moa-exh-link>' +
      '<div class="relative overflow-hidden bg-secondary/30 shrink-0 aspect-square">' +
      (pct ? '<div class="absolute top-2 left-2 z-[3] flex flex-col gap-1"><span class="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">-' + pct + '%</span></div>' : "") +
      '<img alt="' + esc(it.name) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="' + esc(img) + '">' +
      (it.soldout ? '<div class="moa-exh-so">SOLD OUT</div>' : "") + '</div>' +
      '<div class="p-2.5 flex flex-col gap-1 shrink-0"><h3 class="line-clamp-2 leading-snug text-xs font-normal text-foreground/90 min-h-[38px]">' + esc(it.name) + '</h3>' +
      '<div class="mt-1">' + (pct ? '<p class="text-muted-foreground line-through mb-0.5 text-[11px]">' + exhYen(it.cust_price) + '</p>' : '<p class="mb-0.5 text-[11px]">&nbsp;</p>') +
      '<div class="flex items-baseline gap-1">' + (pct ? '<span class="font-bold text-destructive text-sm">' + pct + '%</span>' : "") + '<span class="font-bold text-foreground price-text text-sm">' + exhYen(it.price) + '</span></div></div></div></a>';
  }
  var EXH_ARROW = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>';
  function exhHtml(list) {
    return list.map(function (e) {
      return '<section class="py-10"><div class="flex items-end justify-between mb-6"><div><h2 class="text-2xl font-bold tracking-tight text-foreground">' + esc(e.title) + '</h2>' +
        (e.subtitle ? '<p class="text-sm text-muted-foreground mt-1">' + esc(e.subtitle) + '</p>' : "") + '</div>' +
        '<a class="moa-exh-more text-sm font-medium text-primary hover:underline flex items-center gap-1" href="/exhibition/' + e.id + '" data-moa-exh-link>すべて見る ' + EXH_ARROW + '</a></div>' +
        '<div class="moa-exh-grid">' + e.items.slice(0, 6).map(exhCard).join("") + '</div></section>';
    }).join("");
  }
  function exhBindClicks(host) {
    host.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest("a[data-moa-exh-link]");
      if (!a || ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return;
      ev.preventDefault();
      var href = a.getAttribute("href") || "/";
      if (/^\/exhibition\/\d+\/?$/.test(href)) document.body.classList.add("moa-exh-page");
      nav(href);
    });
  }
  function exhStyle() {
    if (document.getElementById("moa-exh-style")) { var o = document.getElementById("moa-exh-style"); if (o.textContent !== EXH_CSS) o.textContent = EXH_CSS; return; }
    var st = document.createElement("style"); st.id = "moa-exh-style"; st.textContent = EXH_CSS; document.head.appendChild(st);
  }
  function getExh(cb) {
    if (exhCache && (Date.now() - exhAt < 20000)) { cb(exhCache); return; }
    if (exhLoading) { exhWaiters.push(cb); if (exhCache) cb(exhCache); return; }
    exhLoading = true; exhWaiters.push(cb);
    fetch("/api/shop/exhibitions", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) {
      exhCache = (d && d.exhibitions || []).filter(function (e) { return e && e.items && e.items.length; });
      exhAt = Date.now();
    }).catch(function () { exhCache = exhCache || []; exhAt = Date.now(); }).then(function () {
      exhLoading = false;
      var w = exhWaiters; exhWaiters = [];
      w.forEach(function (f) { try { f(exhCache); } catch (e) {} });
    });
  }
  function renderExhibitions(list) {
    var host = qs("#moa-exh");
    if (!isHome() || !list.length) { if (host) host.remove(); exhSig = ""; return; }
    var sig = JSON.stringify(list);
    var anchor = qs("main > div.container:not(#moa-exh)");
    if (!anchor) return;
    if (host && host.isConnected && sig === exhSig) return;
    exhStyle();
    if (!host) {
      host = document.createElement("div"); host.id = "moa-exh"; host.className = "container moa-exh-wrap";
      exhBindClicks(host);
    }
    host.innerHTML = exhHtml(list);
    exhSig = sig;
    if (host.parentNode !== anchor.parentNode || host.nextSibling !== anchor) anchor.parentNode.insertBefore(host, anchor);
  }
  function ensureExhibitions() {
    var host = qs("#moa-exh");
    if (!isHome()) { if (host) host.remove(); exhSig = ""; return; }
    getExh(function (list) { if (isHome()) renderExhibitions(list); });
  }

  /* detail page: /exhibition/:id (rendered inside <main>, the SPA's own 404 is hidden) */
  function exhPageId() { var m = /^\/exhibition\/(\d+)\/?$/.exec(location.pathname); return m ? Number(m[1]) : 0; }
  function renderExhPage(list, id) {
    var main = qs("main");
    if (!main || exhPageId() !== id) return;
    var host = qs("#moa-exh-page");
    var ex = null;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) ex = list[i];
    var sig = id + ":" + (ex ? JSON.stringify(ex) : "none");
    if (host && host.isConnected && host.parentNode === main && sig === exhPageSig) return;
    exhStyle();
    if (!host) {
      host = document.createElement("div"); host.id = "moa-exh-page"; host.className = "container moa-exh-wrap";
      exhBindClicks(host);
    }
    if (ex) {
      host.innerHTML = '<section class="py-10"><div class="moa-exh-crumb"><a href="/" data-moa-exh-link>ホーム</a> › 企画展</div>' +
        '<h1 class="moa-exh-h1">' + esc(ex.title) + '</h1>' + (ex.subtitle ? '<p class="moa-exh-sub">' + esc(ex.subtitle) + '</p>' : "") +
        '<span class="moa-exh-count">全' + ex.items.length + '商品</span>' +
        '<div class="moa-exh-grid" style="margin-top:26px">' + ex.items.map(exhCard).join("") + '</div></section>';
      if (exhOldTitle === null) exhOldTitle = document.title;
      document.title = ex.title + " | seoulmono";
    } else {
      host.innerHTML = '<div class="moa-exh-empty"><p>この企画展は終了したか、見つかりませんでした。</p><a href="/" data-moa-exh-link>ホームに戻る</a></div>';
    }
    exhPageSig = sig;
    if (host.parentNode !== main) main.appendChild(host);
    window.scrollTo(0, 0);
  }
  function ensureExhPage() {
    var id = exhPageId();
    var host = qs("#moa-exh-page");
    document.body.classList.toggle("moa-exh-page", !!id);
    if (!id) {
      if (host) host.remove();
      exhPageSig = "";
      if (exhOldTitle !== null) { document.title = exhOldTitle; exhOldTitle = null; }
      return;
    }
    getExh(function (list) { if (exhPageId() === id) renderExhPage(list, id); });
  }

  /* ---------- lifecycle ---------- */
  var pending = false;
  function ensure() {
    pending = false;
    injectCss();
    document.body.classList.toggle("moa-home", isHome() && !window.__moaHeroFail);
    if (!isHome()) document.body.classList.remove("moa-ready");
    if (!document.getElementById("moa-header")) buildHeader();
    if (document.getElementById("moa-header")) { document.body.classList.remove("moa-fail"); initMascot(); }
    ensureMobileLogo();
    tryShrink();
    syncHeader();
    if (!window.__smNewHome) {
      ensureHero();
      tagHomeSections();
      ensureReviews();
      ensureExhibitions();
    }
    ensureExhPage();
    if (!window.__smNewHome) { tagRank(); layoutWide(); }
  }
  function schedule() { if (pending) return; pending = true; setTimeout(ensure, 30); }

  function onScroll() {
    var st = qs(".moa-sticky");
    if (!st) return;
    var y = window.scrollY;
    if (y > 110) st.classList.add("is-compact");
    else if (y < 40) st.classList.remove("is-compact");
  }

  function boot() {
    startIntro();
    window.addEventListener("scroll", onScroll, { passive: true });
    injectCss();
    document.body.classList.toggle("moa-home", isHome());
    ensure();
    setTimeout(function () {
      if (!document.getElementById("moa-header")) document.body.classList.add("moa-fail");
      if (!window.__smNewHome && isHome() && !document.getElementById("moa-hero")) { window.__moaHeroFail = true; document.body.classList.remove("moa-home"); }
    }, 8000);
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", schedule);
    window.addEventListener("cart-updated", function () { setTimeout(schedule, 80); });
    window.addEventListener("storage", schedule);
    window.addEventListener("resize", schedule);
  }
  if (document.body) boot(); else document.addEventListener("DOMContentLoaded", boot);
})();
