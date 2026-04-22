/* ============================================================
   KitKing — main app logic
   ============================================================ */

/* ---------- State ---------- */
const state = {
  filters: {
    league: new Set(),
    team: new Set(),
    type: new Set(),
    size: new Set(),
    rating: 0,
    priceMax: 200,
    sale: false,
    stock: false,
    search: "",
  },
  sort: "popular",
  page: 1,
  perPage: 12,
  currency: localStorage.getItem("kk:currency") || "USD",
  theme: localStorage.getItem("kk:theme") || "light",
  cart: JSON.parse(localStorage.getItem("kk:cart") || "[]"),
  wishlist: JSON.parse(localStorage.getItem("kk:wishlist") || "[]"),
  recent: JSON.parse(localStorage.getItem("kk:recent") || "[]"),
  user: JSON.parse(localStorage.getItem("kk:user") || "null"),
  checkout: { step: 1, shipping: {}, payment: "card" },
};

/* ---------- Helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

function fmtPrice(usd) {
  const c = CURRENCIES[state.currency];
  const v = usd * c.rate;
  const s = v >= 1000 ? v.toFixed(0) : v.toFixed(2);
  return `${c.symbol}${s}`;
}

function byId(id) { return PRODUCTS.find(p => p.id === id); }

function toast(msg, type = "") {
  const wrap = $("#toastWrap");
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => { t.classList.add("fade"); setTimeout(() => t.remove(), 300); }, 2600);
}

/* ---------- Theme ---------- */
function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
}
$("#themeBtn").addEventListener("click", () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  localStorage.setItem("kk:theme", state.theme);
  applyTheme();
});
applyTheme();

/* ---------- Currency ---------- */
function applyCurrency() {
  $("#currencySelect").value = state.currency;
  $("#currencySelectMobile").value = state.currency;
  localStorage.setItem("kk:currency", state.currency);
  renderProducts();
  renderCart();
  renderWishlist();
  renderRecent();
}
$("#currencySelect").addEventListener("change", e => { state.currency = e.target.value; applyCurrency(); });
$("#currencySelectMobile").addEventListener("change", e => { state.currency = e.target.value; applyCurrency(); });

/* ---------- Hero slider ---------- */
(() => {
  const slides = $$(".hero-slide");
  const dotsWrap = $("#heroDots");
  let cur = 0;
  slides.forEach((_, i) => {
    const b = document.createElement("button");
    if (i === 0) b.classList.add("active");
    b.addEventListener("click", () => go(i));
    dotsWrap.appendChild(b);
  });
  const dots = $$("#heroDots button");
  function go(i) {
    slides[cur].classList.remove("active");
    dots[cur].classList.remove("active");
    cur = i;
    slides[cur].classList.add("active");
    dots[cur].classList.add("active");
  }
  setInterval(() => go((cur + 1) % slides.length), 6000);

  $$("[data-shop]").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.shop;
    scrollToCatalog();
    applyNav(k);
  }));
})();

/* ---------- Countdown ---------- */
(() => {
  const target = Date.now() + 1000 * 60 * 60 * 72;
  function tick() {
    const diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const pad = n => String(n).padStart(2, "0");
    $("#cdD").textContent = pad(d);
    $("#cdH").textContent = pad(h);
    $("#cdM").textContent = pad(m);
    $("#cdS").textContent = pad(s);
  }
  tick(); setInterval(tick, 1000);
})();

/* ---------- Leagues render ---------- */
(() => {
  const wrap = $("#leagues");
  LEAGUES.forEach(l => {
    const card = document.createElement("div");
    card.className = "league-card";
    card.innerHTML = `
      <div>
        <div class="league-abbr">${l.abbr}</div>
        <div style="font-size:.72rem;color:var(--fg-3);margin-top:6px;letter-spacing:.14em;text-transform:uppercase">${l.country}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;width:100%">
        <div class="league-name">${l.name}</div>
        <div class="league-arrow">→</div>
      </div>`;
    card.addEventListener("click", () => {
      state.filters.league = new Set([l.id]);
      renderFilters();
      state.page = 1;
      renderProducts();
      scrollToCatalog();
    });
    wrap.appendChild(card);
  });
})();

/* ---------- Filters UI ---------- */
function renderFilters() {
  // Leagues
  const lw = $("#filterLeague");
  lw.innerHTML = LEAGUES.map(l => `
    <label class="check">
      <input type="checkbox" data-filter="league" value="${l.id}" ${state.filters.league.has(l.id) ? "checked" : ""}/>
      <span>${l.name}</span>
    </label>`).join("");

  // Teams (unique, sorted)
  const teams = [...new Set(PRODUCTS.map(p => p.team))].sort();
  const tw = $("#filterTeam");
  tw.innerHTML = teams.map(t => `
    <label class="check">
      <input type="checkbox" data-filter="team" value="${t}" ${state.filters.team.has(t) ? "checked" : ""}/>
      <span>${t}</span>
    </label>`).join("");

  // Types
  const typeW = $("#filterType");
  typeW.innerHTML = TYPES.map(t => `
    <label class="check">
      <input type="checkbox" data-filter="type" value="${t.id}" ${state.filters.type.has(t.id) ? "checked" : ""}/>
      <span>${t.name}</span>
    </label>`).join("");

  // Sizes
  const sw = $("#filterSize");
  sw.innerHTML = SIZES.map(s => `
    <button class="size-chip ${state.filters.size.has(s) ? "active" : ""}" data-size="${s}">${s}</button>
  `).join("");

  // Rating
  const rw = $("#filterRating");
  rw.innerHTML = [4, 3, 2, 1].map(r => `
    <label class="check">
      <input type="radio" name="rating" value="${r}" ${state.filters.rating === r ? "checked" : ""}/>
      <span>${"★".repeat(r)}${"☆".repeat(5 - r)} &amp; up</span>
    </label>`).join("");

  // Price label
  $("#priceRange").value = state.filters.priceMax;
  $("#priceLabel").textContent = fmtPrice(state.filters.priceMax);

  $("#filterSale").checked = state.filters.sale;
  $("#filterStock").checked = state.filters.stock;
}

function bindFilters() {
  document.addEventListener("change", e => {
    const t = e.target;
    if (t.matches('[data-filter]')) {
      const key = t.dataset.filter;
      if (t.checked) state.filters[key].add(t.value);
      else state.filters[key].delete(t.value);
      state.page = 1;
      renderProducts();
    }
    if (t.matches('[name="rating"]')) {
      state.filters.rating = Number(t.value);
      state.page = 1; renderProducts();
    }
    if (t.id === "filterSale") { state.filters.sale = t.checked; state.page = 1; renderProducts(); }
    if (t.id === "filterStock") { state.filters.stock = t.checked; state.page = 1; renderProducts(); }
  });
  document.addEventListener("click", e => {
    const s = e.target.closest('.size-chip');
    if (s) {
      const v = s.dataset.size;
      if (state.filters.size.has(v)) state.filters.size.delete(v);
      else state.filters.size.add(v);
      s.classList.toggle("active");
      state.page = 1; renderProducts();
    }
  });
  $("#priceRange").addEventListener("input", e => {
    state.filters.priceMax = Number(e.target.value);
    $("#priceLabel").textContent = fmtPrice(state.filters.priceMax);
  });
  $("#priceRange").addEventListener("change", () => { state.page = 1; renderProducts(); });
  $("#sortSelect").addEventListener("change", e => { state.sort = e.target.value; renderProducts(); });

  const clear = () => {
    state.filters = { league:new Set(), team:new Set(), type:new Set(), size:new Set(), rating:0, priceMax:200, sale:false, stock:false, search:"" };
    state.page = 1;
    renderFilters(); renderProducts();
  };
  $("#clearFilters").addEventListener("click", clear);
  $("#clearFilters2").addEventListener("click", clear);

  // Mobile toggle
  $("#filterToggle").addEventListener("click", () => {
    $("#filters").classList.add("open");
    $("#backdrop").classList.add("open");
  });
}

/* ---------- Product filter/sort ---------- */
function filteredProducts() {
  const f = state.filters;
  let list = PRODUCTS.filter(p => {
    if (f.league.size && !f.league.has(p.league)) return false;
    if (f.team.size && !f.team.has(p.team)) return false;
    if (f.type.size && !f.type.has(p.type)) return false;
    if (f.size.size && ![...f.size].some(s => p.sizes.includes(s))) return false;
    if (f.rating && p.rating < f.rating) return false;
    if (p.price > f.priceMax) return false;
    if (f.sale && !p.sale) return false;
    if (f.stock && p.stock <= 0) return false;
    if (f.search) {
      const q = f.search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.team.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  switch (state.sort) {
    case "price-asc":  list.sort((a,b) => a.price - b.price); break;
    case "price-desc": list.sort((a,b) => b.price - a.price); break;
    case "rating":     list.sort((a,b) => b.rating - a.rating); break;
    case "newest":     list.sort((a,b) => (b.isNew?1:0) - (a.isNew?1:0)); break;
    default:           list.sort((a,b) => (b.isHot?1:0) - (a.isHot?1:0));
  }
  return list;
}

/* ---------- Active chips ---------- */
function renderChips() {
  const chips = [];
  const f = state.filters;
  f.league.forEach(v => chips.push({ key:"league", val:v, label: LEAGUES.find(l=>l.id===v)?.name || v }));
  f.team.forEach(v => chips.push({ key:"team", val:v, label: v }));
  f.type.forEach(v => chips.push({ key:"type", val:v, label: TYPES.find(t=>t.id===v)?.name || v }));
  f.size.forEach(v => chips.push({ key:"size", val:v, label: "Size " + v }));
  if (f.rating) chips.push({ key:"rating", val:f.rating, label: `${f.rating}★ & up` });
  if (f.sale)   chips.push({ key:"sale", val:true, label: "On Sale" });
  if (f.stock)  chips.push({ key:"stock", val:true, label: "In Stock" });
  if (f.search) chips.push({ key:"search", val:f.search, label: `"${f.search}"` });

  const wrap = $("#activeChips");
  wrap.innerHTML = chips.map(c => `<span class="chip" data-key="${c.key}" data-val="${c.val}">${c.label} ✕</span>`).join("");
  wrap.onclick = e => {
    const ch = e.target.closest(".chip");
    if (!ch) return;
    const { key, val } = ch.dataset;
    if (["league","team","type","size"].includes(key)) state.filters[key].delete(val);
    else if (key === "rating") state.filters.rating = 0;
    else if (key === "sale")   state.filters.sale = false;
    else if (key === "stock")  state.filters.stock = false;
    else if (key === "search") state.filters.search = "";
    state.page = 1; renderFilters(); renderProducts();
  };
}

/* ---------- Product card ---------- */
function cardHTML(p) {
  const badges = [];
  if (p.sale)    badges.push(`<span class="card-badge badge-sale">−${Math.round((1-p.price/p.oldPrice)*100)}%</span>`);
  else if (p.isNew) badges.push(`<span class="card-badge badge-new">New</span>`);
  else if (p.isHot) badges.push(`<span class="card-badge badge-hot">Trending</span>`);
  if (p.type === "retro") badges.push(`<span class="card-badge badge-retro">Retro</span>`);
  const wished = state.wishlist.includes(p.id);
  return `
    <article class="card" data-id="${p.id}">
      <div class="card-media">
        <div class="card-badges">${badges.join("")}</div>
        <button class="card-wish ${wished ? "active" : ""}" data-act="wish" aria-label="Wishlist">
          <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <div class="jersey">${jerseySVG(p.colors)}</div>
        <div class="card-quick">
          <button data-act="add">Add to bag</button>
          <button data-act="quick">Quick view</button>
        </div>
      </div>
      <div class="card-body">
        <div class="card-league">${p.team}</div>
        <div class="card-name">${p.name}</div>
        <div class="card-meta">
          <div class="card-price">
            ${p.oldPrice ? `<s>${fmtPrice(p.oldPrice)}</s>` : ""}
            <b>${fmtPrice(p.price)}</b>
          </div>
          <div class="card-rating"><span class="star">★</span>${p.rating}<span>(${p.reviewCount})</span></div>
        </div>
      </div>
    </article>`;
}

/* ---------- Render products ---------- */
function renderProducts() {
  renderChips();
  const list = filteredProducts();
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / state.perPage));
  if (state.page > pages) state.page = pages;
  const start = (state.page - 1) * state.perPage;
  const pageList = list.slice(start, start + state.perPage);

  const grid = $("#productGrid");
  if (!total) {
    grid.innerHTML = "";
    $("#empty").hidden = false;
    $("#pagination").innerHTML = "";
  } else {
    $("#empty").hidden = true;
    // skeleton flash
    grid.innerHTML = Array.from({length: pageList.length}).map(() =>
      `<div class="card"><div class="skeleton" style="aspect-ratio:4/5"></div><div class="card-body"><div class="skeleton" style="height:10px;margin-bottom:8px;margin-top:12px"></div><div class="skeleton" style="height:14px;width:70%"></div></div></div>`
    ).join("");
    setTimeout(() => {
      grid.innerHTML = pageList.map(cardHTML).join("");
    }, 120);
    renderPagination(pages);
  }
}

function renderPagination(pages) {
  const p = $("#pagination");
  let html = `<button ${state.page===1?"disabled":""} data-p="prev">‹</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="${i===state.page?"active":""}" data-p="${i}">${i}</button>`;
  }
  html += `<button ${state.page===pages?"disabled":""} data-p="next">›</button>`;
  p.innerHTML = html;
  p.onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    const v = b.dataset.p;
    if (v === "prev") state.page = Math.max(1, state.page - 1);
    else if (v === "next") state.page = Math.min(pages, state.page + 1);
    else state.page = Number(v);
    renderProducts();
    $("#productGrid").scrollIntoView({ behavior: "smooth", block: "start" });
  };
}

/* ---------- Card click delegation ---------- */
$("#productGrid").addEventListener("click", e => {
  const card = e.target.closest(".card"); if (!card) return;
  const id = Number(card.dataset.id);
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (act === "wish") { e.stopPropagation(); toggleWishlist(id); return; }
  if (act === "add")  { e.stopPropagation(); addToCart(id); return; }
  openProduct(id);
});

/* ---------- Nav ---------- */
function applyNav(k) {
  const f = state.filters;
  f.league = new Set(); f.team = new Set(); f.type = new Set(); f.sale = false;
  const title = $("#catalogTitle");
  if (k === "new") { state.sort = "newest"; $("#sortSelect").value = "newest"; title.textContent = "New Arrivals"; }
  else if (k === "sale") { f.sale = true; title.textContent = "On Sale"; }
  else if (k === "clubs") { ["premier","laliga","bundesliga","seriea","ligue1"].forEach(x => f.league.add(x)); title.textContent = "Club Jerseys"; }
  else if (k === "national") { f.league.add("national"); title.textContent = "National Team Kits"; }
  else if (k === "retro") { f.type.add("retro"); title.textContent = "Retro Kits"; }
  else title.textContent = "All Jerseys";
  state.page = 1; renderFilters(); renderProducts();
}
$$("[data-nav]").forEach(a => a.addEventListener("click", e => {
  e.preventDefault();
  applyNav(a.dataset.nav);
  scrollToCatalog();
  $("#mobileMenu").classList.remove("open");
}));

function scrollToCatalog() {
  const el = $("#productGrid");
  const top = el.getBoundingClientRect().top + window.scrollY - 120;
  window.scrollTo({ top, behavior: "smooth" });
}

/* ---------- Search ---------- */
const searchBar = $("#searchBar");
$("#searchBtn").addEventListener("click", () => {
  searchBar.classList.toggle("open");
  if (searchBar.classList.contains("open")) setTimeout(() => $("#searchInput").focus(), 100);
});
$("#searchClose").addEventListener("click", () => { searchBar.classList.remove("open"); $("#searchSuggestions").innerHTML = ""; });
$("#searchInput").addEventListener("input", e => {
  const q = e.target.value.trim().toLowerCase();
  const sug = $("#searchSuggestions");
  if (!q) { sug.innerHTML = ""; return; }
  const matches = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)
  ).slice(0, 6);
  sug.innerHTML = matches.map(p => `
    <div class="search-suggestion" data-id="${p.id}">
      <div class="thumb" style="background:${p.colors.c1}">${p.team.charAt(0)}</div>
      <div><b>${p.name}</b><br/><small class="muted">${p.team} · ${fmtPrice(p.price)}</small></div>
    </div>`).join("");
});
$("#searchSuggestions").addEventListener("click", e => {
  const s = e.target.closest(".search-suggestion"); if (!s) return;
  openProduct(Number(s.dataset.id));
  searchBar.classList.remove("open");
});
$("#searchInput").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    state.filters.search = e.target.value.trim();
    state.page = 1; renderProducts();
    searchBar.classList.remove("open");
    scrollToCatalog();
  }
});

/* ---------- Mobile menu ---------- */
$("#mobileMenuBtn").addEventListener("click", () => $("#mobileMenu").classList.add("open"));
$("#mobileMenuClose").addEventListener("click", () => $("#mobileMenu").classList.remove("open"));

/* ---------- Backdrop ---------- */
$("#backdrop").addEventListener("click", closeAllDrawers);
function closeAllDrawers() {
  $$(".drawer.open, .modal.open").forEach(el => el.classList.remove("open"));
  $("#backdrop").classList.remove("open");
  $("#filters").classList.remove("open");
  document.body.style.overflow = "";
}
document.addEventListener("click", e => {
  const id = e.target.closest("[data-close]")?.dataset.close;
  if (id) closeAllDrawers();
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeAllDrawers(); });

function openDrawer(id) {
  $(`#${id}`).classList.add("open");
  $("#backdrop").classList.add("open");
}
function openModal(id) {
  $(`#${id}`).classList.add("open");
  $("#backdrop").classList.add("open");
  document.body.style.overflow = "hidden";
}

/* ---------- Product modal ---------- */
let currentProduct = null;
let selectedSize = "M";
let selectedQty = 1;
let customName = "";
let customNum = "";

function openProduct(id) {
  const p = byId(id); if (!p) return;
  currentProduct = p;
  selectedSize = "M";
  selectedQty = 1;
  customName = "";
  customNum = "";

  // add to recent
  state.recent = [id, ...state.recent.filter(x => x !== id)].slice(0, 8);
  save("kk:recent", state.recent);
  renderRecent();

  const stars = "★".repeat(Math.round(p.rating)) + "☆".repeat(5 - Math.round(p.rating));
  const savePct = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

  $("#productModalInner").innerHTML = `
    <button class="icon-btn pm-close" data-close="productModal"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
    <div class="pm-grid">
      <div class="pm-media">
        <div class="pm-main" id="pmMain">${jerseySVG(p.colors)}</div>
        <div class="pm-thumbs" id="pmThumbs">
          <button class="active">${jerseySVG(p.colors)}</button>
          <button>${jerseySVG({...p.colors, pattern: "solid"})}</button>
          <button>${jerseySVG({...p.colors, c1: p.colors.c2, c2: p.colors.c1})}</button>
        </div>
      </div>
      <div class="pm-info">
        <div class="sub">${LEAGUES.find(l=>l.id===p.league)?.name || ""} · ${p.team}</div>
        <h2>${p.name}</h2>
        <div class="card-rating" style="margin-top:6px"><span class="star">★</span><b>${p.rating}</b> <span class="muted">· ${p.reviewCount} reviews · In stock</span></div>
        <div class="pm-price">
          ${p.oldPrice ? `<s>${fmtPrice(p.oldPrice)}</s>` : ""}
          ${fmtPrice(p.price)}
          ${savePct ? `<span class="save">Save ${savePct}%</span>` : ""}
        </div>
        <p class="desc">Authentic ${p.type} jersey. Breathable Dri-FIT fabric with heat-transfer club crest. 100% recycled polyester.</p>

        <h4>Size <a class="link-btn" data-size-guide>Size guide</a></h4>
        <div class="pm-options" id="pmSizes">
          ${p.sizes.map(s => `<button class="size-chip ${s==='M'?'active':''}" data-ps="${s}">${s}</button>`).join("")}
        </div>

        <h4>Quantity</h4>
        <div class="pm-actions">
          <div class="qty">
            <button data-qty="-1">−</button>
            <input type="number" id="pmQty" value="1" min="1" max="${p.stock}"/>
            <button data-qty="+1">+</button>
          </div>
          <button class="btn btn-primary" id="pmAdd">Add to bag · ${fmtPrice(p.price)}</button>
          <button class="icon-btn ${state.wishlist.includes(p.id) ? "active" : ""}" id="pmWish" aria-label="Wishlist">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>

        <div class="pm-custom">
          <div class="pm-custom-head">
            <span>Customize</span>
            <span class="muted small">+$12</span>
          </div>
          <div class="pm-custom-row">
            <div><label>Name</label><input type="text" id="pmName" maxlength="10" placeholder="YOUR NAME"/></div>
            <div><label>Number</label><input type="number" id="pmNum" maxlength="2" min="0" max="99" placeholder="10"/></div>
          </div>
          <div class="pm-custom-note">Live preview updates on the jersey. Official fonts applied at print.</div>
        </div>

        <ul class="feats">
          <li>Free shipping on orders over $80</li>
          <li>30-day free returns</li>
          <li>Ships within 24 hours</li>
          <li>Officially licensed product</li>
        </ul>

        <div class="pm-reviews">
          <h4 style="margin-top:0">Customer reviews</h4>
          ${MOCK_REVIEWS.map(r => `
            <div class="pm-review-item">
              <b>${r.name}</b> <span class="stars">${"★".repeat(r.stars)}${"☆".repeat(5-r.stars)}</span>
              <p>${r.text}</p>
            </div>`).join("")}
        </div>
      </div>
    </div>`;

  bindProductModal();
  openModal("productModal");
}

function bindProductModal() {
  const p = currentProduct;
  const qtyInput = $("#pmQty");

  $$("#pmSizes .size-chip").forEach(b => b.addEventListener("click", () => {
    $$("#pmSizes .size-chip").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    selectedSize = b.dataset.ps;
  }));

  $$("[data-qty]").forEach(b => b.addEventListener("click", () => {
    const d = Number(b.dataset.qty);
    selectedQty = Math.max(1, Math.min(p.stock, selectedQty + d));
    qtyInput.value = selectedQty;
  }));
  qtyInput.addEventListener("input", () => {
    selectedQty = Math.max(1, Math.min(p.stock, Number(qtyInput.value) || 1));
    qtyInput.value = selectedQty;
  });

  const nameInput = $("#pmName"), numInput = $("#pmNum");
  function updatePreview() {
    customName = nameInput.value.trim();
    customNum = numInput.value.trim();
    $("#pmMain").innerHTML = jerseySVG({...p.colors, name: customName, num: customNum });
  }
  nameInput.addEventListener("input", updatePreview);
  numInput.addEventListener("input", updatePreview);

  $("#pmThumbs").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$("#pmThumbs button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    $("#pmMain").innerHTML = b.innerHTML;
  });

  $("#pmAdd").addEventListener("click", () => {
    addToCart(p.id, { size: selectedSize, qty: selectedQty, name: customName, num: customNum });
    closeAllDrawers();
    setTimeout(() => openDrawer("cartDrawer"), 250);
  });

  $("#pmWish").addEventListener("click", () => {
    toggleWishlist(p.id);
    $("#pmWish").classList.toggle("active");
  });
}

/* ---------- Cart ---------- */
function addToCart(id, opts = {}) {
  const p = byId(id); if (!p) return;
  const size = opts.size || "M";
  const qty  = opts.qty  || 1;
  const name = opts.name || "";
  const num  = opts.num  || "";
  const key = `${id}-${size}-${name}-${num}`;
  const existing = state.cart.find(c => c.key === key);
  if (existing) existing.qty += qty;
  else state.cart.push({ key, id, size, qty, name, num });
  save("kk:cart", state.cart);
  renderCart();
  toast(`Added "${p.name}" to cart`, "success");
}

function removeFromCart(key) {
  state.cart = state.cart.filter(c => c.key !== key);
  save("kk:cart", state.cart);
  renderCart();
}
function updateCartQty(key, d) {
  const it = state.cart.find(c => c.key === key); if (!it) return;
  it.qty = Math.max(1, it.qty + d);
  save("kk:cart", state.cart);
  renderCart();
}

function cartSubtotal() {
  return state.cart.reduce((s, c) => {
    const p = byId(c.id); if (!p) return s;
    const extra = (c.name || c.num) ? 12 : 0;
    return s + (p.price + extra) * c.qty;
  }, 0);
}

function renderCart() {
  const items = $("#cartItems");
  const count = state.cart.reduce((s, c) => s + c.qty, 0);
  $("#cartBadge").textContent = count;
  $("#cartBadge").toggleAttribute("data-empty", count === 0);
  $("#cartCountLabel").textContent = `(${count})`;

  if (!state.cart.length) {
    items.innerHTML = `<div class="empty-drawer"><h3>Your bag is empty</h3><p>Add something you love.</p></div>`;
    $("#cartFoot").style.display = "none";
    return;
  }
  $("#cartFoot").style.display = "grid";
  items.innerHTML = state.cart.map(c => {
    const p = byId(c.id); if (!p) return "";
    const extra = (c.name || c.num) ? 12 : 0;
    return `
      <div class="cart-item">
        <div class="thumb">${jerseySVG(p.colors)}</div>
        <div>
          <b>${p.name}</b>
          <small>Size ${c.size}${c.name || c.num ? ` · ${c.name}${c.num?" #"+c.num:""}` : ""}</small>
          <span class="ci-price">${fmtPrice(p.price + extra)}</span>
          <div class="qty">
            <button data-ck="${c.key}" data-cq="-1">−</button>
            <input value="${c.qty}" readonly/>
            <button data-ck="${c.key}" data-cq="+1">+</button>
          </div>
        </div>
        <button class="x" data-rm="${c.key}" aria-label="Remove">✕</button>
      </div>`;
  }).join("");
  $("#cartSubtotal").textContent = fmtPrice(cartSubtotal());
}

$("#cartItems").addEventListener("click", e => {
  const rm = e.target.dataset.rm;
  if (rm) return removeFromCart(rm);
  const ck = e.target.dataset.ck;
  if (ck) updateCartQty(ck, Number(e.target.dataset.cq));
});

$("#cartBtn").addEventListener("click", () => openDrawer("cartDrawer"));

/* ---------- Wishlist ---------- */
function toggleWishlist(id) {
  const p = byId(id); if (!p) return;
  if (state.wishlist.includes(id)) {
    state.wishlist = state.wishlist.filter(x => x !== id);
    toast(`Removed from wishlist`);
  } else {
    state.wishlist.push(id);
    toast(`Saved to wishlist`, "success");
  }
  save("kk:wishlist", state.wishlist);
  renderWishlist();
  // refresh cards
  $$(`.card[data-id="${id}"] .card-wish`).forEach(b => b.classList.toggle("active", state.wishlist.includes(id)));
}

function renderWishlist() {
  const wrap = $("#wishlistItems");
  $("#wishlistBadge").textContent = state.wishlist.length;
  $("#wishlistBadge").toggleAttribute("data-empty", state.wishlist.length === 0);
  if (!state.wishlist.length) {
    wrap.innerHTML = `<div class="empty-drawer"><h3>No saved items</h3><p>Tap the heart on any jersey to save it here.</p></div>`;
    return;
  }
  wrap.innerHTML = state.wishlist.map(id => {
    const p = byId(id); if (!p) return "";
    return `
      <div class="cart-item">
        <div class="thumb">${jerseySVG(p.colors)}</div>
        <div>
          <b>${p.name}</b>
          <small>${p.team}</small>
          <small><b>${fmtPrice(p.price)}</b></small>
          <div style="margin-top:6px;display:flex;gap:6px">
            <button class="btn btn-sm btn-primary" data-wlad="${p.id}">Add to cart</button>
            <button class="btn btn-sm btn-ghost" data-wlv="${p.id}">View</button>
          </div>
        </div>
        <button class="x" data-wlrm="${p.id}">✕</button>
      </div>`;
  }).join("");
}

$("#wishlistBtn").addEventListener("click", () => openDrawer("wishlistDrawer"));
$("#wishlistItems").addEventListener("click", e => {
  const t = e.target;
  if (t.dataset.wlrm) toggleWishlist(Number(t.dataset.wlrm));
  else if (t.dataset.wlad) { addToCart(Number(t.dataset.wlad)); }
  else if (t.dataset.wlv) { closeAllDrawers(); openProduct(Number(t.dataset.wlv)); }
});

/* ---------- Recently viewed ---------- */
function renderRecent() {
  if (!state.recent.length) { $("#recentSection").hidden = true; return; }
  $("#recentSection").hidden = false;
  $("#recentGrid").innerHTML = state.recent
    .map(id => byId(id)).filter(Boolean).slice(0, 4).map(cardHTML).join("");
}
$("#recentGrid").addEventListener("click", e => {
  const card = e.target.closest(".card"); if (!card) return;
  const id = Number(card.dataset.id);
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (act === "wish") { e.stopPropagation(); toggleWishlist(id); return; }
  if (act === "add")  { e.stopPropagation(); addToCart(id); return; }
  openProduct(id);
});

/* ---------- Checkout ---------- */
$("#checkoutBtn").addEventListener("click", () => {
  if (!state.cart.length) return toast("Cart is empty", "error");
  closeAllDrawers();
  state.checkout.step = 1;
  openModal("checkoutModal");
  renderCheckout();
});

function renderCheckout() {
  $$("#stepper .step").forEach(s => {
    const n = Number(s.dataset.step);
    s.classList.toggle("active", n === state.checkout.step);
    s.classList.toggle("done", n < state.checkout.step);
  });
  const body = $("#checkoutBody");
  const subtotal = cartSubtotal();
  const shipping = subtotal >= 80 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (state.checkout.step === 1) {
    body.innerHTML = `
      <h3>Shipping Information</h3>
      <div class="form-grid" style="margin-top:16px">
        <div class="form-field"><label>First name</label><input id="fFirst" required value="${state.checkout.shipping.first||''}"/></div>
        <div class="form-field"><label>Last name</label><input id="fLast" required value="${state.checkout.shipping.last||''}"/></div>
        <div class="form-field full"><label>Email</label><input type="email" id="fEmail" required value="${state.checkout.shipping.email||''}"/></div>
        <div class="form-field full"><label>Phone</label><input type="tel" id="fPhone" required value="${state.checkout.shipping.phone||''}"/></div>
        <div class="form-field full"><label>Address</label><input id="fAddr" required value="${state.checkout.shipping.addr||''}"/></div>
        <div class="form-field"><label>City</label><input id="fCity" required value="${state.checkout.shipping.city||''}"/></div>
        <div class="form-field"><label>Postal code</label><input id="fZip" required value="${state.checkout.shipping.zip||''}"/></div>
        <div class="form-field full"><label>Country</label>
          <select id="fCountry">
            <option>Bangladesh</option><option>India</option><option>United States</option>
            <option>United Kingdom</option><option>Germany</option><option>Spain</option><option>Other</option>
          </select>
        </div>
      </div>
      ${orderSummaryHTML(subtotal, shipping, tax, total)}
      <div class="checkout-foot">
        <button class="btn btn-ghost" data-close="checkoutModal">Cancel</button>
        <button class="btn btn-primary" id="coNext">Continue to Payment →</button>
      </div>`;
    $("#coNext").addEventListener("click", () => {
      const req = ["fFirst","fLast","fEmail","fPhone","fAddr","fCity","fZip"];
      for (const id of req) if (!$("#"+id).value.trim()) return toast("Fill all fields", "error");
      state.checkout.shipping = {
        first:$("#fFirst").value, last:$("#fLast").value, email:$("#fEmail").value,
        phone:$("#fPhone").value, addr:$("#fAddr").value, city:$("#fCity").value,
        zip:$("#fZip").value, country:$("#fCountry").value
      };
      state.checkout.step = 2; renderCheckout();
    });
  }

  else if (state.checkout.step === 2) {
    body.innerHTML = `
      <h3>Payment Method</h3>
      <div class="pay-methods" style="margin-top:16px">
        <label class="pay-method ${state.checkout.payment==='card'?'active':''}">
          <input type="radio" name="pay" value="card" ${state.checkout.payment==='card'?'checked':''}/>
          <div><b>Credit / Debit Card</b><br/><small>Visa, Mastercard, Amex</small></div>
        </label>
        <label class="pay-method ${state.checkout.payment==='paypal'?'active':''}">
          <input type="radio" name="pay" value="paypal" ${state.checkout.payment==='paypal'?'checked':''}/>
          <div><b>PayPal</b><br/><small>Pay with your PayPal account</small></div>
        </label>
        <label class="pay-method ${state.checkout.payment==='bkash'?'active':''}">
          <input type="radio" name="pay" value="bkash" ${state.checkout.payment==='bkash'?'checked':''}/>
          <div><b>bKash</b><br/><small>Mobile banking (Bangladesh)</small></div>
        </label>
        <label class="pay-method ${state.checkout.payment==='cod'?'active':''}">
          <input type="radio" name="pay" value="cod" ${state.checkout.payment==='cod'?'checked':''}/>
          <div><b>Cash on Delivery</b><br/><small>Pay when you receive (+$2)</small></div>
        </label>
      </div>
      <div id="cardFields" style="margin-top:16px; ${state.checkout.payment==='card' ? '' : 'display:none'}">
        <div class="form-grid">
          <div class="form-field full"><label>Card number</label><input placeholder="1234 5678 9012 3456"/></div>
          <div class="form-field"><label>Expiry</label><input placeholder="MM/YY"/></div>
          <div class="form-field"><label>CVV</label><input placeholder="123"/></div>
          <div class="form-field full"><label>Name on card</label><input/></div>
        </div>
      </div>
      ${orderSummaryHTML(subtotal, shipping, tax, total)}
      <div class="checkout-foot">
        <button class="btn btn-ghost" id="coBack">← Back</button>
        <button class="btn btn-primary" id="coNext">Review Order →</button>
      </div>`;
    $$('input[name="pay"]').forEach(r => r.addEventListener("change", e => {
      state.checkout.payment = e.target.value;
      renderCheckout();
    }));
    $("#coBack").addEventListener("click", () => { state.checkout.step = 1; renderCheckout(); });
    $("#coNext").addEventListener("click", () => { state.checkout.step = 3; renderCheckout(); });
  }

  else if (state.checkout.step === 3) {
    const ship = state.checkout.shipping;
    body.innerHTML = `
      <h3>Review Your Order</h3>
      <div style="margin-top:16px">
        <b>Shipping to</b>
        <p class="muted" style="margin:4px 0">${ship.first} ${ship.last}<br/>${ship.addr}, ${ship.city}, ${ship.zip}<br/>${ship.country} · ${ship.phone}</p>
        <b>Payment</b>
        <p class="muted" style="margin:4px 0">${({card:"Credit/Debit Card",paypal:"PayPal",bkash:"bKash",cod:"Cash on Delivery"})[state.checkout.payment]}</p>
        <b>Items</b>
        <div style="margin-top:8px">
          ${state.cart.map(c => {
            const p = byId(c.id);
            return `<div class="row" style="display:flex;justify-content:space-between;padding:4px 0"><span>${p.name} × ${c.qty}</span><b>${fmtPrice(p.price * c.qty)}</b></div>`;
          }).join("")}
        </div>
      </div>
      ${orderSummaryHTML(subtotal, shipping, tax, total)}
      <div class="checkout-foot">
        <button class="btn btn-ghost" id="coBack">← Back</button>
        <button class="btn btn-primary" id="coPlace">Place Order — ${fmtPrice(total)}</button>
      </div>`;
    $("#coBack").addEventListener("click", () => { state.checkout.step = 2; renderCheckout(); });
    $("#coPlace").addEventListener("click", placeOrder);
  }
}

function orderSummaryHTML(sub, ship, tax, total) {
  return `
    <div class="order-summary">
      <div class="row"><span>Subtotal</span><span>${fmtPrice(sub)}</span></div>
      <div class="row"><span>Shipping</span><span>${ship === 0 ? "FREE" : fmtPrice(ship)}</span></div>
      <div class="row"><span>Tax (8%)</span><span>${fmtPrice(tax)}</span></div>
      <div class="row total"><span>Total</span><span>${fmtPrice(total)}</span></div>
    </div>`;
}

function placeOrder() {
  const orderNum = "KK-" + Math.random().toString(36).slice(2, 10).toUpperCase();
  state.cart = [];
  save("kk:cart", state.cart);
  renderCart();
  $("#checkoutBody").innerHTML = `
    <div class="order-success">
      <div class="big">✓</div>
      <h2>Order placed!</h2>
      <p class="muted">Thanks for your purchase. Confirmation sent to your email.</p>
      <div class="order-num">Order #${orderNum}</div>
      <p class="muted small">Expected delivery: 3–5 business days</p>
      <button class="btn btn-primary" data-close="checkoutModal" style="margin-top:12px">Continue Shopping</button>
    </div>`;
  $$("#stepper .step").forEach(s => s.classList.add("done"));
}

/* ---------- Account ---------- */
$("#accountBtn").addEventListener("click", openAccount);
function openAccount() {
  if (state.user) {
    $("#accountTitle").textContent = "My Account";
    $("#accountBody").innerHTML = `
      <div style="padding:24px">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
          <div style="width:56px;height:56px;border-radius:50%;background:var(--brand);color:#fff;display:grid;place-items:center;font-size:1.4rem;font-weight:800">${state.user.name.charAt(0).toUpperCase()}</div>
          <div><b>${state.user.name}</b><br/><small class="muted">${state.user.email}</small></div>
        </div>
        <div style="display:grid;gap:8px">
          <button class="btn btn-ghost btn-block">My orders</button>
          <button class="btn btn-ghost btn-block">Addresses</button>
          <button class="btn btn-ghost btn-block">Wishlist (${state.wishlist.length})</button>
          <button class="btn btn-ghost btn-block">Settings</button>
          <button class="btn btn-brand btn-block" id="logoutBtn">Sign out</button>
        </div>
      </div>`;
    $("#logoutBtn").addEventListener("click", () => {
      state.user = null; localStorage.removeItem("kk:user");
      toast("Signed out");
      openAccount();
    });
  } else {
    $("#accountTitle").textContent = "Sign in";
    $("#accountBody").innerHTML = `
      <div class="tabs">
        <button class="active" data-tab="login">Sign In</button>
        <button data-tab="signup">Create Account</button>
      </div>
      <div id="accTabBody" style="padding:24px">
        ${loginForm()}
      </div>`;
    const body = $("#accTabBody");
    $$("[data-tab]").forEach(b => b.addEventListener("click", () => {
      $$("[data-tab]").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      body.innerHTML = b.dataset.tab === "login" ? loginForm() : signupForm();
      bindAccForm();
    }));
    bindAccForm();
  }
  openModal("accountModal");
}
function loginForm() {
  return `
    <div class="form-grid">
      <div class="form-field full"><label>Email</label><input id="alEmail" type="email"/></div>
      <div class="form-field full"><label>Password</label><input id="alPass" type="password"/></div>
    </div>
    <button class="btn btn-primary btn-block" id="alSubmit" style="margin-top:14px">Sign in</button>
    <p class="muted small" style="text-align:center;margin-top:12px">Forgot password?</p>`;
}
function signupForm() {
  return `
    <div class="form-grid">
      <div class="form-field full"><label>Full name</label><input id="asName"/></div>
      <div class="form-field full"><label>Email</label><input id="asEmail" type="email"/></div>
      <div class="form-field full"><label>Password</label><input id="asPass" type="password"/></div>
    </div>
    <button class="btn btn-primary btn-block" id="asSubmit" style="margin-top:14px">Create account</button>`;
}
function bindAccForm() {
  const sub = $("#alSubmit");
  if (sub) sub.addEventListener("click", () => {
    const email = $("#alEmail").value.trim();
    if (!email) return toast("Enter email", "error");
    state.user = { name: email.split("@")[0], email };
    save("kk:user", state.user);
    toast(`Welcome back, ${state.user.name}!`, "success");
    closeAllDrawers();
  });
  const sub2 = $("#asSubmit");
  if (sub2) sub2.addEventListener("click", () => {
    const name = $("#asName").value.trim();
    const email = $("#asEmail").value.trim();
    if (!name || !email) return toast("Fill all fields", "error");
    state.user = { name, email };
    save("kk:user", state.user);
    toast(`Welcome, ${name}!`, "success");
    closeAllDrawers();
  });
}

/* ---------- Newsletter ---------- */
$("#newsletterForm").addEventListener("submit", e => {
  e.preventDefault();
  const email = e.target.querySelector("input").value;
  toast(`Subscribed ${email}`, "success");
  e.target.reset();
});

/* ---------- Back to top ---------- */
const back = $("#backTop");
window.addEventListener("scroll", () => {
  back.classList.toggle("show", window.scrollY > 400);
});
back.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ---------- Chat widget ---------- */
const chatPanel = $("#chatPanel");
const chatMsgs = $("#chatMessages");
const botReplies = [
  "Hi, how can we help? Ask about shipping, sizes, or returns.",
  "Shipping is free over $80 — otherwise $9.99. Delivery 3–5 business days.",
  "Easy 30-day returns on unworn jerseys with original tags.",
  "Sizing runs true. If between sizes, we recommend sizing up.",
  "Custom name and number printing adds $12 and ships within 24 hours.",
  "All jerseys are 100% authentic, officially licensed products.",
];
let botIdx = 0;
function botMsg(text) {
  const d = document.createElement("div");
  d.className = "chat-msg bot"; d.textContent = text;
  chatMsgs.appendChild(d);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}
function meMsg(text) {
  const d = document.createElement("div");
  d.className = "chat-msg me"; d.textContent = text;
  chatMsgs.appendChild(d);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}
$("#chatToggle").addEventListener("click", () => {
  chatPanel.classList.toggle("open");
  if (chatPanel.classList.contains("open") && !chatMsgs.children.length) botMsg(botReplies[0]);
});
$("#chatClose").addEventListener("click", () => chatPanel.classList.remove("open"));
$("#chatForm").addEventListener("submit", e => {
  e.preventDefault();
  const i = $("#chatInputField");
  const v = i.value.trim(); if (!v) return;
  meMsg(v); i.value = "";
  botIdx = (botIdx + 1) % botReplies.length;
  setTimeout(() => botMsg(botReplies[botIdx]), 700);
});

/* ---------- Cookie banner ---------- */
if (!localStorage.getItem("kk:cookie")) {
  setTimeout(() => $("#cookie").classList.add("show"), 1500);
}
$("#cookieAccept").addEventListener("click", () => {
  localStorage.setItem("kk:cookie", "1");
  $("#cookie").classList.remove("show");
});

/* ---------- Header shadow on scroll ---------- */
window.addEventListener("scroll", () => {
  $("#header").style.boxShadow = window.scrollY > 20 ? "0 4px 20px rgba(0,0,0,0.06)" : "";
});

/* ---------- Init ---------- */
renderFilters();
bindFilters();
renderProducts();
renderCart();
renderWishlist();
renderRecent();

/* keyboard shortcut: / to focus search */
document.addEventListener("keydown", e => {
  if (e.key === "/" && !["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)) {
    e.preventDefault();
    searchBar.classList.add("open");
    $("#searchInput").focus();
  }
});

/* ---------- Scroll progress bar ---------- */
(() => {
  const bar = $("#progressBar");
  if (!bar) return;
  const update = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.width = pct + "%";
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
})();

/* ---------- Reveal on scroll ---------- */
(() => {
  if (!("IntersectionObserver" in window)) {
    $$(".reveal, .reveal-stagger").forEach(el => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        if (en.target.classList.contains("stats-grid")) animateCounters(en.target);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.15 });
  $$(".reveal, .reveal-stagger, .stats-grid").forEach(el => io.observe(el));
})();

/* ---------- Stats counters ---------- */
function animateCounters(root) {
  $$(".stat-num", root).forEach(el => {
    const target = Number(el.dataset.count) || 0;
    const dur = 1400;
    const start = performance.now();
    const fmt = n => n >= 1000 ? (n/1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(n);
    const tick = now => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(target * eased);
      el.textContent = fmt(v);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target);
    };
    requestAnimationFrame(tick);
  });
}

/* ---------- Hero stage floating jerseys ---------- */
(() => {
  const stage = $("#heroStage");
  if (!stage) return;
  const picks = PRODUCTS.filter(p => p.isHot || p.isNew).slice(0, 3);
  const pool = picks.length === 3 ? picks : PRODUCTS.slice(0, 3);
  stage.innerHTML = `
    <div class="hero-jersey side-l">${jerseySVG(pool[1].colors)}</div>
    <div class="hero-jersey main">${jerseySVG(pool[0].colors)}</div>
    <div class="hero-jersey side-r">${jerseySVG(pool[2].colors)}</div>
  `;
})();

/* ---------- Story jersey ---------- */
(() => {
  const el = $("#storyJersey");
  if (!el) return;
  const retro = PRODUCTS.find(p => p.type === "retro") || PRODUCTS[0];
  el.innerHTML = jerseySVG(retro.colors);
})();

/* ---------- Brand marquee ---------- */
(() => {
  const track = $("#brandTrack");
  if (!track) return;
  const teams = [...new Set(PRODUCTS.map(p => p.team))].slice(0, 12);
  const row = teams.map(t => `<span class="brand-item">${t}</span>`).join("");
  track.innerHTML = row + row;
})();

/* ---------- Service worker ---------- */
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

/* ---------- Size guide trigger ---------- */
document.addEventListener("click", e => {
  if (e.target.closest("[data-size-guide]")) {
    e.preventDefault();
    openModal("sizeGuideModal");
  }
});

/* ---------- Compare feature ---------- */
state.compare = new Set();
function renderCompareBar() {
  const bar = $("#compareBar");
  const n = state.compare.size;
  $("#compareCount").textContent = `${n} item${n===1?"":"s"}`;
  bar.classList.toggle("show", n > 0);
  const thumbs = $("#compareThumbs");
  thumbs.innerHTML = [...state.compare].map(id => {
    const p = byId(id); if (!p) return "";
    return `<div class="cmp-thumb" title="${p.name}" data-rmc="${id}">${jerseySVG(p.colors)}</div>`;
  }).join("");
}
function toggleCompare(id) {
  if (state.compare.has(id)) state.compare.delete(id);
  else {
    if (state.compare.size >= 4) { toast("Compare max 4", "error"); return; }
    state.compare.add(id);
  }
  renderCompareBar();
  $$(`.card[data-id="${id}"] .card-compare-chk`).forEach(b => b.classList.toggle("active", state.compare.has(id)));
}
$("#productGrid").addEventListener("click", e => {
  const chk = e.target.closest(".card-compare-chk");
  if (!chk) return;
  e.stopPropagation();
  const id = Number(chk.closest(".card").dataset.id);
  toggleCompare(id);
});
$("#compareThumbs").addEventListener("click", e => {
  const t = e.target.closest("[data-rmc]");
  if (t) toggleCompare(Number(t.dataset.rmc));
});
$("#compareClear").addEventListener("click", () => {
  const ids = [...state.compare];
  state.compare.clear();
  renderCompareBar();
  ids.forEach(id => $$(`.card[data-id="${id}"] .card-compare-chk`).forEach(b => b.classList.remove("active")));
});
$("#compareOpen").addEventListener("click", () => {
  if (!state.compare.size) return;
  const items = [...state.compare].map(byId).filter(Boolean);
  const rows = [
    ["Team", p => p.team],
    ["League", p => LEAGUES.find(l=>l.id===p.league)?.name || p.league],
    ["Type", p => TYPES.find(t=>t.id===p.type)?.name || p.type],
    ["Price", p => `<b>${fmtPrice(p.price)}</b>${p.oldPrice?` <s class="muted small">${fmtPrice(p.oldPrice)}</s>`:""}`],
    ["Rating", p => `★ ${p.rating} <span class="muted small">(${p.reviewCount})</span>`],
    ["Stock", p => p.stock > 0 ? `${p.stock} available` : "Out of stock"],
    ["Sizes", p => p.sizes.join(", ")],
  ];
  $("#compareBody").innerHTML = `
    <table class="compare-table">
      <thead><tr><th></th>${items.map(p => `<th><div class="cmp-head"><div class="cmp-jersey">${jerseySVG(p.colors)}</div><b>${p.name}</b></div></th>`).join("")}</tr></thead>
      <tbody>
        ${rows.map(([lbl, fn]) => `<tr><th>${lbl}</th>${items.map(p => `<td>${fn(p)}</td>`).join("")}</tr>`).join("")}
        <tr><th></th>${items.map(p => `<td><button class="btn btn-sm btn-primary" data-cmp-add="${p.id}">Add to bag</button></td>`).join("")}</tr>
      </tbody>
    </table>`;
  openModal("compareModal");
});
$("#compareBody").addEventListener("click", e => {
  const t = e.target.closest("[data-cmp-add]");
  if (t) addToCart(Number(t.dataset.cmpAdd));
});

/* Inject compare checkbox into cards after render */
const _origRender = renderProducts;
renderProducts = function() {
  _origRender.apply(this, arguments);
  setTimeout(() => {
    $$("#productGrid .card, #recentGrid .card").forEach(card => {
      if ($(".card-compare-chk", card)) return;
      const id = Number(card.dataset.id);
      const btn = document.createElement("button");
      btn.className = "card-compare-chk" + (state.compare.has(id) ? " active" : "");
      btn.setAttribute("aria-label", "Compare");
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h12"/></svg>`;
      $(".card-media", card)?.appendChild(btn);
    });
  }, 160);
};
renderProducts();

/* ---------- Order tracking ---------- */
$("#trackOrderLink")?.addEventListener("click", e => {
  e.preventDefault();
  $("#trackResult").innerHTML = "";
  $("#trackInput").value = "";
  openModal("trackModal");
});
$("#trackBtn")?.addEventListener("click", () => {
  const v = $("#trackInput").value.trim();
  if (!v) return toast("Enter order number", "error");
  const steps = ["Ordered", "Processing", "Shipped", "Out for delivery", "Delivered"];
  const at = 2 + Math.floor(Math.random() * 2);
  $("#trackResult").innerHTML = `
    <div class="tracker">
      <b>Order ${v.toUpperCase()}</b>
      <p class="muted small">Estimated delivery: 3–5 business days</p>
      <div class="track-steps">
        ${steps.map((s,i) => `<div class="${i<at?"done":""} ${i===at?"active":""}"><span class="dot">${i<at?"✓":""}</span>${s}</div>`).join("")}
      </div>
    </div>`;
});

/* ---------- Promo code + share (hook into existing flows) ---------- */
const PROMOS = { KITKING10: 0.10, WELCOME15: 0.15, FAN20: 0.20 };
state.promo = null;

const _origOrderSummary = orderSummaryHTML;
orderSummaryHTML = function(sub, ship, tax, total) {
  const disc = state.promo ? sub * PROMOS[state.promo] : 0;
  const adjTotal = total - disc;
  return `
    <div class="promo">
      <label class="small muted">Promo code</label>
      <div style="display:flex;gap:8px;margin-top:6px">
        <input id="promoInput" placeholder="KITKING10" value="${state.promo||''}" style="flex:1;padding:10px;border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:6px"/>
        <button class="btn btn-sm btn-ghost" id="promoApply">Apply</button>
      </div>
      ${state.promo ? `<small style="color:var(--ok,#2b7a4b)">✓ ${state.promo} — ${Math.round(PROMOS[state.promo]*100)}% off</small>` : ""}
    </div>
    <div class="order-summary">
      <div class="row"><span>Subtotal</span><span>${fmtPrice(sub)}</span></div>
      ${disc ? `<div class="row"><span>Discount</span><span>−${fmtPrice(disc)}</span></div>` : ""}
      <div class="row"><span>Shipping</span><span>${ship === 0 ? "FREE" : fmtPrice(ship)}</span></div>
      <div class="row"><span>Tax (8%)</span><span>${fmtPrice(tax)}</span></div>
      <div class="row total"><span>Total</span><span>${fmtPrice(adjTotal)}</span></div>
    </div>`;
};
document.addEventListener("click", e => {
  if (e.target.id === "promoApply") {
    const v = $("#promoInput").value.trim().toUpperCase();
    if (!v) { state.promo = null; toast("Promo cleared"); renderCheckout(); return; }
    if (PROMOS[v]) { state.promo = v; toast(`${v} applied — ${Math.round(PROMOS[v]*100)}% off`, "success"); renderCheckout(); }
    else toast("Invalid promo code", "error");
  }
});

/* Clear promo after order */
const _origPlace = placeOrder;
placeOrder = function() {
  _origPlace.apply(this, arguments);
  state.promo = null;
};

/* ---------- Share button (wire into product modal) ---------- */
const _origBindPM = bindProductModal;
bindProductModal = function() {
  _origBindPM.apply(this, arguments);
  const actions = $(".pm-actions");
  if (actions && !$("#pmShare")) {
    const btn = document.createElement("button");
    btn.id = "pmShare";
    btn.className = "icon-btn";
    btn.setAttribute("aria-label", "Share");
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>`;
    btn.addEventListener("click", async () => {
      const p = currentProduct;
      const url = location.href.split("#")[0] + "#p=" + p.id;
      const data = { title: `${p.name} — KITKING`, text: `Check out ${p.name} on KITKING`, url };
      if (navigator.share) {
        try { await navigator.share(data); } catch {}
      } else {
        try { await navigator.clipboard.writeText(url); toast("Link copied", "success"); }
        catch { toast(url); }
      }
    });
    actions.appendChild(btn);
  }
};
