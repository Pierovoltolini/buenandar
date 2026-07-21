// ============================================================
//  BuenAndar.uy — script.js
//  Carousel · Productos (stock/encargue) · Modal · Mini carrito
//  El estado y la lógica del carrito viven en cart.js (compartido
//  con carrito.html) — este archivo solo dibuja la UI de la home.
// ============================================================

let currentProduct = null;
let currentSize = null;
let currentFilter = "all"; // "all" | "stock" | "preorder"

// ── Carrusel ────────────────────────────────────────────────
(function initCarousel() {
  const slides = [
    {
      type: "image",
      src: "img/banner1.png",
      headline: "Calidad Alta gama\npara cada paso",
      sub: "Las mejores marcas deportivas, en Uruguay"
    },
    {
      type: "image",
      src: "img/banner2.png",
      headline: "Movete bien\nal mejor precio",
      sub: "Modelos exclusivos · Stock y encargue · Envíos a todo el país"
    },
    {
      type: "image",
      src: "img/hero3.png",
      headline: "Stock\ny encargue",
      sub: "Encontrá el modelo que buscás · Consulta por WhatsApp, compras 100% seguras"
    }
  ];

  const track = document.getElementById("carouselTrack");
  const dotsWrap = document.getElementById("carouselDots");
  if (!track || !dotsWrap) return;

  let current = 0;
  let timer;

  function buildSlides() {
    slides.forEach((s, i) => {
      const slide = document.createElement("div");
      slide.className = "carousel-slide";

      let media;
      if (s.type === "video") {
        media = document.createElement("video");
        media.src = s.src;
        media.autoplay = true;
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
      } else {
        media = document.createElement("img");
        media.src = s.src;
        media.alt = s.headline;
        media.loading = i === 0 ? "eager" : "lazy";
      }

      const overlay = document.createElement("div");
      overlay.className = "carousel-overlay";
      overlay.innerHTML = `
        <div class="carousel-content">
          <div class="carousel-eyebrow">BuenAndar.uy — Uruguay</div>
          <h1 class="carousel-headline">${s.headline.replace(/\n/g, "<br>")}</h1>
          <p class="carousel-sub">${s.sub}</p>
          <div class="carousel-btns">
            <a href="#products" class="btn-primary">Ver productos</a>
            <a href="https://wa.me/598${WA_NUMBER.replace(/^0/, '')}" target="_blank" class="btn-secondary">
              Consultar por WhatsApp
            </a>
          </div>
        </div>`;

      slide.appendChild(media);
      slide.appendChild(overlay);
      track.appendChild(slide);

      const dot = document.createElement("button");
      dot.className = "dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Slide ${i + 1}`);
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  function goTo(n) {
    current = (n + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dotsWrap.querySelectorAll(".dot").forEach((d, i) =>
      d.classList.toggle("active", i === current)
    );
    resetTimer();
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 5000);
  }

  buildSlides();

  document.getElementById("carouselPrev").addEventListener("click", () => goTo(current - 1));
  document.getElementById("carouselNext").addEventListener("click", () => goTo(current + 1));

  let touchX = null;
  track.addEventListener("touchstart", e => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend", e => {
    if (touchX === null) return;
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(current + (diff > 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });

  resetTimer();
})();

// ── Header scroll ───────────────────────────────────────────
window.addEventListener("scroll", () => {
  const header = document.getElementById("header");
  if (header) header.classList.toggle("scrolled", window.scrollY > 10);
});

// ── Hamburger ───────────────────────────────────────────────
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobileNav");
if (hamburger && mobileNav) {
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("open");
    mobileNav.classList.toggle("open");
  });
  mobileNav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      hamburger.classList.remove("open");
      mobileNav.classList.remove("open");
    });
  });
}

// ── Filtro de productos (Todos / Entrega inmediata / Por encargue) ──
function setFilter(filter) {
  currentFilter = filter;
  renderProducts();
  updateFilterTabsUI();
}

function goToProductFilter(filter) {
  setFilter(filter);
  const target = document.getElementById("products");
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateFilterTabsUI() {
  document.querySelectorAll(".product-filter-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === currentFilter);
  });
}

// ── Tarjeta de producto (reutilizada en carruseles y relacionados) ──
function buildProductCard(p) {
  const card = document.createElement("div");
  card.className = "product-card carousel-product";
  card.setAttribute("data-id", p.id);

  let lastTap = 0;

  card.addEventListener("click", function (e) {
    if (
      e.target.closest(".btn-ver") ||
      e.target.closest(".btn-carrito") ||
      e.target.closest(".size-pill")
    ) return;
    if (!window.matchMedia("(pointer: coarse)").matches) openModal(p.id);
  });

  card.addEventListener("touchend", function (e) {
    if (
      e.target.closest(".btn-ver") ||
      e.target.closest(".btn-carrito") ||
      e.target.closest(".size-pill")
    ) return;
    const now = Date.now();
    if (now - lastTap < 350) {
      openModal(p.id);
      e.preventDefault();
    }
    lastTap = now;
  });

  const isStock = isStockProduct(p);
  const stockLabel = getPurchaseLabelShort(p);
  const hasDiscount = typeof p.compareAtPrice === "number" && p.compareAtPrice > p.price;
  const discountPct = hasDiscount ? Math.round(100 - (p.price / p.compareAtPrice) * 100) : 0;
  const sizeList = normalizeSizes(p);
  const totalStock = isStock ? sizeList.reduce((sum, s) => sum + (s.stock || 0), 0) : null;
  const lowStock = isStock && totalStock !== null && totalStock > 0 && totalStock <= 3;

  card.innerHTML = `
    <div class="product-img-wrap">
      <img src="${p.images[0]}" alt="${p.name}" loading="lazy">
      ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
      <span class="product-stock-badge ${isStock ? "is-stock" : "is-preorder"}">${stockLabel}</span>
    </div>

    <div class="product-info">
      <div class="product-brand">${p.brand}</div>
      <div class="product-name">${p.name}</div>

      <div class="product-price-row">
        <div class="product-price">$${p.price.toLocaleString("es-UY")} <span>UYU</span></div>
        ${hasDiscount ? `
          <div class="product-compare-price">$${p.compareAtPrice.toLocaleString("es-UY")}</div>
          <div class="product-discount-pill">-${discountPct}%</div>
        ` : ""}
      </div>

      ${lowStock ? `<div class="product-low-stock">¡Últimas ${totalStock} unidades!</div>` : ""}

      <div class="product-sizes">
        ${sizeList.map(s => `<span class="size-pill${!isSizeAvailable(p, s.size) ? " is-sold-out" : ""}">${s.size}</span>`).join("")}
      </div>

      <div class="product-actions">
        <button class="btn-ver" onclick="openModal(${p.id})">
          Ver producto
        </button>
        <button class="btn-carrito" onclick="addToCartFromGrid(${p.id})">
          ${isStock ? "+ Carrito" : "Encargar"}
        </button>
      </div>
    </div>
  `;

  if (p.images.length > 1 && !window.matchMedia("(pointer: coarse)").matches) {
    const imgWrap = card.querySelector(".product-img-wrap");
    const img = imgWrap.querySelector("img");
    imgWrap.addEventListener("mouseenter", () => { img.src = p.images[1]; });
    imgWrap.addEventListener("mouseleave", () => { img.src = p.images[0]; });
  }

  return card;
}

function renderProducts() {
  const wrap = document.getElementById("brandCarousels");
  if (!wrap) return;
  wrap.innerHTML = "";
  updateFilterTabsUI();

  const activeProducts = products.filter(p => p.active !== false);
  const filtered = currentFilter === "all"
    ? activeProducts
    : activeProducts.filter(p => p.purchaseType === currentFilter);

  if (filtered.length === 0) {
    wrap.innerHTML = `
      <div class="products-empty-state">
        <p>${currentFilter === "stock"
          ? "Todavía no tenemos modelos en stock publicados. Muy pronto vamos a sumar fotos — seguinos en Instagram para enterarte primero."
          : "No hay modelos por encargue disponibles en este momento."}</p>
      </div>`;
    return;
  }

  const BRAND_ORDER = ["Adidas", "Nike", "On Cloud", "New Balance"];
  const byBrand = {};
  filtered.forEach(p => {
    if (!byBrand[p.brand]) byBrand[p.brand] = [];
    byBrand[p.brand].push(p);
  });

  const allBrands = [
    ...BRAND_ORDER.filter(b => byBrand[b]),
    ...Object.keys(byBrand).filter(b => !BRAND_ORDER.includes(b))
  ];

  allBrands.forEach(brand => {
    const brandProducts = byBrand[brand];

    const row = document.createElement("div");
    row.className = "brand-row";

    const title = document.createElement("div");
    title.className = "brand-row-title";
    title.innerHTML = `
      <span class="brand-row-name">${brand}</span>
      <span class="brand-row-count">
        ${brandProducts.length} modelo${brandProducts.length !== 1 ? "s" : ""}
      </span>
    `;
    row.appendChild(title);

    const carousel = document.createElement("div");
    carousel.className = "products-carousel";

    brandProducts.forEach(p => carousel.appendChild(buildProductCard(p)));

    if (currentFilter !== "stock") {
      const consultCard = document.createElement("div");
      consultCard.className = "product-card carousel-product consult-card";
      consultCard.innerHTML = `
        <div class="consult-card-inner">
          <h3>¿No encontrás el modelo que buscás?</h3>
          <p>ESCRIBINOS y lo conseguimos por encargue.</p>
          <a href="https://wa.me/59894990760?text=Hola%2C%20no%20encuentro%20el%20modelo%20que%20busco%20en%20BuenAndar.uy" target="_blank">
            ESCRIBINOS
          </a>
        </div>
      `;
      carousel.appendChild(consultCard);
    }

    row.appendChild(carousel);
    wrap.appendChild(row);
  });
}

// ── Modal de producto ──────────────────────────────────────────
const modalOverlay = document.getElementById("modalOverlay");

function openModal(id) {
  const p = products.find(x => x.id === id && x.active !== false);
  if (!p) return;
  currentProduct = p;
  currentSize = null;

  document.getElementById("modalBrand").textContent = p.brand;
  document.getElementById("modalName").textContent = p.name;

  const hasDiscount = typeof p.compareAtPrice === "number" && p.compareAtPrice > p.price;
  document.getElementById("modalPrice").innerHTML = hasDiscount
    ? `$${p.price.toLocaleString("es-UY")} UYU <span class="modal-compare-price">$${p.compareAtPrice.toLocaleString("es-UY")}</span>`
    : `$${p.price.toLocaleString("es-UY")} UYU`;

  const stockTag = document.getElementById("modalStock");
  stockTag.textContent = getPurchaseLabel(p);
  stockTag.className = "modal-stock-tag " + (isStockProduct(p) ? "is-stock" : "is-preorder");

  const purchaseInfo = document.getElementById("modalPurchaseInfo");
  if (purchaseInfo) {
    purchaseInfo.innerHTML = isStockProduct(p)
      ? `<strong>Entrega inmediata.</strong> Este par está listo para enviar apenas confirmes tu compra.`
      : `<strong>Producto por encargue.</strong> Este modelo se solicita especialmente en tu talle. Plazo estimado de entrega: ${p.estimatedDelivery || "10 a 12 días hábiles"}. Se confirma con una seña del 50% del valor; el resto se abona cuando el producto llega.`;
  }

  document.getElementById("modalDesc").textContent = p.description;
  document.getElementById("modalFeatures").innerHTML = p.features.map(f => `<span class="feature-tag">${f}</span>`).join("");

  const mainImg = document.getElementById("modalMainImg");
  mainImg.src = p.images[0];
  const thumbs = document.getElementById("modalThumbs");
  thumbs.innerHTML = p.images.map((img, i) => `
    <img src="${img}" class="modal-thumb${i === 0 ? " active" : ""}" alt="Foto ${i+1}" onclick="selectThumb(this, '${img}')">
  `).join("");

  const sizesWrap = document.getElementById("modalSizes");
  sizesWrap.innerHTML = normalizeSizes(p).map(s => {
    const available = isSizeAvailable(p, s.size);
    return `<button type="button" class="modal-size-btn${available ? "" : " sold-out"}" ${available ? `onclick="selectSize(this, '${s.size}')"` : 'disabled aria-disabled="true" title="Sin stock en este talle"'}>${s.size}</button>`;
  }).join("");

  const addBtn = document.getElementById("modalAddCart");
  addBtn.textContent = isStockProduct(p) ? "Agregar al carrito" : "Encargar producto";

  renderRelatedProducts(p);

  modalOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
  history.replaceState(null, "", `#p/${p.slug}`);

  trackEvent("ViewContent", {
    content_ids: [p.id],
    content_name: p.name,
    content_type: "product",
    value: p.price,
    currency: "UYU"
  });
}

function closeModal() {
  modalOverlay.classList.remove("active");
  document.body.style.overflow = "";
  currentProduct = null;
  currentSize = null;
  if (location.hash.startsWith("#p/")) {
    history.replaceState(null, "", location.pathname + location.search);
  }
}

function selectThumb(el, src) {
  document.getElementById("modalMainImg").src = src;
  document.querySelectorAll(".modal-thumb").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
}

function selectSize(el, size) {
  document.querySelectorAll(".modal-size-btn").forEach(b => b.classList.remove("selected"));
  el.classList.add("selected");
  currentSize = size;
}

function renderRelatedProducts(p) {
  const wrap = document.getElementById("modalRelated");
  if (!wrap) return;
  const related = products.filter(x => x.active !== false && x.id !== p.id && x.brand === p.brand).slice(0, 4);
  if (related.length === 0) {
    wrap.innerHTML = "";
    return;
  }
  wrap.innerHTML = `
    <div class="modal-related-title">También te puede gustar</div>
    <div class="modal-related-grid">
      ${related.map(r => `
        <button type="button" class="modal-related-item" onclick="openModal(${r.id})">
          <img src="${r.images[0]}" alt="${r.name}" loading="lazy">
          <span class="modal-related-name">${r.name}</span>
          <span class="modal-related-price">$${r.price.toLocaleString("es-UY")}</span>
        </button>
      `).join("")}
    </div>`;
}

document.getElementById("modalClose").addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });

const sizeGuideBtn = document.getElementById("modalSizeGuideBtn");
const sizeGuideText = document.getElementById("modalSizeGuideText");
if (sizeGuideBtn && sizeGuideText) {
  sizeGuideBtn.addEventListener("click", () => {
    sizeGuideText.classList.toggle("visible");
  });
}

// Botón principal del modal: "Agregar al carrito" (stock) o "Encargar producto" (preorder)
document.getElementById("modalAddCart").addEventListener("click", () => {
  if (!currentProduct) return;
  if (!currentSize) { showToast("Seleccioná un talle"); return; }
  if (!isSizeAvailable(currentProduct, currentSize)) { showToast("Sin stock en este talle"); return; }
  const added = addToCart(currentProduct, currentSize);
  if (!added) { showToast("Sin stock en este talle"); return; }
  const p = currentProduct;
  closeModal();
  showAddedToCartToast(p);
});

// Botón secundario del modal: compra directa por WhatsApp
document.getElementById("modalWhatsApp").addEventListener("click", () => {
  if (!currentProduct) return;
  if (!currentSize) { showToast("Seleccioná un talle"); return; }
  if (!isSizeAvailable(currentProduct, currentSize)) { showToast("Sin stock en este talle"); return; }
  const modality = isStockProduct(currentProduct) ? "en stock" : "por encargue";
  const label = formatItemLabel(currentProduct.brand, currentProduct.name);
  const msg = `Hola, quiero comprar este par: ${label} talle ${currentSize} (${modality}).`;
  const waNumber = `598${WA_NUMBER.replace(/^0/, "")}`;
  window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, "_blank");
});

// ── Mini carrito (drawer) ────────────────────────────────────
const cartOverlay = document.getElementById("cartOverlay");
const cartDrawer = document.getElementById("cartDrawer");

function openCart() {
  renderAllCartUI();
  cartOverlay.classList.add("active");
  cartDrawer.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartOverlay.classList.remove("active");
  cartDrawer.classList.remove("open");
  document.body.style.overflow = "";
}

document.getElementById("cartBtn").addEventListener("click", openCart);
document.getElementById("cartClose").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

function addToCartFromGrid(id) {
  const p = products.find(x => x.id === id && x.active !== false);
  if (!p) return;
  const sizeList = normalizeSizes(p);
  if (sizeList.length === 1) {
    const only = sizeList[0];
    if (!isSizeAvailable(p, only.size)) { showToast("Sin stock en este talle"); return; }
    addToCart(p, only.size);
    showAddedToCartToast(p);
  } else {
    openModal(id);
  }
}

const cartCheckoutBtn = document.getElementById("cartCheckoutBtn");
if (cartCheckoutBtn) {
  cartCheckoutBtn.addEventListener("click", () => startCheckout(cartCheckoutBtn));
}

// ── Toast ──────────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.classList.remove("with-actions");
  toast.textContent = msg;
  toast.classList.add("show", "success");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove("show", "success"), 3000);
}

// Confirmación tras agregar al carrito: sin popups invasivos,
// solo dos caminos claros para el cliente.
function showAddedToCartToast(product) {
  const toast = document.getElementById("toast");
  toast.innerHTML = `
    <span class="toast-msg">✓ ${product.name} agregado al carrito</span>
    <div class="toast-actions">
      <a href="carrito.html" class="toast-btn toast-btn-primary">Ver carrito</a>
      <button type="button" class="toast-btn toast-btn-secondary" id="toastDismiss">Seguir comprando</button>
    </div>
  `;
  toast.classList.add("show", "success", "with-actions");
  document.getElementById("toastDismiss").addEventListener("click", () => {
    toast.classList.remove("show", "success", "with-actions");
  });
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove("show", "success", "with-actions"), 6000);
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  updateCartBadge();
  registerCartUI({
    items: "cartItems",
    subtotal: "cartSubtotal",
    discount: "cartDiscount",
    total: "cartTotal",
    banner: "cartDiscountBanner",
    mixedBanner: "cartMixedBanner",
    checkoutBtn: "cartCheckoutBtn"
  });

  if (location.hash.startsWith("#p/")) {
    const slug = location.hash.slice(3);
    const p = products.find(x => x.slug === slug && x.active !== false);
    if (p) openModal(p.id);
  }
});
