// ============================================================
//  BuenAndar.uy — cart-page.js
//  Inicialización específica de carrito.html.
//  El estado y la lógica del carrito viven en cart.js (compartido
//  con el mini carrito de index.html) — no se duplica nada acá.
// ============================================================

window.addEventListener("scroll", () => {
  const header = document.getElementById("header");
  if (header) header.classList.toggle("scrolled", window.scrollY > 10);
});

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

const pageCheckoutBtn = document.getElementById("pageCheckoutBtn");
if (pageCheckoutBtn) {
  pageCheckoutBtn.addEventListener("click", () => startCheckout(pageCheckoutBtn));
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  registerCartUI({
    items: "pageCartItems",
    subtotal: "pageCartSubtotal",
    discount: "pageCartDiscount",
    total: "pageCartTotal",
    banner: "pageCartDiscountBanner",
    mixedBanner: "pageCartMixedBanner",
    checkoutBtn: "pageCheckoutBtn"
  });
});
