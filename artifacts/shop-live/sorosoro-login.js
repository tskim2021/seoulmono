/* seoulmono login page (2-column card + admin-managed event banner).
 * Overlays the original React /login page; same API (/api/auth/login) and same
 * localStorage keys, so the app picks the session up after a full reload.
 * Rollback: delete the <script src="/sorosoro-login.js..."> line in index.html. */
(function () {
  "use strict";
  var ROOT_ID = "sl-root", STYLE_ID = "sl-style";
  var TOKEN_KEY = "allddaom_token", USER_KEY = "allddaom_user", SAVED_ID_KEY = "allddaom_saved_id";
  var timer = null;

  var CSS = [
    "#sl-root{position:fixed;inset:0;z-index:99990;overflow:auto;background:#F6F5FB;color:#17142B;-webkit-font-smoothing:antialiased}",
    "#sl-root *{box-sizing:border-box}",
    "#sl-root .sl-wrap{min-height:100%;display:flex;flex-direction:column;max-width:1840px;margin:0 auto;padding:0 clamp(16px,5vw,96px) 32px}",
    "#sl-root .sl-top{display:flex;align-items:center;justify-content:space-between;height:84px}",
    "#sl-root .sl-top img{height:44px;width:auto;display:block}#sl-root .sl-top .moa-logo-art{height:44px}",
    "#sl-root .sl-top a{color:#4A4760;text-decoration:none;font-size:15px}",
    "#sl-root .sl-top a:hover{color:#6E48D9}",
    "#sl-root .sl-card{margin:auto 0;display:grid;grid-template-columns:1.16fr 1fr;min-height:min(540px,calc(100vh - 140px));background:#fff;border-radius:28px;overflow:hidden;box-shadow:0 14px 48px rgba(60,40,130,.10)}",
    "#sl-root .sl-banner{position:relative;overflow:hidden;background:linear-gradient(150deg,#3B2A86 0%,#6E48D9 60%,#9D7BF0 100%);min-height:260px}",
    "#sl-root .sl-slide{position:absolute;inset:0;opacity:0;transition:opacity .6s ease;pointer-events:none;display:block}",
    "#sl-root .sl-slide.on{opacity:1;pointer-events:auto}",
    "#sl-root .sl-slide img{width:100%;height:100%;object-fit:cover;display:block}",
    "#sl-root .sl-dots{position:absolute;left:0;right:0;bottom:22px;display:flex;gap:8px;justify-content:center;z-index:2}",
    "#sl-root .sl-dots button{width:8px;height:8px;border-radius:99px;border:0;padding:0;background:rgba(255,255,255,.5);cursor:pointer;transition:all .25s}",
    "#sl-root .sl-dots button.on{width:24px;background:#fff}",
    "#sl-root .sl-def{position:absolute;inset:0;padding:clamp(24px,3.2vw,48px);display:flex;flex-direction:column;color:#fff}",
    "#sl-root .sl-def .k{font-size:12px;letter-spacing:.3em;font-weight:700;opacity:.9}",
    "#sl-root .sl-def h2{margin:20px 0 12px;font-size:clamp(22px,2.4vw,34px);line-height:1.4;font-weight:800;letter-spacing:-.01em}",
    "#sl-root .sl-def p{margin:0;font-size:clamp(12.5px,1vw,15px);line-height:1.8;opacity:.92}",
    "#sl-root .sl-mas{position:absolute;right:10%;bottom:13%;width:clamp(110px,14vw,200px);aspect-ratio:407/384;filter:drop-shadow(0 12px 18px rgba(20,10,60,.35));cursor:pointer;-webkit-tap-highlight-color:transparent}.sl-mas-bob{position:absolute;inset:0;animation:sl-bob 3.2s ease-in-out infinite;transform-origin:50% 90%}.sl-mas.hop .sl-mas-bob{animation:sl-hop .7s ease both}.sl-mas-tilt{position:absolute;inset:0;transform-origin:50% 85%;transition:transform .3s cubic-bezier(.3,.7,.3,1)}.sl-mas-tilt>img{position:absolute;inset:0;width:100%;height:100%;display:block;user-select:none;-webkit-user-drag:none}.sl-eyes,.sl-stars{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none}.sl-pupil{will-change:transform}.sl-blink{transform-box:fill-box;transform-origin:center;animation:sl-blink 5.2s infinite}.sl-star{transform-box:fill-box;transform-origin:center;animation:sl-tw1 3.4s ease-in-out infinite}.sl-star.s2{animation:sl-tw2 2.9s ease-in-out .6s infinite}@keyframes sl-bob{0%,100%{transform:translateY(0) rotate(-3.2deg)}50%{transform:translateY(-9%) rotate(3.2deg)}}@keyframes sl-hop{0%{transform:translateY(0) scale(1,1)}28%{transform:translateY(-30%) scale(.94,1.08)}52%{transform:translateY(0) scale(1.1,.9)}72%{transform:translateY(-9%) scale(.98,1.03)}100%{transform:translateY(0) scale(1,1)}}@keyframes sl-blink{0%,91%,100%{transform:scaleY(1)}94%{transform:scaleY(.08)}97%{transform:scaleY(1)}}@keyframes sl-tw1{0%,100%{transform:translate(0,0) scale(1) rotate(0);opacity:1}25%{transform:translate(-22px,-30px) scale(1.3) rotate(40deg)}50%{transform:translate(10px,-48px) scale(.55) rotate(95deg);opacity:.55}75%{transform:translate(32px,-14px) scale(1.2) rotate(150deg);opacity:1}}@keyframes sl-tw2{0%,100%{transform:translate(0,0) scale(1) rotate(0);opacity:1}30%{transform:translate(20px,28px) scale(1.35) rotate(-45deg)}60%{transform:translate(-18px,38px) scale(.55) rotate(-110deg);opacity:.55}80%{transform:translate(-28px,8px) scale(1.15) rotate(-160deg);opacity:1}}@media (prefers-reduced-motion:reduce){.sl-mas-bob,.sl-blink,.sl-star,.sl-slide{animation:none!important;transition:none!important}}",
    "#sl-root .sl-def .f{margin-top:auto;font-size:11.5px;letter-spacing:.14em;font-weight:600;opacity:.9}",
    "#sl-root .sl-form{padding:clamp(24px,3.4vw,48px) clamp(24px,3.6vw,52px);display:flex;flex-direction:column;justify-content:center}",
    "#sl-root .sl-form h1{margin:0;font-size:clamp(24px,2.2vw,32px);font-weight:800;letter-spacing:-.01em;color:#17142B}",
    "#sl-root .sl-sub{margin:10px 0 28px;color:#7A7690;font-size:14.5px;line-height:1.7}",
    "#sl-root label.sl-l{display:block;margin:0 0 8px;font-size:14px;font-weight:700}",
    "#sl-root input.sl-in{width:100%;height:50px;border:1px solid #E3DDF5;background:#F1EDFC;border-radius:13px;padding:0 18px;font-size:15px;color:#17142B;outline:none;margin-bottom:16px;font-family:inherit;transition:border-color .15s,box-shadow .15s}",
    "#sl-root input.sl-in:focus{border-color:#6E48D9;box-shadow:0 0 0 4px rgba(110,72,217,.15);background:#fff}",
    "#sl-root .sl-err{display:none;margin:-6px 0 16px;padding:12px 14px;border-radius:10px;background:#FFF1F2;border:1px solid #FFCDD2;color:#C62828;font-size:14px}",
    "#sl-root .sl-err.on{display:block}",
    "#sl-root button.sl-btn{width:100%;height:52px;border:0;border-radius:14px;background:linear-gradient(135deg,#6E48D9,#5632B8);color:#fff;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 24px rgba(110,72,217,.28);transition:transform .12s,opacity .15s}",
    "#sl-root button.sl-btn:hover{transform:translateY(-1px)}",
    "#sl-root button.sl-btn:disabled{opacity:.6;cursor:default;transform:none}",
    "#sl-root .sl-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:16px 0 20px;font-size:13.5px}",
    "#sl-root .sl-chk{display:flex;align-items:center;gap:8px;color:#4A4760;cursor:pointer}",
    "#sl-root .sl-chk input{width:18px;height:18px;accent-color:#6E48D9}",
    "#sl-root .sl-row a{color:#17142B;text-decoration:none;font-weight:600}",
    "#sl-root .sl-row a:hover{color:#6E48D9}",
    "#sl-root .sl-foot{border-top:1px solid #ECE9F4;padding-top:20px;text-align:center;color:#7A7690;font-size:14px}",
    "#sl-root .sl-foot a{margin-left:8px;color:#6E48D9;font-weight:800;text-decoration:none}",
    "@media (max-width:900px){",
    "#sl-root .sl-top{height:64px}#sl-root .sl-top img{height:32px}#sl-root .sl-top .moa-logo-art{height:32px}#sl-root .sl-top a{font-size:13px}",
    "#sl-root .sl-card{grid-template-columns:1fr;border-radius:24px;min-height:0}",
    "#sl-root .sl-banner{min-height:0;height:clamp(212px,58vw,300px)}",
    "#sl-root .sl-def{padding:22px}#sl-root .sl-def h2{margin:14px 0 8px;font-size:22px}#sl-root .sl-def p{font-size:13px;line-height:1.7}#sl-root .sl-mas{width:clamp(78px,24vw,112px);right:5%;bottom:10%}#sl-root .sl-def h2,#sl-root .sl-def p{max-width:66%}#sl-root .sl-def h2{font-size:18px;margin:12px 0 8px}#sl-root .sl-def p{font-size:12px}#sl-root .sl-def .f{display:none}#sl-root .sl-def .k{font-size:11px}",
    "#sl-root .sl-form{padding:28px 22px 30px}#sl-root .sl-sub{margin:10px 0 26px;font-size:14px}",
    "#sl-root input.sl-in{height:52px;margin-bottom:18px}#sl-root button.sl-btn{height:54px}",
    "}"
  ].join("\n");

  var HTML = [
    '<div class="sl-wrap">',
    '<div class="sl-top"><a href="/" data-go aria-label="seoulmono">' + (window.__seoulmonoLogoHtml ? window.__seoulmonoLogoHtml('sl') : '<img src="/seoulmono-logo-word.png" alt="ソウルモノ">') + '</a><a href="/" data-go>ショッピングを続ける ↗</a></div>',
    '<div class="sl-card">',
    '<div class="sl-banner" id="sl-banner" aria-label="イベント"></div>',
    '<div class="sl-form">',
    '<h1>おかえりなさい。</h1>',
    '<p class="sl-sub">ログインして、あなただけのお買い物を始めましょう。</p>',
    '<form id="sl-form" novalidate>',
    '<label class="sl-l" for="sl-id">ID</label>',
    '<input class="sl-in" id="sl-id" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false">',
    '<label class="sl-l" for="sl-pw">パスワード</label>',
    '<input class="sl-in" id="sl-pw" name="password" type="password" autocomplete="current-password">',
    '<div class="sl-err" id="sl-err" role="alert"></div>',
    '<button class="sl-btn" id="sl-submit" type="submit">ログイン</button>',
    '<div class="sl-row"><label class="sl-chk"><input type="checkbox" id="sl-save">ID保存</label><a href="/find-account" data-go>ID・パスワードを探す</a></div>',
    '</form>',
    '<div class="sl-foot">まだ会員ではありませんか？<a href="/register" data-go>会員登録 →</a></div>',
    '</div>',
    '</div>',
    '</div>'
  ].join("");

  var EYES = [{ cx: 128, cy: 191, rx: 25, ry: 27 }, { cx: 209, cy: 199, rx: 24, ry: 27 }];
  var PUP = { rx: 14, ry: 15.5, rest: [5, 3], max: [10.5, 11] };
  function starPath(r) { return "M0," + -r + " C" + r * .1 + "," + -r * .35 + " " + r * .35 + "," + -r * .1 + " " + r + ",0 C" + r * .35 + "," + r * .1 + " " + r * .1 + "," + r * .35 + " 0," + r + " C" + -r * .1 + "," + r * .35 + " " + -r * .35 + "," + r * .1 + " " + -r + ",0 C" + -r * .35 + "," + -r * .1 + " " + -r * .1 + "," + -r * .35 + " 0," + -r + "Z"; }
  function eyesSvg() {
    return EYES.map(function (e, i) {
      return '<g transform="translate(' + e.cx + " " + e.cy + ')"><g class="sl-blink"><ellipse rx="' + e.rx + '" ry="' + e.ry + '" fill="url(#sl-sclera)" stroke="rgba(40,75,110,.28)" stroke-width="2.4"/>' +
        '<g class="sl-pupil"><ellipse rx="' + PUP.rx + '" ry="' + PUP.ry + '" fill="#235063"/><circle cx="-5" cy="-6" r="5.2" fill="#fff" opacity=".92"/><circle cx="4.5" cy="5" r="2.2" fill="#fff" opacity=".55"/></g></g></g>';
    }).join("");
  }
  var DEFAULT_BANNER = [
    '<div class="sl-def">',
    '<div class="k">YOUR EVERYDAY, BETTER</div>',
    '<h2>あなたの毎日に、<br>もうひとつ上の満足を。</h2>',
    '<p>気に入った商品を集めて、<br>あなただけのお買い物を続けましょう。</p>',
    '<div class="sl-mas" id="sl-mas"><div class="sl-mas-bob"><div class="sl-mas-tilt">',
    '<img src="/sorosoro-mascot.webp" alt="" draggable="false">',
    '<svg class="sl-eyes" viewBox="0 0 407 384" aria-hidden="true"><defs><radialGradient id="sl-sclera" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#E3EDF4"/></radialGradient></defs>' + eyesSvg() + '</svg>',
    '</div>',
    '<svg class="sl-stars" viewBox="0 0 407 384" aria-hidden="true"><defs><linearGradient id="sl-starg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFE08A"/></linearGradient></defs>',
    '<g transform="translate(372 -22)"><path class="sl-star" d="' + starPath(40) + '" fill="url(#sl-starg)"/></g>',
    '<g transform="translate(430 44)"><path class="sl-star s2" d="' + starPath(28) + '" fill="url(#sl-starg)"/></g></svg>',
    '</div></div>',
    '<div class="f">SEOULMONO SEOUL · GOOD CHOICES FOR YOU</div>',
    '</div>'
  ].join("");

  /* mascot: pupils follow the pointer, wander when idle, blink via CSS, hop on click */
  var mas = { bound: false, idle: null, last: 0, onMove: null };
  function setPupils(root, dx, dy, fast) {
    var ps = root.querySelectorAll(".sl-pupil");
    for (var i = 0; i < ps.length; i++) {
      ps[i].style.transition = fast ? "transform .08s linear" : "transform .35s cubic-bezier(.3,.7,.3,1)";
      ps[i].style.transform = "translate(" + dx.toFixed(2) + "px," + dy.toFixed(2) + "px)";
    }
  }
  function tilt(root, tx, rot) {
    var t = root.querySelector(".sl-mas-tilt");
    if (t) t.style.transform = "translate(" + tx.toFixed(2) + "%,0) rotate(" + rot.toFixed(2) + "deg)";
  }
  function startMascot(root) {
    var m = root.querySelector("#sl-mas");
    if (!m) return;
    m.addEventListener("click", function () {
      m.classList.remove("hop"); void m.offsetWidth; m.classList.add("hop");
      setTimeout(function () { m.classList.remove("hop"); }, 750);
    });
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPupils(root, PUP.rest[0], PUP.rest[1], false);
    mas.bound = true;
    mas.onMove = function (e) {
      var now = Date.now(); if (now - mas.last < 40) return; mas.last = now;
      var r = m.getBoundingClientRect(); if (!r.width) return;
      var vx = e.clientX - (r.left + r.width / 2), vy = e.clientY - (r.top + r.height / 2), d = Math.sqrt(vx * vx + vy * vy) || 1;
      var k = Math.min(1, d / 260), ux = vx / d, uy = vy / d;
      setPupils(root, PUP.max[0] * ux * k, PUP.max[1] * uy * k, true);
      tilt(root, ux * k * 5, ux * k * 9);
    };
    window.addEventListener("mousemove", mas.onMove, { passive: true });
    (function wander() {
      mas.idle = setTimeout(function () {
        if (!document.getElementById(ROOT_ID)) return;
        if (Date.now() - mas.last > 2500 && !document.hidden) {
          var rx = Math.random() * 2 - 1, ry = Math.random() * 1.6 - .8;
          setPupils(root, rx * PUP.max[0], ry * PUP.max[1], false);
          tilt(root, rx * 4.5, rx * 7);
        }
        wander();
      }, 1500 + Math.random() * 2200);
    })();
  }
  function stopMascot() {
    clearTimeout(mas.idle); mas.idle = null;
    if (mas.onMove) window.removeEventListener("mousemove", mas.onMove);
    mas.onMove = null; mas.bound = false;
  }

  function isLogin() { return /^\/login\/?$/.test(location.pathname); }
  function safeUrl(u) { return typeof u === "string" && /^(\/(?!\/)|https?:\/\/)/.test(u) ? u : ""; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function go(url) {
    history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo(0, 0);
  }

  function renderBanner(root, banners) {
    var box = root.querySelector("#sl-banner");
    if (!box) return;
    var list = (banners || []).filter(function (b) { return safeUrl(b.imageUrl); });
    if (!list.length) { return; }
    var html = list.map(function (b, i) {
      var img = '<img src="' + esc(safeUrl(b.imageUrl)) + '" alt="' + esc(b.title || "") + '"' + (i === 0 ? "" : ' loading="lazy"') + ">";
      var link = safeUrl(b.linkUrl);
      var cls = "sl-slide" + (i === 0 ? " on" : "");
      if (!link) return '<div class="' + cls + '">' + img + "</div>";
      if (link.charAt(0) === "/") return '<a class="' + cls + '" href="' + esc(link) + '" data-go>' + img + "</a>";
      return '<a class="' + cls + '" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer">' + img + "</a>";
    }).join("");
    if (list.length > 1) html += '<div class="sl-dots">' + list.map(function (_, i) { return '<button type="button" aria-label="' + (i + 1) + '"' + (i === 0 ? ' class="on"' : "") + ' data-i="' + i + '"></button>'; }).join("") + "</div>";
    stopMascot();
    box.innerHTML = html;
    if (list.length < 2) return;
    var slides = box.querySelectorAll(".sl-slide"), dots = box.querySelectorAll(".sl-dots button"), cur = 0;
    function show(n) {
      cur = (n + slides.length) % slides.length;
      for (var i = 0; i < slides.length; i++) { slides[i].classList.toggle("on", i === cur); dots[i].classList.toggle("on", i === cur); }
    }
    for (var d = 0; d < dots.length; d++) dots[d].addEventListener("click", function (e) { show(Number(e.currentTarget.getAttribute("data-i"))); restart(); });
    function restart() { clearInterval(timer); timer = setInterval(function () { show(cur + 1); }, 5000); }
    restart();
  }

  function submit(root) {
    var idEl = root.querySelector("#sl-id"), pwEl = root.querySelector("#sl-pw"), err = root.querySelector("#sl-err"), btn = root.querySelector("#sl-submit"), save = root.querySelector("#sl-save");
    function fail(msg) { err.textContent = msg; err.classList.add("on"); }
    err.classList.remove("on");
    var id = idEl.value.trim(), pw = pwEl.value;
    if (!id) { fail("IDを入力してください。"); idEl.focus(); return; }
    if (!pw) { fail("パスワードを入力してください。"); pwEl.focus(); return; }
    btn.disabled = true; btn.textContent = "ログイン中…";
    fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mb_id: id, mb_password: pw }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.j.token) {
          if (res.status === 429) fail("試行回数が多すぎます。しばらくしてからもう一度お試しください。");
          else if (res.status === 400 || res.status === 401) fail("IDまたはパスワードが正しくありません。");
          else fail(res.j && res.j.error ? String(res.j.error) : "ログインに失敗しました。");
          btn.disabled = false; btn.textContent = "ログイン";
          return;
        }
        try {
          localStorage.setItem(TOKEN_KEY, res.j.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.j.user));
          if (save.checked) localStorage.setItem(SAVED_ID_KEY, id); else localStorage.removeItem(SAVED_ID_KEY);
        } catch (e) {}
        try {
          if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: "login", userName: res.j.user && res.j.user.mb_name, userEmail: res.j.user && res.j.user.mb_email, token: res.j.token }));
        } catch (e) {}
        var rd = new URLSearchParams(location.search).get("redirect");
        location.assign(rd && /^\/(?!\/)/.test(rd) ? rd : "/");
      })
      .catch(function () { fail("通信エラーが発生しました。もう一度お試しください。"); btn.disabled = false; btn.textContent = "ログイン"; });
  }

  function mount() {
    if (document.getElementById(ROOT_ID)) return;
    if (!document.getElementById(STYLE_ID)) {
      var st = document.createElement("style"); st.id = STYLE_ID; st.textContent = CSS; document.head.appendChild(st);
    }
    var root = document.createElement("div");
    root.id = ROOT_ID; root.innerHTML = HTML;
    document.body.appendChild(root);
    document.documentElement.style.overflow = "hidden";
    try { var saved = localStorage.getItem(SAVED_ID_KEY); if (saved) { root.querySelector("#sl-id").value = saved; root.querySelector("#sl-save").checked = true; } } catch (e) {}
    root.querySelector("#sl-banner").innerHTML = DEFAULT_BANNER;
    startMascot(root);
    root.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-go]");
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault(); go(a.getAttribute("href"));
    });
    root.querySelector("#sl-form").addEventListener("submit", function (e) { e.preventDefault(); submit(root); });
    fetch("/api/shop/login-banners", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : { banners: [] }; })
      .then(function (j) { if (document.getElementById(ROOT_ID) === root && j.banners && j.banners.length) renderBanner(root, j.banners); })
      .catch(function () {});
  }

  function unmount() {
    clearInterval(timer); timer = null; stopMascot();
    var r = document.getElementById(ROOT_ID);
    if (r) r.remove();
    document.documentElement.style.overflow = "";
  }

  function sync() { if (isLogin()) mount(); else unmount(); }

  ["pushState", "replaceState"].forEach(function (m) {
    var orig = history[m];
    history[m] = function () { var out = orig.apply(this, arguments); setTimeout(sync, 0); return out; };
  });
  window.addEventListener("popstate", function () { setTimeout(sync, 0); });
  if (document.body) sync(); else document.addEventListener("DOMContentLoaded", sync);
})();
