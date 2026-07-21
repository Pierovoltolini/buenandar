// ============================================================
//  BuenAndar.uy — checkout.js
//  Formulario de contacto/envío + método de envío/pago + resumen.
//  Mercado Pago crea una preferencia vía la Cloudflare Pages
//  Function (functions/api/create-preference.js) y redirige al
//  cliente a pagar. Transferencia/efectivo se confirman directo
//  y se avisan por WhatsApp (no hay backend propio para asentarlos).
// ============================================================

const SHIPPING_METHODS = [
  { id: "mvd",      name: "Montevideo · 24-48 hs (Tres Cruces)", price: 190 },
  { id: "interior", name: "Interior · DAC 24-72 hs",             price: 290 },
  { id: "pickup",   name: "Retiro en local",                     price: 0   }
];

const PAYMENT_METHODS = [
  { id: "mp",       name: "Mercado Pago",           desc: "Todas las tarjetas · Hasta 12 cuotas sin interés" },
  { id: "transfer", name: "Transferencia bancaria", desc: "10% de descuento en el total" },
  { id: "cash",     name: "Efectivo al retirar",    desc: "Solo retiro en local" }
];

const TRANSFER_DISCOUNT_PERCENT = 10;

const state = {
  shipping: SHIPPING_METHODS[0],
  payment: PAYMENT_METHODS[0]
};

// ── Totales ────────────────────────────────────────────────────
// Aplica primero el descuento por cantidad (2/3+ pares, ya definido
// en cart.js) y, si el método elegido es transferencia, un 10% extra
// sobre lo que queda. Ambos se calculan sobre el subtotal, no el envío.
function computeTotals() {
  const sub = getSubtotal();
  const qtyDiscountPct = getDiscount(getCartQty());

  let discounted = sub;
  let discountAmount = 0;

  if (qtyDiscountPct > 0) {
    const amt = Math.round(discounted * qtyDiscountPct);
    discounted -= amt;
    discountAmount += amt;
  }
  if (state.payment.id === "transfer") {
    const amt = Math.round(discounted * TRANSFER_DISCOUNT_PERCENT / 100);
    discounted -= amt;
    discountAmount += amt;
  }

  const shipping = state.shipping.price;
  return { sub, shipping, discountAmount, total: discounted + shipping };
}

// ── Render resumen ───────────────────────────────────────────────
function renderSummary() {
  const linesEl = document.getElementById("checkout-lines");
  const { sub, shipping, discountAmount, total } = computeTotals();

  linesEl.innerHTML = cart.map(item => `
    <div class="checkout-line">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <div class="checkout-line-name">${item.name}</div>
        <div class="checkout-line-meta">
          Talle ${item.size} · ${item.purchaseType === "stock" ? "En stock" : "Por encargue"} · x${item.qty}
        </div>
      </div>
      <div class="checkout-line-price">$${(item.price * item.qty).toLocaleString("es-UY")}</div>
    </div>
  `).join("");

  document.getElementById("checkout-subtotal").textContent = `$${sub.toLocaleString("es-UY")}`;
  document.getElementById("checkout-shipping").textContent = shipping === 0 ? "Gratis" : `$${shipping.toLocaleString("es-UY")}`;
  document.getElementById("checkout-total").textContent = `$${total.toLocaleString("es-UY")}`;

  const discountRow = document.getElementById("checkout-discount-row");
  if (discountAmount > 0) {
    discountRow.hidden = false;
    document.getElementById("checkout-discount").textContent = `-$${discountAmount.toLocaleString("es-UY")}`;
  } else {
    discountRow.hidden = true;
  }
}

// ── Render métodos de envío / pago ───────────────────────────────
function renderShipping() {
  document.getElementById("checkout-shipping-list").innerHTML = SHIPPING_METHODS.map((s, i) => `
    <label class="checkout-radio">
      <input type="radio" name="shipping" value="${s.id}" ${i === 0 ? "checked" : ""}>
      <div class="checkout-radio-body">
        <div>
          <div class="checkout-radio-name">${s.name}</div>
          <div class="checkout-radio-desc">Entrega estimada según zona</div>
        </div>
        <div class="checkout-radio-price">${s.price === 0 ? "Gratis" : "$" + s.price.toLocaleString("es-UY")}</div>
      </div>
    </label>
  `).join("");

  document.querySelectorAll('input[name="shipping"]').forEach(input => {
    input.addEventListener("change", () => {
      state.shipping = SHIPPING_METHODS.find(s => s.id === input.value);
      updateRadioSelection();
      renderSummary();
    });
  });
  updateRadioSelection();
}

function renderPayment() {
  document.getElementById("checkout-payment-list").innerHTML = PAYMENT_METHODS.map((p, i) => `
    <label class="checkout-radio">
      <input type="radio" name="payment" value="${p.id}" ${i === 0 ? "checked" : ""}>
      <div class="checkout-radio-body">
        <div>
          <div class="checkout-radio-name">${p.name}</div>
          <div class="checkout-radio-desc">${p.desc}</div>
        </div>
      </div>
    </label>
  `).join("");

  document.querySelectorAll('input[name="payment"]').forEach(input => {
    input.addEventListener("change", () => {
      state.payment = PAYMENT_METHODS.find(p => p.id === input.value);
      updateRadioSelection();
      renderSummary();
      updateSubmitLabel();
    });
  });
  updateRadioSelection();
  updateSubmitLabel();
}

// Marca visualmente la opción elegida (además del :checked nativo,
// para que se vea bien en cualquier navegador).
function updateRadioSelection() {
  document.querySelectorAll(".checkout-radio").forEach(label => {
    const input = label.querySelector("input");
    label.classList.toggle("is-selected", input.checked);
  });
}

function updateSubmitLabel() {
  const btn = document.getElementById("checkout-submit");
  btn.textContent = state.payment.id === "mp" ? "Pagar con Mercado Pago" : "Confirmar pedido";
}

// ── Validación ────────────────────────────────────────────────────
function validateForm() {
  const form = document.getElementById("checkout-form");
  let valid = true;

  form.querySelectorAll(".form-field").forEach(f => f.classList.remove("error"));

  ["email", "name", "phone", "address", "city", "state"].forEach(name => {
    const input = form.querySelector(`[name="${name}"]`);
    if (!input || !input.value.trim()) {
      input?.closest(".form-field")?.classList.add("error");
      valid = false;
    }
  });

  const emailInput = form.querySelector('[name="email"]');
  if (emailInput?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
    emailInput.closest(".form-field")?.classList.add("error");
    valid = false;
  }

  return valid;
}

// ── Mercado Pago ──────────────────────────────────────────────────
async function requestMPPreference(orderData) {
  const res = await fetch("/api/create-preference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.init_point) {
    throw new Error(data.error || "No se pudo iniciar el pago con Mercado Pago.");
  }
  return data.init_point;
}

// ── Transferencia / efectivo: se avisan por WhatsApp ────────────────
function buildOrderWhatsAppMessage(orderData) {
  const { customer, items, shipping, payment, total } = orderData;
  const itemsList = items.map(i =>
    `${formatItemLabel(i.brand, i.name)} talle ${i.size}${i.qty > 1 ? ` x${i.qty}` : ""}`
  ).join(", ");

  return `Hola! Hice un pedido en la web (${orderData.orderNumber}).\n` +
    `Productos: ${itemsList}.\n` +
    `Envío: ${shipping.name}.\n` +
    `Pago: ${payment.name}.\n` +
    `Total: $${total.toLocaleString("es-UY")} UYU.\n` +
    `Nombre: ${customer.name}. Tel: ${customer.phone}.\n` +
    `Dirección: ${customer.address}, ${customer.city}, ${customer.state}.`;
}

function confirmOrder(orderData) {
  cart = [];
  saveCart();
  updateCartBadge();

  document.getElementById("checkout-layout").hidden = true;
  document.getElementById("order-confirmed").hidden = false;
  document.getElementById("order-number").textContent = orderData.orderNumber;

  // No hay backend propio para registrar el pedido: WhatsApp es el
  // canal real por el que el pedido llega al vendedor.
  const waNumber = `598${WA_NUMBER.replace(/^0/, "")}`;
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(buildOrderWhatsAppMessage(orderData))}`;
  window.open(waUrl, "_blank");

  // Confirmación real de la orden: para transferencia/efectivo no hay
  // pasarela externa que la confirme después, así que el Purchase se
  // registra acá. Para Mercado Pago se registra solo en pago-retorno.html,
  // una vez que el pago está aprobado.
  trackEvent("Purchase", { value: orderData.total, currency: "UYU", num_items: getCartQty() });
}

// ── Submit ────────────────────────────────────────────────────────
async function handleSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const form = document.getElementById("checkout-form");
  const customer = Object.fromEntries(new FormData(form).entries());
  const { sub, discountAmount, total } = computeTotals();
  const orderNumber = "BA-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  const orderData = {
    orderNumber,
    customer,
    items: cart,
    shipping: state.shipping,
    payment: state.payment,
    subtotal: sub,
    discountAmount,
    total,
    createdAt: new Date().toISOString()
  };

  const btn = document.getElementById("checkout-submit");
  btn.disabled = true;
  btn.textContent = "Procesando…";

  try {
    if (state.payment.id === "mp") {
      const initPoint = await requestMPPreference(orderData);
      window.location.href = initPoint;
      return;
    }
    confirmOrder(orderData);
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    updateSubmitLabel();
    showToast("No se pudo iniciar el pago. Probá de nuevo o escribinos por WhatsApp.");
  }
}

// ── Toast (checkout.html no carga script.js, así que va acá) ──────
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove("show"), 4000);
}

// ── Init ──────────────────────────────────────────────────────────
function showEmptyState() {
  document.getElementById("checkout-layout").hidden = true;
  document.getElementById("checkout-empty").hidden = false;
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();

  if (cart.length === 0) {
    showEmptyState();
    return;
  }

  renderShipping();
  renderPayment();
  renderSummary();
  document.getElementById("checkout-form").addEventListener("submit", handleSubmit);

  trackEvent("InitiateCheckout", {
    value: getTotal(),
    currency: "UYU",
    num_items: getCartQty()
  });
});
