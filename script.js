// ============================================================
//  BuenAndar.uy — script.js
//  Carousel · Productos · Modal · Carrito · WhatsApp
// ============================================================

const WA_NUMBER = "094990760";

// ── Estado del carrito ──────────────────────────────────────
let cart = JSON.parse(localStorage.getItem("buenandar_cart") || "[]");
let currentProduct = null;
let currentSize = null;

function saveCart() {
  localStorage.setItem("buenandar_cart", JSON.stringify(cart));
}

// ── Descuentos ──────────────────────────────────────────────
function getDiscount(qty) {
  if (qty >= 3) return 0.15;
  if (qty >= 2) return 0.10;
  return 0;
}

function getCartQty() {
  return cart.reduce((sum, i) => sum + i.qty, 0);
}

function getSubtotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function getTotal() {
  const sub = getSubtotal();
  const disc = getDiscount(getCartQty());
  return sub * (1 - disc);
}

// ── Carrusel ────────────────────────────────────────────────
(function initCarousel() {
  // Slides: editá esta lista para cambiar imágenes/videos
  const slides = [
    
    {
      type: "image",
      src: "banner1.png",
      headline: "Calidad Alta gama\npara cada paso",
      sub: "Las mejores marcas deportivas, en Uruguay"
    },
    {
      type: "image",
      src: "banner2.png",
      headline: "Movete bien\nal mejor precio",
      sub: "Modelos exclusivos · Stock y encargue · Envíos a todo el país"
    },
    
   
    
    {
      type: "image",
      src: "hero3.png",
      headline: "Stock\ny encargue",
      sub: "Encontrá el modelo que buscás · Consulta por WhatsApp, compras 100% seguras"
    }
    // Para agregar un video:
    // { type: "video", src: "video/banner.mp4", headline: "...", sub: "..." }
  ];

  const track = document.getElementById("carouselTrack");
  const dotsWrap = document.getElementById("carouselDots");
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

      // Dot
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

  // Swipe touch
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
  document.getElementById("header").classList.toggle("scrolled", window.scrollY > 10);
});

// ── Hamburger ───────────────────────────────────────────────
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobileNav");
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

function renderProducts() {
  const wrap = document.getElementById("brandCarousels");
  if (!wrap) return;
  wrap.innerHTML = "";

  // Orden de marcas deseado; las que no tengan productos no aparecen
  const BRAND_ORDER = ["Adidas", "Nike", "On Cloud", "New Balance",];

  // Agrupar productos por marca
  const byBrand = {};
  products.forEach(p => {
    if (!byBrand[p.brand]) byBrand[p.brand] = [];
    byBrand[p.brand].push(p);
  });

  // Marcas a mostrar: primero las del orden definido, luego cualquier extra
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

  brandProducts.forEach(p => {
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

      if (!window.matchMedia("(pointer: coarse)").matches) {
        openModal(p.id);
      }
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

    card.innerHTML = `
      <div class="product-img-wrap">
        <img src="${p.images[0]}" alt="${p.name}" loading="lazy">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
        <span class="product-stock-badge">${p.stockType}</span>
      </div>

      <div class="product-info">
        <div class="product-brand">${p.brand}</div>
        <div class="product-name">${p.name}</div>

        <div class="product-price">
          $${p.price.toLocaleString("es-UY")} <span>UYU</span>
        </div>

        <div class="product-sizes">
          ${p.sizes.map(s => `<span class="size-pill">${s}</span>`).join("")}
        </div>

        <div class="product-actions">
          <button class="btn-ver" onclick="openModal(${p.id})">
            Ver producto
          </button>
          <button class="btn-carrito" onclick="addToCartFromGrid(${p.id})">
            + Carrito
          </button>
        </div>
      </div>
    `;

    carousel.appendChild(card);
  });

  // 🔥 CARD FINAL DE CONSULTA
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

  row.appendChild(carousel);
  wrap.appendChild(row);
});
}

// ── Modal ────────────────────────────────────────────────────
const modalOverlay = document.getElementById("modalOverlay");

function openModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  currentProduct = p;
  currentSize = null;

  document.getElementById("modalBrand").textContent = p.brand;
  document.getElementById("modalName").textContent = p.name;
  document.getElementById("modalPrice").textContent = `$${p.price.toLocaleString("es-UY")} UYU`;
  document.getElementById("modalStock").textContent = p.stockType;
  document.getElementById("modalDesc").textContent = p.description;
  document.getElementById("modalFeatures").innerHTML = p.features.map(f => `<span class="feature-tag">${f}</span>`).join("");

  // Galería
  const mainImg = document.getElementById("modalMainImg");
  mainImg.src = p.images[0];
  const thumbs = document.getElementById("modalThumbs");
  thumbs.innerHTML = p.images.map((img, i) => `
    <img src="${img}" class="modal-thumb${i === 0 ? " active" : ""}" alt="Foto ${i+1}" onclick="selectThumb(this, '${img}')">
  `).join("");

  // Talles
  const sizesWrap = document.getElementById("modalSizes");
  sizesWrap.innerHTML = p.sizes.map(s => `
    <button class="modal-size-btn" onclick="selectSize(this, '${s}')">${s}</button>
  `).join("");

  modalOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalOverlay.classList.remove("active");
  document.body.style.overflow = "";
  currentProduct = null;
  currentSize = null;
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

document.getElementById("modalClose").addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });

// Botón "Sumar al carrito" del modal
document.getElementById("modalAddCart").addEventListener("click", () => {
  if (!currentProduct) return;
  if (!currentSize) { showToast("Seleccioná un talle"); return; }
  addToCart(currentProduct, currentSize);
  showToast("✓ Agregado al carrito");
  closeModal();
  openCart();
});

// Botón "Comprar por WhatsApp" del modal
document.getElementById("modalWhatsApp").addEventListener("click", () => {
  if (!currentProduct) return;
  if (!currentSize) { showToast("Seleccioná un talle"); return; }
  const msg = `Hola, quiero comprar este par: ${currentProduct.name} talle ${currentSize}.`;
  const waNumber = `598${WA_NUMBER.replace(/^0/, "")}`;
  window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, "_blank");
});

// ── Carrito ──────────────────────────────────────────────────
const cartOverlay = document.getElementById("cartOverlay");
const cartDrawer = document.getElementById("cartDrawer");

function openCart() {
  renderCart();
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

function addToCart(product, size) {
  const existing = cart.find(i => i.id === product.id && i.size === size);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.images[0],
      size,
      qty: 1
    });
  }
  saveCart();
  updateCartBadge();
}

function addToCartFromGrid(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  // Si tiene 1 solo talle, agregar directo. Si no, abrir modal.
  if (p.sizes.length === 1) {
    addToCart(p, p.sizes[0]);
    showToast("✓ Agregado al carrito");
    updateCartBadge();
  } else {
    openModal(id);
  }
}

function removeFromCart(id, size) {
  cart = cart.filter(i => !(i.id === id && i.size === size));
  saveCart();
  updateCartBadge();
  renderCart();
}

function changeQty(id, size, delta) {
  const item = cart.find(i => i.id === id && i.size === size);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  const qty = getCartQty();
  const badge = document.getElementById("cartBadge");
  badge.textContent = qty;
  badge.classList.toggle("visible", qty > 0);
}

function renderCart() {
  const itemsEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const subtotalEl = document.getElementById("cartSubtotal");
  const discountEl = document.getElementById("cartDiscount");
  const discountBanner = document.getElementById("cartDiscountBanner");
  const checkoutBtn = document.getElementById("cartCheckoutBtn");

  if (cart.length === 0) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon">🛒</span>
        <p>Tu carrito está vacío</p>
      </div>`;
    subtotalEl.textContent = "$0";
    discountEl.textContent = "$0";
    totalEl.textContent = "$0";
    discountBanner.classList.remove("visible");
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div>
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-size">Talle ${item.size}</div>
        <div class="cart-item-price">$${(item.price * item.qty).toLocaleString("es-UY")}</div>
        <div class="cart-qty">
          <button class="qty-btn" onclick="changeQty(${item.id}, '${item.size}', -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, '${item.size}', 1)">+</button>
        </div>
      </div>
      <button class="cart-item-del" onclick="removeFromCart(${item.id}, '${item.size}')" title="Eliminar">✕</button>
    </div>
  `).join("");

  const qty = getCartQty();
  const sub = getSubtotal();
  const disc = getDiscount(qty);
  const discAmt = sub * disc;
  const total = sub - discAmt;

  subtotalEl.textContent = `$${sub.toLocaleString("es-UY")}`;
  discountEl.textContent = disc > 0 ? `-$${discAmt.toLocaleString("es-UY")}` : "$0";
  totalEl.textContent = `$${total.toLocaleString("es-UY")}`;

  if (disc > 0) {
    discountBanner.textContent = qty >= 3 ? "🎉 Aplicaste 15% OFF — 3 pares o más" : "🎉 Aplicaste 10% OFF — 2 pares";
    discountBanner.classList.add("visible");
  } else {
    discountBanner.classList.remove("visible");
  }
}

// ── WhatsApp desde carrito ──────────────────────────────────
document.getElementById("cartCheckoutBtn").addEventListener("click", () => {
  if (cart.length === 0) return;
  const waNumber = `598${WA_NUMBER.replace(/^0/, "")}`;
  const qty = getCartQty();
  const disc = getDiscount(qty);
  const total = getTotal();
  const itemsList = cart.map(i => `${i.brand} ${i.name} talle ${i.size}${i.qty > 1 ? ` (x${i.qty})` : ""}`).join(", ");
  let msg = "";
  if (qty === 1) {
    msg = `Hola, quiero comprar este par: ${itemsList}.`;
  } else if (qty === 2) {
    msg = `Hola, quiero comprar 2 pares: ${itemsList}. También vi que aplica el 10% OFF. Total: $${total.toLocaleString("es-UY")} UYU.`;
  } else {
    msg = `Hola, quiero comprar ${qty} pares: ${itemsList}. También vi que aplica el 15% OFF. Total: $${total.toLocaleString("es-UY")} UYU.`;
  }
  window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, "_blank");
});

// ── Toast ────────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show", "success");
  setTimeout(() => toast.classList.remove("show", "success"), 3000);
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  updateCartBadge();
});
