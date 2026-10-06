/* Txova — aplicação de demonstração (sem servidor, sem pagamentos reais) */
(function () {
  'use strict';
  const D = window.TX_DATA;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const view = $('#view');

  /* ---------- Utilitários ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' MT';
  const ic = (name, cls) => {
    const p = (window.ICONS || {})[name] || '';
    return '<span class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg></span>';
  };
  const hydrateIcons = root => $$('[data-icon]', root).forEach(el => { el.outerHTML = ic(el.dataset.icon); });
  const grad = g => 'background:linear-gradient(135deg,' + g[0] + ',' + g[1] + ')';
  const soft = g => 'background:linear-gradient(135deg,' + g[0] + '22,' + g[1] + '33)';
  const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];
  const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
  const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);
  /* Peso / tamanho de embalagem */
  const fmtKg = w => String(w).replace('.', ',') + ' kg';
  const hasVariants = it => !!(it.weights || it.sizes);
  const priceLabel = it => it.unit === 'kg' ? mt(it.price) + '<small class="per">/kg</small>' : it.sizes ? '<small class="per">desde </small>' + mt(Math.min.apply(null, it.sizes.map(z => z.p))) : mt(it.price);
  const variantHint = it => it.sizes ? it.sizes.map(z => z.l).join(' · ') : it.weights ? 'Ao quilo: ' + it.weights.map(fmtKg).join(' · ') : '';
  const variantList = it => it.sizes ? it.sizes.map(z => ({ l: z.l, p: z.p, kg: z.kg, bulky: !!z.bulky }))
    : it.weights ? it.weights.map(w => ({ l: fmtKg(w), p: Math.round(it.price * w), kg: w, bulky: false })) : null;
  const variantDefault = it => it.sizes ? (it.def || 0) : it.weights ? Math.max(0, it.weights.indexOf(1)) : 0;
  const fmtDate = ts => {
    const d = new Date(ts); const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return d.getDate() + ' ' + meses[d.getMonth()] + ', ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  };

  /* ---------- Persistência (localStorage) ---------- */
  const KEY = { cart: 'txova.cart.v1', orders: 'txova.orders.v1', state: 'txova.state.v1' };
  const load = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { toast('Sem espaço para guardar dados'); } };

  const defaultState = () => ({
    user: { name: 'Zara', last: 'Machava', phone: '84 123 4567', email: 'zara@exemplo.co.mz' },
    addresses: D.addresses.slice(), addrId: D.addresses[0].id,
    favs: ['sabores-polana', 'farmacia-saude'], ageOk: false, recent: ['matapa', 'frango', 'paracetamol'],
    notif: true, vehicle: 'mota', pay: 'mpesa'
  });
  let state = Object.assign(defaultState(), load(KEY.state, {}));
  let cart = load(KEY.cart, { storeId: null, items: [], code: '', note: '', rx: null });
  let orders = load(KEY.orders, null);
  const saveState = () => save(KEY.state, state);
  const saveCart = () => { save(KEY.cart, cart); updateBadge(); };
  const saveOrders = () => save(KEY.orders, orders);

  /* ---------- Dados derivados ---------- */
  const storeById = id => D.stores.find(s => s.id === id);
  const catById = id => D.categories.find(c => c.id === id);
  const allItems = s => s.sections.reduce((a, sec) => a.concat(sec.items), []);
  const itemById = (s, id) => allItems(s).find(i => i.id === id);
  const addr = () => state.addresses.find(a => a.id === state.addrId) || state.addresses[0];
  const distKm = (bairroA, bairroB) => {
    const a = D.coords[bairroA] || [200, 150], b = D.coords[bairroB] || [200, 150];
    return Math.max(1.2, Math.hypot(a[0] - b[0], a[1] - b[1]) / 17);
  };
  const r5 = n => Math.round(n / 5) * 5;
  function delivery(store, vehicleId, toBairro) {
    const v = D.vehicles[vehicleId]; const km = distKm(store.bairro, toBairro || addr().bairro);
    const fee = r5(v.base + v.perKm * km);
    const eta = Math.round(store.prep + 4 + km * v.speed + v.extra);
    return { fee, eta, km, range: eta + '–' + (eta + 10) + ' min' };
  }

  /* ---------- Carrinho ---------- */
  const lineKey = (itemId, opts) => itemId + '|' + (opts || []).join('|');
  const cartCount = () => cart.items.reduce((a, l) => a + l.qty, 0);
  const cartStore = () => cart.storeId ? storeById(cart.storeId) : null;
  const cartSubtotal = () => cart.items.reduce((a, l) => a + l.unit * l.qty, 0);
  const cartKg = () => cart.items.reduce((a, l) => a + (l.kg || 0.5) * l.qty, 0);
  const cartBulky = () => cart.items.some(l => l.bulky);
  const cartAdult = () => cart.items.some(l => l.adult);
  const cartRx = () => cart.items.some(l => l.rx);
  const motaOk = () => !cartBulky() && cartKg() <= D.vehicles.mota.maxKg;
  const qtyInCart = itemId => cart.items.filter(l => l.itemId === itemId).reduce((a, l) => a + l.qty, 0);
  const emptyCart = keepCode => ({ storeId: null, items: [], code: keepCode ? cart.code : '', note: '', rx: null });

  function addToCart(store, item, qty, opts, note, optPrice, variant) {
    if (variant) opts = [variant.l].concat(opts || []);
    const doAdd = () => {
      if (cart.storeId !== store.id) cart = Object.assign(emptyCart(true), { storeId: store.id });
      const key = lineKey(item.id, opts);
      const ex = cart.items.find(l => l.key === key);
      if (ex) { ex.qty += qty; if (note) ex.note = note; }
      else cart.items.push({ key, itemId: item.id, name: item.name, emoji: item.emoji, unit: (variant ? variant.p : item.price) + (optPrice || 0), qty, opts: opts || [], note: note || '', kg: variant ? variant.kg : (item.kg || 0.5), bulky: variant ? variant.bulky : !!item.bulky, adult: !!item.adult, rx: !!item.rx, perKg: item.unit === 'kg' ? item.price : 0 });
      saveCart(); bump(); toast(item.emoji + ' ' + item.name + (variant ? ' (' + variant.l + ')' : '') + ' adicionado');
      refreshStoreUI();
      if (item.rx && !cart.rx) setTimeout(() => rxSheet(), 350);
    };
    const gate = () => (item.adult && !state.ageOk) ? ageGate(doAdd) : doAdd();
    if (cart.storeId && cart.storeId !== store.id && cart.items.length) {
      const cur = cartStore();
      confirmSheet({ emoji: '🛍️', title: 'Começar novo carrinho?', text: 'O seu carrinho tem produtos de <b>' + esc(cur ? cur.name : 'outra loja') + '</b>. Cada pedido é entregue a partir de uma só loja. Quer esvaziar o carrinho e adicionar este produto?', ok: 'Sim, novo carrinho', cancel: 'Manter o atual', onOk: gate });
      return;
    }
    gate();
  }
  function changeQty(key, d) {
    const l = cart.items.find(x => x.key === key); if (!l) return;
    l.qty += d; if (l.qty <= 0) cart.items = cart.items.filter(x => x !== l);
    if (!cart.items.length) cart = emptyCart(true);
    if (!cartRx()) cart.rx = null;
    saveCart();
  }
  function changeItemQty(store, item, d) {
    if (d > 0) { if ((item.opts && item.opts.length) || hasVariants(item)) return go('#/produto/' + store.id + '/' + item.id); return addToCart(store, item, 1, [], ''); }
    const lines = cart.items.filter(l => l.itemId === item.id);
    const l = lines[lines.length - 1]; if (l) changeQty(l.key, -1); refreshStoreUI();
  }
  function promoInfo(sub) {
    const c = D.promoCodes[(cart.code || '').toUpperCase()];
    if (!c) return { disc: 0, free: false, label: '' };
    if (c.type === 'pct') return { disc: Math.min(c.max || 1e9, Math.round(sub * c.value / 100)), free: false, label: c.label };
    if (c.type === 'fixed') return sub >= (c.minSubtotal || 0) ? { disc: c.value, free: false, label: c.label } : { disc: 0, free: false, label: c.label, warn: 'válido acima de ' + mt(c.minSubtotal) };
    if (c.type === 'freeDelivery') return { disc: 0, free: true, label: c.label };
    return { disc: 0, free: false, label: '' };
  }
  const SERVICE = 25;
  function totals(vehicleId) {
    const s = cartStore(); const sub = cartSubtotal();
    const d = s ? delivery(s, vehicleId) : { fee: 0, eta: 0, km: 0, range: '' };
    const p = promoInfo(sub);
    const fee = p.free ? 0 : d.fee; const service = sub ? SERVICE : 0;
    return { sub, fee, feeOrig: d.fee, service, disc: p.disc, promo: p, eta: d.eta, range: d.range, km: d.km, total: Math.max(0, sub + fee + service - p.disc) };
  }

  /* ---------- UI global ---------- */
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
  function updateBadge() { const b = $('#cartBadge'); const n = cartCount(); b.hidden = !n; b.textContent = n > 99 ? '99+' : n; }
  function bump() { const b = $('#cartBadge'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { } }
  function go(h) { if (location.hash === h) route(); else location.hash = h; }
  function back(fallback) { if (history.state && history.state.txIn) history.back(); else go(fallback || '#/'); }

  /* ---------- Folhas (bottom sheets) ---------- */
  let sheetClose = null;
  function openSheet(html, onMount, opts) {
    closeSheet(true);
    const root = $('#sheet-root');
    root.innerHTML = '<div class="sheet-backdrop"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>' + html + '</div>';
    const sheet = $('.sheet', root);
    const close = () => {
      if (!root.contains(sheet)) return;
      sheet.classList.add('closing'); $('.sheet-backdrop', root).classList.add('closing');
      setTimeout(() => { if (root.contains(sheet)) root.innerHTML = ''; }, 200);
      sheetClose = null; if (opts && opts.onClose) opts.onClose();
    };
    sheetClose = close;
    if (!(opts && opts.locked)) $('.sheet-backdrop', root).addEventListener('click', close);
    $$('[data-close]', sheet).forEach(b => b.addEventListener('click', close));
    if (onMount) onMount(sheet, close);
    return close;
  }
  function closeSheet(instant) { const root = $('#sheet-root'); if (instant) { root.innerHTML = ''; sheetClose = null; } else if (sheetClose) sheetClose(); }

  function confirmSheet(o) {
    openSheet('<div class="center-sheet"><div class="sheet-emoji">' + (o.emoji || '❓') + '</div><h2>' + o.title + '</h2><p class="muted sheet-text">' + o.text + '</p>' +
      '<button class="btn" data-ok>' + (o.ok || 'Confirmar') + '</button><button class="btn secondary mt8" data-cancel>' + (o.cancel || 'Cancelar') + '</button></div>',
    (sh, close) => {
      $('[data-ok]', sh).onclick = () => { close(); setTimeout(o.onOk, 230); };
      $('[data-cancel]', sh).onclick = () => { close(); if (o.onCancel) setTimeout(o.onCancel, 230); };
    }, { locked: o.locked });
  }

  function ageGate(onOk, onNo) {
    confirmSheet({ emoji: '🔞', title: 'Tem 18 anos ou mais?', locked: true,
      text: 'A venda de bebidas alcoólicas a menores de 18 anos é proibida por lei. O estafeta pode pedir o seu <b>BI</b> no momento da entrega.',
      ok: 'Sim, tenho 18 anos ou mais', cancel: 'Não, tenho menos de 18',
      onOk: () => { state.ageOk = true; saveState(); toast('Idade confirmada ✓'); if (onOk) onOk(); },
      onCancel: () => { toast('Não é possível comprar bebidas alcoólicas'); if (onNo) onNo(); } });
  }

  function rxSheet(onDone) {
    openSheet('<h2>Receita médica</h2><p class="muted sheet-text">Tem no carrinho medicamentos que só podem ser vendidos com receita. Tire uma fotografia ou carregue o ficheiro — o farmacêutico valida antes de preparar o pedido.</p>' +
      '<label class="rx-drop">' + ic('camera') + '<b>Tirar foto ou escolher ficheiro</b><small>JPG, PNG ou PDF</small><input type="file" id="rxFile" accept="image/*,application/pdf" hidden></label>' +
      '<div id="rxPrev"></div>' +
      '<button class="btn secondary mt8" id="rxDemo">' + ic('file-text') + ' Usar receita de exemplo (demo)</button>' +
      '<button class="btn mt8" id="rxOk" disabled>Confirmar receita</button><button class="btn ghost-btn mt8" data-close>Agora não</button>',
    (sh, close) => {
      let rx = null;
      const show = () => {
        $('#rxPrev', sh).innerHTML = rx ? '<div class="rx-file">' + (rx.thumb ? '<img src="' + rx.thumb + '" alt="">' : '<div class="rx-doc">📄</div>') + '<div><b>' + esc(rx.name) + '</b><small>Pronta a enviar ✓</small></div></div>' : '';
        $('#rxOk', sh).disabled = !rx;
      };
      $('#rxFile', sh).onchange = e => {
        const f = e.target.files[0]; if (!f) return;
        rx = { name: f.name, size: f.size, thumb: null };
        if (/^image\//.test(f.type)) {
          const url = URL.createObjectURL(f); const img = new Image();
          img.onload = () => { const c = document.createElement('canvas'); const k = 160 / Math.max(img.width, img.height); c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); rx.thumb = c.toDataURL('image/jpeg', .7); URL.revokeObjectURL(url); show(); };
          img.onerror = () => show(); img.src = url;
        }
        show();
      };
      $('#rxDemo', sh).onclick = () => { rx = { name: 'receita_hospital_central.jpg', size: 245000, thumb: null, demo: true }; show(); };
      $('#rxOk', sh).onclick = () => { cart.rx = Object.assign(rx, { at: Date.now() }); saveCart(); close(); toast('Receita carregada ✓'); if (onDone) setTimeout(onDone, 220); else rerender(); };
    });
  }

  /* ---------- Componentes ---------- */
  function storeMeta(s) {
    const d = delivery(s, 'mota');
    return '<div class="meta"><span class="star">' + ic('star') + '<b class="ink">' + s.rating.toFixed(1).replace('.', ',') + '</b></span><span class="dot">' + d.range + '</span><span class="dot">🛵 ' + mt(d.fee) + '</span></div>';
  }
  const favBtn = s => '<button class="fav' + (state.favs.includes(s.id) ? ' on' : '') + '" data-fav="' + s.id + '" aria-label="Favorito">' + ic('heart') + '</button>';
  function storeCard(s) {
    return '<a class="fcard" href="#/loja/' + s.id + '"><div class="cover" style="' + grad(s.grad) + '"><span class="emo">' + s.emoji + '</span>' + (s.promo ? '<span class="tag">' + esc(s.promo) + '</span>' : '') + favBtn(s) + '</div>' +
      '<div class="fbody"><h3>' + esc(s.name) + '</h3><div class="kind-l">' + ic('map-pin') + esc(s.bairro) + ' · ' + esc(s.kind) + '</div>' + storeMeta(s) + '</div></a>';
  }
  function storeRow(s) {
    return '<a class="srow" href="#/loja/' + s.id + '"><div class="thumb" style="' + grad(s.grad) + '"><span>' + s.emoji + '</span></div><div class="info"><h3>' + esc(s.name) + (s.adult ? ' <span class="pop red">18+</span>' : '') + '</h3><div class="kind">' + esc(s.kind) + ' · ' + esc(s.bairro) + '</div>' + storeMeta(s) +
      (s.promo ? '<span class="pill orange">' + ic('tag') + esc(s.promo) + '</span>' : '') + '</div></a>';
  }
  function itemBadges(it) {
    return (it.tag ? '<span class="pop">' + esc(it.tag) + '</span>' : '') + (it.rx ? '<span class="pop rx">℞ Receita</span>' : '') + (it.adult ? '<span class="pop red">18+</span>' : '') + (it.bulky && !/carro/i.test(it.tag || '') ? '<span class="pop car">🚗 Só de carro</span>' : '');
  }
  function itemCtrl(it) {
    const q = qtyInCart(it.id);
    if (!q) return '<button class="add" data-add="' + it.id + '" aria-label="Adicionar ' + esc(it.name) + '">' + ic('plus') + '</button>';
    return '<div class="stepper"><button data-dec="' + it.id + '" aria-label="Menos">' + ic(q === 1 ? 'trash-2' : 'minus') + '</button><b>' + q + '</b><button data-inc="' + it.id + '" aria-label="Mais">' + ic('plus') + '</button></div>';
  }
  function itemRow(s, it) {
    const b = itemBadges(it);
    return '<div class="item" data-item="' + it.id + '"><div class="info"><h3>' + esc(it.name) + '</h3>' + (it.desc ? '<p>' + esc(it.desc) + '</p>' : '') +
      '<div class="price">' + priceLabel(it) + (it.old ? ' <s>' + mt(it.old) + '</s>' : '') + '</div>' + (hasVariants(it) ? '<div class="var-hint">' + (it.unit === 'kg' ? '⚖️ ' : '📦 ') + variantHint(it) + '</div>' : '') + (b ? '<div class="badges">' + b + '</div>' : '') + '</div>' +
      '<div class="pic" style="' + soft(s.grad) + '">' + it.emoji + '<span class="ctrl" data-ctrl="' + it.id + '">' + itemCtrl(it) + '</span></div></div>';
  }
  function topbar(title, opts) {
    opts = opts || {};
    return '<header class="topbar">' + (opts.back !== false ? '<button class="icon-btn" data-back="' + (opts.fallback || '#/') + '" aria-label="Voltar">' + ic('chevron-left') + '</button>' : '') + '<h1>' + title + '</h1>' + (opts.right || '') + '</header>';
  }
  function emptyState(emoji, title, text, btn, href) {
    return '<div class="empty"><div class="big">' + emoji + '</div><h2>' + title + '</h2><p>' + text + '</p>' + (btn ? '<a class="btn sm inline" href="' + href + '">' + btn + '</a>' : '') + '</div>';
  }

  /* ---------- Ecrãs ---------- */
  let currentRoute = '', liveTimer = null, refreshStoreUI = () => { };
  const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

  function screenHome() {
    const a = addr();
    const active = orders.filter(o => orderStatus(o).idx < 4);
    const featured = D.stores.filter(s => s.featured);
    const zone = sessionStorage.getItem('txova.zone') || 'Todos';
    const zones = ['Todos', 'Sommerschield', 'Polana Cimento', 'Baixa', 'Costa do Sol', 'Matola'];
    const inZone = s => zone === 'Todos' || (zone === 'Matola' ? s.cidade === 'Matola' : s.bairro === zone);
    const near = D.stores.filter(inZone).sort((x, y) => distKm(x.bairro, a.bairro) - distKm(y.bairro, a.bairro));
    view.innerHTML = '<div class="page">' +
      '<section class="home-head"><div class="loc-row"><button class="loc-btn" id="locBtn"><small>Entregar em</small><strong>' + ic('map-pin') + esc(a.label) + ' · ' + esc(a.bairro) + ic('chevron-right') + '</strong></button>' +
      '<a class="icon-btn ghost" href="#/pedidos" aria-label="Pedidos">' + ic('bell') + (active.length ? '<i class="dot-badge"></i>' : '') + '</a></div>' +
      '<h1 class="hello">' + greet() + ', ' + esc(state.user.name) + ' 👋<br>O que vamos pedir hoje?</h1>' +
      '<a class="searchbox" href="#/pesquisa">' + ic('search') + '<span class="ph">Pratos, lojas, medicamentos…</span></a></section>' +
      (active.length ? '<a class="live-banner" href="#/pedido/' + active[0].id + '"><span class="lb-ic">' + D.vehicles[active[0].vehicle].emoji + '</span><span class="lb-t"><b>' + orderStatus(active[0]).title + ' · ' + orderStatus(active[0]).remaining + ' min</b><small>' + esc(active[0].storeName) + ' · toque para acompanhar</small></span>' + ic('chevron-right') + '</a>' : '') +
      '<div class="promos">' + D.promos.map(p => '<a class="promo" href="' + (p.store ? '#/loja/' + p.store : p.cat ? '#/categoria/' + p.cat : '#/carrinho') + '" style="' + grad(p.grad) + '"><h3>' + esc(p.title) + '</h3><p>' + esc(p.sub) + '</p><span class="em">' + p.emoji + '</span></a>').join('') + '</div>' +
      '<section class="section"><div class="section-h"><h2>Categorias</h2></div><div class="cats">' +
      D.categories.map(c => '<a class="cat" href="#/categoria/' + c.id + '" style="background:' + c.color + '"><span class="lbl">' + (c.home || c.short) + '</span><span class="em">' + c.emoji + '</span></a>').join('') + '</div></section>' +
      '<section class="section"><div class="section-h"><h2>Em destaque</h2><a href="#/pesquisa">Ver tudo</a></div><div class="hscroll">' + featured.map(storeCard).join('') + '</div></section>' +
      '<section class="section"><div class="section-h"><h2>Lojas perto de si</h2><span class="muted small">' + plural(D.stores.length, 'loja', 'lojas') + '</span></div></section>' +
      '<div class="chips zone-chips">' + zones.map(z => '<button class="chip' + (z === zone ? ' active' : '') + '" data-zone="' + z + '">' + (z === 'Polana Cimento' ? 'Polana' : z) + '</button>').join('') + '</div>' +
      '<section class="section mt8"><div class="slist">' + (near.length ? near.map(storeRow).join('') : '<p class="muted">Sem lojas nesta zona.</p>') + '</div></section>' +
      '<div class="demo-note">' + ic('info') + '<span>Aplicação de demonstração. Lojas, preços e estafetas são fictícios — nenhum pagamento é real.</span></div></div>';
    $('#locBtn').onclick = addressSheet;
    $$('[data-zone]').forEach(b => b.onclick = () => { sessionStorage.setItem('txova.zone', b.dataset.zone); const y = window.scrollY; screenHome(); window.scrollTo(0, y); });
  }

  function screenCategory(id) {
    const c = catById(id); if (!c) return go('#/');
    const list = D.stores.filter(s => s.cat === id);
    const notes = { farmacia: '℞ Medicamentos com receita: carregue a foto da receita no carrinho. O farmacêutico valida antes da entrega.', bebidas: '🔞 Venda de álcool apenas a maiores de 18 anos. O BI pode ser pedido na entrega.', casa: '🧺 Limpeza, higiene e mercearia para a casa. Produtos pesados (gás, sacos de 25 kg…) vão de carro.', mercados: '🚗 Compras grandes? Escolha entrega de carro no checkout.' };
    view.innerHTML = '<div class="page">' + topbar(c.emoji + ' ' + c.name) + (notes[id] ? '<div class="demo-note info-note">' + notes[id] + '</div>' : '') +
      '<div class="wrap"><p class="muted small mb8">' + plural(list.length, 'loja', 'lojas') + ' em Maputo e Matola</p><div class="slist">' + list.map(storeRow).join('') + '</div></div></div>';
  }

  function screenSearch() {
    view.innerHTML = '<div class="page">' + topbar('Pesquisar', { back: false }) +
      '<div class="wrap"><label class="searchbox flat">' + ic('search') + '<input id="q" type="search" placeholder="Pratos, lojas, medicamentos…" autocomplete="off" enterkeyhint="search" aria-label="Pesquisar"></label>' +
      '<div class="chips flat-chips">' + D.categories.map(c => '<a class="chip" href="#/categoria/' + c.id + '">' + c.emoji + ' ' + c.short + '</a>').join('') + '</div>' +
      '<div id="results"></div></div></div>';
    const q = $('#q'); const res = $('#results');
    const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const draw = () => {
      const t = norm(q.value.trim());
      if (!t) {
        res.innerHTML = '<div class="result-h">Pesquisas recentes</div><div class="recent">' + state.recent.map(r => '<button class="chip" data-q="' + esc(r) + '">' + ic('rotate-ccw') + ' ' + esc(r) + '</button>').join('') + '</div>' +
          '<div class="result-h">Populares em Maputo</div><div class="recent">' + ['matapa', 'camarão', 'frango', 'cerveja', 'gás', 'mussiro', 'pão', 'repelente'].map(r => '<button class="chip" data-q="' + r + '">' + r + '</button>').join('') + '</div>' +
          '<div class="result-h">Todas as lojas (' + D.stores.length + ')</div><div class="slist">' + D.stores.map(storeRow).join('') + '</div>';
      } else {
        const stores = D.stores.filter(s => norm(s.name + ' ' + s.kind + ' ' + s.bairro + ' ' + s.cidade + ' ' + (s.tags || []).join(' ') + ' ' + catById(s.cat).name).includes(t));
        const prods = []; D.stores.forEach(s => allItems(s).forEach(it => { if (norm(it.name + ' ' + it.desc).includes(t)) prods.push([s, it]); }));
        res.innerHTML = (stores.length ? '<div class="result-h">Lojas (' + stores.length + ')</div><div class="slist">' + stores.map(storeRow).join('') + '</div>' : '') +
          (prods.length ? '<div class="result-h">Produtos (' + prods.length + ')</div><div class="card">' + prods.slice(0, 40).map(([s, it]) => '<a class="line-item" href="#/produto/' + s.id + '/' + it.id + '"><div class="pic" style="' + soft(s.grad) + '">' + it.emoji + '</div><div class="info"><h3>' + esc(it.name) + '</h3><small>' + esc(s.name) + ' · ' + esc(s.bairro) + '</small></div><b>' + priceLabel(it) + '</b></a>').join('') + '</div>' : '') +
          (!stores.length && !prods.length ? emptyState('🔍', 'Nada encontrado', 'Tente “frango”, “farmácia” ou “Matola”.') : '');
      }
      $$('[data-q]', res).forEach(b => b.onclick = () => { q.value = b.dataset.q; remember(b.dataset.q); draw(); });
    };
    const remember = v => { state.recent = [v].concat(state.recent.filter(r => r !== v)).slice(0, 6); saveState(); };
    let deb; q.oninput = () => { clearTimeout(deb); deb = setTimeout(draw, 120); };
    q.onkeydown = e => { if (e.key === 'Enter') { const v = q.value.trim(); if (v) remember(v); q.blur(); } };
    draw();
  }

  function screenStore(id) {
    const s = storeById(id); if (!s) return go('#/');
    document.body.classList.add('no-tabbar');
    const dm = delivery(s, 'mota'), dc = delivery(s, 'carro');
    const c = catById(s.cat);
    view.innerHTML = '<div class="page store-page">' +
      '<div class="store-hero" style="' + grad(s.grad) + '"><div class="bar"><button class="icon-btn" data-back="#/" aria-label="Voltar">' + ic('chevron-left') + '</button><div class="row8"><button class="icon-btn" id="shareBtn" aria-label="Partilhar">' + ic('share') + '</button>' +
      '<button class="icon-btn fav-big' + (state.favs.includes(s.id) ? ' on' : '') + '" data-fav="' + s.id + '" aria-label="Favorito">' + ic('heart') + '</button></div></div><span class="emo">' + s.emoji + '</span></div>' +
      '<div class="store-card"><div class="sc-cat">' + c.emoji + ' ' + c.name + (s.adult ? ' · <b class="red-t">18+</b>' : '') + '</div><h1>' + esc(s.name) + '</h1><p class="muted small">' + esc(s.desc || s.kind) + '</p>' +
      '<div class="meta"><span>' + ic('map-pin') + esc(s.bairro) + ', ' + esc(s.cidade) + '</span><span class="dot">' + plural(s.reviews, 'avaliação', 'avaliações') + '</span></div>' +
      '<div class="store-stats"><div><b class="star">★ ' + s.rating.toFixed(1).replace('.', ',') + '</b><small>Avaliação</small></div><div><b>🛵 ' + mt(dm.fee) + '</b><small>' + dm.range + '</small></div><div><b>🚗 ' + mt(dc.fee) + '</b><small>' + dc.range + '</small></div></div>' +
      (s.promo ? '<div class="store-promo">' + ic('tag') + esc(s.promo) + '</div>' : '') + (s.min ? '<div class="muted small mt8">Pedido mínimo: ' + mt(s.min) + '</div>' : '') + '</div>' +
      '<div class="chips sec-chips">' + s.sections.map((sec, i) => '<button class="chip' + (i ? '' : ' active') + '" data-sec="' + i + '">' + esc(sec.title) + '</button>').join('') + '</div>' +
      s.sections.map((sec, i) => '<section class="menu-sec" id="sec' + i + '"><h2>' + esc(sec.title) + '</h2>' + sec.items.map(it => itemRow(s, it)).join('') + '</section>').join('') +
      '<div id="cartbarSlot"></div></div>';
    $$('[data-sec]').forEach(b => b.onclick = () => { $$('[data-sec]').forEach(x => x.classList.toggle('active', x === b)); b.scrollIntoView({ inline: 'center', block: 'nearest' }); const el = $('#sec' + b.dataset.sec); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'smooth' }); });
    $('#shareBtn').onclick = () => { const data = { title: s.name + ' — Txova', text: 'Olha esta loja no Txova: ' + s.name, url: location.href }; if (navigator.share) navigator.share(data).catch(() => { }); else toast('Partilha indisponível neste navegador'); };
    view.onclick = e => {
      const t = e.target.closest('[data-add],[data-inc],[data-dec],[data-item]'); if (!t) return;
      if (t.dataset.add || t.dataset.inc) return changeItemQty(s, itemById(s, t.dataset.add || t.dataset.inc), 1);
      if (t.dataset.dec) return changeItemQty(s, itemById(s, t.dataset.dec), -1);
      if (t.dataset.item) go('#/produto/' + s.id + '/' + t.dataset.item);
    };
    refreshStoreUI = () => {
      $$('[data-ctrl]').forEach(el => { const it = itemById(s, el.dataset.ctrl); if (it) el.innerHTML = itemCtrl(it); });
      const slot = $('#cartbarSlot'); if (!slot) return;
      const n = cartCount(); const cs = cartStore();
      slot.innerHTML = n ? '<a class="cartbar" href="#/carrinho"><span class="count">' + n + '</span><span class="lbl">Ver carrinho' + (cs && cs.id !== s.id ? '<small> · ' + esc(cs.name) + '</small>' : '') + '</span><span class="tot">' + mt(cartSubtotal()) + '</span></a>' : '';
    };
    refreshStoreUI();
    if (s.adult && !state.ageOk) setTimeout(() => { if (currentRoute === '#/loja/' + s.id) ageGate(null, () => back('#/')); }, 350);
  }

  function screenProduct(sid, iid) {
    const s = storeById(sid); const it = s && itemById(s, iid); if (!it) return go('#/');
    document.body.classList.add('no-tabbar');
    let qty = 1; const sel = (it.opts || []).map(o => o.type === 'one' ? [0] : []);
    const vars = variantList(it); let vi = variantDefault(it);
    view.innerHTML = '<div class="page product-page">' + topbar(esc(s.name), { fallback: '#/loja/' + s.id }) +
      '<div class="wrap"><div class="item-hero" style="' + grad(s.grad) + '"><span>' + it.emoji + '</span></div>' +
      '<div class="badges">' + itemBadges(it) + '</div><h1 class="p-title">' + esc(it.name) + '</h1><p class="muted p-desc">' + esc(it.desc || 'Produto de ' + s.name + '.') + '</p>' +
      '<div class="price big">' + priceLabel(it) + (it.old ? ' <s>' + mt(it.old) + '</s>' : '') + '</div>' +
      (vars ? '<div class="card mt12"><div class="card-h"><h2>' + (it.unit === 'kg' ? '⚖️ Peso' : '📦 Tamanho') + '</h2><span class="pill orange">Escolha 1</span></div><div class="var-grid">' +
        vars.map((v, i) => '<button class="var-opt" data-v="' + i + '"><b>' + v.l + '</b><small>' + mt(v.p) + '</small>' + (v.bulky ? '<em>🚗 só de carro</em>' : it.sizes && v.kg ? '<em>' + mt(v.p / v.kg) + (/ L$/.test(v.l) ? '/L' : '/kg') + '</em>' : '') + '</button>').join('') + '</div>' +
        (it.unit === 'kg' ? '<p class="muted small mt8">Peso aproximado: a loja pesa na hora e ajusta, se necessário, para o peso mais próximo.</p>' : '') + '<div id="bulkyNote"></div></div>' : '') +
      (it.rx ? '<div class="demo-note info-note blue">' + ic('file-text') + '<span><b>Medicamento sujeito a receita médica.</b> Vai precisar de carregar a fotografia da receita. O farmacêutico valida antes da entrega.</span></div>' : '') +
      (it.adult ? '<div class="demo-note info-note red">🔞 <span>Bebida alcoólica — venda proibida a menores de 18 anos. O BI pode ser pedido na entrega.</span></div>' : '') +
      (it.bulky ? '<div class="demo-note info-note">🚗 <span>Produto volumoso: este pedido será entregue de <b>carro</b>.</span></div>' : '') +
      (it.opts || []).map((o, oi) => '<div class="card mt12"><div class="card-h"><h2>' + esc(o.name) + '</h2><span class="pill' + (o.type === 'one' ? ' orange' : '') + '">' + (o.type === 'one' ? 'Escolha 1' : 'Opcional') + '</span></div><div class="opts">' +
        o.choices.map((ch, ci) => '<button class="opt opt-sm" data-o="' + oi + '" data-c="' + ci + '"><span class="' + (o.type === 'one' ? 'radio' : 'checkbox') + '"></span><span class="t"><b>' + esc(ch.l) + '</b></span>' + (ch.p ? '<small class="muted">+ ' + mt(ch.p) + '</small>' : '') + '</button>').join('') + '</div></div>').join('') +
      '<div class="card mt12"><div class="card-h"><h2>Notas para a loja</h2><small class="muted">Opcional</small></div><label class="field"><textarea id="pnote" placeholder="' + ({ restaurantes: 'Ex.: sem cebola, bem picante…', mercados: 'Ex.: tomates bem maduros, peixe limpo…', farmacia: 'Ex.: genérico, se houver', bebidas: 'Ex.: bem geladas', casa: 'Ex.: marca mais barata', cosmeticos: 'Ex.: embrulhar para presente' }[s.cat] || 'Ex.: instruções para a loja') + '"></textarea></label></div>' +
      '<div class="store-link"><a href="#/loja/' + s.id + '" class="srow mini"><div class="thumb" style="' + grad(s.grad) + '"><span>' + s.emoji + '</span></div><div class="info"><h3>' + esc(s.name) + '</h3><div class="kind">' + esc(s.bairro) + '</div></div>' + ic('chevron-right') + '</a></div><div class="spacer-cta"></div></div>' +
      '<div class="footer-cta"><div class="qty-row"><div class="stepper"><button id="qm" aria-label="Menos">' + ic('minus') + '</button><b id="qv">1</b><button id="qp" aria-label="Mais">' + ic('plus') + '</button></div><button class="btn" id="addBtn"></button></div></div></div>';
    const price = () => (vars ? vars[vi].p : it.price) + (it.opts || []).reduce((a, o, oi) => a + sel[oi].reduce((b, ci) => b + o.choices[ci].p, 0), 0);
    const draw = () => {
      $$('[data-o]').forEach(b => b.classList.toggle('sel', sel[+b.dataset.o].includes(+b.dataset.c)));
      $$('[data-v]').forEach(b => b.classList.toggle('sel', +b.dataset.v === vi));
      if ($('#bulkyNote')) $('#bulkyNote').innerHTML = vars[vi].bulky ? '<div class="demo-note info-note">🚗 <span>' + vars[vi].l + ' é volumoso: o pedido será entregue de <b>carro</b>.</span></div>' : '';
      $('#qv').textContent = qty; $('#addBtn').textContent = 'Adicionar · ' + mt(price() * qty);
    };
    $$('[data-o]').forEach(b => b.onclick = () => {
      const oi = +b.dataset.o, ci = +b.dataset.c, o = it.opts[oi];
      if (o.type === 'one') sel[oi] = [ci]; else sel[oi] = sel[oi].includes(ci) ? sel[oi].filter(x => x !== ci) : sel[oi].concat(ci);
      draw();
    });
    $$('[data-v]').forEach(b => b.onclick = () => { vi = +b.dataset.v; draw(); });
    $('#qm').onclick = () => { qty = Math.max(1, qty - 1); draw(); };
    $('#qp').onclick = () => { qty = Math.min(50, qty + 1); draw(); };
    $('#addBtn').onclick = () => {
      const labels = []; (it.opts || []).forEach((o, oi) => sel[oi].forEach(ci => labels.push(o.choices[ci].l)));
      const before = cartCount();
      const optP = price() - (vars ? vars[vi].p : it.price);
      addToCart(s, it, qty, labels, $('#pnote').value.trim(), optP, vars ? vars[vi] : null);
      setTimeout(() => { if (cartCount() > before && !$('.sheet') && currentRoute.startsWith('#/produto/')) back('#/loja/' + s.id); }, 500);
    };
    draw();
  }

  function screenCart() {
    const s = cartStore();
    if (!s || !cart.items.length) {
      view.innerHTML = '<div class="page">' + topbar('Carrinho', { back: false }) + emptyState('🛍️', 'O carrinho está vazio', 'Explore restaurantes, mercados e farmácias em Maputo e Matola.', 'Explorar lojas', '#/') + '</div>';
      return;
    }
    const t = totals(motaOk() ? 'mota' : 'carro');
    const short = s.min && t.sub < s.min;
    const code = (cart.code || '').toUpperCase();
    view.innerHTML = '<div class="page">' + topbar('Carrinho', { back: false, right: '<button class="link" id="clearCart">Esvaziar</button>' }) + '<div class="wrap">' +
      '<a class="card store-mini" href="#/loja/' + s.id + '"><div class="thumb" style="' + grad(s.grad) + '">' + s.emoji + '</div><div class="info"><h3>' + esc(s.name) + '</h3><small class="muted">' + esc(s.bairro) + ' · ' + t.range + '</small></div><span class="link">+ Adicionar</span></a>' +
      '<div class="card">' + cart.items.map(l => '<div class="line-item"><div class="pic" style="' + soft(s.grad) + '">' + l.emoji + '</div><div class="info"><h3>' + esc(l.name) + '</h3>' +
        ((l.perKg ? l.opts.slice(1) : l.opts).length ? '<small>' + esc((l.perKg ? l.opts.slice(1) : l.opts).join(' · ')) + '</small><br>' : '') + (l.note ? '<small>“' + esc(l.note) + '”</small><br>' : '') +
        (l.perKg ? '<small>' + mt(l.perKg) + '/kg × ' + fmtKg(l.kg) + (l.qty > 1 ? ' × ' + l.qty : '') + '</small><br>' : '') +
        '<small><b class="ink">' + mt(l.unit * l.qty) + '</b>' + (l.rx ? ' · <span class="rx-t">℞ receita</span>' : '') + (l.adult ? ' · <span class="red-t">18+</span>' : '') + (l.bulky ? ' · 🚗' : '') + '</small></div>' +
        '<div class="stepper"><button data-q="' + esc(l.key) + '" data-d="-1" aria-label="Menos">' + ic(l.qty === 1 ? 'trash-2' : 'minus') + '</button><b>' + l.qty + '</b><button data-q="' + esc(l.key) + '" data-d="1" aria-label="Mais">' + ic('plus') + '</button></div></div>').join('') + '</div>' +
      (cartRx() ? '<div class="card rx-card ' + (cart.rx ? 'ok' : 'warn') + '"><div class="addr"><div class="ico">' + ic('file-text') + '</div><div class="info"><h3>' + (cart.rx ? 'Receita carregada ✓' : 'Receita médica necessária') + '</h3><p>' + (cart.rx ? esc(cart.rx.name) + ' · será validada pelo farmacêutico' : 'Alguns medicamentos exigem receita. Carregue uma foto para continuar.') + '</p></div></div><button class="btn sm ' + (cart.rx ? 'secondary' : '') + ' mt8" id="rxBtn">' + ic('camera') + (cart.rx ? ' Trocar receita' : ' Carregar receita') + '</button></div>' : '') +
      (cartAdult() ? '<div class="demo-note info-note red">🔞 <span>O pedido contém bebidas alcoólicas. O estafeta vai pedir o BI de quem receber.</span></div>' : '') +
      (!motaOk() ? '<div class="demo-note info-note">🚗 <span>Pedido pesado (' + cartKg().toFixed(1).replace('.', ',') + ' kg) ou volumoso — será entregue de <b>carro</b>.</span></div>' : '') +
      '<div class="card"><div class="card-h"><h2>Código promocional</h2></div><div class="input-row"><input id="code" placeholder="TXOVA10" value="' + esc(code) + '" autocapitalize="characters" aria-label="Código promocional"><button class="btn sm dark" id="applyCode">Aplicar</button></div>' +
      (code ? (D.promoCodes[code] ? '<div class="ok-t">✓ ' + esc(t.promo.label) + (t.promo.warn ? ' — ' + t.promo.warn : '') + '</div>' : '<div class="err">Código inválido</div>') : '<small class="muted">Experimente TXOVA10, KANIMAMBO ou MAPUTO100</small>') + '</div>' +
      '<div class="card"><div class="sum"><span>Subtotal</span><span>' + mt(t.sub) + '</span></div>' + (t.disc ? '<div class="sum disc"><span>Desconto</span><span>−' + mt(t.disc) + '</span></div>' : '') +
      '<div class="sum"><span>Entrega (desde)</span><span>' + (t.promo.free ? '<s class="muted">' + mt(t.feeOrig) + '</s> Grátis' : mt(t.fee)) + '</span></div><div class="sum"><span>Taxa de serviço</span><span>' + mt(t.service) + '</span></div>' +
      '<p class="muted small mt8">' + ic('info') + ' Escolhe entre <b>mota</b> ou <b>carro</b> no passo seguinte.</p></div>' +
      '<div class="spacer-cta"></div></div>' +
      '<div class="footer-cta above-tab">' + (short ? '<div class="err center mb8">Pedido mínimo de ' + mt(s.min) + ' — faltam ' + mt(s.min - t.sub) + '</div>' : '') + '<button class="btn" id="toCheckout"' + (short ? ' disabled' : '') + '>Continuar · ' + mt(t.sub - t.disc) + '</button></div></div>';
    $$('[data-q]').forEach(b => b.onclick = () => { changeQty(b.dataset.q, +b.dataset.d); rerender(); });
    $('#clearCart').onclick = () => confirmSheet({ emoji: '🗑️', title: 'Esvaziar carrinho?', text: 'Todos os produtos serão removidos.', ok: 'Esvaziar', onOk: () => { cart = emptyCart(false); saveCart(); rerender(); } });
    $('#applyCode').onclick = () => { const v = $('#code').value.trim().toUpperCase(); cart.code = v; saveCart(); toast(D.promoCodes[v] ? 'Código aplicado 🎉' : (v ? 'Código inválido' : 'Código removido')); rerender(); };
    if ($('#rxBtn')) $('#rxBtn').onclick = () => rxSheet();
    $('#toCheckout').onclick = () => { if (cartRx() && !cart.rx) return rxSheet(() => go('#/checkout')); go('#/checkout'); };
  }

  function defaultPayPhone(p) {
    const ph = state.user.phone.replace(/\D/g, '');
    if (p.prefixes.includes(ph.slice(0, 2))) return fmtPhone(ph);
    return p.prefixes[0] + ' ' + ph.slice(2, 5) + ' ' + ph.slice(5, 9);
  }
  const fmtPhone = p => String(p).replace(/\D/g, '').replace(/^(\d{2})(\d{3})(\d{4})$/, '$1 $2 $3');

  function screenCheckout() {
    const s = cartStore(); if (!s || !cart.items.length) return go('#/carrinho');
    document.body.classList.add('no-tabbar');
    if (!motaOk()) state.vehicle = 'carro';
    const a = addr();
    const t = totals(state.vehicle);
    const pay = D.payments.find(p => p.id === state.pay) || D.payments[0];
    const vcard = vid => {
      const v = D.vehicles[vid]; const d = delivery(s, vid); const dis = vid === 'mota' && !motaOk();
      return '<button class="opt veh' + (state.vehicle === vid ? ' sel' : '') + (dis ? ' disabled' : '') + '" data-veh="' + vid + '"' + (dis ? ' aria-disabled="true"' : '') + '><span class="veh-top"><span class="veh-ic">' + v.emoji + '</span><span class="radio"></span></span><b>' + v.name + '</b><small>' + (dis ? 'Indisponível para este pedido' : v.desc) + '</small>' +
        '<span class="veh-fee">' + (t.promo.free ? '<s>' + mt(d.fee) + '</s> Grátis' : mt(d.fee)) + '</span><span class="veh-eta">' + ic('clock') + d.range + '</span></button>';
    };
    view.innerHTML = '<div class="page">' + topbar('Finalizar pedido', { fallback: '#/carrinho' }) + '<div class="wrap">' +
      '<div class="card"><div class="card-h"><h2>Morada de entrega</h2><button class="link" id="chAddr">Alterar</button></div><div class="addr"><div class="ico">' + ic(a.icon || 'map-pin') + '</div><div class="info"><h3>' + esc(a.label) + '</h3><p>' + esc(a.street) + '<br>' + esc(a.bairro) + ', ' + esc(a.cidade) + (a.ref ? '<br><i>Ref.: ' + esc(a.ref) + '</i>' : '') + '</p></div></div>' +
      '<label class="field"><span>Telefone para contacto</span><div class="prefix"><b>🇲🇿 +258</b><input id="phone" inputmode="tel" value="' + esc(state.user.phone) + '"></div></label></div>' +
      '<div class="card"><div class="card-h"><h2>Entrega por</h2></div><p class="muted small veh-route">' + ic('map-pin') + ' ' + esc(s.bairro) + ' → ' + esc(a.bairro) + ' · ' + t.km.toFixed(1).replace('.', ',') + ' km</p><div class="seg">' + vcard('mota') + vcard('carro') + '</div>' +
      '<p class="muted small mt8">' + (state.vehicle === 'mota' ? '🛵 Um estafeta de mota leva o pedido numa mochila térmica — mais rápido no trânsito.' : '🚗 Um motorista leva tudo de uma vez — ideal para grades, gás e compras do mês.') + '</p></div>' +
      '<div class="card"><div class="card-h"><h2>Pagamento</h2></div><div class="opts">' + D.payments.map(p => '<button class="opt' + (p.id === pay.id ? ' sel' : '') + '" data-pay="' + p.id + '"><span class="logo" style="background:' + p.color + '">' + p.badge + '</span><span class="t"><b>' + esc(p.name) + '</b><small>' + esc(p.sub) + '</small></span><span class="radio"></span></button>').join('') + '</div>' +
      (pay.mobile ? '<label class="field"><span>Número ' + esc(pay.name) + '</span><div class="prefix"><b>+258</b><input id="payPhone" inputmode="tel" value="' + esc(defaultPayPhone(pay)) + '"></div></label><div class="err" id="payErr" hidden></div>' : '') +
      (pay.id === 'dinheiro' ? '<label class="field"><span>Troco para (opcional)</span><input id="change" inputmode="numeric" placeholder="Ex.: 2000"></label>' : '') + '</div>' +
      '<div class="card"><div class="card-h"><h2>Resumo</h2><small class="muted">' + plural(cartCount(), 'artigo', 'artigos') + ' · ' + esc(s.name) + '</small></div>' +
      cart.items.map(l => '<div class="sum"><span>' + l.qty + '× ' + esc(l.name) + (l.opts.length ? ' <small class="muted">(' + esc(l.opts.join(', ')) + ')</small>' : '') + '</span><span>' + mt(l.unit * l.qty) + '</span></div>').join('') +
      '<div class="sum sep"><span>Subtotal</span><span>' + mt(t.sub) + '</span></div>' + (t.disc ? '<div class="sum disc"><span>Desconto (' + esc(cart.code) + ')</span><span>−' + mt(t.disc) + '</span></div>' : '') +
      '<div class="sum"><span>Entrega de ' + D.vehicles[state.vehicle].name.toLowerCase() + '</span><span>' + (t.promo.free ? '<s class="muted">' + mt(t.feeOrig) + '</s> Grátis' : mt(t.fee)) + '</span></div><div class="sum"><span>Taxa de serviço</span><span>' + mt(t.service) + '</span></div>' +
      '<div class="sum total"><span>Total</span><span>' + mt(t.total) + '</span></div>' +
      (cart.rx ? '<p class="small rx-t mt8">℞ Receita anexada: ' + esc(cart.rx.name) + '</p>' : '') + (cartAdult() ? '<p class="small red-t mt8">🔞 BI obrigatório na entrega</p>' : '') + '</div>' +
      '<div class="card"><label class="field nomt"><span>Instruções para o ' + (state.vehicle === 'mota' ? 'estafeta' : 'motorista') + '</span><textarea id="dnote" placeholder="Ex.: ligar ao chegar ao portão">' + esc(cart.note) + '</textarea></label></div>' +
      '<div class="spacer-cta"></div></div><div class="footer-cta"><button class="btn" id="placeBtn">Fazer pedido · ' + mt(t.total) + '</button><div class="cta-sub">' + D.vehicles[state.vehicle].emoji + ' ' + D.vehicles[state.vehicle].name + ' · chega em ' + t.range + ' · ' + esc(pay.name) + '</div></div></div>';
    const keep = () => { cart.note = $('#dnote').value; saveCart(); const ph = $('#phone'); if (ph && ph.value.trim()) { state.user.phone = ph.value.trim(); saveState(); } };
    const keepScroll = fn => { const y = window.scrollY; fn(); rerender(); window.scrollTo(0, y); };
    $$('[data-veh]').forEach(b => b.onclick = () => {
      if (b.classList.contains('disabled')) return toast('Pedido pesado ou volumoso — só de carro');
      keep(); keepScroll(() => { state.vehicle = b.dataset.veh; saveState(); });
    });
    $$('[data-pay]').forEach(b => b.onclick = () => { keep(); keepScroll(() => { state.pay = b.dataset.pay; saveState(); }); });
    $('#chAddr').onclick = () => { keep(); addressSheet(); };
    $('#placeBtn').onclick = () => {
      keep();
      if (cartRx() && !cart.rx) return rxSheet(() => rerender());
      let phone = '';
      if (pay.mobile) {
        phone = $('#payPhone').value.replace(/\D/g, '').replace(/^258/, '');
        const err = $('#payErr');
        if (!/^\d{9}$/.test(phone) || !pay.prefixes.includes(phone.slice(0, 2))) {
          err.hidden = false; err.textContent = 'Introduza um número ' + pay.name + ' válido (9 dígitos, começa por ' + pay.prefixes.join(' ou ') + ').';
          $('#payPhone').focus(); return;
        }
      }
      const doPay = () => paymentSheet(pay, t.total, phone, ref => placeOrder(pay, t, ref, phone));
      if (cartAdult() && !state.ageOk) return ageGate(doPay);
      doPay();
    };
  }

  function paymentSheet(pay, total, phone, onSuccess) {
    const ref = ({ mpesa: 'MP', emola: 'EM', mkesh: 'MK', cartao: 'CD' }[pay.id] || 'TX') + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '.' + uid();
    const success = (sh, title, sub) => {
      const body = $('.pay-body', sh); if (!body) return;
      body.innerHTML = '<div class="paysim"><div class="success-ic">' + ic('check') + '</div><h2>' + title + '</h2><p class="muted">' + sub + '</p><div class="ref">Ref. ' + ref + '</div><p class="muted small mt12">Kanimambo! A enviar o pedido à loja…</p></div>';
      setTimeout(() => { closeSheet(true); onSuccess(ref); }, 1600);
    };
    if (pay.mobile) {
      openSheet('<div class="pay-body"><div class="paysim"><div class="logo-xl" style="background:' + pay.color + '">' + pay.badge + '</div><h2>Pagamento ' + esc(pay.name) + '</h2><p class="muted">A enviar pedido de pagamento para <b>+258 ' + fmtPhone(phone) + '</b>…</p><div class="spinner"></div><p class="small muted">Desbloqueie o telemóvel e confirme com o seu PIN</p></div></div>', sh => {
        setTimeout(() => {
          const body = $('.pay-body', sh); if (!body) return;
          body.innerHTML = '<div class="paysim"><h2>Confirme no telemóvel</h2><p class="muted small">Simulação do pedido ' + esc(pay.name) + '</p><div class="phone-mock"><div class="scr"><div class="ussd"><b class="ttl" style="color:' + pay.color + '">' + esc(pay.name) + '</b>Confirma o pagamento de <b>' + mt(total) + '</b> a <b>TXOVA ENTREGAS</b>?<br>Introduza o seu PIN:<input id="pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="PIN"><div class="acts"><button id="pinNo">Cancelar</button><button id="pinOk">Enviar</button></div></div></div></div><p class="small muted mt8">Demo: qualquer PIN de 4 dígitos</p></div>';
          const pin = $('#pin', sh); pin.focus({ preventScroll: true });
          $('#pinNo', sh).onclick = () => { closeSheet(); toast('Pagamento cancelado'); };
          $('#pinOk', sh).onclick = () => {
            if (!/^\d{4}$/.test(pin.value)) { pin.classList.add('bad'); toast('O PIN tem 4 dígitos'); return; }
            body.innerHTML = '<div class="paysim"><h2>A processar…</h2><div class="spinner"></div><p class="muted small">A confirmar com ' + esc(pay.name) + '</p></div>';
            setTimeout(() => success(sh, 'Pagamento confirmado', mt(total) + ' pagos com ' + esc(pay.name)), 1300);
          };
        }, 1600);
      }, { locked: true });
    } else if (pay.id === 'cartao') {
      openSheet('<div class="pay-body"><h2>Pagar com cartão</h2><div class="card-mock"><div class="row-sb"><span class="chip-ic"></span><b>VISA</b></div><div class="num" id="cmNum">4242 4242 4242 4242</div><div class="row-sb small"><span>' + esc((state.user.name + ' ' + state.user.last).toUpperCase()) + '</span><span>12/29</span></div></div>' +
        '<label class="field"><span>Número do cartão</span><input id="cnum" inputmode="numeric" value="4242 4242 4242 4242"></label><div class="input-row2"><label class="field"><span>Validade</span><input value="12/29" aria-label="Validade"></label><label class="field"><span>CVV</span><input inputmode="numeric" value="123" maxlength="3" aria-label="CVV"></label></div>' +
        '<button class="btn mt12" id="cardPay">Pagar ' + mt(total) + '</button><button class="btn secondary mt8" data-close>Cancelar</button><p class="small muted center mt8">Simulação — nenhum valor é cobrado</p></div>', sh => {
        $('#cnum', sh).oninput = e => { $('#cmNum', sh).textContent = e.target.value || '•••• •••• •••• ••••'; };
        $('#cardPay', sh).onclick = () => {
          const last4 = ($('#cnum', sh).value.replace(/\D/g, '').slice(-4)) || '4242';
          $('.pay-body', sh).innerHTML = '<div class="paysim"><h2>Verificação 3-D Secure</h2><div class="spinner"></div><p class="muted small">A validar com o banco emissor…</p></div>';
          setTimeout(() => success(sh, 'Pagamento aprovado', mt(total) + ' · Visa •••• ' + last4), 1800);
        };
      }, { locked: false });
    } else {
      const ch = $('#change') ? parseInt($('#change').value, 10) : 0;
      openSheet('<div class="pay-body"><div class="paysim"><div class="sheet-emoji">💵</div><h2>Dinheiro na entrega</h2><p class="muted">Pague <b>' + mt(total) + '</b> ao ' + (state.vehicle === 'mota' ? 'estafeta' : 'motorista') + ' quando receber.' + (ch > total ? ' Troco para ' + mt(ch) + ': <b>' + mt(ch - total) + '</b>.' : ' Tenha trocos, por favor.') + '</p><button class="btn mt12" id="cashOk">Confirmar pedido</button><button class="btn secondary mt8" data-close>Voltar</button></div></div>', sh => {
        $('#cashOk', sh).onclick = () => { $('.pay-body', sh).innerHTML = '<div class="paysim"><h2>A enviar pedido…</h2><div class="spinner"></div></div>'; setTimeout(() => success(sh, 'Pedido confirmado', 'Pagamento em dinheiro na entrega'), 1000); };
      });
    }
  }

  function placeOrder(pay, t, ref, phone) {
    const s = cartStore(); const a = addr(); const vid = state.vehicle;
    const pool = D.riders[vid]; const rider = pool[Math.floor(Math.random() * pool.length)];
    const o = {
      id: 'TX' + String(Date.now()).slice(-6), ref, createdAt: Date.now(), storeId: s.id, storeName: s.name, storeBairro: s.bairro, emoji: s.emoji, grad: s.grad, cat: s.cat,
      items: cart.items.map(l => ({ name: l.name, qty: l.qty, unit: l.unit, emoji: l.emoji, opts: l.opts, itemId: l.itemId, key: l.key, kg: l.kg, bulky: l.bulky, perKg: l.perKg || 0 })),
      sub: t.sub, fee: t.fee, service: t.service, disc: t.disc, total: t.total, code: cart.code, vehicle: vid, rider, eta: t.eta,
      address: Object.assign({}, a), pay: pay.id, payName: pay.name, payPhone: phone, rx: cart.rx ? { name: cart.rx.name } : null, adult: cartAdult(), note: cart.note,
      demoMs: 150000
    };
    orders.unshift(o); saveOrders();
    cart = emptyCart(false); saveCart();
    location.replace('#/pedido/' + o.id + '?novo=1');
  }

  /* ---------- Estado do pedido (simulado: ~2,5 min do início ao fim) ---------- */
  const STEPS_BASE = [
    { k: 'ok', ic: 'circle-check', at: 0 },
    { k: 'prep', ic: 'chef-hat', at: 0.08 },
    { k: 'pick', ic: 'package', at: 0.38 },
    { k: 'road', ic: 'navigation', at: 0.5 },
    { k: 'done', ic: 'house', at: 1 }
  ];
  function steps(o) {
    const v = D.vehicles[o.vehicle]; const first = o.rider.name.split(' ')[0];
    const who = o.vehicle === 'mota' ? 'O estafeta' : 'O motorista';
    const prep = { restaurantes: 'A cozinha está a preparar o seu pedido', farmacia: o.rx ? 'O farmacêutico está a validar a receita' : 'A farmácia está a separar os produtos', mercados: 'A loja está a separar as suas compras', bebidas: 'A preparar as bebidas bem geladas', casa: 'A separar e embalar os produtos', cosmeticos: 'A embalar os seus produtos' }[o.cat] || 'A loja está a preparar o pedido';
    const txt = {
      ok: ['Pedido confirmado', o.storeName + ' recebeu o seu pedido'],
      prep: [o.cat === 'restaurantes' ? 'A preparar' : o.cat === 'farmacia' && o.rx ? 'A validar receita' : 'A separar produtos', prep],
      pick: [(o.vehicle === 'mota' ? 'Estafeta' : 'Motorista') + ' na loja', who + ' ' + first + ' está a recolher o pedido'],
      road: ['A caminho', first + ' vai de ' + v.name.toLowerCase() + ' (' + o.rider.plate + ') até si'],
      done: ['Entregue', 'Bom proveito! Kanimambo por usar o Txova']
    };
    return STEPS_BASE.map(s => Object.assign({}, s, { t: txt[s.k][0], d: txt[s.k][1] }));
  }
  function orderStatus(o) {
    if (o.past) return { idx: 4, p: 1, title: 'Entregue', remaining: 0 };
    const p = Math.min(1, Math.max(0, (Date.now() - o.createdAt) / o.demoMs));
    let idx = 0; STEPS_BASE.forEach((s, i) => { if (p >= s.at) idx = i; });
    return { idx, p, title: steps(o)[idx].t, remaining: Math.max(1, Math.ceil(o.eta * (1 - p))) };
  }

  /* ---------- Mapa estilizado (SVG próprio, sem APIs pagas) ---------- */
  function mapSVG(o) {
    const s = D.coords[o.storeBairro] || [200, 150]; const h0 = D.coords[o.address.bairro] || [260, 150];
    const same = Math.hypot(s[0] - h0[0], s[1] - h0[1]) < 24; const h = same ? [h0[0] + 34, h0[1] - 34] : h0;
    const mx = (s[0] + h[0]) / 2, my = (s[1] + h[1]) / 2; const dx = h[0] - s[0], dy = h[1] - s[1];
    const cx = mx - dy * 0.22, cy = my + dx * 0.22;
    const route = 'M' + s[0] + ' ' + s[1] + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + h[0] + ' ' + h[1];
    const labels = [['Matola', 40, 160], ['Machava', 100, 82], ['Zimpeto', 136, 22], ['Sommerschield', 254, 142], ['Polana', 262, 194], ['Baixa', 172, 250], ['Costa do Sol', 290, 62], ['Coop', 230, 118], ['Malhangalene', 196, 162], ['Alto Maé', 150, 212], ['Triunfo', 300, 100], ['Magoanine', 188, 36]];
    const coast = 'M372 0 L360 48 L346 92 L322 128 L300 168 L286 212 L246 248 L190 258 L130 264 L70 272 L0 262';
    return '<svg viewBox="0 0 400 300" role="img" aria-label="Mapa do trajeto entre a loja e a sua morada"><defs><pattern id="blk" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#F3EFE7"/><rect x="1.5" y="1.5" width="13" height="13" rx="2.5" fill="#EAE4D8"/></pattern></defs>' +
      '<rect width="400" height="300" fill="url(#blk)"/>' +
      '<path d="' + coast + ' L0 300 L400 300 L400 0 Z" fill="#BFE3F2"/><path d="' + coast + '" fill="none" stroke="#A3D4EA" stroke-width="3"/>' +
      '<path d="M128 266 Q96 228 62 236 Q30 242 6 222" fill="none" stroke="#BFE3F2" stroke-width="8" stroke-linecap="round"/>' +
      '<text x="300" y="282" class="m-sea">Baía de Maputo</text><text x="378" y="200" class="m-sea" transform="rotate(-72 378 200)">Oceano Índico</text>' +
      '<g fill="#D3EAC4"><ellipse cx="226" cy="232" rx="12" ry="7"/><ellipse cx="302" cy="146" rx="9" ry="13"/><ellipse cx="124" cy="140" rx="18" ry="10"/><ellipse cx="250" cy="60" rx="14" ry="9"/></g>' +
      '<g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"><path d="M0 182 L62 172 L150 196 L196 236" stroke-width="7"/><path d="M196 236 L286 212 L322 128 L360 48" stroke-width="6"/><path d="M196 236 L214 160 L230 90 L240 0" stroke-width="5"/><path d="M110 94 L170 120 L214 160 L268 152 L300 168" stroke-width="5"/><path d="M62 172 L110 94 L150 34" stroke-width="5"/><path d="M180 200 L258 204" stroke-width="4"/><path d="M268 152 L262 96 L196 44" stroke-width="4"/><path d="M36 226 L80 204 L150 196" stroke-width="4"/></g>' +
      '<g class="m-lbl">' + labels.map(l => '<text x="' + l[1] + '" y="' + l[2] + '">' + l[0] + '</text>').join('') + '</g>' +
      '<path d="' + route + '" fill="none" stroke="#1C1B1F" stroke-opacity=".10" stroke-width="10" stroke-linecap="round"/>' +
      '<path id="routeBase" d="' + route + '" fill="none" stroke="#EC4A1F" stroke-opacity=".55" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="1 7"/>' +
      '<path id="routeDone" d="' + route + '" fill="none" stroke="#EC4A1F" stroke-width="5" stroke-linecap="round"/>' +
      '<g transform="translate(' + s[0] + ' ' + s[1] + ')"><circle r="16" fill="#fff" stroke="#1C1B1F" stroke-width="2"/><text y="6" text-anchor="middle" font-size="16">' + o.emoji + '</text></g>' +
      '<g transform="translate(' + h[0] + ' ' + h[1] + ')"><circle r="24" fill="#EC4A1F" opacity=".18" class="m-pulse"/><circle r="14" fill="#EC4A1F" stroke="#fff" stroke-width="3"/><text y="5" text-anchor="middle" font-size="13">🏠</text></g>' +
      '<g id="vehicle"><g class="veh-bob"><circle r="18" fill="#fff" stroke="#EC4A1F" stroke-width="3"/><text y="6.5" text-anchor="middle" font-size="18">' + D.vehicles[o.vehicle].emoji + '</text></g></g></svg>';
  }

  function screenOrder(id) {
    const o = orders.find(x => x.id === id); if (!o) return go('#/pedidos');
    document.body.classList.add('no-tabbar');
    const isNew = location.hash.includes('novo=1');
    const v = D.vehicles[o.vehicle]; const first = o.rider.name.split(' ')[0];
    view.innerHTML = '<div class="page track-page">' + topbar('Pedido #' + o.id, { fallback: '#/pedidos', right: '<button class="icon-btn" id="helpBtn" aria-label="Ajuda">' + ic('info') + '</button>' }) +
      '<div class="track-map">' + mapSVG(o) + '<div class="eta"><small id="etaLbl">Chega em</small><b id="etaVal"></b></div><div class="demo-chip">' + v.emoji + ' ' + v.name + '</div></div>' +
      '<div class="wrap"><div class="card status-card"><h2 id="stTitle"></h2><p class="muted small" id="stDesc"></p><div class="progress"><i id="prog"></i></div></div>' +
      '<div class="card"><div class="courier"><div class="av">' + o.rider.avatar + '</div><div class="info"><small class="muted">' + (o.vehicle === 'mota' ? 'O seu estafeta' : 'O seu motorista') + '</small><h3>' + esc(o.rider.name) + '</h3><div class="meta"><span class="star">' + ic('star') + '<b class="ink">' + String(o.rider.rating).replace('.', ',') + '</b></span><span class="dot">' + o.rider.trips.toLocaleString('pt-PT') + ' entregas</span></div></div>' +
      '<button class="icon-btn" id="callBtn" aria-label="Ligar">' + ic('phone') + '</button><button class="icon-btn" id="chatBtn" aria-label="Mensagem">' + ic('message-circle') + '</button></div>' +
      '<div class="vehicle-box"><span class="veh-big">' + v.emoji + '</span><div class="grow"><b>' + esc(o.rider.vehicle) + '</b><small>' + (o.vehicle === 'mota' ? 'Entrega de mota' : 'Entrega de carro') + '</small></div><span class="plate">' + esc(o.rider.plate) + '</span></div></div>' +
      '<div class="card"><div class="card-h"><h2>Estado do pedido</h2><button class="link" id="ffBtn">' + ic('fast-forward') + ' Avançar</button></div><div class="steps" id="steps"></div></div>' +
      '<div class="card"><div class="card-h"><h2>' + o.emoji + ' ' + esc(o.storeName) + '</h2><small class="muted">' + fmtDate(o.createdAt) + '</small></div>' +
      o.items.map(l => '<div class="sum"><span>' + l.qty + '× ' + esc(l.name) + (l.opts && l.opts.length ? ' <small class="muted">(' + esc(l.opts.join(', ')) + ')</small>' : '') + '</span><span>' + mt(l.unit * l.qty) + '</span></div>').join('') +
      '<div class="sum sep"><span>Entrega (' + v.name.toLowerCase() + ')</span><span>' + (o.fee ? mt(o.fee) : 'Grátis') + '</span></div>' + (o.disc ? '<div class="sum disc"><span>Desconto</span><span>−' + mt(o.disc) + '</span></div>' : '') + '<div class="sum"><span>Taxa de serviço</span><span>' + mt(o.service) + '</span></div>' +
      '<div class="sum total"><span>Total</span><span>' + mt(o.total) + '</span></div><p class="small muted mt8">' + esc(o.payName) + (o.payPhone ? ' · +258 ' + fmtPhone(o.payPhone) : '') + ' · Ref. ' + esc(o.ref) + '</p>' +
      '<p class="small muted">📍 ' + esc(o.address.street) + ', ' + esc(o.address.bairro) + '</p>' + (o.rx ? '<p class="small rx-t">℞ Receita: ' + esc(o.rx.name) + '</p>' : '') + (o.adult ? '<p class="small red-t">🔞 Mostre o BI ao receber</p>' : '') + '</div>' +
      '<div id="doneSlot"></div></div></div>';
    const path = $('#routeBase'); const done = $('#routeDone'); const veh = $('#vehicle'); const L = path.getTotalLength();
    done.style.strokeDasharray = L + ' ' + L;
    const st = steps(o); let lastIdx = -1;
    const tick = () => {
      if (!document.body.contains(veh)) return stopLive();
      const S = orderStatus(o);
      const road = Math.max(0, Math.min(1, (S.p - 0.5) / 0.5));
      const pt = path.getPointAtLength(road * L);
      veh.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
      done.style.strokeDashoffset = (L * (1 - road)).toFixed(1);
      $('#prog').style.width = (S.p * 100).toFixed(1) + '%';
      $('#etaVal').textContent = S.idx === 4 ? 'Entregue ✓' : S.remaining + ' min';
      $('#etaLbl').textContent = S.idx === 4 ? fmtDate(o.createdAt + (o.past ? 35 * 6e4 : o.demoMs)) : 'Chega em';
      if (S.idx !== lastIdx) {
        lastIdx = S.idx;
        $('#stTitle').textContent = st[S.idx].t + (S.idx < 4 ? '…' : ' 🎉');
        $('#stDesc').textContent = st[S.idx].d;
        $('#steps').innerHTML = st.map((x, i) => { const dn = i < S.idx || S.idx === 4; return '<div class="step ' + (dn ? 'done' : i === S.idx ? 'now' : '') + '"><div class="bullet">' + ic(dn ? 'check' : x.ic) + '</div><div><h3>' + x.t + '</h3><p>' + x.d + '</p></div></div>'; }).join('');
        if (S.idx === 4) {
          $('#ffBtn').hidden = true;
          $('#doneSlot').innerHTML = '<button class="btn" id="rateBtn">' + ic('star') + (o.rated ? ' Avaliado: ' + o.rated + '★' : ' Avaliar entrega') + '</button><button class="btn secondary mt8" id="againBtn">' + ic('rotate-ccw') + ' Pedir outra vez</button>';
          $('#rateBtn').onclick = () => rateSheet(o); $('#againBtn').onclick = () => reorder(o);
          if (!o.rated && !o.past && lastIdx === 4 && Date.now() - o.createdAt < o.demoMs + 5000) setTimeout(() => { if (currentRoute === '#/pedido/' + o.id && !$('.sheet')) rateSheet(o); }, 1200);
        }
      }
    };
    stopLive(); tick(); liveTimer = setInterval(tick, 400);
    $('#ffBtn').onclick = () => {
      const S = orderStatus(o); const nextP = S.idx >= 3 ? 1 : STEPS_BASE[S.idx + 1].at + 0.001;
      o.createdAt = Date.now() - nextP * o.demoMs; saveOrders(); tick();
    };
    $('#callBtn').onclick = () => toast('📞 A ligar a ' + first + '… (simulação)');
    $('#chatBtn').onclick = () => chatSheet(o);
    $('#helpBtn').onclick = () => confirmSheet({ emoji: '💬', title: 'Precisa de ajuda?', text: 'Esta entrega é uma <b>simulação</b>: o pedido avança sozinho em cerca de 2 minutos. Use “Avançar” para saltar etapas.', ok: 'Falar com ' + esc(first), cancel: 'Fechar', onOk: () => chatSheet(o) });
    if (isNew) { history.replaceState(history.state, '', '#/pedido/' + o.id); currentRoute = '#/pedido/' + o.id; toast('Pedido feito! ' + v.emoji + ' ' + first + ' vai levar o seu pedido'); }
  }
  function stopLive() { if (liveTimer) { clearInterval(liveTimer); liveTimer = null; } }

  function chatSheet(o) {
    const first = o.rider.name.split(' ')[0];
    openSheet('<h2>' + o.rider.avatar + ' ' + esc(first) + '</h2><p class="muted small">' + esc(o.rider.vehicle) + ' · ' + esc(o.rider.plate) + '</p><div class="chat" id="chat"><div class="msg them">Olá! Sou ' + esc(first) + ', vou levar o seu pedido de ' + esc(o.storeName) + ' 👋</div></div>' +
      '<div class="quick">' + ['Estou no portão', 'Pode ligar quando chegar?', 'Obrigado!'].map(q => '<button class="chip" data-m="' + q + '">' + q + '</button>').join('') + '</div>', sh => {
      $$('[data-m]', sh).forEach(b => b.onclick = () => {
        const c = $('#chat', sh); c.insertAdjacentHTML('beforeend', '<div class="msg me">' + esc(b.dataset.m) + '</div>'); c.scrollTop = 1e6;
        setTimeout(() => { if (!document.body.contains(c)) return; c.insertAdjacentHTML('beforeend', '<div class="msg them">' + pick(['Ok, combinado! 👍', 'Sem problema, ligo ao chegar.', 'Estou quase aí ' + D.vehicles[o.vehicle].emoji, 'De nada, até já!'], hash(b.dataset.m)) + '</div>'); c.scrollTop = 1e6; }, 700);
      });
    });
  }
  function rateSheet(o) {
    let stars = o.rated || 5;
    openSheet('<div class="center-sheet"><div class="sheet-emoji">' + o.rider.avatar + '</div><h2>Como correu a entrega?</h2><p class="muted sheet-text">Avalie ' + esc(o.rider.name.split(' ')[0]) + ' e ' + esc(o.storeName) + '</p><div class="stars" id="stars"></div>' +
      '<div class="quick center">' + ['Rápido', 'Simpático', 'Bem embalado', 'Tudo certo'].map(q => '<button class="chip">' + q + '</button>').join('') + '</div><button class="btn mt12" id="rateOk">Enviar avaliação</button></div>', (sh, close) => {
      const draw = () => { $('#stars', sh).innerHTML = [1, 2, 3, 4, 5].map(i => '<button data-s="' + i + '" class="' + (i <= stars ? 'on' : '') + '" aria-label="' + i + ' estrelas">★</button>').join(''); $$('[data-s]', sh).forEach(b => b.onclick = () => { stars = +b.dataset.s; draw(); }); };
      draw(); $$('.quick .chip', sh).forEach(c => c.onclick = () => c.classList.toggle('active'));
      $('#rateOk', sh).onclick = () => { o.rated = stars; saveOrders(); close(); toast('Kanimambo pela avaliação! ⭐'); setTimeout(rerender, 220); };
    });
  }
  function reorder(o) {
    const s = storeById(o.storeId); if (!s) return;
    const run = () => {
      cart = Object.assign(emptyCart(false), { storeId: s.id });
      o.items.forEach(l => { const it = itemById(s, l.itemId); if (it) cart.items.push({ key: l.key || lineKey(it.id, l.opts), itemId: it.id, name: it.name, emoji: it.emoji, unit: l.unit, qty: l.qty, opts: l.opts || [], note: '', kg: l.kg != null ? l.kg : (it.kg || 0.5), bulky: l.bulky != null ? !!l.bulky : !!it.bulky, adult: !!it.adult, rx: !!it.rx, perKg: l.perKg || 0 }); });
      saveCart(); toast('Produtos adicionados ao carrinho'); go('#/carrinho');
    };
    if (cart.items.length && cart.storeId !== s.id) confirmSheet({ emoji: '🛍️', title: 'Substituir carrinho?', text: 'O carrinho atual será esvaziado.', ok: 'Substituir', onOk: run }); else run();
  }

  function screenOrders() {
    const tab = sessionStorage.getItem('txova.otab') || 'curso';
    const live = orders.filter(o => orderStatus(o).idx < 4), past = orders.filter(o => orderStatus(o).idx === 4);
    const list = tab === 'curso' ? live : past;
    view.innerHTML = '<div class="page">' + topbar('Os meus pedidos', { back: false }) +
      '<div class="tabs"><button data-t="curso" class="' + (tab === 'curso' ? 'active' : '') + '">Em curso (' + live.length + ')</button><button data-t="ant" class="' + (tab !== 'curso' ? 'active' : '') + '">Anteriores (' + past.length + ')</button></div><div class="wrap">' +
      (list.length ? list.map(o => { const S = orderStatus(o); const v = D.vehicles[o.vehicle]; return '<div class="card order"><a class="top" href="#/pedido/' + o.id + '"><div class="thumb" style="' + grad(o.grad) + '">' + o.emoji + '</div><div class="info grow"><h3>' + esc(o.storeName) + '</h3><small class="muted">' + fmtDate(o.createdAt) + ' · ' + v.emoji + ' ' + v.name + '</small></div><span class="st' + (S.idx < 4 ? ' live' : '') + '">' + S.title + '</span></a>' +
        '<div class="items">' + esc(o.items.map(l => l.qty + '× ' + l.name + (l.opts && l.opts.length ? ' (' + l.opts[0] + ')' : '')).join(', ')) + '</div><div class="row-sb"><b>' + mt(o.total) + '</b><small class="muted">#' + o.id + ' · ' + esc(o.payName) + '</small></div>' +
        '<div class="acts mt8">' + (S.idx < 4 ? '<a class="btn sm" href="#/pedido/' + o.id + '">' + ic('navigation') + ' Acompanhar</a>' : '<a class="btn sm secondary" href="#/pedido/' + o.id + '">Detalhes</a><button class="btn sm" data-re="' + o.id + '">' + ic('rotate-ccw') + ' Repetir</button>') + '</div></div>'; }).join('')
        : (tab === 'curso' ? emptyState('🛵', 'Nenhum pedido em curso', 'Quando fizer um pedido, pode acompanhá-lo aqui em tempo real.', 'Fazer um pedido', '#/') : emptyState('🧾', 'Ainda sem histórico', 'Os seus pedidos anteriores aparecem aqui.'))) + '</div></div>';
    $$('[data-t]').forEach(b => b.onclick = () => { sessionStorage.setItem('txova.otab', b.dataset.t); screenOrders(); });
    $$('[data-re]').forEach(b => b.onclick = () => reorder(orders.find(o => o.id === b.dataset.re)));
    stopLive(); liveTimer = setInterval(() => { if (currentRoute !== '#/pedidos') return stopLive(); if (orders.filter(o => orderStatus(o).idx < 4).length !== live.length) screenOrders(); }, 2000);
  }

  function screenProfile() {
    const u = state.user; const done = orders.filter(o => orderStatus(o).idx === 4);
    const spent = done.reduce((a, o) => a + o.total, 0);
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    const row = (id, icon, t, small, chev) => '<button id="' + id + '">' + ic(icon) + '<span class="t">' + t + '</span>' + (small != null ? '<small>' + small + '</small>' : '') + (chev !== false ? ic('chevron-right', 'chev') : '') + '</button>';
    view.innerHTML = '<div class="page">' + topbar('Perfil', { back: false }) +
      '<div class="profile-head"><div class="avatar">' + esc((u.name || 'Z')[0]) + '</div><div><h2>' + esc(u.name + ' ' + u.last) + '</h2><p class="muted small">+258 ' + esc(u.phone) + '</p><p class="muted small">' + esc(u.email) + '</p></div></div>' +
      '<div class="stats"><div><b>' + orders.length + '</b><small>Pedidos</small></div><div><b>' + state.favs.length + '</b><small>Favoritos</small></div><div><b>' + mt(spent).replace(' MT', '') + '</b><small>MT gastos</small></div></div>' +
      '<div class="wrap mt12">' +
      (!standalone ? '<button class="card install-card" id="installBtn"><span class="ins-ic"><img src="icons/icon-192.png" alt=""></span><span class="t"><b>Instalar o Txova</b><small>Adicione ao ecrã principal para abrir como uma app</small></span>' + ic('download') + '</button>' : '') +
      '<div class="result-h">Conta</div><div class="menu-list">' +
      row('pEdit', 'user', 'Dados pessoais', esc(u.name)) + row('pAddr', 'map-pin', 'Moradas', state.addresses.length) +
      row('pPay', 'wallet', 'Pagamento preferido', esc((D.payments.find(p => p.id === state.pay) || {}).name || '')) + row('pFav', 'heart', 'Lojas favoritas', state.favs.length) +
      '<a href="#/pedidos">' + ic('receipt') + '<span class="t">Histórico de pedidos</span>' + ic('chevron-right', 'chev') + '</a></div>' +
      '<div class="result-h">Preferências</div><div class="menu-list">' +
      '<button id="pNotif">' + ic('bell') + '<span class="t">Notificações do pedido</span><span class="toggle' + (state.notif ? ' on' : '') + '"></span></button>' +
      row('pAge', 'shield-check', 'Maior de 18 anos confirmado', state.ageOk ? 'Sim' : 'Não', false) +
      '<div>' + ic('globe') + '<span class="t">Idioma</span><small>Português (Moçambique)</small></div>' +
      '<div>' + ic('banknote') + '<span class="t">Moeda</span><small>Metical (MZN)</small></div></div>' +
      '<div class="result-h">Txova</div><div class="menu-list">' +
      row('pPromo', 'tag', 'Códigos promocionais') + row('pAbout', 'info', 'Sobre esta demonstração') + row('pReset', 'rotate-ccw', 'Repor dados da demonstração', null, false) + '</div>' +
      '<p class="center muted small mt12">Txova v1.0 · Feito em Maputo 🇲🇿</p></div>' +
      '<div class="demo-note">' + ic('info') + '<span>Aplicação de demonstração: lojas, produtos, estafetas e pagamentos são simulados.</span></div></div>';
    const ib = $('#installBtn'); if (ib) ib.onclick = installFlow;
    $('#pEdit').onclick = () => openSheet('<h2>Dados pessoais</h2><label class="field"><span>Nome</span><input id="fn" value="' + esc(u.name) + '"></label><label class="field"><span>Apelido</span><input id="fl" value="' + esc(u.last) + '"></label><label class="field"><span>Telefone</span><div class="prefix"><b>+258</b><input id="fp" inputmode="tel" value="' + esc(u.phone) + '"></div></label><label class="field"><span>Email</span><input id="fe" type="email" value="' + esc(u.email) + '"></label><button class="btn mt12" id="fs">Guardar</button>', (sh, close) => {
      $('#fs', sh).onclick = () => { u.name = $('#fn', sh).value.trim() || 'Zara'; u.last = $('#fl', sh).value.trim(); u.phone = $('#fp', sh).value.trim(); u.email = $('#fe', sh).value.trim(); saveState(); close(); toast('Dados guardados'); setTimeout(rerender, 220); };
    });
    $('#pAddr').onclick = addressSheet;
    $('#pPay').onclick = () => openSheet('<h2>Pagamento preferido</h2><div class="opts mt12">' + D.payments.map(p => '<button class="opt' + (p.id === state.pay ? ' sel' : '') + '" data-pp="' + p.id + '"><span class="logo" style="background:' + p.color + '">' + p.badge + '</span><span class="t"><b>' + esc(p.name) + '</b><small>' + esc(p.sub) + '</small></span><span class="radio"></span></button>').join('') + '</div>', (sh, close) => {
      $$('[data-pp]', sh).forEach(b => b.onclick = () => { state.pay = b.dataset.pp; saveState(); close(); setTimeout(rerender, 220); });
    });
    $('#pFav').onclick = () => { const f = state.favs.map(storeById).filter(Boolean); openSheet('<h2>Lojas favoritas</h2><div class="slist mt12">' + (f.length ? f.map(storeRow).join('') : '<p class="muted">Toque no ♥ de uma loja para a guardar aqui.</p>') + '</div>'); };
    $('#pNotif').onclick = () => { state.notif = !state.notif; saveState(); rerender(); };
    $('#pAge').onclick = () => { if (state.ageOk) { state.ageOk = false; saveState(); rerender(); toast('Confirmação de idade removida'); } else ageGate(() => rerender()); };
    $('#pPromo').onclick = () => openSheet('<h2>Códigos promocionais</h2><div class="mt12">' + Object.keys(D.promoCodes).map(k => '<div class="promo-code"><b>' + k + '</b><span>' + esc(D.promoCodes[k].label) + '</span></div>').join('') + '</div><p class="muted small mt8">Aplique o código no carrinho.</p>');
    $('#pAbout').onclick = () => openSheet('<h2>Sobre o Txova</h2><p class="muted sheet-text">Esta é uma <b>aplicação de demonstração</b>: as ' + D.stores.length + ' lojas, os produtos, os estafetas e os pagamentos M-Pesa, e-Mola, mKesh, cartão e dinheiro são fictícios e simulados. Nenhum valor é cobrado. Depois da primeira abertura, funciona sem internet.</p><p class="muted small">Ícones: Lucide (ISC). Letra: Plus Jakarta Sans (OFL).</p><button class="btn mt12" data-close>Fechar</button>');
    $('#pReset').onclick = () => confirmSheet({ emoji: '♻️', title: 'Repor demonstração?', text: 'Apaga carrinho, pedidos e preferências deste telemóvel e volta ao início.', ok: 'Repor', onOk: () => { [KEY.cart, KEY.orders, KEY.state].forEach(k => localStorage.removeItem(k)); sessionStorage.clear(); location.replace(location.pathname + location.search + '#/'); location.reload(); } });
  }

  /* ---------- Moradas ---------- */
  function addressSheet() {
    openSheet('<h2>Onde entregamos?</h2><div class="opts mt12">' + state.addresses.map(a => '<button class="opt' + (a.id === state.addrId ? ' sel' : '') + '" data-a="' + a.id + '"><span class="logo soft">' + ic(a.icon || 'map-pin') + '</span><span class="t"><b>' + esc(a.label) + '</b><small>' + esc(a.street) + ' · ' + esc(a.bairro) + '</small></span><span class="radio"></span></button>').join('') + '</div>' +
      '<button class="btn secondary mt12" id="newAddr">' + ic('plus') + ' Nova morada</button>', (sh, close) => {
      $$('[data-a]', sh).forEach(b => b.onclick = () => { state.addrId = b.dataset.a; saveState(); close(); toast('A entregar em ' + addr().label + ' · ' + addr().bairro); setTimeout(rerender, 220); });
      $('#newAddr', sh).onclick = newAddressSheet;
    });
  }
  function newAddressSheet() {
    openSheet('<h2>Nova morada</h2><label class="field"><span>Nome</span><input id="na-l" placeholder="Ex.: Casa da mamã"></label>' +
      '<label class="field"><span>Rua / Avenida e número</span><input id="na-s" placeholder="Ex.: Av. Kenneth Kaunda, 520"></label>' +
      '<label class="field"><span>Bairro</span><select id="na-b">' + D.bairros.map(b => '<option>' + esc(b) + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>Ponto de referência</span><input id="na-r" placeholder="Ex.: perto da escola, portão verde"></label><div class="err" id="na-e" hidden>Preencha a rua e o número.</div>' +
      '<button class="btn mt12" id="na-ok">Guardar morada</button>', (sh, close) => {
      $('#na-ok', sh).onclick = () => {
        const street = $('#na-s', sh).value.trim(); if (!street) { $('#na-e', sh).hidden = false; return; }
        const b = $('#na-b', sh).value;
        const a = { id: 'm' + Date.now(), label: $('#na-l', sh).value.trim() || 'Outra morada', icon: 'map-pin', street, bairro: b, cidade: /Matola|Machava/.test(b) ? 'Matola' : 'Maputo', ref: $('#na-r', sh).value.trim() };
        state.addresses.push(a); state.addrId = a.id; saveState(); close(); toast('Morada guardada'); setTimeout(rerender, 220);
      };
    });
  }

  /* ---------- Instalação ---------- */
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; toast('Txova instalado 🎉'); });
  function installFlow() {
    if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.finally(() => { deferredPrompt = null; }); return; }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    openSheet('<h2>Instalar o Txova</h2>' + (ios
      ? '<ol class="steps-list"><li>Abra esta página no <b>Safari</b>.</li><li>Toque em <b>Partilhar</b> ' + ic('share') + ' na barra de baixo.</li><li>Escolha <b>“Adicionar ao ecrã principal”</b>.</li><li>Toque em <b>Adicionar</b>. Pronto! 🎉</li></ol>'
      : '<ol class="steps-list"><li>Abra esta página no <b>Chrome</b>.</li><li>Toque no menu <b>⋮</b> (canto superior direito).</li><li>Escolha <b>“Instalar aplicação”</b> ou <b>“Adicionar ao ecrã principal”</b>.</li><li>Confirme em <b>Instalar</b>. Pronto! 🎉</li></ol>') +
      '<p class="muted small">Depois de instalado, o Txova abre em ecrã inteiro e funciona sem internet.</p><button class="btn mt12" data-close>Percebi</button>');
  }

  /* ---------- Router (hash: funciona em qualquer subpasta) ---------- */
  function rerender() { route(true); }
  function route(keep) {
    const h = location.hash || '#/';
    const path = h.split('?')[0];
    const changed = path !== currentRoute;
    currentRoute = path;
    stopLive(); view.onclick = null; refreshStoreUI = () => { };
    document.body.classList.remove('no-tabbar');
    if (changed) closeSheet(true);
    const parts = path.replace(/^#\/?/, '').split('/');
    const tabFor = { '': 'inicio', pesquisa: 'pesquisa', carrinho: 'carrinho', pedidos: 'pedidos', perfil: 'perfil', categoria: 'inicio' };
    $$('#tabbar a').forEach(a => a.classList.toggle('active', a.dataset.tab === tabFor[parts[0]]));
    switch (parts[0]) {
      case '': screenHome(); break;
      case 'pesquisa': screenSearch(); break;
      case 'categoria': screenCategory(parts[1]); break;
      case 'loja': screenStore(parts[1]); break;
      case 'produto': screenProduct(parts[1], parts[2]); break;
      case 'carrinho': screenCart(); break;
      case 'checkout': screenCheckout(); break;
      case 'pedido': screenOrder(parts[1]); break;
      case 'pedidos': screenOrders(); break;
      case 'perfil': screenProfile(); break;
      default: location.replace('#/'); return;
    }
    if (changed && keep !== true) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', () => {
    if (!(history.state && history.state.txRoot)) { try { history.replaceState({ txIn: true }, ''); } catch (e) { } }
    route();
  });

  /* Delegação global: voltar e favoritos */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-back]'); if (b) { e.preventDefault(); back(b.dataset.back); return; }
    const f = e.target.closest('[data-fav]');
    if (f) {
      e.preventDefault(); e.stopPropagation(); const id = f.dataset.fav;
      state.favs = state.favs.includes(id) ? state.favs.filter(x => x !== id) : state.favs.concat(id); saveState();
      $$('[data-fav="' + id + '"]').forEach(x => x.classList.toggle('on', state.favs.includes(id)));
      toast(state.favs.includes(id) ? '♥ Adicionado aos favoritos' : 'Removido dos favoritos');
    }
  }, true);

  /* ---------- Pedidos de exemplo (histórico) ---------- */
  function seedOrders() {
    const mk = (id, sid, days, vid, lines, ri, pay) => {
      const s = storeById(sid); const p = D.payments.find(x => x.id === pay);
      const items = lines.map(([iid, q]) => { const it = itemById(s, iid); return { name: it.name, qty: q, unit: it.price, emoji: it.emoji, opts: [], itemId: it.id, key: lineKey(it.id, []) }; });
      const sub = items.reduce((a, l) => a + l.unit * l.qty, 0); const fee = delivery(s, vid, 'Sommerschield').fee;
      return { id, ref: 'MP' + id.slice(2), createdAt: Date.now() - days * 864e5 - 3.6e6 * 3, storeId: s.id, storeName: s.name, storeBairro: s.bairro, emoji: s.emoji, grad: s.grad, cat: s.cat, items, sub, fee, service: SERVICE, disc: 0, total: sub + fee + SERVICE,
        vehicle: vid, rider: D.riders[vid][ri], eta: 35, address: Object.assign({}, D.addresses[0]), pay, payName: p.name, payPhone: p.mobile ? '841234567' : '', past: true, rated: 5, demoMs: 150000 };
    };
    return [
      mk('TX418230', 'sabores-polana', 2, 'mota', [['mat1', 1], ['zam1', 1], ['mas1', 2]], 0, 'mpesa'),
      mk('TX402917', 'super-matola', 6, 'carro', [['mt1', 1], ['mt3', 2], ['mt4', 1]], 0, 'dinheiro'),
      mk('TX387554', 'farmacia-saude', 12, 'mota', [['fa1', 1], ['fp1', 1]], 1, 'mpesa')
    ];
  }
  if (!Array.isArray(orders)) { orders = seedOrders(); saveOrders(); }
  if (cart.storeId && !storeById(cart.storeId)) { cart = emptyCart(false); saveCart(); }

  /* ---------- Arranque ---------- */
  try { if (!history.state) history.replaceState({ txRoot: true }, ''); } catch (e) { }
  hydrateIcons(document);
  updateBadge();
  route();
  const splash = $('#splash'); let seen = false;
  try { seen = !!sessionStorage.getItem('txova.splash'); sessionStorage.setItem('txova.splash', '1'); } catch (e) { }
  setTimeout(() => { splash.classList.add('gone'); setTimeout(() => splash.remove(), 600); }, seen ? 0 : 700);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => { });
    });
  }
  window.addEventListener('offline', () => toast('Sem internet — o Txova continua a funcionar 👍'));
  window.addEventListener('online', () => toast('De volta à internet ✓'));
})();
