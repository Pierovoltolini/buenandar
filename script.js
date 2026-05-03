/* ===================================
   CONECTATEC.UY — SCRIPT
   Lógica pura — sin productos hardcodeados
   =================================== */

const WA_NUMBER = "59892275155";
const WA_GENERAL_MSG = encodeURIComponent("Hola, estaba navegando en tu web de Conectatec y estoy interesado en tus productos, ¿me podrías ayudar?");
const WA_BASE_URL = `https://wa.me/${WA_NUMBER}`;

// WhatsApp SVG inline
const WA_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

const ARROW_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;

/* === DOM REFS === */
const hamburger   = document.getElementById('hamburger');
const mobileMenu  = document.getElementById('mobileMenu');
const searchBtn   = document.getElementById('searchBtn');
const searchOverlay = document.getElementById('searchOverlay');
const searchInput = document.getElementById('searchInput');
const searchClose = document.getElementById('searchClose');
const featuredGrid   = document.getElementById('featuredGrid');
const bestsellerStrip = document.getElementById('bestsellerStrip');
const shopGrid    = document.getElementById('shopGrid');
const shopCount   = document.getElementById('shopCount');
const filterChips = document.querySelectorAll('.filter-chip');
const navLinks    = document.querySelectorAll('[data-page]');
const pages       = document.querySelectorAll('.page');

/* === STATE === */
let currentPage = 'home';
let activeFilter = 'all';
let searchQuery  = '';

/* === PAGE NAV === */
function showPage(id) {
  pages.forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + id);
  if (target) {
    target.classList.add('active');
    currentPage = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  closeMenu();
}

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.dataset.page;
    if (page) showPage(page);
  });
});

/* === MENU === */
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  mobileMenu.classList.toggle('open');
  document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
});

function closeMenu() {
  hamburger.classList.remove('active');
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}

/* === SEARCH === */
searchBtn && searchBtn.addEventListener('click', () => {
  searchOverlay.classList.toggle('open');
  if (searchOverlay.classList.contains('open')) searchInput.focus();
});

searchClose && searchClose.addEventListener('click', () => {
  searchOverlay.classList.remove('open');
  searchInput.value = '';
  searchQuery = '';
});

searchInput && searchInput.addEventListener('input', e => {
  searchQuery = e.target.value.toLowerCase().trim();
  if (searchQuery.length > 0) {
    showPage('shop');
    renderShop();
  }
});

searchInput && searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    searchOverlay.classList.remove('open');
    showPage('shop');
    renderShop();
  }
});

/* === WHATSAPP HELPERS === */
function waProductUrl(productName) {
  const msg = encodeURIComponent(
    `Hola, estaba navegando en tu web de Conectatec y estoy interesado en el producto ${productName}, ¿me podrías ayudar?`
  );
  return `${WA_BASE_URL}?text=${msg}`;
}

function waGeneralUrl() {
  return `${WA_BASE_URL}?text=${WA_GENERAL_MSG}`;
}

/* Float WA button */
document.querySelectorAll('.wsp-float, .btn-wsp-general').forEach(el => {
  el.href = waGeneralUrl();
});

/* === CARD BUILDER === */
function buildCard(product, size = 'normal') {
  const badgeHTML = product.bestSeller
    ? `<div class="product-card-badge">Más vendido</div>`
    : product.featured
    ? `<div class="product-card-badge">Destacado</div>`
    : '';

  const card = document.createElement('article');
  card.className = 'product-card reveal';
  card.innerHTML = `
    <div class="product-card-image">
      <img src="${product.image}" alt="${product.name}" loading="lazy">
      ${badgeHTML}
    </div>

    <div class="product-card-body">
      <p class="product-card-sub">${product.subcategory}</p>
      <h3 class="product-card-name">${product.name}</h3>
      <p class="product-card-desc">${product.description}</p>
      <p class="product-card-price"><span>UYU</span>${product.price.toLocaleString('es-UY')}</p>


      <button class="btn-whatsapp open-product" type="button">
        Ver producto
      </button>
    </div>
  `;

  card.querySelector('.open-product').addEventListener('click', () => openProductModal(product));

  return card;
}
function openProductModal(product) {
  const oldModal = document.querySelector('.product-modal-overlay');
  if (oldModal) oldModal.remove();

  const images = product.images && product.images.length ? product.images : [product.image];

  const modal = document.createElement('div');
  modal.className = 'product-modal-overlay';

  modal.innerHTML = `
    <div class="product-modal">
      <button class="product-modal-close" type="button">×</button>

      <div class="product-modal-gallery">
        <div class="product-modal-main-image">
          <img src="${images[0]}" alt="${product.name}" id="modalMainImage">
        </div>

        <div class="product-modal-thumbs">
          ${images.map((img, index) => `
            <button class="product-thumb ${index === 0 ? 'active' : ''}" type="button" data-img="${img}">
              <img src="${img}" alt="${product.name}">
            </button>
          `).join('')}
        </div>
      </div>

      <div class="product-modal-info">
        <p class="product-modal-category">${product.subcategory}</p>
        <h2>${product.name}</h2>

        <div class="product-modal-stock">EN STOCK</div>

        <p class="product-modal-price">$ ${product.price.toLocaleString('es-UY')}</p>

        <p class="product-modal-description">${product.description}</p>

        <div class="product-modal-box">
          <p class="product-modal-label">ENVÍOS Y ENTREGA</p>
          <ul>
            <li>Envíos a todo el país</li>
            <li>Coordiná entrega o retiro</li>
            <li>Consultá tiempos y costos por WhatsApp</li>
          </ul>
        </div>

        <div class="product-modal-box">
          <p class="product-modal-label">MEDIOS DE PAGO</p>
          <ul>
            <li>Efectivo</li>
            <li>Transferencia</li>
          </ul>
        </div>

        <a class="product-modal-btn" href="${waProductUrl(product.name)}" target="_blank" rel="noopener noreferrer">
          ${WA_ICON} LO QUIERO COMPRAR YA
        </a>

        <p class="product-modal-note">Te contactaremos por WhatsApp</p>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  modal.querySelector('.product-modal-close').addEventListener('click', closeProductModal);

  modal.addEventListener('click', e => {
    if (e.target === modal) closeProductModal();
  });

  const mainImage = modal.querySelector('#modalMainImage');
  const thumbs = modal.querySelectorAll('.product-thumb');

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      mainImage.src = thumb.dataset.img;
    });
  });
}

function closeProductModal() {
  const modal = document.querySelector('.product-modal-overlay');
  if (modal) modal.remove();
  document.body.style.overflow = '';
}
/* === RENDER FEATURED === */
function renderFeatured() {
  if (!featuredGrid) return;
  featuredGrid.innerHTML = '';
  const featured = products.filter(p => p.featured).slice(0, 3);
  featured.forEach(p => featuredGrid.appendChild(buildCard(p)));
}

/* === RENDER BEST SELLERS === */
function renderBestSellers() {
  if (!bestsellerStrip) return;
  bestsellerStrip.innerHTML = '';
  const bs = products.filter(p => p.bestSeller).slice(0, 4);
  bs.forEach(p => bestsellerStrip.appendChild(buildCard(p)));
}

/* === RENDER SHOP === */
function renderShop() {
  if (!shopGrid) return;
  shopGrid.innerHTML = '';

  let filtered = [...products];

  if (activeFilter !== 'all') {
    filtered = filtered.filter(p =>
      p.subcategory === activeFilter || p.category === activeFilter
    );
  }

  if (searchQuery) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchQuery) ||
      p.description.toLowerCase().includes(searchQuery) ||
      p.subcategory.toLowerCase().includes(searchQuery)
    );
  }

  if (shopCount) {
    shopCount.textContent = `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`;
  }

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `<p>No se encontraron productos.</p>`;
    shopGrid.appendChild(empty);
    return;
  }

  filtered.forEach(p => shopGrid.appendChild(buildCard(p)));
  observeReveal();
}

/* === FILTERS === */
filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    renderShop();
  });
});

/* === SCROLL REVEAL === */
function observeReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* === HERO CTA → SHOP === */
document.querySelectorAll('.go-shop').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    showPage('shop');
  });
});

/* === INIT === */
function init() {
  renderFeatured();
  renderBestSellers();
  renderShop();
  showPage('home');
  observeReveal();
}

document.addEventListener('DOMContentLoaded', init);
