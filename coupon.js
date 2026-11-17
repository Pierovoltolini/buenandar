// ============================================================
//  BuenAndar.uy — coupon.js
//  Cupón de bienvenida de $300: barra superior, ventana de
//  registro (nombre completo, email, celular) y botón flotante.
//  El registro se guarda en la planilla vía /api/registro.
//  Se carga en index, carrito y checkout.
// ============================================================

const BA_COUPON = (() => {
  const AMOUNT = 300;
  const KEY_CODE = "ba_cupon";
  const KEY_DISMISS = "ba_cupon_cerrado";
  const DISMISS_DAYS = 3;
  const WA = "59894990760";

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} }
  };

  const getCode = () => store.get(KEY_CODE);
  const params = new URLSearchParams(location.search);
  const fromInstagram = /instagram|ig/i.test(params.get("utm_source") || "") || params.has("cupon") || location.hash === "#cupon";
  const origin = fromInstagram ? "instagram" : (params.get("utm_source") || "web");

  const money = n => "$" + Number(n).toLocaleString("es-UY");

  function waLink(code) {
    const msg = `Hola, me registré en la web y quiero usar mi cupón ${code} de ${money(AMOUNT)}.`;
    return `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  }

  // ── Barra superior ────────────────────────────────────────
  function renderBar() {
    const bar = document.createElement("button");
    bar.type = "button";
    bar.className = "coupon-bar";
    bar.id = "couponBar";
    bar.addEventListener("click", () => open("barra"));
    document.body.prepend(bar);
    updateBar();
  }

  function updateBar() {
    const bar = document.getElementById("couponBar");
    if (!bar) return;
    const code = getCode();
    bar.innerHTML = code
      ? `🎁 Tu cupón <strong>${code}</strong> · ${money(AMOUNT)} en tu primera compra`
      : `🎁 Registrate y llevate <strong>${money(AMOUNT)} de regalo</strong> para tu primera compra <span class="coupon-bar-cta">Quiero mi cupón →</span>`;
  }

  // ── Botón flotante ────────────────────────────────────────
  function renderPill() {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "coupon-pill";
    pill.id = "couponPill";
    pill.addEventListener("click", () => open("flotante"));
    document.body.appendChild(pill);
    updatePill();
  }

  function updatePill() {
    const pill = document.getElementById("couponPill");
    if (!pill) return;
    const code = getCode();
    pill.innerHTML = code ? `🎁 ${code}` : `🎁 ${money(AMOUNT)} para vos`;
  }

  // ── Ventana de registro ───────────────────────────────────
  function renderModal() {
    const wrap = document.createElement("div");
    wrap.className = "coupon-overlay";
    wrap.id = "couponOverlay";
    wrap.innerHTML = `
      <div class="coupon-modal" role="dialog" aria-modal="true" aria-labelledby="couponTitle">
        <button type="button" class="coupon-close" aria-label="Cerrar">✕</button>

        <div class="coupon-step" id="couponForm">
          <div class="coupon-ticket">
            <span class="coupon-ticket-amount">${money(AMOUNT)}</span>
            <span class="coupon-ticket-text">de regalo</span>
          </div>
          <h2 class="coupon-title" id="couponTitle">Bienvenido a BuenAndar</h2>
          <p class="coupon-sub">Registrate en 20 segundos y te regalamos un cupón de ${money(AMOUNT)} para tu primera compra. Vale para zapatillas, ropa y lentes.</p>
          <form id="couponFormEl" novalidate>
            <label class="coupon-field">
              <span>Nombre completo</span>
              <input name="nombre" type="text" autocomplete="name" placeholder="Ej: Martina Pérez" required>
            </label>
            <label class="coupon-field">
              <span>Gmail</span>
              <input name="email" type="email" autocomplete="email" inputmode="email" placeholder="tuemail@gmail.com" required>
            </label>
            <label class="coupon-field">
              <span>Celular</span>
              <input name="celular" type="tel" autocomplete="tel" inputmode="tel" placeholder="099 123 456" required>
            </label>
            <input name="website" type="text" class="coupon-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
            <p class="coupon-error" id="couponError" role="alert"></p>
            <button type="submit" class="coupon-submit" id="couponSubmit">Quiero mi cupón de ${money(AMOUNT)}</button>
            <p class="coupon-legal">Un cupón por persona, válido en tu primera compra. Te escribimos solo para novedades de BuenAndar.</p>
          </form>
        </div>

        <div class="coupon-step" id="couponDone" hidden>
          <div class="coupon-check">✓</div>
          <h2 class="coupon-title">Listo, tu cupón ya es tuyo</h2>
          <p class="coupon-sub">Usalo en tu primera compra: se descuenta al finalizar el pedido o si nos escribís por WhatsApp.</p>
          <button type="button" class="coupon-code" id="couponCode" title="Copiar código"></button>
          <span class="coupon-copy-hint" id="couponCopyHint">Tocá el código para copiarlo</span>
          <a class="coupon-submit coupon-wa" id="couponWa" target="_blank" rel="noopener">Usarlo por WhatsApp</a>
          <button type="button" class="coupon-secondary" id="couponKeep">Seguir mirando productos</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);

    wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
    wrap.querySelector(".coupon-close").addEventListener("click", close);
    wrap.querySelector("#couponKeep").addEventListener("click", close);
    wrap.querySelector("#couponFormEl").addEventListener("submit", submit);
    wrap.querySelector("#couponCode").addEventListener("click", copyCode);
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  }

  function showDone(code) {
    document.getElementById("couponForm").hidden = true;
    document.getElementById("couponDone").hidden = false;
    document.getElementById("couponCode").textContent = code;
    document.getElementById("couponWa").href = waLink(code);
  }

  function open(source) {
    const overlay = document.getElementById("couponOverlay");
    if (!overlay) return;
    const code = getCode();
    if (code) showDone(code);
    overlay.classList.add("open");
    document.body.classList.add("coupon-lock");
    if (typeof trackEvent === "function") trackEvent("ViewContent", { content_name: "Cupon 300 - " + source });
  }

  function close() {
    const overlay = document.getElementById("couponOverlay");
    if (!overlay || !overlay.classList.contains("open")) return;
    overlay.classList.remove("open");
    document.body.classList.remove("coupon-lock");
    if (!getCode()) store.set(KEY_DISMISS, String(Date.now()));
  }

  async function copyCode() {
    const code = getCode();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      document.getElementById("couponCopyHint").textContent = "Copiado ✓";
    } catch {
      document.getElementById("couponCopyHint").textContent = code;
    }
  }

  async function submit(e) {
    e.preventDefault();
    const form = e.target;
    const err = document.getElementById("couponError");
    const btn = document.getElementById("couponSubmit");
    const data = Object.fromEntries(new FormData(form).entries());
    err.textContent = "";

    if ((data.nombre || "").trim().split(/\s+/).length < 2) { err.textContent = "Poné tu nombre y apellido"; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((data.email || "").trim())) { err.textContent = "Revisá tu email"; return; }
    if (!/^(\+?598)?0?9\d{7}$/.test((data.celular || "").replace(/[^\d+]/g, ""))) { err.textContent = "Revisá tu celular (ej: 099 123 456)"; return; }

    btn.disabled = true;
    btn.textContent = "Generando tu cupón…";
    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, origen: origin })
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok || !out.cupon) throw new Error(out.error || "No pudimos registrarte ahora");
      store.set(KEY_CODE, out.cupon);
      showDone(out.cupon);
      updateBar();
      updatePill();
      document.dispatchEvent(new CustomEvent("ba:cupon", { detail: out.cupon }));
      if (typeof trackEvent === "function") trackEvent("Lead", { content_name: "Cupon 300", value: AMOUNT, currency: "UYU" });
      else if (typeof fbq === "function") fbq("track", "Lead");
    } catch (ex) {
      err.textContent = ex.message || "No pudimos registrarte ahora. Probá de nuevo.";
      btn.disabled = false;
      btn.textContent = `Quiero mi cupón de ${money(AMOUNT)}`;
    }
  }

  // ── Cuándo se abre solo ───────────────────────────────────
  function autoOpen() {
    if (getCode()) return;
    if (fromInstagram) { setTimeout(() => open("instagram"), 800); return; }
    const last = Number(store.get(KEY_DISMISS) || 0);
    if (Date.now() - last < DISMISS_DAYS * 864e5) return;
    let done = false;
    const trigger = () => { if (done) return; done = true; open("auto"); cleanup(); };
    const onScroll = () => {
      const h = document.documentElement;
      if ((h.scrollTop + innerHeight) / h.scrollHeight > 0.45) trigger();
    };
    const timer = setTimeout(trigger, 15000);
    const cleanup = () => { clearTimeout(timer); removeEventListener("scroll", onScroll); };
    addEventListener("scroll", onScroll, { passive: true });
  }

  function init({ auto = false, pill = true } = {}) {
    renderBar();
    if (pill) renderPill();
    renderModal();
    if (auto) autoOpen();
  }

  return { init, open, getCode, AMOUNT };
})();
