(function () {
  "use strict";

  function killGiftSendFlow() {
    var p = location.pathname;
    if (p.indexOf("/gift/receive/") === 0 || p.indexOf("/gift/recipient/") === 0) return;
    if (p === "/gift" || p.indexOf("/gift/") === 0) {
      location.replace("/");
    }
  }
  killGiftSendFlow();

  var BANNERS = [
    {
      titleLines: ["韓国スナック", "セレクション"],
      bg: "linear-gradient(135deg,#FF9DBB 0%,#FFD3A6 100%)",
      textColor: "#3A1230",
      emojis: ["🍜", "🍿", "🧀"]
    },
    {
      titleLines: ["韓国サプリ", "セレクション"],
      bg: "linear-gradient(135deg,#8FE3B0 0%,#C8F4D8 100%)",
      textColor: "#0F3B26",
      emojis: ["💊", "🌿", "✅"]
    },
    {
      titleLines: ["韓国ドラッグストア", "コスメセレクション"],
      bg: "linear-gradient(135deg,#B18CFF 0%,#8CD9FF 100%)",
      textColor: "#241250",
      emojis: ["💄", "✨", "🛍️"]
    },
    {
      titleLines: ["seoulmono厳選", "ギフトセットまとめ"],
      bg: "linear-gradient(135deg,#FFD3EC 0%,#D8C4FF 100%)",
      textColor: "#3A1250",
      emojis: ["🎁", "🎀", "🍬"]
    }
  ];

  var GRID_ID = "sorosoro-banner-grid";
  var ROW_ID = "sorosoro-banner-row";
  var BEST_ID = "sorosoro-bestseller-card";
  var HERO_ID = "sorosoro-hero-carousel";
  // Hero banners managed in the admin menu ('배너 관리'). null = not loaded yet, [] = none configured (built-in cards are used),
  // [...] = {imageUrl, mobileImageUrl, linkUrl, title} in display order. Images keep their own ratio at every screen width.
  var HERO_API = "/api/shop/hero-banners";
  var heroBanners = null;
  var heroFetchStarted = false;
  function fetchHeroBanners() {
    if (heroFetchStarted) return;
    heroFetchStarted = true;
    fetch(HERO_API, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var list = d && Array.isArray(d.banners) ? d.banners : [];
        heroBanners = list.filter(function (b) { return b && typeof b.imageUrl === "string" && b.imageUrl.length > 0; });
      })
      .catch(function () { heroBanners = []; });
  }
  var STYLE_ID = "sorosoro-banner-grid-style";
  var bestsellerHtml = null;
  var COLLECT_ID = "sorosoro-collection-section";
  var collectionPages = null;
  var collectionPageIdx = 0;

  if (location.pathname === "/") fetchHeroBanners();
  fetch("/api/shop/home")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var items = (data.best || []).slice(0, 10);
      if (!items.length) return;
      var rows = items
        .map(function (it, i) {
          return (
            '<li><button class="w-full flex items-center gap-2.5 py-1.5 group">' +
            '<span class="text-xs font-bold w-4 shrink-0 text-primary">・</span>' +
            '<span class="text-xs text-foreground group-hover:text-primary transition-colors truncate flex-1 text-left">' +
            (it.it_name_ja || it.it_name) +
            "</span></button></li>"
          );
        })
        .join("");
      bestsellerHtml =
        '<div class="flex items-center gap-2 mb-3 pb-2 border-b border-border/60">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up w-4 h-4 text-primary" aria-hidden="true"><path d="M22 7 13.5 15.5 8.5 10.5 2 17"></path><path d="M16 7h6v6"></path></svg>' +
        '<h3 class="text-sm font-bold">ピックアップ商品</h3>' +
        "</div>" +
        '<ol class="space-y-1">' + rows + "</ol>";

      var pool = (data.best || []).filter(function (it) { return it.it_img1; });
      collectionPages = [];
      for (var i = 0; i < pool.length; i += 9) {
        collectionPages.push(pool.slice(i, i + 9));
      }

      inject();
    })
    .catch(function () {});

  function authHeaders() {
    var token = localStorage.getItem("allddaom_token");
    return token ? { Authorization: "Bearer " + token } : {};
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      "html{background:#fff!important}" +
      ".item-info-section button{box-shadow:none!important}" +
      ".container{max-width:1440px!important}" +
      ".page-wrap{max-width:1440px!important}" +
      "body{background:#fff!important}" +
      ".ssr-cart-items-card{border:1px solid #eee!important;border-radius:12px!important;overflow:hidden!important}" +
      "@media (max-width:768px){.cart-layout,.checkout-grid{flex-direction:column!important}.cart-summary,.checkout-sticky-right{width:100%!important;position:static!important;top:auto!important}}" +
      "#" + ROW_ID + "{display:grid;grid-template-columns:1fr 260px 260px;gap:24px;align-items:stretch;margin-top:40px;margin-bottom:40px}" +
      "@media (max-width:1279px){#" + ROW_ID + "{grid-template-columns:1fr}#" + ROW_ID + " >:nth-child(2),#" + ROW_ID + " >:nth-child(3){display:none}}" +
      "#" + BEST_ID + " ol{list-style:none;margin:0;padding:0}" +
      "#" + BEST_ID + " li button{background:none;border:none;cursor:pointer;text-align:left}" +
      "#" + GRID_ID + "{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:16px;height:100%}" +
      "#" + GRID_ID + " .ssr-banner-card{position:relative;display:flex;align-items:center;border-radius:16px;overflow:hidden;min-height:140px;padding:20px 24px;text-decoration:none;transition:transform .2s ease,box-shadow .2s ease;box-shadow:0 1px 2px rgba(58,35,80,.06)}" +
      "#" + GRID_ID + " .ssr-banner-card:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(58,35,80,.14)}" +
      "#" + GRID_ID + " .ssr-banner-decor{position:absolute;inset:0;pointer-events:none;overflow:hidden}" +
      "#" + GRID_ID + " .ssr-banner-decor span{position:absolute;font-size:64px;opacity:.35;filter:drop-shadow(0 4px 8px rgba(0,0,0,.08))}" +
      "#" + GRID_ID + " .ssr-banner-decor span:nth-child(1){right:10%;top:8%;font-size:80px;transform:rotate(-8deg)}" +
      "#" + GRID_ID + " .ssr-banner-decor span:nth-child(2){right:28%;bottom:6%;font-size:52px;transform:rotate(10deg)}" +
      "#" + GRID_ID + " .ssr-banner-decor span:nth-child(3){right:2%;bottom:-6%;font-size:70px;transform:rotate(6deg)}" +
      "#" + GRID_ID + " .ssr-banner-body{position:relative;z-index:1;max-width:62%}" +
      "#" + GRID_ID + " .ssr-banner-title{margin:0;font-size:20px;font-weight:700;text-shadow:0 1px 0 rgba(255,255,255,.25);font-family:\"Zen Kaku Gothic New\",\"Noto Sans JP\",sans-serif;line-height:1.45}" +
      "@media (max-width:640px){#" + GRID_ID + "{grid-template-columns:1fr}}" +
      "@media (min-width:768px){.grid.grid-cols-2.md\\:grid-cols-4.gap-4:has(> :nth-child(6)){grid-template-columns:repeat(5,minmax(0,1fr))}}" +
      "@media (min-width:1024px){footer .grid.grid-cols-1.lg\\:grid-cols-2{grid-template-columns:0.62fr 1fr;column-gap:96px}}" +
      "#" + HERO_ID + "{position:absolute;top:0;bottom:0;left:32px;right:32px;z-index:1;overflow:hidden;box-sizing:border-box}" +
      "#" + HERO_ID + " .ssr-carousel-track{display:flex;height:100%;gap:16px;transition:transform .5s cubic-bezier(.4,0,.2,1)}" +
      "#" + HERO_ID + " .ssr-carousel-track.ssr-no-anim{transition:none}" +
      "#" + HERO_ID + " .ssr-banner-card{position:relative;display:flex;align-items:center;flex:0 0 600px;width:600px;height:100%;padding:28px 32px;box-sizing:border-box;overflow:hidden;border-radius:18px}" +
      "#" + HERO_ID + " .ssr-banner-decor{position:absolute;inset:0;pointer-events:none;overflow:hidden}" +
      "#" + HERO_ID + " .ssr-banner-decor span{position:absolute;font-size:64px;opacity:.35;filter:drop-shadow(0 4px 8px rgba(0,0,0,.08))}" +
      "#" + HERO_ID + " .ssr-banner-decor span:nth-child(1){right:8%;top:10%;font-size:78px;transform:rotate(-8deg)}" +
      "#" + HERO_ID + " .ssr-banner-decor span:nth-child(2){right:26%;bottom:8%;font-size:50px;transform:rotate(10deg)}" +
      "#" + HERO_ID + " .ssr-banner-decor span:nth-child(3){right:2%;bottom:-8%;font-size:68px;transform:rotate(6deg)}" +
      "#" + HERO_ID + " .ssr-banner-body{position:relative;z-index:1;max-width:64%}" +
      "#" + HERO_ID + " .ssr-banner-title{margin:0;font-size:19px;font-weight:700;text-shadow:0 1px 0 rgba(255,255,255,.25);font-family:\"Zen Kaku Gothic New\",\"Noto Sans JP\",sans-serif;line-height:1.4}" +
      "#" + HERO_ID + " .ssr-carousel-controls{position:absolute;left:32px;right:32px;bottom:8px;z-index:2;display:flex;align-items:center;gap:14px}" +
      "#" + HERO_ID + " .ssr-carousel-progress{flex:1;height:3px;background:rgba(40,20,60,.15);border-radius:2px;overflow:hidden}" +
      "#" + HERO_ID + " .ssr-carousel-progress-bar{height:100%;width:0;background:rgba(40,20,60,.6);border-radius:2px}" +
      "#" + HERO_ID + " .ssr-carousel-buttons{display:flex;gap:8px;flex-shrink:0}" +
      "#" + HERO_ID + " .ssr-carousel-btn{width:28px;height:28px;border-radius:50%;border:none;background:rgba(255,255,255,.75);color:#3A2350;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;line-height:1;padding:0;transition:background .15s ease}" +
      "#" + HERO_ID + " .ssr-carousel-btn:hover{background:#fff}" +
      "#" + HERO_ID + " .ssr-carousel-controls{display:none}" +
      "@media (max-width:1300px){#" + HERO_ID + " .ssr-banner-card{flex:0 0 460px;width:460px}}" +
      "@media (max-width:900px){#" + HERO_ID + " .ssr-banner-card{flex:0 0 100%;width:100%}}" +
      "@media (max-width:640px){#" + HERO_ID + " .ssr-banner-body{max-width:100%}#" + HERO_ID + " .ssr-banner-title{font-size:16px}}" +
      "#" + HERO_ID + ".ssr-hero-img{position:relative;top:auto;bottom:auto;left:auto;right:auto;width:calc(100% - 64px);max-width:1800px;margin:0 auto;height:auto;overflow:hidden}" +
      "#" + HERO_ID + ".ssr-hero-img .ssr-carousel-track{height:auto;align-items:flex-start}" +
      "#" + HERO_ID + ".ssr-hero-img .ssr-banner-card{flex:0 0 100%;width:100%;height:auto;padding:0;display:block;background:#f3f0f8;border-radius:16px;overflow:hidden;text-decoration:none}" +
      "#" + HERO_ID + ".ssr-hero-img .ssr-banner-card img{display:block;width:100%;height:auto}" +
      "@media (max-width:900px){#" + HERO_ID + ".ssr-hero-img{width:calc(100% - 32px)}#" + HERO_ID + ".ssr-hero-img .ssr-banner-card{border-radius:12px}}" +
      // PC (> 900px): the same two-up layout, but the cards are a percentage of the hero width (37.8% = 460px at 1216px) and keep the
      // 460:250 ratio, so the whole banner row scales with the window instead of being clipped; uploaded images keep their own ratio
      "@media (min-width:901px){#" + HERO_ID + "{position:relative;top:auto;bottom:auto;left:auto;right:auto;margin:0 32px;height:auto}" +
      "#" + HERO_ID + " .ssr-carousel-track{height:auto;align-items:flex-start}" +
      "#" + HERO_ID + " .ssr-banner-card{flex:0 0 37.8%;width:37.8%;height:auto;aspect-ratio:46/25}" +
      "#" + HERO_ID + ".ssr-hero-img{width:auto;max-width:none;margin:0 32px}" +
      "#" + HERO_ID + ".ssr-hero-img .ssr-banner-card{aspect-ratio:auto}}";
    document.head.appendChild(style);
  }

  function buildSlideCard(b) {
    var card = document.createElement("div");
    card.className = "ssr-banner-card";
    card.style.background = b.bg;
    var titleHtml = b.titleLines.join("<br>");
    var emojiHtml = b.emojis.map(function (e) { return "<span>" + e + "</span>"; }).join("");
    card.innerHTML =
      '<div class="ssr-banner-decor">' + emojiHtml + "</div>" +
      '<div class="ssr-banner-body">' +
      '<h3 class="ssr-banner-title" style="color:' + b.textColor + '">' + titleHtml + "</h3>" +
      "</div>";
    return card;
  }

  function buildImageCard(b) {
    var card = document.createElement(b.linkUrl ? "a" : "div");
    card.className = "ssr-banner-card ssr-banner-card-img";
    if (b.linkUrl) {
      card.href = b.linkUrl;
      if (/^https?:\/\//i.test(b.linkUrl) && b.linkUrl.indexOf(location.origin) !== 0) { card.target = "_blank"; card.rel = "noopener"; }
    }
    var pic = document.createElement("picture");
    if (b.mobileImageUrl) {
      var src = document.createElement("source");
      src.media = "(max-width:900px)";
      src.srcset = b.mobileImageUrl;
      pic.appendChild(src);
    }
    var img = document.createElement("img");
    img.src = b.imageUrl;
    img.alt = b.title || "";
    img.decoding = "async";
    img.addEventListener("load", function () { window.dispatchEvent(new Event("resize")); }); // re-measure once the real size is known
    pic.appendChild(img);
    card.appendChild(pic);
    return card;
  }

  function buildGrid() {
    var grid = document.createElement("div");
    grid.id = GRID_ID;
    BANNERS.forEach(function (b) {
      grid.appendChild(buildSlideCard(b));
    });
    return grid;
  }

  function buildHeroCarousel() {
    var wrap = document.createElement("div");
    wrap.id = HERO_ID;
    // banners from the admin menu (images, one per view, own ratio) or the built-in cards when none are configured
    var imgMode = !!(heroBanners && heroBanners.length);
    var list = imgMode ? heroBanners : BANNERS;
    var build = imgMode ? buildImageCard : buildSlideCard;
    if (imgMode) wrap.className = "ssr-hero-img";

    var track = document.createElement("div");
    track.className = "ssr-carousel-track";
    if (list.length < 2) {
      track.appendChild(build(list[0]));
      wrap.appendChild(track);
      return wrap;
    }
    // lead clone (last banner) + real banners + 2 trail clones (first, second banner) for seamless looping
    var order = [list.length - 1].concat(list.map(function (_, i) { return i; })).concat([0, 1]);
    order.forEach(function (bannerIdx) {
      track.appendChild(build(list[bannerIdx % list.length]));
    });
    wrap.appendChild(track);

    var controls = document.createElement("div");
    controls.className = "ssr-carousel-controls";
    controls.innerHTML =
      '<div class="ssr-carousel-progress"><div class="ssr-carousel-progress-bar"></div></div>' +
      '<div class="ssr-carousel-buttons">' +
      '<button class="ssr-carousel-btn" data-action="prev" aria-label="前へ">&#8249;</button>' +
      '<button class="ssr-carousel-btn" data-action="toggle" aria-label="一時停止">&#10073;&#10073;</button>' +
      '<button class="ssr-carousel-btn" data-action="next" aria-label="次へ">&#8250;</button>' +
      "</div>";
    wrap.appendChild(controls);

    initCarousel(wrap, track, controls, list.length, imgMode);
    return wrap;
  }

  function initCarousel(wrap, track, controls, totalCount, imgMode) {
    var total = totalCount || BANNERS.length;
    var index = 1; // position 1 = first real banner (position 0 is the lead clone)
    var playing = true;
    var intervalMs = 4000;
    var timer = null;
    var snapTimeout = null;
    var progressBar = controls.querySelector(".ssr-carousel-progress-bar");
    var toggleBtn = controls.querySelector('[data-action="toggle"]');

    function stepPx() {
      var first = track.children[0];
      return first ? first.getBoundingClientRect().width + 16 : 0;
    }

    function render(animate) {
      track.classList.toggle("ssr-no-anim", !animate);
      var step = stepPx();
      var slideWidth = step - 16;
      var heroWidth = wrap.getBoundingClientRect().width;
      // phones / small tablets (<= 900px): one banner at a time, filling the hero; larger screens: a centred pair
      var single = window.matchMedia("(max-width:900px)").matches;
      var sec = wrap.parentElement;
      if (sec && sec.tagName === "SECTION") { var fixed = single && !imgMode; sec.style.height = fixed ? "250px" : "auto"; sec.style.minHeight = fixed ? "250px" : "0"; }
      var pairWidth = single ? slideWidth : slideWidth * 2 + 16;
      var centerOffset = (heroWidth - pairWidth) / 2;
      track.style.transform = "translateX(" + (centerOffset - index * step) + "px)";
    }

    function restartProgress() {
      progressBar.style.transition = "none";
      progressBar.style.width = "0%";
      void progressBar.offsetWidth;
      if (playing) {
        progressBar.style.transition = "width " + intervalMs + "ms linear";
        progressBar.style.width = "100%";
      }
    }

    function goTo(newIndex) {
      clearTimeout(snapTimeout);
      index = newIndex;
      render(true);
      restartProgress();
      snapTimeout = setTimeout(function () {
        if (index > total) {
          index = 1;
          render(false);
        } else if (index < 1) {
          index = total;
          render(false);
        }
      }, 520);
    }

    function startTimer() {
      clearInterval(timer);
      if (!playing) return;
      timer = setInterval(function () {
        goTo(index + 1);
      }, intervalMs);
    }

    controls.addEventListener("click", function (e) {
      var btn = e.target.closest(".ssr-carousel-btn");
      if (!btn) return;
      var action = btn.getAttribute("data-action");
      if (action === "next") {
        goTo(index + 1);
        startTimer();
      } else if (action === "prev") {
        goTo(index - 1);
        startTimer();
      } else if (action === "toggle") {
        playing = !playing;
        toggleBtn.innerHTML = playing ? "&#10073;&#10073;" : "&#9654;";
        if (playing) {
          restartProgress();
          startTimer();
        } else {
          clearInterval(timer);
          progressBar.style.transition = "none";
        }
      }
    });

    window.addEventListener("resize", function () {
      render(false);
    });

    render(false);
    restartProgress();
    startTimer();

    if (document.readyState === "complete") {
      render(false);
    } else {
      window.addEventListener("load", function () {
        render(false);
      });
    }
    setTimeout(function () {
      render(false);
    }, 500);
  }

  function findFlexRow() {
    if (location.pathname !== "/") return null;
    var flexRow = document.querySelector("div.flex.gap-6.items-start");
    if (!flexRow) return null;
    var mainCol = flexRow.querySelector(":scope > div.flex-1.min-w-0");
    if (!mainCol) return null;
    var hasHomeMarker = Array.from(mainCol.querySelectorAll("section")).some(function (s) {
      return /ベスト|베스트|best/i.test(s.textContent.slice(0, 20));
    });
    return hasHomeMarker ? { flexRow: flexRow, mainCol: mainCol } : null;
  }

  function hideRecentlyViewed(sidebar) {
    if (!sidebar) return;
    Array.from(sidebar.children).forEach(function (card) {
      var t = card.textContent;
      if ((t.indexOf("最近見た商品") === 0 || t.indexOf("최근 본 상품") === 0) && card.style.display !== "none") {
        card.style.display = "none";
      }
    });
  }

  function findRankingCard(sidebar) {
    return Array.from(sidebar.children).find(function (c) {
      var t = c.textContent;
      return t.indexOf("おすすめ検索キーワード") === 0 || t.indexOf("추천 검색어") === 0 || t.indexOf("リアルタイム人気検索ワード") === 0 || t.indexOf("人気の検索キーワード") === 0 || t.indexOf("실시간 인기 검색어") === 0 || t.indexOf("실시간인기검색어") === 0;
    });
  }

  function findBestSection(mainCol) {
    return Array.from(mainCol.children).find(function (s) {
      return s.tagName === "SECTION" && /ベスト|베스트|best/i.test(s.textContent.slice(0, 20));
    });
  }

  function injectHeroCarousel() {
    if (location.pathname !== "/") return;
    if (document.getElementById(HERO_ID)) return;
    var heroSection = Array.from(document.querySelectorAll("section")).find(function (s) {
      return s.textContent.indexOf("公式ストア") !== -1 || s.textContent.indexOf("공식 스토어") !== -1;
    });
    if (!heroSection) return;
    if (heroBanners === null) { fetchHeroBanners(); return; } // the next tick builds the hero once the list is known
    ensureStyle();
    Array.prototype.forEach.call(heroSection.querySelectorAll(":scope > div"), function (child) {
      child.style.display = "none";
    });
    var imgMode = !!(heroBanners && heroBanners.length);
    var fixedHeight = !imgMode && window.matchMedia("(max-width:900px)").matches;
    heroSection.style.minHeight = fixedHeight ? "250px" : "0";
    heroSection.style.height = fixedHeight ? "250px" : "auto";
    heroSection.style.background = "#FFFFFF";
    heroSection.style.maxWidth = "none";
    heroSection.style.width = "100vw";
    heroSection.style.marginLeft = "calc(50% - 50vw)";
    heroSection.style.marginRight = "calc(50% - 50vw)";
    heroSection.style.marginTop = "12px";
    heroSection.style.marginBottom = "12px";
    heroSection.appendChild(buildHeroCarousel());
  }

  function inject() {
    var row = document.getElementById(ROW_ID);
    if (!row) {
      var found = findFlexRow();
      if (!found) return;
      var sidebar = found.flexRow.children[1];
      if (!sidebar) return;
      hideRecentlyViewed(sidebar);
      var rankingCard = findRankingCard(sidebar);
      if (!rankingCard) return;
      var bestSection = findBestSection(found.mainCol);
      if (!bestSection) return;

      ensureStyle();
      row = document.createElement("div");
      row.id = ROW_ID;
      row.appendChild(buildGrid());
      row.appendChild(rankingCard);
      found.mainCol.insertBefore(row, bestSection.nextSibling);
      sidebar.style.display = "none";
    }

    if (row.children.length < 3 && bestsellerHtml) {
      var bestCard = document.createElement("div");
      bestCard.id = BEST_ID;
      bestCard.className = "bg-card rounded-xl p-4 elegant-shadow";
      bestCard.innerHTML = bestsellerHtml;
      row.appendChild(bestCard);
    }
  }

  var TAG_STOP = /^(個|錠|包|枚|本|箱|セット|入り|分|回|選んで購入|から|選択1|選択|プレゼント|付き|\+|1)$/;
  var TAG_MEASURE = /^\d[\d.,]*(g|mg|ml|kg|cm|mm|%|円|個|錠|包|枚|本|箱|日分|ヶ月分|週間分|回|種)/i;

  function extractTags(name) {
    var cleaned = name.replace(/[\[【()（）\]】]/g, " ");
    var tokens = cleaned.split(/[\s・\/+×xX]+/).filter(Boolean);
    var out = [];
    tokens.forEach(function (t) {
      if (TAG_MEASURE.test(t)) return;
      if (TAG_STOP.test(t)) return;
      if (/^[\d.,]+$/.test(t)) return;
      if (t.length < 2) return;
      if (out.indexOf(t) === -1) out.push(t);
    });
    return out.slice(0, 4);
  }

  function enhanceProductCards() {
    var textDivs = document.querySelectorAll(".p-2\\.5.flex.flex-col.gap-1.shrink-0");
    textDivs.forEach(function (div) {
      if (div.getAttribute("data-ssr-tagged")) return;
      div.setAttribute("data-ssr-tagged", "1");
      var h3 = div.querySelector("h3");
      if (!h3) return;
      var priceWrap = div.querySelector(":scope > div.mt-1");
      if (priceWrap && !priceWrap.querySelector(".line-through")) {
        var spacer = document.createElement("p");
        spacer.className = "text-muted-foreground line-through mb-0.5 text-[11px]";
        spacer.style.visibility = "hidden";
        spacer.innerHTML = "&nbsp;";
        priceWrap.insertBefore(spacer, priceWrap.firstChild);
      }

      var card = div.closest(".group.relative.bg-card");
      var img = card ? card.querySelector("img") : null;
      var idMatch = img && img.src ? img.src.match(/product-image\/(\d+)/) : null;
      if (idMatch) {
        var rating = buildRatingRow(idMatch[1]);
        if (priceWrap) priceWrap.insertAdjacentElement("afterend", rating);
        else div.insertBefore(rating, div.firstChild);
      }

      var tags = extractTags(h3.textContent.trim());
      var row = document.createElement("div");
      row.className = "ssr-tag-row";
      row.innerHTML = tags
        .map(function (t) {
          return '<span class="ssr-tag">#' + t + "</span>";
        })
        .join("");
      div.appendChild(row);
    });
  }

  var RATING_OPTIONS = [4.0, 4.2, 4.3, 4.5, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0];

  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function buildRatingRow(productId) {
    var h = hashStr(productId);
    if (h >= 0) {
      var hiddenRow = document.createElement("div");
      hiddenRow.style.display = "none";
      return hiddenRow;
    }
    var rating = RATING_OPTIONS[h % RATING_OPTIONS.length];
    var count = 12 + (h % 280);
    var filled = Math.round(rating);
    var row = document.createElement("div");
    row.className = "ssr-rating-row";
    row.innerHTML =
      '<span class="ssr-rating-stars">' +
      "★".repeat(filled) +
      "☆".repeat(5 - filled) +
      "</span><span class=\"ssr-rating-num\">" +
      rating.toFixed(1) +
      '</span><span class="ssr-rating-count">(' +
      count +
      ")</span>";
    return row;
  }

  function enhanceListViewRatings() {
    var imgs = document.querySelectorAll('main img[src*="product-image"]');
    Array.prototype.forEach.call(imgs, function (img) {
      var thumb = img.parentElement;
      if (!thumb || thumb.style.width !== "90px") return;
      var row = thumb.parentElement;
      if (!row || row.getAttribute("data-ssr-lv-rated") === "1") return;
      var infoDiv = thumb.nextElementSibling;
      if (!infoDiv || !infoDiv.querySelector("p.line-clamp-2")) return;
      var priceRow = infoDiv.lastElementChild;
      if (!priceRow) return;
      row.setAttribute("data-ssr-lv-rated", "1");
      var idMatch = img.src.match(/product-image\/(\d+)/);
      if (!idMatch) return;
      priceRow.insertAdjacentElement("afterend", buildRatingRow(idMatch[1]));
    });
  }

  function ensureTagStyle() {
    if (document.getElementById("sorosoro-tag-style")) return;
    var style = document.createElement("style");
    style.id = "sorosoro-tag-style";
    style.textContent =
      ".ssr-tag-row{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;height:44px;overflow:hidden;align-content:flex-start}" +
      ".ssr-tag{font-size:10px;line-height:1.6;color:#7A4FA0;background:#F3E9FF;padding:2px 7px;border-radius:999px;white-space:nowrap}" +
      ".ssr-rating-row{display:flex;align-items:center;gap:4px;margin-top:4px}" +
      ".ssr-rating-stars{color:#F5A623;font-size:11px;letter-spacing:1px}" +
      ".ssr-rating-num{font-size:11px;font-weight:700;color:#3A2350}" +
      ".ssr-rating-count{font-size:10px;color:#a89bbd}" +
      ".price-text{font-size:16px!important}" +
      ".w-full.py-2\\.5.border-t.border-border.flex.items-center.justify-center.gap-1\\.5.text-xs.font-semibold{display:none!important}";
    document.head.appendChild(style);
  }

  function ensureSearchStyle() {
    if (document.getElementById("sorosoro-search-style")) return;
    var style = document.createElement("style");
    style.id = "sorosoro-search-style";
    style.textContent =
      ".ssr-search-caret{position:absolute;top:50%;transform:translateY(-50%);right:50px;font-size:9px;color:#5C3DB0;pointer-events:none;line-height:1}" +
      ".ssr-search-divider{position:absolute;top:50%;transform:translateY(-50%);right:38px;width:1px;height:18px;background:#D8C4FF;pointer-events:none}";
    document.head.appendChild(style);
  }

  function styleSearchBar() {
    ensureSearchStyle();
    var form = document.querySelector("header form.relative");
    if (!form || form.getAttribute("data-ssr-search") === "1") return;
    var input = form.querySelector("input");
    var btn = form.querySelector("button");
    if (!input || !btn) return;
    form.setAttribute("data-ssr-search", "1");
    input.style.background = "#fff";
    input.style.border = "1.5px solid #8C6BFF";
    input.style.borderRadius = "12px";
    input.style.paddingRight = "76px";
    input.style.height = "48px";
    btn.style.color = "#6E48D9";

    var caret = document.createElement("span");
    caret.className = "ssr-search-caret";
    caret.textContent = "▾";
    var divider = document.createElement("span");
    divider.className = "ssr-search-divider";
    form.appendChild(caret);
    form.appendChild(divider);
  }

  function ensureIconRowStyle() {
    if (document.getElementById("sorosoro-iconrow-style")) return;
    var style = document.createElement("style");
    style.id = "sorosoro-iconrow-style";
    style.textContent =
      ".ssr-hicon-row{display:flex;align-items:center;gap:28px}" +
      "a.ssr-hicon,button.ssr-hicon{display:flex;flex-direction:column;align-items:center;gap:4px;color:#28365E;text-decoration:none;background:none;border:none;cursor:pointer;font-family:inherit;padding:0}" +
      ".ssr-hicon svg{width:24px;height:24px}" +
      ".ssr-hicon span{font-size:12px;font-weight:400;white-space:nowrap}" +
      ".ssr-hicon:hover{color:#6E48D9}" +
      ".ssr-hicon-cartwrap{position:relative;display:inline-flex}" +
      ".ssr-hicon-badge{position:absolute;top:-4px;right:-6px;background:#FF6B35;color:#fff;font-size:10px;font-weight:700;line-height:1;min-width:16px;height:16px;border-radius:999px;display:none;align-items:center;justify-content:center;padding:0 3px}";
    document.head.appendChild(style);
  }

  function ensureCategoryMenuStyle() {
    if (document.getElementById("sorosoro-catmenu-style")) return;
    var style = document.createElement("style");
    style.id = "sorosoro-catmenu-style";
    style.textContent =
      "[data-radix-popper-content-wrapper]:has(>[role='menu']){position:fixed!important;top:var(--ssr-cat-top,140px)!important;left:auto!important;right:var(--ssr-cat-right,16px)!important;transform:none!important}";
    document.head.appendChild(style);
  }

  function updateCategoryMenuPos() {
    var icon = document.querySelector(".ssr-hicon-row .ssr-hicon");
    if (!icon) return;
    var r = icon.getBoundingClientRect();
    document.documentElement.style.setProperty("--ssr-cat-top", Math.round(r.bottom + 8) + "px");
    document.documentElement.style.setProperty("--ssr-cat-right", Math.round(window.innerWidth - r.right) + "px");
  }

  function openCategoryMenu() {
    var navBtn = document.querySelector('nav button[aria-haspopup="menu"]');
    if (!navBtn || navBtn.getAttribute("aria-expanded") === "true") return;
    updateCategoryMenuPos();
    navBtn.focus();
    navBtn.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter", code: "Enter" })
    );
  }

  function closeCategoryMenu() {
    var navBtn = document.querySelector('nav button[aria-haspopup="menu"]');
    if (!navBtn || navBtn.getAttribute("aria-expanded") !== "true") return;
    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape", code: "Escape" })
    );
  }

  var ssrCatCloseTimer = null;
  function scheduleCategoryClose() {
    clearTimeout(ssrCatCloseTimer);
    ssrCatCloseTimer = setTimeout(closeCategoryMenu, 250);
  }
  function cancelCategoryClose() {
    clearTimeout(ssrCatCloseTimer);
  }

  function hideNavCategoryEntry() {
    var navBtn = document.querySelector('nav button[aria-haspopup="menu"]');
    if (!navBtn) return;
    var wrap = navBtn.parentElement;
    if (!wrap || wrap.getAttribute("data-ssr-hidden") === "1") return;
    wrap.setAttribute("data-ssr-hidden", "1");
    wrap.style.display = "none";
    var divider = wrap.nextElementSibling;
    if (divider && divider.className.indexOf("w-px") !== -1) divider.style.display = "none";
  }

  function styleHeaderIcons() {
    ensureIconRowStyle();
    ensureCategoryMenuStyle();
    hideNavCategoryEntry();
    var container = document.querySelector("header .flex.items-center.gap-1");
    if (!container || container.getAttribute("data-ssr-icons") === "1") return;
    var cartLink = container.querySelector('a[href="/cart"]');
    var loginLink = container.querySelector('a[href="/login"]');
    if (!cartLink || !loginLink) return;
    container.setAttribute("data-ssr-icons", "1");
    cartLink.style.display = "none";
    loginLink.style.display = "none";

    var row = document.createElement("div");
    row.className = "ssr-hicon-row";

    var catBtn = document.createElement("button");
    catBtn.type = "button";
    catBtn.className = "ssr-hicon";
    catBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect></svg><span>カテゴリ</span>';
    catBtn.addEventListener("click", openCategoryMenu);
    catBtn.addEventListener("mouseenter", function () {
      cancelCategoryClose();
      openCategoryMenu();
    });
    catBtn.addEventListener("mouseleave", scheduleCategoryClose);

    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest('[role="menu"]')) cancelCategoryClose();
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest('[role="menu"]')) scheduleCategoryClose();
    });
    window.addEventListener("resize", updateCategoryMenuPos);

    var myLink = document.createElement("a");
    myLink.href = loginLink.getAttribute("href");
    myLink.className = "ssr-hicon";
    myLink.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg><span>マイページ</span>';

    var cartA = document.createElement("a");
    cartA.href = "/cart";
    cartA.className = "ssr-hicon";
    cartA.innerHTML =
      '<span class="ssr-hicon-cartwrap"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 11 4-7"></path><path d="m19 11-4-7"></path><path d="M2 11h20"></path><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.6-7.4"></path><path d="M4.5 15.5h15"></path></svg><span class="ssr-hicon-badge" data-ssr-cart-badge>0</span></span><span>カート</span>';

    row.appendChild(catBtn);
    row.appendChild(myLink);
    row.appendChild(cartA);
    container.insertBefore(row, cartLink);
  }

  function ensureHomeTabStyle() {
    if (document.getElementById("sorosoro-hometab-style")) return;
    var style = document.createElement("style");
    style.id = "sorosoro-hometab-style";
    style.textContent =
      ".ssr-home-tab{font-size:15px;font-weight:700;color:#8C6BFF;transition:colors .15s ease;padding:4px 12px;border-radius:4px;flex-shrink:0;background:none;border:none;cursor:pointer;font-family:inherit}" +
      ".ssr-home-tab:hover{color:#8C6BFF}" +
      ".ssr-navtab-black{color:#000!important}";
    document.head.appendChild(style);
  }

  function growPromoBanners() {
    var grid = document.querySelector(".grid.grid-cols-1.sm\\:grid-cols-2.gap-4.py-10");
    if (!grid || grid.getAttribute("data-ssr-promo-h") === "1") return;
    grid.setAttribute("data-ssr-promo-h", "1");
    Array.prototype.forEach.call(grid.children, function (card) {
      var h = card.getBoundingClientRect().height;
      card.style.minHeight = Math.round(h + 20) + "px";
    });
  }

  function styleNavRow() {
    ensureHomeTabStyle();
    var nav = document.querySelector("header nav");
    var header = document.querySelector("header");
    if (!nav || !header) return;
    if (nav.getAttribute("data-ssr-nav") !== "1") {
      nav.setAttribute("data-ssr-nav", "1");
      nav.style.borderTop = "none";
    }
    if (header.getAttribute("data-ssr-header-border") !== "1") {
      header.setAttribute("data-ssr-header-border", "1");
      header.style.borderBottom = "none";
    }
    var tabsRow = nav.querySelector(".flex.items-center.gap-1.overflow-x-auto");
    if (!tabsRow || tabsRow.getAttribute("data-ssr-home") === "1") return;
    tabsRow.setAttribute("data-ssr-home", "1");
    Array.prototype.forEach.call(tabsRow.querySelectorAll("button"), function (b) {
      b.classList.add("ssr-navtab-black");
    });
    var homeBtn = document.createElement("button");
    homeBtn.type = "button";
    homeBtn.className = "ssr-home-tab";
    homeBtn.textContent = localStorage.getItem("sorosoro_language") === "ko" ? "홈" : "ホーム";
    homeBtn.addEventListener("click", function () {
      if (location.pathname !== "/") {
        location.href = "/";
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
    tabsRow.insertBefore(homeBtn, tabsRow.firstChild);
  }

  var TOPBAR_ID = "sorosoro-topbar";

  function ensureTopbarStyle() {
    if (document.getElementById("sorosoro-topbar-style")) return;
    var style = document.createElement("style");
    style.id = "sorosoro-topbar-style";
    style.textContent =
      "#" +
      TOPBAR_ID +
      "{width:100vw;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw)}" +
      "#" + TOPBAR_ID + " .ssr-topbar-event{background:#F3E9FF}" +
      "#" + TOPBAR_ID + " .ssr-topbar-event-inner{max-width:1440px;margin:0 auto;padding:0 1rem;height:46px;display:flex;align-items:center;justify-content:center;gap:12px;position:relative}" +
      "#" + TOPBAR_ID + " .ssr-topbar-event-inner span{font-size:12px;color:#4A2A63;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      "#" + TOPBAR_ID + " .ssr-topbar-cta{flex-shrink:0;background:#6E48D9;color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;text-decoration:none;white-space:nowrap}" +
      "#" + TOPBAR_ID + " .ssr-topbar-cta:hover{background:#5C3DB0}" +
      "#" + TOPBAR_ID + " .ssr-topbar-close{position:absolute;right:1rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#4A2A63;font-size:16px;line-height:1;padding:4px}" +
      "#" + TOPBAR_ID + " .ssr-topbar-links{background:#fff;padding-top:7px}" +
      "#" + TOPBAR_ID + " .ssr-topbar-links-inner{max-width:1440px;margin:0 auto;padding:0 1rem;height:22px;display:flex;align-items:center;justify-content:flex-end;gap:16px}" +
      "#" + TOPBAR_ID + " .ssr-topbar-links-inner a{font-size:11px;color:#6B6470;text-decoration:none;white-space:nowrap}" +
      "#" + TOPBAR_ID + " .ssr-topbar-links-inner a:hover{color:#6E48D9}" +
      "@media (max-width:768px){#" + TOPBAR_ID + " .ssr-topbar-links{display:none}}";
    document.head.appendChild(style);
  }

  function updateTopbarAuthLink() {
    var inner = document.querySelector(".ssr-topbar-links-inner");
    if (!inner) return;
    var link = inner.firstElementChild;
    if (!link || link.tagName !== "A") return;
    var loggedIn = !!localStorage.getItem("allddaom_token");
    var ko = localStorage.getItem("sorosoro_language") === "ko";
    if (loggedIn) {
      if (link.getAttribute("data-ssr-logout") !== "1") {
        link.setAttribute("data-ssr-logout", "1");
        link.setAttribute("href", "#");
        link.addEventListener("click", function (e) {
          e.preventDefault();
          localStorage.removeItem("allddaom_token");
          location.href = "/";
        });
      }
      var outText = ko ? "로그아웃" : "ログアウト";
      if (link.textContent !== outText) link.textContent = outText;
    } else {
      if (link.getAttribute("data-ssr-logout") === "1") {
        link.removeAttribute("data-ssr-logout");
        link.setAttribute("href", "/login");
      }
      var inText = ko ? "로그인" : "ログイン";
      if (link.textContent !== inText) link.textContent = inText;
    }
  }

  function injectTopbar() {
    if (document.getElementById(TOPBAR_ID)) return;
    var header = document.querySelector("header");
    if (!header || !header.parentElement) return;
    ensureTopbarStyle();
    var bar = document.createElement("div");
    bar.id = TOPBAR_ID;
    bar.innerHTML =
      '<div class="ssr-topbar-event"><div class="ssr-topbar-event-inner">' +
      '<span>初回登録で全商品100円購入イベント実施中！</span><a class="ssr-topbar-cta" href="/register">初回登録イベント ›</a>' +
      '<button type="button" class="ssr-topbar-close" aria-label="閉じる">×</button>' +
      "</div></div>" +
      '<div class="ssr-topbar-links"><div class="ssr-topbar-links-inner"><a href="/login">ログイン</a><a href="/register">会員登録</a><a href="/notice">お知らせ</a></div></div>';
    bar.querySelector(".ssr-topbar-close").addEventListener("click", function () {
      bar.querySelector(".ssr-topbar-event").style.display = "none";
    });
    header.parentElement.insertBefore(bar, header);
  }

  function fullBleedSection(section) {
    if (!section || section.getAttribute("data-ssr-fullbleed") === "1") return;
    section.setAttribute("data-ssr-fullbleed", "1");
    section.style.width = "100%";
    section.style.alignSelf = "center";
    var inner = section.firstElementChild;
    if (inner) {
      inner.style.width = "100%";
      inner.style.maxWidth = "1440px";
      inner.style.marginLeft = "auto";
      inner.style.marginRight = "auto";
    }
  }

  function currentPageLabel() {
    var path = location.pathname;
    var params = new URLSearchParams(location.search);
    var ko = localStorage.getItem("sorosoro_language") === "ko";
    if (path === "/products") {
      var sort = params.get("sort");
      if (sort === "new") return ko ? "신상품" : "新着商品";
      if (sort === "popular") return ko ? "베스트" : "ランキング";
      if (sort === "recommended") return ko ? "추천상품" : "おすすめ商品";
      return null;
    }
    if (path === "/events") return ko ? "이벤트" : "イベント";
    if (path === "/notice") return ko ? "공지사항" : "お知らせ";
    return null;
  }

  function makeCrumbHomeBtn() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.style.cssText = "background:none;border:none;cursor:pointer;color:#aaa;font-size:12px;padding:0";
    btn.textContent = localStorage.getItem("sorosoro_language") === "ko" ? "홈" : "ホーム";
    btn.addEventListener("click", function () {
      location.href = "/";
    });
    return btn;
  }

  function fixBreadcrumbAlignment(crumb) {
    var main = document.querySelector("main");
    if (!main) return;
    var mainRect = main.getBoundingClientRect();
    var targetLeft = mainRect.left + 32;
    var targetRight = mainRect.right - 32;

    crumb.style.position = "relative";
    crumb.style.left = "0px";
    crumb.style.width = "100%";
    crumb.style.boxSizing = "border-box";
    crumb.style.marginTop = "0px";
    var rect = crumb.getBoundingClientRect();
    var TARGET_TOP_GAP = 20;
    var topDiff = TARGET_TOP_GAP - (rect.top - mainRect.top);
    if (Math.abs(topDiff) > 1) crumb.style.marginTop = topDiff + "px";
  }

  function styleBreadcrumb() {
    var homeBtn = Array.prototype.find.call(document.querySelectorAll("main button"), function (b) {
      var t = b.textContent.trim();
      return t === "ホーム" || t === "홈";
    });
    var crumb = homeBtn ? homeBtn.parentElement : null;

    if (crumb) {
      fixBreadcrumbAlignment(crumb);
      if (crumb.getAttribute("data-ssr-crumb") === "1") return;
      var labelEl = Array.prototype.find.call(crumb.children, function (c) {
        return c !== homeBtn && c.tagName === "SPAN" && c.textContent.trim() !== "›";
      });
      var label = labelEl ? null : currentPageLabel();
      if (!labelEl && !label) return;
      crumb.setAttribute("data-ssr-crumb", "1");
      crumb.style.justifyContent = "flex-end";
      if (!labelEl) {
        labelEl = document.createElement("span");
        labelEl.style.cssText = "color:#666;font-weight:600";
        labelEl.textContent = label;
        var sep = document.createElement("span");
        sep.textContent = "›";
        crumb.appendChild(sep);
        crumb.appendChild(labelEl);
      }
      crumb.insertBefore(labelEl, crumb.firstChild);
      crumb.appendChild(homeBtn);
      return;
    }

    var label = currentPageLabel();
    if (!label) return;
    var wrap = document.querySelector(".page-wrap") || document.querySelector("main > div");
    if (!wrap || wrap.getAttribute("data-ssr-crumb-added") === "1") return;
    wrap.setAttribute("data-ssr-crumb-added", "1");
    var newCrumb = document.createElement("div");
    newCrumb.style.cssText =
      "display:flex;align-items:center;justify-content:flex-end;gap:5px;margin-bottom:16px;font-size:12px;color:#aaa";
    var newLabel = document.createElement("span");
    newLabel.style.cssText = "color:#666;font-weight:600";
    newLabel.textContent = label;
    var newSep = document.createElement("span");
    newSep.textContent = "›";
    newCrumb.appendChild(newLabel);
    newCrumb.appendChild(newSep);
    newCrumb.appendChild(makeCrumbHomeBtn());
    wrap.insertBefore(newCrumb, wrap.firstChild);
  }

  var RELATED_GAP = 8;
  var RELATED_VISIBLE_COUNT = 5;

  function findRelatedTrack() {
    var heading = Array.prototype.find.call(document.querySelectorAll("main h3"), function (h) {
      return h.textContent.indexOf("その他の商品") !== -1 || h.textContent.indexOf("다른 상품") !== -1;
    });
    if (!heading) return null;
    var section = heading.parentElement ? heading.parentElement.parentElement : null;
    if (!section) return null;
    var scrollParent = section.querySelector('div[style*="overflow-x"]');
    var track = section.querySelector('div[style*="max-content"]');
    if (!scrollParent || !track) return null;
    return { scrollParent: scrollParent, track: track };
  }

  function updateCsPhoneBox() {
    if (location.pathname !== "/cs") return;
    var telLink = document.querySelector('main a[href^="tel:"]');
    if (!telLink) return;
    var iconRow = telLink.parentElement ? telLink.parentElement.parentElement : null;
    var outerBar = iconRow ? iconRow.parentElement : null;
    if (!outerBar || outerBar.getAttribute("data-ssr-csphone") === "1") return;
    outerBar.setAttribute("data-ssr-csphone", "1");
    var stripEl = outerBar.parentElement;
    var headerStrip = stripEl ? stripEl.previousElementSibling : null;
    if (headerStrip) headerStrip.style.borderBottom = "none";
    if (stripEl) {
      stripEl.style.background = "transparent";
      stripEl.style.borderBottom = "none";
      stripEl.style.padding = "0";
    }
    outerBar.style.boxSizing = "border-box";
    outerBar.style.width = "100%";
    outerBar.style.maxWidth = "1440px";
    outerBar.style.marginLeft = "auto";
    outerBar.style.marginRight = "auto";
    outerBar.style.marginTop = "24px";
    outerBar.style.marginBottom = "24px";
    outerBar.style.paddingLeft = "1rem";
    outerBar.style.paddingRight = "1rem";
    outerBar.style.paddingTop = "20px";
    outerBar.style.paddingBottom = "20px";
    outerBar.style.background = "#F3E9FF";
    outerBar.style.border = "1px solid #B9A0E8";
    outerBar.style.borderRadius = "14px";
    outerBar.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C24FA0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>' +
      '<div><p style="margin:0;font-size:11px;color:#888;">お問い合わせ</p>' +
      '<span style="font-size:18px;font-weight:900;color:#C24FA0;">1〜2営業日以内にご返信</span></div>' +
      "</div>" +
      '<div style="font-size:12px;color:#888;line-height:1.6;">ログイン後、マイページ ＞ お問い合わせ からいつでもお問い合わせいただけます。</div>';
  }

  var QNA_BOARD_ID = "ssr-qna-board";

  function ensureQnaStyle() {
    if (document.getElementById("sorosoro-qna-style")) return;
    var style = document.createElement("style");
    style.id = "sorosoro-qna-style";
    style.textContent =
      "#" + QNA_BOARD_ID + "{margin:24px auto;max-width:1440px;padding:0 1rem;box-sizing:border-box}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-head h3{font-size:16px;font-weight:800;color:#241a3d;margin:0}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-new-btn{font-size:13px;font-weight:700;color:#fff;background:#6E48D9;border:none;border-radius:8px;padding:8px 14px;cursor:pointer}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-new-btn:hover{opacity:.9}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-list{display:flex;flex-direction:column;gap:10px}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-card{border:1px solid #E7DCF5;border-radius:12px;padding:14px 16px;cursor:pointer;background:#fff;transition:border-color .15s ease}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-card:hover{border-color:#B9A0E8}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-badge{font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-date{font-size:11px;color:#a89bbd}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-preview{font-size:13.5px;line-height:1.6;color:#3A2350;margin:0 0 6px;white-space:pre-wrap;word-break:break-word}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-meta{font-size:11.5px;color:#8a7a96}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-empty{text-align:center;padding:40px 20px;color:#a89bbd;font-size:13px;border:1px dashed #E7DCF5;border-radius:12px}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-login{text-align:center;padding:32px 20px;border:1px solid #E7DCF5;border-radius:12px;background:#FBF8FF}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-login p{font-size:13.5px;color:#5c4a70;margin:0 0 14px}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-login a{display:inline-block;font-size:13px;font-weight:700;color:#fff;background:#6E48D9;border-radius:8px;padding:9px 20px;text-decoration:none}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-form{border:1px solid #E7DCF5;border-radius:12px;padding:14px 16px;margin-bottom:12px;background:#FBF8FF}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-form textarea{width:100%;box-sizing:border-box;min-height:90px;border:1px solid #E7DCF5;border-radius:8px;padding:10px 12px;font-size:13.5px;font-family:inherit;resize:vertical;outline:none}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-form textarea:focus{border-color:#B9A0E8}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-form-actions button{font-size:12.5px;font-weight:700;border-radius:8px;padding:8px 16px;cursor:pointer;border:none}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-cancel-btn{background:#F0EAF8;color:#5c4a70}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-submit-btn{background:#6E48D9;color:#fff}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-detail{margin-top:10px;padding-top:10px;border-top:1px dashed #E7DCF5}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-reply{margin-top:8px;padding:10px 12px;background:#F3E9FF;border-radius:8px;font-size:13px;line-height:1.6;color:#3A2350}" +
      "#" + QNA_BOARD_ID + " .ssr-qna-reply-label{font-size:11px;font-weight:800;color:#6E48D9;margin-bottom:4px;display:block}";
    document.head.appendChild(style);
  }

  function qnaStatusInfo(post, ko) {
    var answered = Number(post.wr_comment) > 0;
    if (answered) {
      return { label: ko ? "답변완료" : "回答済み", color: "#146B4C", bg: "#E1F8EE" };
    }
    return { label: ko ? "답변대기중" : "回答待ち", color: "#8C6A0E", bg: "#FFF6D8" };
  }

  function qnaPreviewText(html) {
    var plain = String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return plain.length > 90 ? plain.slice(0, 90) + "…" : plain;
  }

  function qnaCardHtml(post, ko) {
    var info = qnaStatusInfo(post, ko);
    var date = (post.wr_datetime || "").slice(0, 10);
    return (
      '<div class="ssr-qna-card" data-qna-id="' + post.wr_id + '">' +
      '<div class="ssr-qna-top">' +
      '<span class="ssr-qna-badge" style="color:' + info.color + ";background:" + info.bg + '">' + info.label + "</span>" +
      '<span class="ssr-qna-date">' + date + "</span>" +
      "</div>" +
      '<p class="ssr-qna-preview">' + escapeHtml(qnaPreviewText(post.wr_content)) + "</p>" +
      '<div class="ssr-qna-meta">' +
      (Number(post.wr_comment) > 0
        ? (ko ? "답변 " : "返信 ") + post.wr_comment + (ko ? "건" : "件")
        : ko ? "문의 접수됨" : "回答待ち") +
      "</div></div>"
    );
  }

  function qnaExpandCard(cardEl, id, ko) {
    if (cardEl.getAttribute("data-expanded") === "1") {
      var existing = cardEl.querySelector(".ssr-qna-detail");
      if (existing) existing.remove();
      cardEl.setAttribute("data-expanded", "0");
      return;
    }
    cardEl.setAttribute("data-expanded", "1");
    var detail = document.createElement("div");
    detail.className = "ssr-qna-detail";
    detail.textContent = ko ? "불러오는 중..." : "読み込み中…";
    cardEl.appendChild(detail);
    fetch("/api/boards/qna/" + id, { headers: authHeaders() })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var full = escapeHtml(String(data.wr_content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
        var comments = (data.comments || [])
          .map(function (c) {
            return (
              '<div class="ssr-qna-reply"><span class="ssr-qna-reply-label">' +
              (ko ? "답변" : "回答") +
              "</span>" +
              escapeHtml(String(c.wr_content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()) +
              "</div>"
            );
          })
          .join("");
        detail.innerHTML = '<p class="ssr-qna-preview" style="margin:0 0 6px">' + full + "</p>" + comments;
      })
      .catch(function () {
        detail.textContent = ko ? "불러오지 못했습니다." : "読み込みに失敗しました。";
      });
  }

  function qnaSubmitNew(container, ko) {
    var textarea = container.querySelector(".ssr-qna-form textarea");
    var text = textarea ? textarea.value.trim() : "";
    if (!text) return;
    var submitBtn = container.querySelector(".ssr-qna-submit-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = ko ? "등록 중..." : "送信中…";
    }
    var fd = new FormData();
    fd.append("subject", text.slice(0, 30));
    fd.append("content", text);
    fetch("/api/boards/qna", { method: "POST", body: fd, headers: authHeaders() })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (res) {
        if (!res.ok) throw new Error((res.data && res.data.error) || "failed");
        qnaLoadList(container, ko, true);
      })
      .catch(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = ko ? "등록" : "送信";
        }
        alert(ko ? "등록에 실패했습니다." : "送信に失敗しました。");
      });
  }

  function qnaLoadList(container, ko, closeForm) {
    var listEl = container.querySelector(".ssr-qna-list");
    if (!listEl) return;
    listEl.innerHTML = '<div class="ssr-qna-empty">' + (ko ? "불러오는 중..." : "読み込み中…") + "</div>";
    var formEl = container.querySelector(".ssr-qna-form");
    if (closeForm && formEl) formEl.remove();
    fetch("/api/boards/qna?page=1&limit=20", { headers: authHeaders() })
      .then(function (r) {
        if (r.status === 401) throw { authRequired: true };
        return r.json();
      })
      .then(function (data) {
        var posts = data.posts || [];
        if (!posts.length) {
          listEl.innerHTML =
            '<div class="ssr-qna-empty">' +
            (ko ? "등록된 문의가 없습니다." : "お問い合わせ履歴はまだありません。") +
            "</div>";
          return;
        }
        listEl.innerHTML = posts
          .map(function (p) {
            return qnaCardHtml(p, ko);
          })
          .join("");
        Array.prototype.forEach.call(listEl.querySelectorAll(".ssr-qna-card"), function (card) {
          card.addEventListener("click", function () {
            qnaExpandCard(card, card.getAttribute("data-qna-id"), ko);
          });
        });
      })
      .catch(function (err) {
        if (err && err.authRequired) {
          listEl.outerHTML =
            '<div class="ssr-qna-login"><p>' +
            (ko
              ? "1:1 문의 내역을 보려면 로그인이 필요합니다."
              : "ログインするとお問い合わせ履歴が表示されます。") +
            '</p><a href="/login">' +
            (ko ? "로그인" : "ログイン") +
            "</a></div>";
          var newBtn = container.querySelector(".ssr-qna-new-btn");
          if (newBtn) newBtn.style.display = "none";
        } else {
          listEl.innerHTML =
            '<div class="ssr-qna-empty">' + (ko ? "불러오지 못했습니다." : "読み込みに失敗しました。") + "</div>";
        }
      });
  }

  function renderQnaBoard() {
    if (location.pathname !== "/cs") return;
    if (document.getElementById(QNA_BOARD_ID)) return;
    var telAnchor = document.querySelector('main [data-ssr-csphone="1"]');
    if (!telAnchor) return;
    ensureQnaStyle();
    var ko = localStorage.getItem("sorosoro_language") === "ko";
    var container = document.createElement("div");
    container.id = QNA_BOARD_ID;
    container.innerHTML =
      '<div class="ssr-qna-head"><h3>' +
      (ko ? "1:1 문의" : "お問い合わせ") +
      '</h3><button type="button" class="ssr-qna-new-btn">' +
      (ko ? "+ 새 문의" : "＋ 新規お問い合わせ") +
      "</button></div>" +
      '<div class="ssr-qna-list"></div>';
    telAnchor.parentElement.insertBefore(container, telAnchor.nextSibling);

    var newBtn = container.querySelector(".ssr-qna-new-btn");
    newBtn.addEventListener("click", function () {
      if (container.querySelector(".ssr-qna-form")) return;
      var form = document.createElement("div");
      form.className = "ssr-qna-form";
      form.innerHTML =
        '<textarea placeholder="' +
        (ko ? "문의 내용을 입력해주세요" : "お問い合わせ内容をご記入ください") +
        '"></textarea><div class="ssr-qna-form-actions">' +
        '<button type="button" class="ssr-qna-cancel-btn">' +
        (ko ? "취소" : "キャンセル") +
        "</button>" +
        '<button type="button" class="ssr-qna-submit-btn">' +
        (ko ? "등록" : "送信") +
        "</button></div>";
      container.querySelector(".ssr-qna-head").insertAdjacentElement("afterend", form);
      form.querySelector(".ssr-qna-cancel-btn").addEventListener("click", function () {
        form.remove();
      });
      form.querySelector(".ssr-qna-submit-btn").addEventListener("click", function () {
        qnaSubmitNew(container, ko);
      });
    });

    qnaLoadList(container, ko, false);
  }

  function ensureMyPageStyle() {
    if (document.getElementById("sorosoro-mypage-style")) return;
    var style = document.createElement("style");
    style.id = "sorosoro-mypage-style";
    style.textContent =
      ".dashboard-activity-grid button{transition:transform .15s ease,border-color .15s ease!important}" +
      ".dashboard-activity-grid button:hover{transform:translateY(-3px);border-color:#B9A0E8!important}" +
      ".ssr-mypage-card{background:#fff;border:1px solid #eee;border-radius:18px;margin-bottom:16px;overflow:hidden}" +
      ".ssr-mypage-card-head{padding:14px 20px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center}" +
      ".ssr-mypage-card-head h2{margin:0;font-size:15px;font-weight:800;color:#111;display:flex;align-items:center;gap:6px}" +
      ".ssr-mypage-more-link{font-size:12px;color:#6E48D9;text-decoration:none;font-weight:600;background:none;border:none;cursor:pointer;padding:0}" +
      ".ssr-mypage-cart-row{display:flex;align-items:center;gap:14px;padding:14px 20px;border-bottom:1px solid #f8f8f8}" +
      ".ssr-mypage-cart-row:last-child{border-bottom:none}" +
      ".ssr-mypage-cart-thumb{width:52px;height:52px;flex-shrink:0;background:#f5f5f5;border-radius:12px;overflow:hidden;border:1px solid #eee}" +
      ".ssr-mypage-cart-thumb img{width:100%;height:100%;object-fit:cover}" +
      ".ssr-mypage-cart-name{font-size:13px;color:#333;margin:0 0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".ssr-mypage-cart-meta{font-size:11.5px;color:#999;margin:0}" +
      ".ssr-mypage-cart-price{font-size:13px;font-weight:700;color:#6E48D9;white-space:nowrap}" +
      ".ssr-mypage-empty-box{padding:40px 0;text-align:center;color:#bbb;background:#FBF8FF;border-radius:0 0 18px 18px}" +
      ".ssr-mypage-empty-box svg{display:block;margin:0 auto 10px}" +
      ".ssr-mypage-empty-box p{margin:0;font-size:14px}" +
      ".ssr-mypage-wish-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:16px 20px}" +
      ".ssr-mypage-wish-card{text-decoration:none;color:inherit;display:block}" +
      ".ssr-mypage-wish-thumb{width:100%;aspect-ratio:1;background:#f5f5f5;border-radius:12px;overflow:hidden;border:1px solid #eee;margin-bottom:6px}" +
      ".ssr-mypage-wish-thumb img{width:100%;height:100%;object-fit:cover}" +
      ".ssr-mypage-wish-name{font-size:12px;color:#333;margin:0 0 2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".ssr-mypage-wish-price{font-size:12.5px;font-weight:700;color:#6E48D9;margin:0}" +
      "@media (max-width:700px){.ssr-mypage-wish-grid{grid-template-columns:repeat(2,1fr)}}";
    document.head.appendChild(style);
  }

  function myPagePackageIconSvg(size, color) {
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color +
      '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>' +
      '<path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>'
    );
  }

  function myPageHeartIconSvg(size, color) {
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color +
      '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'
    );
  }

  function addRecentOrdersIcon() {
    var headings = document.querySelectorAll("main h2, body h2");
    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      var t = h.textContent.trim();
      if (t !== "최근 주문" && t !== "最近の注文" && t !== "最近のご注文") continue;
      if (h.getAttribute("data-ssr-icon") === "1") return;
      h.setAttribute("data-ssr-icon", "1");
      h.style.display = "flex";
      h.style.alignItems = "center";
      h.style.gap = "6px";
      h.insertAdjacentHTML("afterbegin", myPagePackageIconSvg(15, "#6E48D9"));
      return;
    }
  }

  function getMyPageCartItems() {
    try {
      var raw = localStorage.getItem("allddaom_cart");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function myPageCartRowHtml(item) {
    var unit = (Number(item.it_price) || 0) + (Number(item.option_price) || 0);
    var qty = Number(item.quantity) || 1;
    var img = item.it_img1 || "";
    return (
      '<div class="ssr-mypage-cart-row">' +
      '<div class="ssr-mypage-cart-thumb">' + (img ? '<img src="' + img + '" alt="">' : "") + "</div>" +
      '<div style="flex:1;min-width:0">' +
      '<p class="ssr-mypage-cart-name">' + escapeHtml(item.it_name || "") + "</p>" +
      '<p class="ssr-mypage-cart-meta">' + (item.option ? escapeHtml(item.option) + " · " : "") + "数量 " + qty + "個</p>" +
      "</div>" +
      '<div class="ssr-mypage-cart-price">' + (unit * qty).toLocaleString() + "원</div>" +
      "</div>"
    );
  }

  function renderMyPageCartCard() {
    var card = document.getElementById("ssr-mypage-cart-card");
    if (!card) return;
    var items = getMyPageCartItems();
    var sig = JSON.stringify(items);
    if (card.getAttribute("data-ssr-sig") === sig) return;
    card.setAttribute("data-ssr-sig", sig);
    var body = card.querySelector(".ssr-mypage-card-body");
    if (!items.length) {
      body.innerHTML =
        '<div class="ssr-mypage-empty-box">' + myPagePackageIconSvg(32, "#ddd") + "<p>カートに商品がありません</p></div>";
      return;
    }
    body.innerHTML = items.map(myPageCartRowHtml).join("");
  }

  function ensureCardWishStyle() {
    if (document.getElementById("sorosoro-card-wish-style")) return;
    var style = document.createElement("style");
    style.id = "sorosoro-card-wish-style";
    style.textContent =
      ".ssr-card-wish-btn{width:32px;height:32px;border-radius:9999px;background:rgba(255,255,255,0.9);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.15);flex-shrink:0;padding:0}" +
      ".ssr-card-wish-btn:hover{background:#fff}";
    document.head.appendChild(style);
  }

  var CARD_WISH_SET = null;
  var CARD_WISH_LOADING = false;

  function loadCardWishSet(cb) {
    if (CARD_WISH_SET) {
      cb(CARD_WISH_SET);
      return;
    }
    if (CARD_WISH_LOADING) return;
    var token = localStorage.getItem("allddaom_token");
    if (!token) {
      CARD_WISH_SET = new Set();
      cb(CARD_WISH_SET);
      return;
    }
    CARD_WISH_LOADING = true;
    fetch("/api/shop/wishlist", { headers: authHeaders() })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        CARD_WISH_SET = new Set((data.items || []).map(function (it) { return String(it.it_id); }));
        CARD_WISH_LOADING = false;
        cb(CARD_WISH_SET);
      })
      .catch(function () {
        CARD_WISH_SET = new Set();
        CARD_WISH_LOADING = false;
        cb(CARD_WISH_SET);
      });
  }

  function cardHeartSvg(filled) {
    return (
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="' +
      (filled ? "#FF6B81" : "none") +
      '" stroke="#FF6B81" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>'
    );
  }

  function addWishHeartsToCards() {
    var wrappers = document.querySelectorAll(".group.relative.bg-card div.absolute.bottom-2.right-2");
    if (!wrappers.length) return;
    ensureCardWishStyle();
    var toInit = [];
    Array.prototype.forEach.call(wrappers, function (wrap) {
      if (wrap.getAttribute("data-ssr-wish") === "1") return;
      var img = wrap.parentElement ? wrap.parentElement.querySelector('img[src*="/api/product-image/"]') : null;
      var m = img && img.getAttribute("src").match(/\/api\/product-image\/(\d+)\//);
      if (!m) return;
      wrap.setAttribute("data-ssr-wish", "1");
      wrap.style.display = "flex";
      wrap.style.gap = "6px";
      var heartBtn = document.createElement("button");
      heartBtn.className = "ssr-card-wish-btn";
      heartBtn.type = "button";
      heartBtn.innerHTML = cardHeartSvg(false);
      heartBtn.setAttribute("data-it-id", m[1]);
      wrap.insertBefore(heartBtn, wrap.firstChild);
      heartBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var token = localStorage.getItem("allddaom_token");
        if (!token) {
          location.href = "/login";
          return;
        }
        var id = heartBtn.getAttribute("data-it-id");
        fetch("/api/shop/wishlist/" + id, { method: "POST", headers: authHeaders() })
          .then(function (r) {
            return r.json();
          })
          .then(function (data) {
            heartBtn.innerHTML = cardHeartSvg(!!data.wished);
            if (CARD_WISH_SET) {
              if (data.wished) CARD_WISH_SET.add(id);
              else CARD_WISH_SET.delete(id);
            }
          })
          .catch(function () {});
      });
      toInit.push(heartBtn);
    });
    if (toInit.length) {
      loadCardWishSet(function (set) {
        toInit.forEach(function (btn) {
          if (set.has(btn.getAttribute("data-it-id"))) btn.innerHTML = cardHeartSvg(true);
        });
      });
    }
  }

  function myPageWishCardHtml(it) {
    var img = it.it_img1 || "";
    return (
      '<a class="ssr-mypage-wish-card" href="/item/' + it.it_id + '">' +
      '<div class="ssr-mypage-wish-thumb">' + (img ? '<img src="' + img + '" alt="">' : "") + "</div>" +
      '<p class="ssr-mypage-wish-name">' + escapeHtml(it.it_name || "") + "</p>" +
      '<p class="ssr-mypage-wish-price">' + (Number(it.it_price) || 0).toLocaleString() + "원</p>" +
      "</a>"
    );
  }

  function renderMyPageWishCard() {
    var card = document.getElementById("ssr-mypage-wish-card");
    if (!card || card.getAttribute("data-ssr-loaded") === "1") return;
    card.setAttribute("data-ssr-loaded", "1");
    var body = card.querySelector(".ssr-mypage-card-body");
    fetch("/api/shop/wishlist", { headers: authHeaders() })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        var items = data.items || [];
        if (!items.length) {
          body.innerHTML = '<div class="ssr-mypage-empty-box"><p>찜한 상품이 없습니다</p></div>';
          return;
        }
        body.innerHTML = '<div class="ssr-mypage-wish-grid">' + items.slice(0, 8).map(myPageWishCardHtml).join("") + "</div>";
      })
      .catch(function () {
        card.removeAttribute("data-ssr-loaded");
      });
  }

  function setupMyPageCartWishSections() {
    var headings = document.querySelectorAll("main h2, body h2");
    var giftHeading = null;
    for (var i = 0; i < headings.length; i++) {
      if (/보낸\s*선물|ギフト/.test(headings[i].textContent)) {
        giftHeading = headings[i];
        break;
      }
    }
    if (!giftHeading) return;
    var headerRow = giftHeading.parentElement;
    var giftCard = headerRow ? headerRow.parentElement : null;
    if (!giftCard || !giftCard.parentElement) return;

    if (giftCard.style.display !== "none") giftCard.style.display = "none";

    if (!document.getElementById("ssr-mypage-cart-card")) {
      var cartCard = document.createElement("div");
      cartCard.id = "ssr-mypage-cart-card";
      cartCard.className = "ssr-mypage-card";
      cartCard.innerHTML =
        '<div class="ssr-mypage-card-head"><h2>' +
        myPagePackageIconSvg(15, "#6E48D9") +
        " 장바구니</h2>" +
        '<a class="ssr-mypage-more-link" href="/cart">전체보기 →</a></div>' +
        '<div class="ssr-mypage-card-body"></div>';

      var wishCard = document.createElement("div");
      wishCard.id = "ssr-mypage-wish-card";
      wishCard.className = "ssr-mypage-card";
      wishCard.innerHTML =
        '<div class="ssr-mypage-card-head"><h2>' +
        myPageHeartIconSvg(15, "#6E48D9") +
        " お気に入り</h2>" +
        '<button type="button" class="ssr-mypage-more-link ssr-mypage-wish-more">전체보기 →</button></div>' +
        '<div class="ssr-mypage-card-body"></div>';

      giftCard.parentElement.insertBefore(cartCard, giftCard.nextSibling);
      giftCard.parentElement.insertBefore(wishCard, cartCard.nextSibling);

      wishCard.querySelector(".ssr-mypage-wish-more").addEventListener("click", function () {
        var navBtns = document.querySelectorAll("aside button, nav button, main button");
        for (var j = 0; j < navBtns.length; j++) {
          if (navBtns[j].textContent.trim() === "찜리스트" || navBtns[j].textContent.trim() === "お気に入り") {
            navBtns[j].click();
            return;
          }
        }
      });

      window.addEventListener("cart-updated", renderMyPageCartCard);
    }
    renderMyPageCartCard();
    renderMyPageWishCard();
  }

  function fixLoginFullBleed() {
    if (location.pathname !== "/login") return;
    var main = document.querySelector("main");
    if (!main) return;
    var outer = main.firstElementChild;
    if (!outer || outer.getAttribute("data-ssr-login-bleed") === "1") return;
    outer.setAttribute("data-ssr-login-bleed", "1");
    outer.style.width = "100vw";
    outer.style.marginLeft = "calc(50% - 50vw)";
    outer.style.boxSizing = "border-box";
  }

  function ensureRegisterStyle() {
    if (document.getElementById("sorosoro-register-style")) return;
    var style = document.createElement("style");
    style.id = "sorosoro-register-style";
    style.textContent =
      '[data-ssr-reg="1"] .reg-field-row{padding:12px 0!important;gap:6px!important}' +
      '[data-ssr-reg="1"] .reg-field-label{margin-bottom:2px}' +
      '[data-ssr-reg="1"] input:focus, [data-ssr-reg="1"] select:focus, #ssr-email-proxy-input:focus{border-color:#9B6FE0!important;box-shadow:0 0 0 3px rgba(155,111,224,0.15);outline:none}';
    document.head.appendChild(style);
  }

  function styleRegisterPage() {
    if (location.pathname !== "/register") return;
    ensureRegisterStyle();
    var main = document.querySelector("main");
    if (!main) return;
    var pageOuter = main.firstElementChild;
    if (!pageOuter) return;
    var card = pageOuter.firstElementChild;
    if (!card) return;

    if (pageOuter.getAttribute("data-ssr-reg") !== "1") {
      pageOuter.setAttribute("data-ssr-reg", "1");
      pageOuter.style.background = "#FCF5FF";
      pageOuter.style.width = "100vw";
      pageOuter.style.marginLeft = "calc(50% - 50vw)";
      pageOuter.style.boxSizing = "border-box";

      card.style.maxWidth = "620px";
      card.style.background = "#fff";
      card.style.borderRadius = "20px";
      card.style.boxShadow = "0 4px 24px rgba(194,79,160,0.10)";
      card.style.border = "1px solid #D8C4FF";
      card.style.padding = "36px 32px";
      card.style.marginTop = "24px";
      card.style.marginBottom = "24px";
    }

    var fields = main.querySelectorAll("input, select");
    Array.prototype.forEach.call(fields, function (el) {
      if (el.tagName === "INPUT" && el.type === "checkbox") return;
      el.style.borderRadius = "10px";
      el.style.border = "1px solid #D8C4FF";
      el.style.padding = "12px 14px";
      el.style.boxSizing = "border-box";
    });

    var buttons = main.querySelectorAll("button");
    Array.prototype.forEach.call(buttons, function (btn) {
      var t = btn.textContent.trim();
      if (/^(중복확인|重複確認|使用可能か確認|인증코드|認証コード|확인|確認)$/.test(t)) {
        btn.style.borderRadius = "8px";
      } else if (/^(회원가입|登録する|취소|キャンセル)$/.test(t)) {
        btn.style.borderRadius = "10px";
      }
    });

    setupUnifiedEmailField();
    setupExtraRegisterFields();
    ensureRegisterFetchPatch();
  }

  function ensureRegisterFetchPatch() {
    if (window.__ssrRegisterFetchPatched) return;
    window.__ssrRegisterFetchPatched = true;
    var originalFetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        var url = typeof input === "string" ? input : input && input.url;
        if (url && url.indexOf("/api/auth/register-shop") !== -1 && init && typeof init.body === "string") {
          var body = JSON.parse(init.body);
          var phoneEl = document.getElementById("ssr-phone-input");
          body.mb_hp = phoneEl ? phoneEl.value.trim() : "";
          init = Object.assign({}, init, { body: JSON.stringify(body) });
        }
      } catch (e) {}
      return originalFetch.call(this, input, init);
    };
  }

  function setupExtraRegisterFields() {
    var labels = document.querySelectorAll(".reg-field-label");
    var nameRow = null;
    var nicknameRow = null;
    Array.prototype.forEach.call(labels, function (lbl) {
      var t = lbl.textContent.trim();
      if (t.indexOf("이름") === 0 || t.indexOf("お名前") === 0) nameRow = lbl.closest(".reg-field-row");
      if (t.indexOf("닉네임") === 0 || t.indexOf("ニックネーム") === 0) nicknameRow = lbl.closest(".reg-field-row");
    });

    if (nicknameRow && nicknameRow.style.display !== "none") nicknameRow.style.display = "none";


    var emailRowEl = document.querySelector(".reg-email-row");
    var emailFieldRow = emailRowEl ? emailRowEl.closest(".reg-field-row") : null;
    if (emailFieldRow && !document.getElementById("ssr-phone-row")) {
      var phoneRow = document.createElement("div");
      phoneRow.className = "reg-field-row";
      phoneRow.id = "ssr-phone-row";
      phoneRow.innerHTML =
        '<div class="reg-field-label"><span style="font-size:14px;color:#333;font-weight:500;">電話番号<span style="color:#e53e3e;margin-left:2px;">*</span></span></div>' +
        '<div class="reg-field-content"><input type="tel" id="ssr-phone-input" placeholder="09012345678" style="width:100%;padding:12px 14px;border:1px solid #D8C4FF;border-radius:10px;font-size:14px;color:#333;box-sizing:border-box"></div>';
      emailFieldRow.parentElement.insertBefore(phoneRow, emailFieldRow);
    }
  }

  function setNativeValue(el, value) {
    var proto = el.tagName === "SELECT" ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
    var desc = Object.getOwnPropertyDescriptor(proto, "value");
    desc.set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
  }

  function setupUnifiedEmailField() {
    var row = document.querySelector(".reg-email-row");
    if (!row) return;

    if (row.getAttribute("data-ssr-email-merged") === "1") {
      if (row.style.display !== "none") row.style.display = "none";
      var realBtn = row.children[3];
      var proxyBtn = document.getElementById("ssr-email-send-btn");
      if (realBtn && proxyBtn) {
        if (proxyBtn.textContent !== realBtn.textContent) proxyBtn.textContent = realBtn.textContent;
        proxyBtn.disabled = realBtn.disabled;
      }
      return;
    }

    if (row.children.length < 4) return;
    var emailInput = row.children[0];
    var domainField = row.children[2];
    var sendBtn = row.children[3];

    if (domainField.tagName === "SELECT") {
      var customOpt = null;
      for (var i = 0; i < domainField.options.length; i++) {
        var t = domainField.options[i].textContent.trim();
        if (t.indexOf("직접입력") !== -1 || t.indexOf("直接入力") !== -1) {
          customOpt = domainField.options[i];
          break;
        }
      }
      if (customOpt) setNativeValue(domainField, customOpt.value);
      return;
    }

    row.setAttribute("data-ssr-email-merged", "1");
    row.style.display = "none";

    var wrap = document.createElement("div");
    wrap.id = "ssr-email-unified-row";
    wrap.style.display = "flex";
    wrap.style.gap = "8px";
    wrap.style.marginBottom = "8px";
    wrap.innerHTML =
      '<input type="email" id="ssr-email-proxy-input" placeholder="example@gmail.com" style="flex:1;min-width:0;width:100%;padding:12px 14px;border:1px solid #D8C4FF;border-radius:10px;font-size:14px;color:#333;box-sizing:border-box">' +
      '<button type="button" id="ssr-email-send-btn" style="white-space:nowrap;padding:0 16px;border:none;border-radius:8px;background:#C24FA0;color:#fff;font-size:13px;font-weight:700;cursor:pointer">' +
      sendBtn.textContent.trim() +
      "</button>";
    row.parentElement.insertBefore(wrap, row);

    wrap.querySelector("#ssr-email-proxy-input").addEventListener("input", function () {
      var v = this.value;
      var at = v.lastIndexOf("@");
      var local = at === -1 ? v : v.slice(0, at);
      var domain = at === -1 ? "" : v.slice(at + 1);
      setNativeValue(emailInput, local);
      setNativeValue(domainField, domain);
    });

    wrap.querySelector("#ssr-email-send-btn").addEventListener("click", function () {
      row.children[3].click();
    });
  }

  var PRICING_PANEL_ADMIN_CHECKED = false;
  var PRICING_PANEL_IS_ADMIN = false;

  function ensurePricingPanelStyle() {
    if (document.getElementById("sorosoro-pricing-panel-style")) return;
    var style = document.createElement("style");
    style.id = "sorosoro-pricing-panel-style";
    style.textContent =
      "#ssr-pricing-fab{position:fixed;left:16px;bottom:16px;z-index:300;width:44px;height:44px;border-radius:50%;background:#6E48D9;color:#fff;border:none;box-shadow:0 2px 10px rgba(0,0,0,0.25);cursor:pointer;font-size:18px;font-weight:800;display:flex;align-items:center;justify-content:center}" +
      "#ssr-pricing-panel{position:fixed;left:16px;bottom:68px;z-index:300;width:280px;background:#fff;border:1px solid #E7DCF5;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,0.18);padding:16px;font-size:13px;color:#333;font-family:inherit}" +
      "#ssr-pricing-panel h4{margin:0 0 10px;font-size:14px;font-weight:800;color:#241a3d}" +
      "#ssr-pricing-panel .ssr-pp-row{display:flex;justify-content:space-between;margin-bottom:6px;color:#666}" +
      "#ssr-pricing-panel input{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #D8C4FF;border-radius:8px;margin:8px 0;font-size:13px}" +
      "#ssr-pricing-panel button.ssr-pp-act{width:100%;padding:9px 0;border:none;border-radius:8px;font-size:12.5px;font-weight:700;cursor:pointer;margin-top:6px}" +
      "#ssr-pricing-panel button.ssr-pp-save{background:#F0EAF8;color:#6E48D9}" +
      "#ssr-pricing-panel button.ssr-pp-convert{background:#6E48D9;color:#fff}" +
      "#ssr-pricing-panel .ssr-pp-msg{margin-top:8px;font-size:12px;min-height:14px}";
    document.head.appendChild(style);
  }

  function setupPricingAdminPanel() {
    if (document.getElementById("ssr-pricing-fab")) return;
    var token = localStorage.getItem("allddaom_token");
    if (!token) return;
    if (!PRICING_PANEL_ADMIN_CHECKED) {
      PRICING_PANEL_ADMIN_CHECKED = true;
      fetch("/api/auth/me", { headers: authHeaders() })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (data) {
          if (data && (data.is_admin || Number(data.mb_level) >= 10)) {
            PRICING_PANEL_IS_ADMIN = true;
            setupPricingAdminPanel();
          }
        })
        .catch(function () {});
      return;
    }
    if (!PRICING_PANEL_IS_ADMIN) return;

    ensurePricingPanelStyle();
    var fab = document.createElement("button");
    fab.id = "ssr-pricing-fab";
    fab.type = "button";
    fab.title = "가격 관리";
    fab.textContent = "¥";
    document.body.appendChild(fab);

    var panel = document.createElement("div");
    panel.id = "ssr-pricing-panel";
    panel.style.display = "none";
    panel.innerHTML =
      "<h4>엔화 가격 변환</h4>" +
      '<div class="ssr-pp-row"><span>전체 상품</span><span data-f="total">-</span></div>' +
      '<div class="ssr-pp-row"><span>변환 완료</span><span data-f="converted">-</span></div>' +
      '<div class="ssr-pp-row"><span>미변환</span><span data-f="pending">-</span></div>' +
      '<input type="number" step="0.0001" placeholder="환율 (예: 0.15)" data-f="rateInput">' +
      '<button type="button" class="ssr-pp-act ssr-pp-save">환율 저장</button>' +
      '<button type="button" class="ssr-pp-act ssr-pp-convert">지금 엔화로 변환하기</button>' +
      '<div class="ssr-pp-msg" data-f="msg"></div>';
    document.body.appendChild(panel);

    fab.addEventListener("click", function () {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
      if (panel.style.display === "block") refreshStatus();
    });

    function refreshStatus() {
      fetch("/api/admin/pricing/jpy-status", { headers: authHeaders() })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          panel.querySelector('[data-f="total"]').textContent = data.total;
          panel.querySelector('[data-f="converted"]').textContent = data.converted;
          panel.querySelector('[data-f="pending"]').textContent = data.pending;
          if (data.rate) panel.querySelector('[data-f="rateInput"]').value = data.rate;
        })
        .catch(function () {});
    }

    panel.querySelector(".ssr-pp-save").addEventListener("click", function () {
      var rate = parseFloat(panel.querySelector('[data-f="rateInput"]').value);
      var msgEl = panel.querySelector('[data-f="msg"]');
      if (!rate || rate <= 0) {
        msgEl.style.color = "#c0392b";
        msgEl.textContent = "올바른 환율을 입력해 주세요.";
        return;
      }
      fetch("/api/admin/pricing/jpy-rate", {
        method: "PUT",
        headers: Object.assign({ "Content-Type": "application/json" }, authHeaders()),
        body: JSON.stringify({ rate: rate })
      })
        .then(function (r) {
          return r.json();
        })
        .then(function () {
          msgEl.style.color = "#2a9d5c";
          msgEl.textContent = "환율이 저장되었습니다.";
          refreshStatus();
        })
        .catch(function () {
          msgEl.style.color = "#c0392b";
          msgEl.textContent = "저장에 실패했습니다.";
        });
    });

    panel.querySelector(".ssr-pp-convert").addEventListener("click", function () {
      var msgEl = panel.querySelector('[data-f="msg"]');
      if (
        !confirm(
          "현재 설정된 환율로 아직 변환되지 않은 모든 상품 가격을 엔화로 변환합니다. 원래 가격은 자동 백업됩니다. 계속할까요?"
        )
      )
        return;
      msgEl.style.color = "#333";
      msgEl.textContent = "변환 중...";
      fetch("/api/admin/pricing/convert-to-jpy", { method: "POST", headers: authHeaders() })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, data: data };
          });
        })
        .then(function (res) {
          if (!res.ok) throw new Error((res.data && res.data.error) || "failed");
          msgEl.style.color = "#2a9d5c";
          msgEl.textContent = res.data.converted + "개 상품이 변환되었습니다.";
          refreshStatus();
        })
        .catch(function (err) {
          msgEl.style.color = "#c0392b";
          msgEl.textContent = (err && err.message) || "변환에 실패했습니다.";
        });
    });

    refreshStatus();
  }

  function convertKakaoButtonToInquiry() {
    var btn = document.querySelector(".kakao-channel-btn");
    if (!btn || btn.getAttribute("data-ssr-inquiry") === "1") return;
    btn.setAttribute("data-ssr-inquiry", "1");
    var ko = localStorage.getItem("sorosoro_language") === "ko";
    var text = ko ? "1:1 문의" : "お問い合わせ";
    btn.title = text;
    var label = btn.querySelector(".kakao-channel-label");
    if (label) {
      label.textContent = text;
      label.style.background = "#6E48D9";
      label.style.color = "#fff";
    }
    var icon = btn.querySelector(".kakao-channel-icon");
    if (icon) {
      icon.style.background = "#6E48D9";
      icon.innerHTML =
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>';
    }
    btn.addEventListener(
      "click",
      function (e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        location.href = "/mypage/inquiry";
      },
      true
    );
  }

  function styleCartItemsCard() {
    if (location.pathname !== "/cart") return;
    var summary = document.querySelector(".cart-summary");
    var list = summary ? summary.previousElementSibling : null;
    if (!list) return;
    if (!list.classList.contains("ssr-cart-items-card")) list.classList.add("ssr-cart-items-card");
  }

  function hideCartGiftTab() {
    if (location.pathname !== "/cart") return;
    var buttons = document.querySelectorAll("main button, body button");
    var regularBtn = null;
    var giftBtn = null;
    for (var i = 0; i < buttons.length; i++) {
      var t = buttons[i].textContent.trim();
      if (t.indexOf("일반 장바구니") !== -1 || t.indexOf("通常カート") !== -1) regularBtn = buttons[i];
      if (t.indexOf("선물 장바구니") !== -1 || t.indexOf("ギフトカート") !== -1) giftBtn = buttons[i];
    }
    if (!regularBtn || !giftBtn) return;
    var toggleWrap = regularBtn.parentElement;
    if (toggleWrap && toggleWrap.style.display !== "none") toggleWrap.style.display = "none";
    if (getComputedStyle(giftBtn).color === "rgb(194, 79, 160)") regularBtn.click();
  }

  function styleMyPage() {
    if (location.pathname !== "/mypage") return;
    ensureMyPageStyle();
    addRecentOrdersIcon();
    setupMyPageCartWishSections();

    var styled = document.querySelectorAll("[style]");
    Array.prototype.forEach.call(styled, function (el) {
      if (el.style.backgroundColor === "rgb(194, 79, 160)") el.style.backgroundColor = "#6E48D9";
      if (el.style.color === "rgb(194, 79, 160)") el.style.color = "#6E48D9";
      if (el.style.borderColor === "rgb(194, 79, 160)") el.style.borderColor = "#6E48D9";

      var br = el.style.borderRadius;
      if (br) {
        if (br.indexOf("10px") !== -1) el.style.borderRadius = br.split("10px").join("22px");
        else if (br === "12px") el.style.borderRadius = "18px";
        else if (br === "8px") el.style.borderRadius = "12px";
      }
    });

    var emptyPs = document.querySelectorAll("main p, body p");
    Array.prototype.forEach.call(emptyPs, function (p) {
      var t = p.textContent.trim();
      if (t.length > 30 || !/없습니다$|ありません$/.test(t)) return;
      var box = p.parentElement;
      if (!box) return;
      if (box.getAttribute("data-ssr-mypage-empty") !== "1") {
        box.setAttribute("data-ssr-mypage-empty", "1");
        box.style.border = "none";
        box.style.borderRadius = "0px 0px 18px 18px";
        box.style.background = "#FBF8FF";
      }
      var icon = box.querySelector("svg");
      if (icon) {
        icon.style.display = "block";
        icon.style.margin = "0 auto 10px";
      }
    });
  }

  function updateShippingSummaryLine() {
    if (location.pathname.indexOf("/item/") !== 0) return;
    var truckIcon = document.querySelector("main svg.lucide-truck");
    if (!truckIcon) return;
    var row = truckIcon.parentElement;
    if (!row || row.getAttribute("data-ssr-shipsum") === "1") return;
    row.setAttribute("data-ssr-shipsum", "1");
    var strong = row.querySelector("strong");
    if (strong) {
      strong.innerHTML =
        (window.__shippingConfig ? window.__shippingConfig.fee : 890) + '円<span style="display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;background:#FDE6F0;color:#C24FA0;font-size:11px;font-weight:700;vertical-align:middle;">2種類目以降 +' + (window.__shippingConfig ? window.__shippingConfig.additionalFee : 490) + '円</span>';
    }
    Array.prototype.forEach.call(row.children, function (child) {
      if (child === strong) return;
      var t = child.textContent ? child.textContent.trim() : "";
      if (t.indexOf("送料") !== -1) child.style.display = "none";
    });
    var wrap = row.parentElement;
    if (!wrap) return;
    var etaRow = document.createElement("div");
    etaRow.style.cssText = "display:flex;align-items:center;gap:6px;";
    etaRow.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C24FA0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' +
      '<span style="font-size:12px;color:#555;">お届け目安 <strong style="color:#111;">7〜10営業日</strong></span>';
    wrap.appendChild(etaRow);
  }

  function updateShippingInfo() {
    if (location.pathname.indexOf("/item/") !== 0) return;
    var section = document.querySelector('[data-section="exchange"]');
    if (!section) return;
    var table = section.querySelector("table.shipping-table");
    if (!table || !table.rows || table.rows.length < 4) return;
    var lang = localStorage.getItem("sorosoro_language") === "ko" ? "ko" : "ja";
    var carrier = lang === "ko" ? "우체국 국제소포" : "韓国郵便（国際小包）";
    var __sf = window.__shippingConfig ? window.__shippingConfig.fee : 890;
    var __sa = window.__shippingConfig ? window.__shippingConfig.additionalFee : 490;
    var fee = lang === "ko" ? ("기본 " + __sf + "엔, 다른 상품 추가 시 1종류당 " + __sa + "엔 (같은 상품 수량 추가는 배송비 1회)") : ("基本" + __sf + "円、別の商品を追加するごとに" + __sa + "円（同じ商品の数量追加は送料1回分）");
    var eta = lang === "ko" ? "영업일 기준 7~10일" : "7〜10営業日";
    if (table.rows[0].cells[1] && table.rows[0].cells[1].textContent !== carrier) {
      table.rows[0].cells[1].textContent = carrier;
    }
    if (table.rows[0].cells[3] && table.rows[0].cells[3].textContent !== fee) {
      table.rows[0].cells[3].textContent = fee;
    }
    if (table.rows[3].cells[1] && table.rows[3].cells[1].textContent !== eta) {
      table.rows[3].cells[1].textContent = eta;
    }
  }

  function hideItemPageParts() {
    if (location.pathname.indexOf("/item/") !== 0) return;
    var tabBtn = Array.prototype.find.call(document.querySelectorAll("main button"), function (b) {
      var t = b.textContent.trim();
      return t === "商品説明" || t === "상품설명";
    });
    var tabBar = tabBtn ? tabBtn.parentElement : null;
    if (tabBar && tabBar.style.display !== "none") tabBar.style.display = "none";

    var infoSection = document.querySelector('[data-section="notice"]');
    if (infoSection && infoSection.style.display !== "none") infoSection.style.display = "none";

    var exchangeSection = document.querySelector('[data-section="exchange"]');
    if (exchangeSection) {
      if (exchangeSection.style.display === "none") exchangeSection.style.display = "";
      var exHeading = exchangeSection.children[0];
      var exWrap = exchangeSection.children[1];
      if (exHeading && exHeading.tagName === "H3") exHeading.style.display = "none";
      if (exWrap && exWrap.children.length >= 2) {
        exWrap.children[0].style.display = "none";
        exWrap.children[1].style.display = "none";
      }
    }
  }

  function styleWishlistButton() {
    if (location.pathname.indexOf("/item/") !== 0) return;
    var favBtn = Array.prototype.find.call(document.querySelectorAll("main button"), function (b) {
      var t = b.textContent.trim();
      return t === "お気に入り" || t === "찜하기" || t === "관심상품";
    });
    if (!favBtn || favBtn.getAttribute("data-ssr-wishlist") === "1") return;
    favBtn.setAttribute("data-ssr-wishlist", "1");
    var span = favBtn.querySelector("span");
    if (span) span.style.display = "none";
    var svg = favBtn.querySelector("svg.lucide-heart");
    if (svg) {
      svg.setAttribute("stroke", "#FF4757");
      svg.style.width = "24px";
      svg.style.height = "24px";
    }
    var active = false;
    favBtn.addEventListener("click", function () {
      active = !active;
      if (svg) svg.setAttribute("fill", active ? "#FF4757" : "none");
    });
  }

  function darkenItemPageFaintText() {
    if (location.pathname.indexOf("/item/") !== 0) return;
    var defaultLabelEl = Array.prototype.find.call(document.querySelectorAll("main span"), function (el) {
      var t = el.textContent.trim();
      return el.children.length === 0 && /×/.test(t) && (/個$/.test(t) || /セット/.test(t) || /^기본/.test(t));
    });
    if (defaultLabelEl) defaultLabelEl.style.setProperty("color", "#333", "important");

    var totalLabelEl = Array.prototype.find.call(document.querySelectorAll("main span"), function (el) {
      var t = el.textContent.trim();
      return (t === "合計" || t === "합계") && el.children.length === 0;
    });
    if (totalLabelEl) totalLabelEl.style.setProperty("color", "#333", "important");

    var favBtn = Array.prototype.find.call(document.querySelectorAll("main button"), function (b) {
      var t = b.textContent.trim();
      return t === "お気に入り" || t === "찜하기" || t === "관심상품";
    });
    if (favBtn) {
      var favSpan = favBtn.querySelector("span");
      if (favSpan) favSpan.style.setProperty("color", "#333", "important");
    }
  }

  function styleQuantityBox() {
    if (location.pathname.indexOf("/item/") !== 0) return;
    var qtyLabel = Array.prototype.find.call(document.querySelectorAll("main span"), function (el) {
      var t = el.textContent.trim();
      return (t === "数量" || t === "수량") && el.children.length === 0;
    });
    if (!qtyLabel) return;
    var qtyBox = qtyLabel.parentElement.parentElement;
    if (!qtyBox || qtyBox.getAttribute("data-ssr-qtybox") === "1") return;
    qtyBox.setAttribute("data-ssr-qtybox", "1");

    var stepper = qtyLabel.parentElement.querySelector("span[style*='line-height']");
    var stepperWrap = stepper ? stepper.parentElement : null;
    if (stepperWrap) {
      Array.prototype.forEach.call(stepperWrap.querySelectorAll("button"), function (btn) {
        btn.style.width = "34px";
        btn.style.height = "34px";
      });
      stepper.style.width = "38px";
      stepper.style.lineHeight = "34px";
      stepper.style.fontSize = "14px";
    }

    var totalRow = qtyBox.lastElementChild;
    if (totalRow) {
      totalRow.style.background = "#F3E9FF";
      totalRow.style.borderRadius = "10px";
      totalRow.style.padding = "12px 14px";
      totalRow.style.borderTop = "none";
      totalRow.style.marginTop = "8px";
      var priceEl = totalRow.querySelector("span:last-child");
      if (priceEl) {
        priceEl.style.color = "#6E48D9";
        priceEl.style.fontSize = "20px";
      }
    }
  }

  function shrinkRelatedProducts() {
    if (location.pathname.indexOf("/item/") !== 0) return;
    var found = findRelatedTrack();
    if (!found) return;
    var containerWidth = found.scrollParent.getBoundingClientRect().width;
    if (!containerWidth) return;
    var cardWidth = (containerWidth - (RELATED_VISIBLE_COUNT - 1) * RELATED_GAP) / RELATED_VISIBLE_COUNT;
    var cardWidthPx = Math.round(cardWidth) + "px";
    var trackStyle = found.track.getAttribute("style") || "";
    if (trackStyle.indexOf("gap: " + RELATED_GAP + "px") === -1) {
      found.track.setAttribute("style", trackStyle.replace(/gap:\s*[^;]+;/, "gap: " + RELATED_GAP + "px;"));
    }
    Array.prototype.forEach.call(found.track.children, function (card) {
      var style = card.getAttribute("style") || "";
      if (style.indexOf("width: " + cardWidthPx) !== -1) return;
      var next = style.replace(/width:\s*[^;]+;/, "width: " + cardWidthPx + ";");
      card.setAttribute("style", next);
    });
  }

  var relatedResizeBound = false;
  function ensureRelatedResizeListener() {
    if (relatedResizeBound) return;
    relatedResizeBound = true;
    window.addEventListener("resize", shrinkRelatedProducts);
  }

  function styleItemPageAccent() {
    if (location.pathname.indexOf("/item/") !== 0) return;
    var main = document.querySelector("main");
    if (!main) return;
    var all = main.querySelectorAll("*");
    Array.prototype.forEach.call(all, function (el) {
      var raw = el.getAttribute("style");
      if (!raw) return;
      if (
        raw.indexOf("194, 79, 160") === -1 &&
        raw.indexOf("231, 220, 245") === -1 &&
        raw.indexOf("#D8C4FF") === -1 &&
        raw.indexOf("#B9A0E8") === -1 &&
        raw.indexOf("34, 160, 107") === -1 &&
        raw.indexOf("29, 138, 90") === -1 &&
        raw.indexOf("240, 240, 240") === -1
      ) {
        return;
      }
      var next = raw
        .split("rgb(194, 79, 160)")
        .join("#6E48D9")
        .split("rgb(231, 220, 245)")
        .join("#B9A0E8")
        .split("#D8C4FF")
        .join("#B9A0E8")
        .split("rgb(240, 240, 240)")
        .join("#B9A0E8")
        .split("linear-gradient(135deg, #6E48D9 0%, rgb(34, 160, 107) 100%)")
        .join("linear-gradient(135deg, #8C6BFF 0%, #C24FA0 50%, #4FC3F7 100%)")
        .split("rgba(29, 138, 90, 0.35)")
        .join("rgba(140, 107, 255, 0.35)");
      if (next !== raw) el.setAttribute("style", next);
    });
  }

  function flattenItemPageShadows() {
    if (location.pathname.indexOf("/item/") !== 0) return;
    var main = document.querySelector("main");
    if (!main) return;
    var all = main.querySelectorAll("*");
    Array.prototype.forEach.call(all, function (el) {
      var cs = getComputedStyle(el);
      if (!cs.boxShadow || cs.boxShadow === "none") return;
      el.style.setProperty("box-shadow", "none", "important");
      if (el.getAttribute("data-ssr-flat") === "1") return;
      el.setAttribute("data-ssr-flat", "1");
      var borderWidth = parseFloat(cs.borderTopWidth) || 0;
      if (borderWidth < 0.5 && el.tagName === "DIV") {
        el.style.border = "1px solid #EEEEEE";
      }
    });
  }

  var flattenScrollBound = false;
  function ensureFlattenOnScroll() {
    if (flattenScrollBound) return;
    flattenScrollBound = true;
    var ticking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          flattenItemPageShadows();
          styleItemPageAccent();
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  function styleListPage() {
    styleBreadcrumb();
    var sidebar = document.querySelector(".list-sidebar");
    if (sidebar && sidebar.getAttribute("data-ssr-hidden") !== "1") {
      sidebar.setAttribute("data-ssr-hidden", "1");
      sidebar.style.display = "none";
    }
    var grid = document.querySelector(".list-grid");
    if (grid && grid.style.gridTemplateColumns !== "repeat(5, 1fr)") {
      grid.style.gridTemplateColumns = "repeat(5, 1fr)";
    }
    var sortRow = document.querySelector(".list-sort-row");
    if (sortRow && sortRow.getAttribute("data-ssr-darken") !== "1") {
      sortRow.setAttribute("data-ssr-darken", "1");
      Array.prototype.forEach.call(sortRow.querySelectorAll("button"), function (btn) {
        if (getComputedStyle(btn).color === "rgb(136, 136, 136)") {
          btn.style.color = "#444";
        }
      });
      var pageWrap = document.querySelector(".page-wrap");
      var countEl = pageWrap
        ? Array.prototype.find.call(pageWrap.querySelectorAll("span"), function (s) {
            return /^全\s?[\d,]+[個件]$/.test(s.textContent.trim());
          })
        : null;
      if (countEl) countEl.style.color = "#666";
    }
  }

  function fixContentWidths() {
    var heroEl = document.getElementById(HERO_ID);
    if (heroEl) {
      var featureSection = heroEl.parentElement.nextElementSibling;
      if (featureSection && featureSection.tagName === "SECTION") fullBleedSection(featureSection);
    }
    fullBleedSection(document.querySelector("footer"));

    var pageWrap = document.querySelector(".page-wrap");
    if (pageWrap && pageWrap.parentElement) {
      pageWrap.parentElement.style.background = "#fff";
    }
  }

  var REVIEW_PREVIEW_ID = "sorosoro-review-preview";
  var reviewPreviewRequested = false;

  function ensureReviewPreviewStyle() {
    if (document.getElementById("sorosoro-rvprev-style")) return;
    var style = document.createElement("style");
    style.id = "sorosoro-rvprev-style";
    style.textContent =
      "#" + REVIEW_PREVIEW_ID + " .ssr-rvprev-head{margin-bottom:16px}" +
      "#" + REVIEW_PREVIEW_ID + " .ssr-rvprev-head h2{font-size:20px;font-weight:700;color:#241a3d;margin:0 0 4px}" +
      "#" + REVIEW_PREVIEW_ID + " .ssr-rvprev-head p{font-size:13px;color:#8a7a96;margin:0}" +
      "#" + REVIEW_PREVIEW_ID + " .ssr-rvprev-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:48px 20px;background:#FAF6FF;border-radius:16px;border:1px dashed #D8C4FF;text-align:center}" +
      "#" + REVIEW_PREVIEW_ID + " .ssr-rvprev-empty svg{width:32px;height:32px;color:#8C6BFF}" +
      "#" + REVIEW_PREVIEW_ID + " .ssr-rvprev-empty-title{font-size:14px;font-weight:700;color:#4A2A63;margin:0}" +
      "#" + REVIEW_PREVIEW_ID + " .ssr-rvprev-empty-sub{font-size:12px;color:#8a7a96;margin:0}" +
      "#" + REVIEW_PREVIEW_ID + " .ssr-rvprev-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}" +
      "#" + REVIEW_PREVIEW_ID + " .ssr-rvprev-card{background:#FAF6FF;border:1px solid #EEE3FF;border-radius:14px;padding:18px}" +
      "#" + REVIEW_PREVIEW_ID + " .ssr-rvprev-stars{color:#F5A623;font-size:13px;letter-spacing:1px;margin-bottom:8px}" +
      "#" + REVIEW_PREVIEW_ID + " .ssr-rvprev-text{font-size:13px;color:#3A2350;line-height:1.6;margin:0 0 12px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}" +
      "#" + REVIEW_PREVIEW_ID + " .ssr-rvprev-meta{display:flex;justify-content:space-between;font-size:11px;color:#8a7a96}" +
      "#" + REVIEW_PREVIEW_ID + " .ssr-rvprev-note{font-size:11px;color:#a89bbd;margin:14px 0 0}";
    document.head.appendChild(style);
  }

  function findReviewSection() {
    var heading = Array.prototype.find.call(document.querySelectorAll("h3"), function (h) {
      var t = h.textContent.trim();
      return t === "商品レビュー" || t === "상품 리뷰" || t === "상품후기";
    });
    return heading ? heading.closest("section") : null;
  }

  var SAMPLE_REVIEWS = [
    { stars: 5, text: "オットギの即席ご飯、お湯を注ぐだけで本格的な味が楽しめました。忙しい日の味方です！", name: "M.K様", product: "オットギ飯" },
    { stars: 4, text: "サムヤンのチーズプルダック麺、辛さの中にチーズのコクがあって美味しかったです。", name: "S.T様", product: "4種チーズプルダック炒め麺" },
    { stars: 5, text: "マルチビタミンを毎日飲んでいますが、パッケージも可愛くて続けやすいです。", name: "Y.N様", product: "マルチビタミン" }
  ];

  function reviewCardHtml(r) {
    return (
      '<div class="ssr-rvprev-card"><div class="ssr-rvprev-stars">' +
      "★".repeat(r.stars) +
      "☆".repeat(5 - r.stars) +
      '</div><p class="ssr-rvprev-text">' +
      r.text +
      '</p><div class="ssr-rvprev-meta"><span>' +
      r.name +
      "</span><span>" +
      r.product +
      "</span></div></div>"
    );
  }

  function buildReviewPreviewSection(reviews) {
    var section = document.createElement("section");
    section.id = REVIEW_PREVIEW_ID;
    section.className = "py-10";
    var body;
    if (reviews && reviews.length) {
      body = '<div class="ssr-rvprev-grid">' + reviews.map(reviewCardHtml).join("") + "</div>";
    } else {
      body =
        '<div class="ssr-rvprev-grid">' +
        SAMPLE_REVIEWS.map(reviewCardHtml).join("") +
        "</div>" +
        '<p class="ssr-rvprev-note">※上記はサンプル表示です。実際のレビューが投稿され次第、順次反映されます。</p>';
    }
    section.innerHTML =
      '<div class="container"><div class="ssr-rvprev-head"><h2>お客様レビュー</h2><p>ご購入いただいたお客様の声</p></div>' +
      body +
      "</div>";
    return section;
  }

  function injectReviewPreview() {
    var existing = document.getElementById(REVIEW_PREVIEW_ID);
    if (location.pathname !== "/") {
      if (existing) existing.remove();
      reviewPreviewRequested = false;
      return;
    }
    if (existing) existing.remove();
    return;
    var reviewSection = findReviewSection();
    if (!reviewSection || !reviewSection.parentElement) return;
    reviewPreviewRequested = true;
    fetch("/api/shop/reviews")
      .then(function (r) {
        return r.json();
      })
      .catch(function () {
        return [];
      })
      .then(function (data) {
        if (document.getElementById(REVIEW_PREVIEW_ID)) return;
        data = Array.isArray(data)
          ? data.filter(function (r) {
              return r && typeof r.stars === "number" && r.text;
            })
          : [];
        ensureReviewPreviewStyle();
        reviewSection.parentElement.insertBefore(buildReviewPreviewSection(data), reviewSection);
      });
  }

  function ensureAppBadgesStyle() {
    if (document.getElementById("sorosoro-appbadges-style")) return;
    var style = document.createElement("style");
    style.id = "sorosoro-appbadges-style";
    style.textContent =
      ".ssr-app-badge{display:inline-flex;align-items:center;gap:10px;background:#111;color:#fff;border-radius:10px;padding:9px 16px;position:relative;cursor:default;user-select:none}" +
      ".ssr-app-badge .ssr-app-badge-text-top{font-size:9px;line-height:1;color:#ccc;letter-spacing:.02em}" +
      ".ssr-app-badge .ssr-app-badge-text-main{font-size:15px;font-weight:700;line-height:1.25;white-space:nowrap}" +
      ".ssr-app-badge-soon{position:absolute;top:-8px;right:-8px;background:#C24FA0;color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:999px;white-space:nowrap}";
    document.head.appendChild(style);
  }

  function addFooterAppBadges() {
    var footer = document.querySelector("footer");
    if (!footer || footer.children.length < 2) return;
    if (document.getElementById("ssr-app-badges-section")) return;
    var ko = localStorage.getItem("sorosoro_language") === "ko";
    ensureAppBadgesStyle();
    var section = document.createElement("div");
    section.id = "ssr-app-badges-section";
    section.style.cssText = "padding:24px 0;border-top:1px solid #eee";
    section.innerHTML =
      '<div class="container" style="max-width:1440px;margin:0 auto;padding:0 16px;box-sizing:border-box">' +
      '<p style="font-size:13px;font-weight:700;color:#333;margin:0 0 12px">' +
      (ko ? "앱으로 더 편리하게 (출시 예정)" : "アプリでもっと便利に（近日公開）") +
      "</p>" +
      '<div style="display:flex;gap:12px;flex-wrap:wrap">' +
      '<div class="ssr-app-badge"><svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.24 0-1.44.65-2.2.46-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8.75-.07 1.55-.5 2.62-.42.94.08 2.09.61 2.78 1.6-2.5 1.51-2.09 4.86.15 6.16-.42 1.24-.99 2.47-1.63 3.83zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.31-2.1 4.25-3.74 4.25z"></path></svg>' +
      '<div><div class="ssr-app-badge-text-top">Download on the</div><div class="ssr-app-badge-text-main">App Store</div></div>' +
      '<span class="ssr-app-badge-soon">' +
      (ko ? "출시예정" : "近日公開") +
      "</span></div>" +
      '<div class="ssr-app-badge"><svg width="22" height="22" viewBox="0 0 24 24"><path fill="#00D2FF" d="M4 2.9c-.4.3-.6.8-.6 1.4v15.4c0 .6.2 1.1.6 1.4l.1.1L13 12 4.1 2.8z"></path><path fill="#00F076" d="M16 15l-3-3-9 9.1c.4.4 1 .4 1.6.1z"></path><path fill="#FFC800" d="M16 9l3.4-2c.6.5.6 1.4 0 2l-3.4 2-2.9-3z"></path><path fill="#FF3A44" d="M16 15l-3-3 3-3 3.4 2c.6.4.6 1.6 0 2z"></path></svg>' +
      '<div><div class="ssr-app-badge-text-top">GET IT ON</div><div class="ssr-app-badge-text-main">Google Play</div></div>' +
      '<span class="ssr-app-badge-soon">' +
      (ko ? "출시예정" : "近日公開") +
      "</span></div>" +
      "</div></div>";
    footer.insertBefore(section, footer.children[1]);
  }

  function fixCsCenter() {
    var footer = document.querySelector("footer");
    if (!footer || footer.getAttribute("data-ssr-cs-fixed")) return;
    var csHeading = Array.from(footer.querySelectorAll("h3")).find(function (h) {
      return h.textContent.trim() === "CS Center" || h.textContent.trim() === "サポート";
    });
    if (!csHeading) return;
    var wrap = csHeading.nextElementSibling;
    if (!wrap) return;

    var supportLabel = Array.from(wrap.querySelectorAll("p")).find(function (p) {
      var t = p.textContent.trim();
      return t === "カスタマーサポート" || t === "고객상담" || t === "고객행복센터";
    });
    var cutoffLabel = Array.from(wrap.querySelectorAll("p")).find(function (p) {
      var t = p.textContent.trim();
      return t === "・注文締切時間" || t === "· 주문마감시간" || t === "・お届けの目安";
    });
    if (!supportLabel || !cutoffLabel) return;
    footer.setAttribute("data-ssr-cs-fixed", "1");

    var supportCol = supportLabel.parentElement;
    supportCol.innerHTML =
      '<p class="text-xs text-muted-foreground mb-1.5">カスタマーサポート</p>' +
      '<div class="flex flex-wrap gap-2 mb-2">' +
      '<a href="/mypage/inquiry" class="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground text-sm font-semibold no-underline hover:opacity-90 transition-opacity">お問い合わせ</a>' +
      '<a href="/faq" class="inline-flex items-center px-6 py-3 rounded-md border border-border text-sm font-semibold no-underline hover:bg-accent transition-colors">FAQ</a>' +
      "</div>" +
      '<p class="text-xs text-muted-foreground leading-relaxed">お問い合わせいただいた内容には1〜2営業日以内にご返信いたします。</p>';

    if (cutoffLabel.textContent.trim() !== "・お届けの目安") cutoffLabel.textContent = "・お届けの目安";
    var cutoffCol = cutoffLabel.parentElement;
    var timeRow = cutoffCol.querySelector(".flex.items-center.gap-2");
    if (timeRow) {
      var bigTime = timeRow.querySelector("span.text-xl");
      var ampm = bigTime ? bigTime.nextElementSibling : null;
      if (bigTime) bigTime.textContent = "7〜10営業日";
      if (ampm) ampm.style.display = "none";
      var descBox = timeRow.querySelector("div.text-xs.text-muted-foreground.leading-relaxed");
      if (descBox) {
        descBox.innerHTML = "<p>お届けまでの目安です。</p><p>（土日祝日を除く）</p>";
      }
    }

    var pt3Row = wrap.querySelector(".pt-3.border-t.border-border\\/60");
    if (pt3Row) {
      pt3Row.classList.remove("pt-3", "border-t", "border-border/60");
      pt3Row.style.paddingTop = "0px";
      pt3Row.style.marginTop = "28px";
    }
  }

  var QM_COLORS = [
    ["#FDE6F0", "#D6478F", "#A82D6C"],
    ["#EDE6FF", "#6E48D9", "#4B2CB0"],
    ["#E2F1FF", "#2E7BC4", "#1D5B96"],
    ["#E1F8EE", "#21966B", "#146B4C"],
    ["#FFEFDD", "#DB8A2A", "#B06B18"],
    ["#FBE6F5", "#AC3F91", "#7E2C6A"],
    ["#EAF6E1", "#4E8F2A", "#35661C"],
    ["#FFF6D8", "#B98E17", "#8C6A0E"]
  ];

  function ensureQmStyle() {
    if (document.getElementById("sorosoro-qm-style")) return;
    var style = document.createElement("style");
    style.id = "sorosoro-qm-style";
    style.textContent =
      ".ssr-qm-icon{width:100%;max-width:72px;aspect-ratio:1;border-radius:16px;display:flex;align-items:center;justify-content:center}" +
      ".ssr-qm-icon svg{width:26px;height:26px;transition:stroke .15s ease}" +
      "a:hover .ssr-qm-icon svg{stroke:var(--qm-hover)}";
    document.head.appendChild(style);
  }

  function ensureCollectionStyle() {
    if (document.getElementById("sorosoro-collection-style")) return;
    var style = document.createElement("style");
    style.id = "sorosoro-collection-style";
    style.textContent =
      "#" + COLLECT_ID + "{margin:0}" +
      "#" + COLLECT_ID + " .ssr-col-head{margin-bottom:20px}" +
      "#" + COLLECT_ID + " .ssr-col-head h2{font-size:22px;font-weight:700;margin:0 0 4px;color:#241a3d}" +
      "#" + COLLECT_ID + " .ssr-col-head p{font-size:13px;color:#8a7a96;margin:0}" +
      "#" + COLLECT_ID + " .ssr-col-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px 28px}" +
      "#" + COLLECT_ID + " .ssr-col-card{display:flex;gap:14px;text-decoration:none;color:inherit}" +
      "#" + COLLECT_ID + " .ssr-col-thumb{width:88px;height:88px;border-radius:12px;object-fit:cover;flex-shrink:0;background:#F3E9FF}" +
      "#" + COLLECT_ID + " .ssr-col-body{min-width:0}" +
      "#" + COLLECT_ID + " .ssr-col-name{font-size:13px;line-height:1.4;color:#241a3d;margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
      "#" + COLLECT_ID + " .ssr-col-was{font-size:11px;color:#a89bbd;text-decoration:line-through;display:block;margin-bottom:2px}" +
      "#" + COLLECT_ID + " .ssr-col-price-row{display:flex;align-items:baseline;gap:6px}" +
      "#" + COLLECT_ID + " .ssr-col-off{font-size:13px;font-weight:700;color:#C24FA0}" +
      "#" + COLLECT_ID + " .ssr-col-price{font-size:15px;font-weight:700;color:#241a3d}" +
      "#" + COLLECT_ID + " .ssr-col-pager{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:28px}" +
      "#" + COLLECT_ID + " .ssr-col-pagebtn{width:32px;height:32px;border-radius:50%;border:1px solid #E7DCF5;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;color:#3A2350}" +
      "#" + COLLECT_ID + " .ssr-col-pagebtn:disabled{opacity:.35;cursor:default}" +
      "#" + COLLECT_ID + " .ssr-col-pageidx{font-size:13px;color:#8a7a96;font-weight:600;font-variant-numeric:tabular-nums}" +
      "@media (max-width:900px){#" + COLLECT_ID + " .ssr-col-grid{grid-template-columns:repeat(2,1fr)}}" +
      "@media (max-width:520px){#" + COLLECT_ID + " .ssr-col-grid{grid-template-columns:1fr}}";
    document.head.appendChild(style);
  }

  function collectionCardHtml(it) {
    var name = it.it_name_ja || it.it_name;
    var price = it.it_price;
    var cust = it.it_cust_price;
    var hasDiscount = cust && cust > price;
    var pct = hasDiscount ? Math.round((1 - price / cust) * 100) : 0;
    return (
      '<a class="ssr-col-card" href="/item/' + it.it_id + '">' +
      '<img class="ssr-col-thumb" src="' + it.it_img1 + '?w=200" alt="" loading="lazy">' +
      '<div class="ssr-col-body">' +
      '<p class="ssr-col-name">' + name + "</p>" +
      (hasDiscount ? '<span class="ssr-col-was">' + cust.toLocaleString() + "円</span>" : "") +
      '<div class="ssr-col-price-row">' +
      (hasDiscount ? '<span class="ssr-col-off">' + pct + "%</span>" : "") +
      '<span class="ssr-col-price">' + price.toLocaleString() + "円</span>" +
      "</div></div></a>"
    );
  }

  function renderCollectionPage(section) {
    if (!collectionPages || !collectionPages.length) return;
    var grid = section.querySelector(".ssr-col-grid");
    var items = collectionPages[collectionPageIdx] || [];
    grid.innerHTML = items.map(collectionCardHtml).join("");
    section.querySelector(".ssr-col-pageidx").textContent = (collectionPageIdx + 1) + " / " + collectionPages.length;
    section.querySelector('[data-page="prev"]').disabled = collectionPageIdx === 0;
    section.querySelector('[data-page="next"]').disabled = collectionPageIdx === collectionPages.length - 1;
  }

  function buildCollectionSection() {
    var section = document.createElement("section");
    section.id = COLLECT_ID;
    section.className = "py-10";
    section.innerHTML =
      '<div class="ssr-col-head">' +
      "<h2>注目の商品</h2>" +
      "<p>seoulmonoのおすすめアイテム</p>" +
      "</div>" +
      '<div class="ssr-col-grid"></div>' +
      '<div class="ssr-col-pager">' +
      '<button class="ssr-col-pagebtn" data-page="prev" aria-label="前のページ">&#8249;</button>' +
      '<span class="ssr-col-pageidx">1 / 1</span>' +
      '<button class="ssr-col-pagebtn" data-page="next" aria-label="次のページ">&#8250;</button>' +
      "</div>";
    section.addEventListener("click", function (e) {
      var btn = e.target.closest(".ssr-col-pagebtn");
      if (!btn || btn.disabled) return;
      var dir = btn.getAttribute("data-page");
      if (dir === "next") collectionPageIdx++;
      else collectionPageIdx--;
      renderCollectionPage(section);
    });
    renderCollectionPage(section);
    return section;
  }

  function findNewArrivalsSection(mainCol) {
    return Array.from(mainCol.children).find(function (s) {
      var t = s.textContent;
      return s.tagName === "SECTION" && (t.indexOf("新着商品") === 0 || t.indexOf("신규 상품") === 0);
    });
  }

  function injectCollectionSection() {
    if (!collectionPages || !collectionPages.length) return;
    if (document.getElementById(COLLECT_ID)) return;
    var found = findFlexRow();
    if (!found) return;
    var newArrivals = findNewArrivalsSection(found.mainCol);
    if (!newArrivals) return;
    ensureCollectionStyle();
    found.mainCol.insertBefore(buildCollectionSection(), newArrivals.nextSibling);
  }

  function restyleQuickMenu() {
    var footer = document.querySelector("footer");
    if (!footer) return;
    var qmHeading = Array.from(footer.querySelectorAll("h3")).find(function (h) {
      return h.textContent.trim() === "Quick Menu" || h.textContent.trim() === "クイックメニュー";
    });
    if (!qmHeading) return;
    var grid = qmHeading.nextElementSibling;
    if (!grid || grid.getAttribute("data-ssr-qm-styled")) return;
    grid.setAttribute("data-ssr-qm-styled", "1");
    ensureQmStyle();
    var links = grid.querySelectorAll(":scope > a");
    links.forEach(function (a, i) {
      var iconBox = a.querySelector("div");
      var svg = a.querySelector("svg");
      if (!iconBox) return;
      var pair = QM_COLORS[i % QM_COLORS.length];
      a.classList.remove("hover:bg-accent", "p-2");
      a.style.padding = "2px";
      a.style.setProperty("--qm-hover", pair[2]);
      iconBox.className = "ssr-qm-icon";
      iconBox.style.background = pair[0];
      if (svg) {
        svg.setAttribute("stroke", pair[1]);
        svg.classList.remove("text-muted-foreground");
        svg.classList.remove("group-hover:text-primary");
        svg.classList.remove("w-4");
        svg.classList.remove("h-4");
      }
    });
  }

  var LOGO_SRC = "/sorosoro-logo.webp";

  function ensureLogoStyle() {
    if (document.getElementById("sorosoro-logo-style")) return;
    var style = document.createElement("style");
    style.id = "sorosoro-logo-style";
    style.textContent = "header .h-16{height:116px}";
    document.head.appendChild(style);
  }

  function replaceLogo() {
    ensureLogoStyle();
    var link = document.querySelector('header a[href="/"]');
    if (!link) return;
    var box = link.querySelector("div");
    if (!box || box.getAttribute("data-ssr-logo") === "1") return;
    var span = box.querySelector("span");
    var text = span ? span.textContent : "";
    if (text.indexOf("seoulmono") === -1) return;
    box.setAttribute("data-ssr-logo", "1");
    box.style.backgroundColor = "transparent";
    box.style.padding = "0";
    box.innerHTML =
      '<img src="' + LOGO_SRC + '" alt="seoulmono" style="height:96px;width:auto;display:block;">';
  }

  var MOBILEFIX_CSS =
    "@media (max-width:767px){" +
    "header .h-16{height:64px!important}" +
    "header [data-ssr-logo] img{height:48px!important;height:clamp(36px,calc((100vw - 220px) / 3),56px)!important;width:auto!important}" +
    "header [data-ssr-logo]{flex-shrink:1;min-width:0}" +
    ".ssr-hicon-row{gap:12px!important}" +
    ".ssr-hicon-row .ssr-hicon>span:not([class]){display:none!important}" +
    ".ssr-hicon{padding:6px!important}" +
    ".ssr-topbar-event-inner{padding-left:12px!important;padding-right:44px!important;gap:8px!important}" +
    ".cart-layout>*{min-width:0!important;max-width:100%!important}" +
    ".ssr-cart-items-card{width:100%!important;max-width:100%!important;box-sizing:border-box!important}" +
    "html,body{overflow-x:clip}" +
    "}" +
    "body{word-break:normal!important;line-break:strict;overflow-wrap:anywhere}" +
    "footer{padding-bottom:var(--mobile-nav-height,0px)}" +
    "body:has(.mobile-buy-bar) footer{padding-bottom:calc(var(--mobile-nav-height,0px) + 84px)}";

  function ensureMobileFixStyle() {
    if (!document.head) return;
    var st = document.getElementById("sorosoro-mobilefix-style");
    if (!st) {
      st = document.createElement("style");
      st.id = "sorosoro-mobilefix-style";
      st.textContent = MOBILEFIX_CSS;
    }
    if (document.head.lastElementChild !== st) document.head.appendChild(st);
  }

  // result counts: the original shows 「全 544個」; Japanese shops count results in 件
  function fixResultCountUnit() {
    if (location.pathname !== "/list" && location.pathname !== "/search" && location.pathname !== "/products") return;
    var spans = document.querySelectorAll("span, p, div");
    for (var i = 0; i < spans.length; i++) {
      var el = spans[i];
      if (el.children.length !== 0) continue;
      var t = el.textContent;
      if (!t || !/^全\s?[\d,]+個$/.test(t)) continue;
      // keep React's text nodes: change their nodeValue only (same identity), exactly like the language switcher does
      for (var j = 0; j < el.childNodes.length; j++) {
        var n = el.childNodes[j];
        if (n.nodeType !== 3) continue;
        var v = n.nodeValue;
        var nv = v.replace(/^全\s+$/, "全").replace(/個$/, "件").replace(/^全\s?([\d,]+)個$/, "全$1件");
        if (nv !== v) n.nodeValue = nv;
      }
    }
  }

  function tick() {
    ensureStyle();
    fixResultCountUnit();
    injectTopbar();
    updateTopbarAuthLink();
    addWishHeartsToCards();
    inject();
    injectHeroCarousel();
    injectCollectionSection();
    injectReviewPreview();
    ensureTagStyle();
    enhanceProductCards();
    enhanceListViewRatings();
    fixCsCenter();

    restyleQuickMenu();
    replaceLogo();
    styleSearchBar();
    styleHeaderIcons();
    styleNavRow();
    growPromoBanners();
    fixContentWidths();
    styleListPage();
    flattenItemPageShadows();
    styleItemPageAccent();
    shrinkRelatedProducts();
    ensureRelatedResizeListener();
    hideItemPageParts();
    updateShippingInfo();
    updateShippingSummaryLine();
    updateCsPhoneBox();
    renderQnaBoard();
    hideCartGiftTab();
    styleCartItemsCard();
    killGiftSendFlow();
    convertKakaoButtonToInquiry();
    fixLoginFullBleed();
    styleRegisterPage();
    styleMyPage();
    styleQuantityBox();
    darkenItemPageFaintText();
    styleWishlistButton();
    ensureFlattenOnScroll();
    ensureMobileFixStyle();
  }

  function start() {
    var tries = 0;
    var poll = setInterval(function () {
      tries++;
      tick();
      if (document.getElementById(ROW_ID) || tries > 30) clearInterval(poll);
    }, 300);

    window.addEventListener("resize", function () {
      clearTimeout(window.__ssrBannerResizeT);
      window.__ssrBannerResizeT = setTimeout(tick, 150);
    });

    new MutationObserver(function () {
      tick();
    }).observe(document.body, { childList: true, subtree: true, characterData: true });

    tick();
  }

  if (document.body) {
    start();
  } else {
    document.addEventListener("DOMContentLoaded", start);
  }
})();
