// ============================================================
//  BuenAndar.uy — cart.js
//  Estado y lógica del carrito: ÚNICA fuente de verdad.
//  Usado por el mini carrito (index.html) y la página completa
//  (carrito.html) para no duplicar el sistema de carrito.
// ============================================================

const WA_NUMBER = "094990760";
const CART_STORAGE_KEY = "buenandar_cart";

let cart = [];
try {
  cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
} catch (e) {
  cart = [];
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// ── Analítica (Meta Pixel) ───────────────────────────────────
// Los 4 eventos ya están conectados en el flujo real de compra.
// No hacen nada hasta que instales el script base de Meta Pixel
// (agregalo en el <head> de index.html y carrito.html) — no se
// rompe nada mientras tanto porque se valida que fbq exista.
function trackEvent(name, data) {
  if (typeof fbq === "function") {
    fbq("track", name, data || {});
  }
}

// ── Helpers de producto: talles y stock ──────────────────────
// sizes admite dos formatos: ["40","41"] (por encargue, sin límite
// de stock) o [{size:"40", stock:3}] (en stock, con conteo real).
function normalizeSizes(product) {
  return product.sizes.map(s =>
    typeof s === "string" ? { size: s, stock: null } : { size: s.size, stock: s.stock }
  );
}

function isStockProduct(product) {
  return product.purchaseType === "stock";
}

function getSizeStock(product, size) {
  const entry = normalizeSizes(product).find(s => s.size === size);
  return entry ? entry.stock : null;
}

function isSizeAvailable(product, size) {
  if (!isStockProduct(product)) return true; // por encargue: se consigue especialmente
  const stock = getSizeStock(product, size);
  return typeof stock === "number" && stock > 0;
}

function getPurchaseLabel(product) {
  return isStockProduct(product) ? "En stock" : "Disponible por encargue";
}

// Versión corta para espacios chicos (tarjetas de producto, carrito).
function getPurchaseLabelShort(product) {
  return isStockProduct(product) ? "En stock" : "Por encargue";
}

// Evita "Adidas Adidas Adizero SL" cuando el nombre ya incluye la marca.
function formatItemLabel(brand, name) {
  return name.toLowerCase().startsWith(brand.toLowerCase()) ? name : `${brand} ${name}`;
}

// ── Descuentos y totales ──────────────────────────────────────
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

function cartIsMixed() {
  const hasStock = cart.some(i => i.purchaseType === "stock");
  const hasPreorder = cart.some(i => i.purchaseType === "preorder");
  return hasStock && hasPreorder;
}

// ── Mutaciones del carrito ────────────────────────────────────
function addToCart(product, size, qty = 1) {
  if (!isSizeAvailable(product, size)) return false;

  const stock = getSizeStock(product, size);
  const existing = cart.find(i => i.id === product.id && i.size === size);

  if (existing) {
    let nextQty = existing.qty + qty;
    if (isStockProduct(product) && typeof stock === "number") nextQty = Math.min(nextQty, stock);
    existing.qty = nextQty;
  } else {
    cart.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.images[0],
      size,
      qty: isStockProduct(product) && typeof stock === "number" ? Math.min(qty, stock) : qty,
      purchaseType: product.purchaseType,
      estimatedDelivery: product.estimatedDelivery || null
    });
  }

  saveCart();
  updateCartBadge();
  renderAllCartUI();
  trackEvent("AddToCart", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: product.price * qty,
    currency: "UYU"
  });
  return true;
}

function removeFromCart(id, size) {
  cart = cart.filter(i => !(i.id === id && i.size === size));
  saveCart();
  updateCartBadge();
  renderAllCartUI();
}

function changeQty(id, size, delta) {
  const item = cart.find(i => i.id === id && i.size === size);
  if (!item) return;
  const product = products.find(p => p.id === id);
  let nextQty = Math.max(1, item.qty + delta);
  if (product && isStockProduct(product)) {
    const stock = getSizeStock(product, size);
    if (typeof stock === "number") nextQty = Math.min(nextQty, stock);
  }
  item.qty = nextQty;
  saveCart();
  updateCartBadge();
  renderAllCartUI();
}

// ── Badge del ícono carrito ────────────────────────────────────
function updateCartBadge() {
  const qty = getCartQty();
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  badge.textContent = qty;
  badge.classList.toggle("visible", qty > 0);
}

// ── Render genérico de una lista de carrito ───────────────────
// ids: { items, subtotal, discount, total, banner, mixedBanner }
function renderCartInto(ids) {
  const itemsEl = document.getElementById(ids.items);
  if (!itemsEl) return;

  const totalEl = ids.total ? document.getElementById(ids.total) : null;
  const subtotalEl = ids.subtotal ? document.getElementById(ids.subtotal) : null;
  const discountEl = ids.discount ? document.getElementById(ids.discount) : null;
  const discountBanner = ids.banner ? document.getElementById(ids.banner) : null;
  const mixedBanner = ids.mixedBanner ? document.getElementById(ids.mixedBanner) : null;
  const checkoutBtn = ids.checkoutBtn ? document.getElementById(ids.checkoutBtn) : null;

  if (mixedBanner) mixedBanner.classList.toggle("visible", cartIsMixed());
  if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

  if (cart.length === 0) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon">🛒</span>
        <p>Tu carrito está vacío</p>
      </div>`;
    if (subtotalEl) subtotalEl.textContent = "$0";
    if (discountEl) discountEl.textContent = "$0";
    if (totalEl) totalEl.textContent = "$0";
    if (discountBanner) discountBanner.classList.remove("visible");
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div>
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta-row">
          <span class="cart-item-size">Talle ${item.size}</span>
          <span class="cart-item-modality ${item.purchaseType === "stock" ? "is-stock" : "is-preorder"}">
            ${item.purchaseType === "stock" ? "En stock" : "Por encargue"}
          </span>
        </div>
        <div class="cart-item-price">
          <span class="cart-item-unit-price">$${item.price.toLocaleString("es-UY")} c/u</span>
          <span class="cart-item-line-total">$${(item.price * item.qty).toLocaleString("es-UY")}</span>
        </div>
        <div class="cart-qty">
          <button class="qty-btn" onclick="changeQty(${item.id}, '${item.size}', -1)" aria-label="Restar cantidad">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, '${item.size}', 1)" aria-label="Sumar cantidad">+</button>
        </div>
      </div>
      <button class="cart-item-del" onclick="removeFromCart(${item.id}, '${item.size}')" title="Eliminar" aria-label="Eliminar producto">✕</button>
    </div>
  `).join("");

  const qty = getCartQty();
  const sub = getSubtotal();
  const disc = getDiscount(qty);
  const discAmt = sub * disc;
  const total = sub - discAmt;

  if (subtotalEl) subtotalEl.textContent = `$${sub.toLocaleString("es-UY")}`;
  if (discountEl) discountEl.textContent = disc > 0 ? `-$${discAmt.toLocaleString("es-UY")}` : "$0";
  if (totalEl) totalEl.textContent = `$${total.toLocaleString("es-UY")}`;

  if (discountBanner) {
    if (disc > 0) {
      discountBanner.textContent = qty >= 3 ? "🎉 Aplicaste 15% OFF — 3 pares o más" : "🎉 Aplicaste 10% OFF — 2 pares";
      discountBanner.classList.add("visible");
    } else {
      discountBanner.classList.remove("visible");
    }
  }
}

// Cada página registra sus propios contenedores (drawer, página
// completa) sin crear un segundo estado: todas leen del mismo `cart`.
const _cartUIs = [];
function registerCartUI(ids) {
  _cartUIs.push(ids);
  renderCartInto(ids);
}
function renderAllCartUI() {
  _cartUIs.forEach(renderCartInto);
}

// ── Checkout ───────────────────────────────────────────────────
function buildWhatsAppCheckoutUrl() {
  const waNumber = `598${WA_NUMBER.replace(/^0/, "")}`;
  const qty = getCartQty();
  const total = getTotal();
  const itemsList = cart.map(i =>
    `${formatItemLabel(i.brand, i.name)} talle ${i.size} (${i.purchaseType === "stock" ? "en stock" : "por encargue"})${i.qty > 1 ? ` x${i.qty}` : ""}`
  ).join(", ");

  let msg;
  if (qty === 1) {
    msg = `Hola, quiero comprar este par: ${itemsList}.`;
  } else if (qty === 2) {
    msg = `Hola, quiero comprar 2 pares: ${itemsList}. También vi que aplica el 10% OFF. Total: $${total.toLocaleString("es-UY")} UYU.`;
  } else {
    msg = `Hola, quiero comprar ${qty} pares: ${itemsList}. También vi que aplica el 15% OFF. Total: $${total.toLocaleString("es-UY")} UYU.`;
  }
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
}

// Intenta Mercado Pago vía la Cloudflare Pages Function (/api/create-preference).
// Si todavía no configuraste el Access Token, o falla la red, cae
// automáticamente al checkout por WhatsApp que ya funciona hoy:
// el botón "Finalizar compra" nunca deja al cliente sin salida.
async function startCheckout(button) {
  if (cart.length === 0) return;

  trackEvent("InitiateCheckout", {
    value: getTotal(),
    currency: "UYU",
    num_items: getCartQty()
  });

  const originalText = button ? button.textContent : null;
  if (button) {
    button.disabled = true;
    button.textContent = "Procesando…";
  }

  try {
    const res = await fetch("/api/create-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart, total: getTotal() })
    });
    if (!res.ok) throw new Error("Mercado Pago no disponible");
    const data = await res.json();
    if (!data.init_point) throw new Error("Respuesta sin init_point");
    window.location.href = data.init_point;
    return;
  } catch (err) {
    window.open(buildWhatsAppCheckoutUrl(), "_blank");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}
