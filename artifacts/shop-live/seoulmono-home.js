/* Seoulmono storefront composition. Uses the existing catalog, routes and authentication. */
(function () {
  'use strict';
  if (window.__smHomeMounted) return;
  window.__smHomeMounted = true;
  var cache = null, loading = false, host = null, active = 0, slideTimer = null, paused = false;
  var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>';
  var chevron = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
  var slides = [
    { tag:'毎日のビタミン習慣', kicker:'VITAMIN, EVERY DAY', title:'明日の私に、<br>いい習慣。', desc:'韓国のビタミンを、毎日の定番に。', label:'ビタミンを見つける', href:'/list?ca_id=190', id:'1785119103', theme:'sun' },
    { tag:'インナービューティー', kicker:'BEAUTY FROM WITHIN', title:'内側から、<br>私らしく。', desc:'毎日に取り入れたい、韓国のインナーケア。', label:'インナーケアを見る', href:'/list?ca_id=220', id:'1785120996', theme:'peach' },
    { tag:'ソウルモノ セレクト', kicker:'A LITTLE BETTER, DAILY', title:'暮らしに、<br>いいものを。', desc:'気になる韓国サプリを、ひとつずつ。', label:'サプリメントを見る', href:'/list?ca_id=200', id:'1785119644', theme:'green' }
  ];
  var shortcuts = [
    ['特価商品','/todaydeal','bolt'],['ランキング','/products?sort=popular','rank'],['新着商品','/products?sort=new','spark'],['ビタミン','/list?ca_id=190','sun'],['サプリメント','/list?ca_id=200','pill'],['乳酸菌','/list?ca_id=210','leaf'],['イベント','/events','gift'],['レビュー','/reviews','star']
  ];
  var shapes = {
    bolt:'<path d="m13 2-8 12h6l-1 8 9-13h-7z"/>',rank:'<path d="M4 20V11h5v9M9 20V4h6v16M15 20v-7h5v7"/>',spark:'<path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',pill:'<path d="m9 4-5 5a6 6 0 0 0 8 8l5-5a6 6 0 0 0-8-8Z"/><path d="m7 7 9 9"/>',leaf:'<path d="M20 3C5 1 0 15 8 19S22 13 20 3ZM4 22l11-13"/>',gift:'<path d="M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8C1 9 5-4 12 8Zm0 0C23 9 19-4 12 8Z"/>',star:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>'
  };
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function yen(n) { return '¥' + Number(n || 0).toLocaleString('ja-JP'); }
  function pic(id) { return '/api/product-image/' + id + '/' + id + '.jpg'; }
  function icon(name) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + shapes[name] + '</svg>'; }
  function norm(p) { return {id:p.it_id, name:p.it_name_ja || p.name || p.it_name, price:Number(p.it_price == null ? p.price : p.it_price), old:Number(p.it_cust_price == null ? p.cust_price : p.it_cust_price), img:p.it_img1 || p.img, sold:p.soldout || p.it_soldout === '1'}; }
  function discount(p) { return p.old > p.price && p.price > 0 ? Math.round((p.old-p.price)/p.old*100) : 0; }
  function price(p) { var d=discount(p); return '<div class="sm-price">'+(d?'<b>'+d+'%</b>':'')+'<strong>'+yen(p.price)+'</strong></div>'; }
  function image(p, cls) { return '<img class="'+(cls||'')+'" src="'+esc(p.img)+'" alt="'+esc(p.name)+'" loading="lazy">'; }
  function card(p, rank) { return '<a class="sm-product" href="/item/'+esc(p.id)+'"><div class="sm-product-photo">'+image(p)+(rank?'<span class="sm-rank">'+rank+'</span>':'')+(p.sold?'<span class="sm-soldout">売り切れ</span>':'')+'<span class="sm-product-go">'+arrow+'</span></div><h3>'+esc(p.name)+'</h3>'+(p.old>p.price?'<del>'+yen(p.old)+'</del>':'<span class="sm-price-space"></span>')+price(p)+'</a>'; }
  function heading(eyebrow, title, href, label) { return '<div class="sm-section-head"><div><span class="sm-section-eyebrow">'+eyebrow+'</span><h2>'+title+'</h2></div><a href="'+href+'">'+(label||'すべて見る')+chevron+'</a></div>'; }
  function hero(banners) {
    var content=(banners||[]).filter(function(b){return b.imageUrl;}).map(function(b){return '<div class="sm-hero-slide sm-admin-slide"><a href="'+esc(b.linkUrl||'/products')+'"><picture>'+(b.mobileImageUrl?'<source media="(max-width:767px)" srcset="'+esc(b.mobileImageUrl)+'">':'')+'<img src="'+esc(b.imageUrl)+'" alt="'+esc(b.title||'おすすめ商品')+'"></picture></a></div>';});
    content=content.concat(slides.map(function(s){return '<div class="sm-hero-slide sm-theme-'+s.theme+'"><span class="sm-hero-tab">'+s.tag+'</span><div class="sm-hero-copy"><span class="sm-kicker">'+s.kicker+'</span><h1>'+s.title+'</h1><p>'+s.desc+'</p><a class="sm-hero-link" href="'+s.href+'">'+s.label+arrow+'</a></div><img class="sm-hero-photo" src="'+pic(s.id)+'" alt="'+s.tag+'の商品" fetchpriority="high"></div>';}));
    return '<section class="sm-shell sm-hero"><div class="sm-hero-main">'+content.join('')+'<div class="sm-hero-controls"><button data-slide="-1" aria-label="前のバナー">'+chevron+'</button><span><b id="sm-slide-number">01</b> / '+String(content.length).padStart(2,'0')+'</span><button data-slide="1" aria-label="次のバナー">'+chevron+'</button><button data-pause aria-label="バナーの自動再生を停止">Ⅱ</button></div></div><a class="sm-promo" href="/products?sort=new"><span>NEW ARRIVALS</span><h2>今週の<br>とっておき。</h2><p>ソウルで見つけた、<br>気になる新着アイテム。</p><img src="'+pic('1785119099')+'" alt="今週の新着ビタミン"><strong>新着商品へ '+arrow+'</strong></a></section><nav class="sm-shell sm-shortcuts" aria-label="ショッピングメニュー">'+shortcuts.map(function(q){return '<a href="'+q[1]+'">'+icon(q[2])+'<span>'+q[0]+'</span></a>';}).join('')+'</nav>';
  }
  function deals(items) {
    var all=items.filter(function(p){return discount(p)>0&&!p.sold;}).sort(function(a,b){return discount(b)-discount(a);}).slice(0,7);if(!all.length)return '';
    var first=all[0];
    return '<section class="sm-deal-band"><div class="sm-shell">'+heading('GOOD PRICE','今週の特価','/todaydeal')+'<div class="sm-deal-layout"><a class="sm-deal-feature" href="/item/'+esc(first.id)+'"><span class="sm-deal-label">PICK OF THE WEEK</span><div class="sm-deal-feature-photo">'+image(first)+'</div><h3>'+esc(first.name)+'</h3><del>'+yen(first.old)+'</del>'+price(first)+'<span class="sm-feature-action">商品を見る '+arrow+'</span></a><div class="sm-deal-list">'+all.slice(1).map(function(p){return '<a class="sm-deal-row" href="/item/'+esc(p.id)+'">'+image(p)+'<div><span class="sm-deal-tag">SPECIAL PRICE</span><h3>'+esc(p.name)+'</h3><del>'+yen(p.old)+'</del>'+price(p)+'</div></a>';}).join('')+'</div></div></div></section>';
  }
  function stories() {
    var s=[['VITAMIN','今日も、軽やかに。','毎日のビタミン習慣','1785119103','190'],['INNER CARE','自分を、いたわる。','韓国のインナーケア','1785120996','220'],['SUPPLEMENT','続けたい、いい習慣。','毎日のサプリメント','1785119644','200']];
    return '<section class="sm-shell sm-stories">'+s.map(function(v,i){return '<a class="sm-story sm-story-'+i+'" href="/list?ca_id='+v[4]+'"><span class="sm-story-tag">'+v[0]+'</span><img src="'+pic(v[3])+'" alt="'+v[2]+'" loading="lazy"><div><h2>'+v[1]+'</h2><p>'+v[2]+arrow+'</p></div></a>';}).join('')+'</section>';
  }
  function collectionName(e,i) { return /^企画展\d+$/.test(e.title)?(i===0?'今週のセレクト':'お得なまとめ買い'):e.title; }
  function collections(exhs) {
    if(!exhs.length)return '';
    return '<section class="sm-shell sm-collections">'+heading('SEOULMONO COLLECTION','ソウルモノの企画展','/events')+'<div class="sm-tabs" role="tablist" aria-label="企画展">'+exhs.map(function(e,i){return '<button role="tab" id="sm-tab-'+i+'" aria-selected="'+(!i)+'" aria-controls="sm-panel-'+i+'" tabindex="'+(i?-1:0)+'" data-collection="'+i+'">'+esc(collectionName(e,i))+'</button>';}).join('')+'</div>'+exhs.map(function(e,i){return '<div class="sm-collection-panel" role="tabpanel" id="sm-panel-'+i+'" aria-labelledby="sm-tab-'+i+'"'+(i?' hidden':'')+'><a class="sm-collection-intro" href="/exhibition/'+e.id+'"><span>CURATED BY<br>SEOULMONO</span><h3>'+esc(collectionName(e,i))+'</h3><p>'+esc(e.subtitle||'韓国のいいものを、セレクト。')+'</p><img src="/seoulmono-bag.png" alt="" loading="lazy">'+arrow+'</a><div class="sm-collection-products">'+e.items.slice(0,4).map(function(p){return card(norm(p));}).join('')+'</div></div>';}).join('')+'</section>';
  }
  function footerLinks(){return '<section class="sm-shell sm-help"><a href="/notice"><span>お知らせ</span><h2>ソウルモノからの<br>新しいお知らせ。</h2>'+arrow+'</a><a href="/reviews"><span>みんなのレビュー</span><h2>買ってよかったを、<br>見つけよう。</h2>'+arrow+'</a><a href="/product-qna"><span>商品Q&A</span><h2>気になることは、<br>こちらから。</h2>'+arrow+'</a></section>';}
  function draw(data) {
    var exhs=data.exhibitions.exhibitions||[], home=data.home;
    var unique=new Map();exhs.forEach(function(e){e.items.forEach(function(p){unique.set(p.it_id,norm(p));});});(home.newItems||[]).forEach(function(p){if(!unique.has(p.it_id))unique.set(p.it_id,norm(p));});
    host.innerHTML=hero(data.banners.banners||[]) + deals(Array.from(unique.values())) + '<section class="sm-shell sm-best">'+heading('BEST SELLERS','人気ランキング','/products?sort=popular')+'<div class="sm-product-grid">'+(home.best||[]).slice(0,6).map(function(p,i){return card(norm(p),i+1);}).join('')+'</div></section>'+stories()+collections(exhs)+'<section class="sm-shell sm-new">'+heading('JUST ARRIVED','新着アイテム','/products?sort=new')+'<div class="sm-product-grid">'+(home.newItems||[]).slice(0,6).map(function(p){return card(norm(p));}).join('')+'</div></section>'+footerLinks();
    host.dataset.ready='true';document.documentElement.classList.remove('sm-home-loading');document.body.classList.add('sm-home');active=0;showSlide(0);scheduleSlides();
  }
  function showSlide(i){if(!host)return;var nodes=host.querySelectorAll('.sm-hero-slide');if(!nodes.length)return;active=(i+nodes.length)%nodes.length;nodes.forEach(function(n,k){n.classList.toggle('is-active',k===active);n.setAttribute('aria-hidden',k!==active?'true':'false');if(k===active)n.removeAttribute('inert');else n.setAttribute('inert','');});var count=host.querySelector('#sm-slide-number');if(count)count.textContent=String(active+1).padStart(2,'0');}
  function scheduleSlides(){clearTimeout(slideTimer);if(paused||document.hidden||!document.body.classList.contains('sm-home'))return;slideTimer=setTimeout(function(){showSlide(active+1);scheduleSlides();},6500);}
  function go(href){history.pushState({},'',href);window.dispatchEvent(new PopStateEvent('popstate'));window.scrollTo(0,0);}
  function bind(){host.addEventListener('click',function(e){var button=e.target.closest('button');if(button){if(button.hasAttribute('data-slide')){showSlide(active+Number(button.dataset.slide));scheduleSlides();}else if(button.hasAttribute('data-pause')){paused=!paused;button.textContent=paused?'▶':'Ⅱ';button.setAttribute('aria-label',paused?'バナーの自動再生を開始':'バナーの自動再生を停止');scheduleSlides();}else if(button.hasAttribute('data-collection')){var idx=button.dataset.collection;host.querySelectorAll('[data-collection]').forEach(function(b){var on=b.dataset.collection===idx;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});host.querySelectorAll('.sm-collection-panel').forEach(function(p){p.hidden=p.id!=='sm-panel-'+idx;});}return;}var a=e.target.closest('a');if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;var href=a.getAttribute('href');if(href&&href[0]==='/'&&href[1]!=='/'){e.preventDefault();go(href);}});
    host.addEventListener('keydown',function(e){if(!e.target.matches('[data-collection]')||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();var tabs=Array.from(host.querySelectorAll('[data-collection]')),i=tabs.indexOf(e.target);i=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[i].click();tabs[i].focus();});
  }
  async function getData(){if(loading)return;loading=true;try{var r=await Promise.all(['/api/shop/home','/api/shop/exhibitions','/api/shop/hero-banners'].map(async function(u){var res=await fetch(u);if(!res.ok)throw new Error('catalog unavailable');return res.json();}));cache={home:r[0],exhibitions:r[1],banners:r[2]};ensure();}catch(e){document.documentElement.classList.remove('sm-home-loading');console.error('Seoulmono home could not load the catalog',e);}finally{loading=false;}}
  function ensure(){var home=location.pathname==='/'||location.pathname==='';if(!home){document.documentElement.classList.remove('sm-home-loading');document.body.classList.remove('sm-home');if(host){host.remove();host=null;}clearTimeout(slideTimer);return;}var main=document.querySelector('main');if(!main)return;if(!cache){getData();return;}if(!host||host.parentNode!==main){host=document.createElement('div');host.id='sm-home';main.prepend(host);bind();draw(cache);}}
  var pending=false;function queue(){if(pending)return;pending=true;setTimeout(function(){pending=false;ensure();},30);}
  function boot(){new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});window.addEventListener('popstate',queue);document.addEventListener('visibilitychange',scheduleSlides);ensure();}
  if(document.body)boot();else document.addEventListener('DOMContentLoaded',boot);
})();
