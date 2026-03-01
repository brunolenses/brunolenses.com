/* ============================================
   B LENSES — WEDDING PORTFOLIO
   Interactive Scripts
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initScrollAnimations();
  initBudgetCalculator();
  initSmoothScroll();
  loadSiteConfig();
  loadDynamicPortfolio();
  loadDynamicAboutPhoto();
  loadDynamicHeroVideo();
});

/* ---- SITE CONFIG (fonts, text, whatsapp) ---- */
async function loadSiteConfig() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/site_config?select=key,value`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const data = await res.json();
    if (!data || !data.length) return;

    const cfg = {};
    data.forEach(r => cfg[r.key] = r.value);

    // Fonts
    if (cfg.font_heading) {
      loadGFont(cfg.font_heading);
      document.documentElement.style.setProperty('--font-heading', `'${cfg.font_heading}', serif`);
    }
    if (cfg.font_body) {
      loadGFont(cfg.font_body);
      document.documentElement.style.setProperty('--font-body', `'${cfg.font_body}', sans-serif`);
    }

    // Hero text
    const badge = document.querySelector('.hero-badge');
    const line1 = document.querySelector('.hero-line-1');
    const line2 = document.querySelector('.hero-line-2');
    const desc = document.querySelector('.hero-description');
    if (badge && cfg.hero_badge) badge.textContent = cfg.hero_badge;
    if (line1 && cfg.hero_line1) line1.textContent = cfg.hero_line1;
    if (line2 && cfg.hero_line2) line2.textContent = cfg.hero_line2;
    if (desc && cfg.hero_description) desc.textContent = cfg.hero_description;

    // WhatsApp
    if (cfg.whatsapp) {
      document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
        a.href = `https://wa.me/${cfg.whatsapp}`;
      });
    }
  } catch (err) {
    console.log('Site config: using defaults', err);
  }
}

function loadGFont(name) {
  const id = 'gf-' + name.replace(/\s+/g, '-');
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id; link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

/* ---- SUPABASE CONFIG ---- */
const SUPABASE_URL = 'https://pqeqccbtqrmsvivnisuc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZXFjY2J0cXJtc3Zpdm5pc3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODM0ODksImV4cCI6MjA4Nzk1OTQ4OX0.9AHXafOxSKYW0rtaXQcSoNakpM5cdf9bQ_P6d_5nhi0';
const BUCKET = 'portfolio';
const CATEGORY = 'wedding';

function storageUrl(path) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function supabaseQuery(table, filters) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?${filters}`;
  try {
    const res = await fetch(url, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    return await res.json();
  } catch (err) {
    console.log('Supabase query failed:', err);
    return [];
  }
}

/* ---- DYNAMIC PORTFOLIO ---- */
async function loadDynamicPortfolio() {
  try {
    const items = await supabaseQuery('portfolio_items',
      `category=eq.${CATEGORY}&item_type=eq.portfolio&order=sort_order`);
    if (!items || !items.length) return;

    const grid = document.querySelector('.portfolio-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const ratioStyleMap = {
      wide: 'aspect-ratio: 2 / 1;',
      landscape: 'aspect-ratio: 4 / 3;',
      square: 'aspect-ratio: 1;',
      portrait: 'aspect-ratio: 3 / 4;'
    };

    items.forEach((item, i) => {
      const url = storageUrl(item.file_path);
      const isWide = item.ratio === 'wide';
      const posX = item.pos_x !== undefined ? item.pos_x : 50;
      const posY = item.pos_y !== undefined ? item.pos_y : 50;
      const div = document.createElement('div');
      div.className = `portfolio-item ${isWide ? 'portfolio-wide' : ''} anim-reveal`;
      div.style.cssText = ratioStyleMap[item.ratio] || '';
      div.innerHTML = `<img src="${url}" alt="Portfólio B Lenses" loading="lazy" style="width:100%;height:100%;object-fit:cover;object-position:${posX}% ${posY}%;border-radius:inherit;">`;
      if (i > 0) div.dataset.delay = i * 100;
      grid.appendChild(div);
    });

    initScrollAnimations();
  } catch (err) {
    console.log('Portfolio: using static placeholders', err);
  }
}

/* ---- DYNAMIC ABOUT PHOTO ---- */
async function loadDynamicAboutPhoto() {
  try {
    const items = await supabaseQuery('portfolio_items',
      `category=eq.${CATEGORY}&item_type=eq.about_photo&limit=1`);
    if (!items || !items.length) return;

    const placeholder = document.querySelector('.about-image-placeholder');
    if (!placeholder) return;

    const url = storageUrl(items[0].file_path);
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Bruno Lopes — B Lenses';
    img.loading = 'lazy';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    placeholder.replaceWith(img);
  } catch (err) {
    console.log('About photo: using placeholder', err);
  }
}

/* ---- DYNAMIC HERO VIDEO ---- */
async function loadDynamicHeroVideo() {
  try {
    const items = await supabaseQuery('portfolio_items',
      `category=eq.${CATEGORY}&item_type=eq.hero_video&limit=1`);
    if (!items || !items.length) return;

    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg) return;

    const url = storageUrl(items[0].file_path);
    const video = document.createElement('video');
    video.src = url;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;';
    heroBg.insertBefore(video, heroBg.firstChild);
  } catch (err) {
    console.log('Hero video: using default background', err);
  }
}


/* ---- MOBILE MENU ---- */
function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', menu.classList.contains('open'));
  });

  // Close mobile menu when clicking nav links
  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
    });
  });
}

/* ---- SCROLL ANIMATIONS ---- */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.anim-reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger the animation slightly for grid items
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach((el, i) => {
    // Auto-stagger siblings in grids
    const parent = el.parentElement;
    if (parent) {
      const siblings = [...parent.children].filter(c => c.classList.contains('anim-reveal'));
      const idx = siblings.indexOf(el);
      if (idx > 0) {
        el.dataset.delay = idx * 100;
      }
    }
    observer.observe(el);
  });
}

/* ---- BUDGET CALCULATOR ---- */
function initBudgetCalculator() {
  const state = {
    photographers: 2,
    videomakers: 0,
    storymakers: 0,
    drone: false,
    website: false,
    trends: 0
  };

  const prices = {
    photographers: 1500,
    videomakers: 2000,
    storymakers: 600,
    drone: 600,
    website: 500,
    trends: 200
  };

  const minimums = {
    photographers: 2,
    videomakers: 2,
    storymakers: 1
  };

  const maxValues = {
    photographers: 6,
    videomakers: 6,
    storymakers: 4,
    trends: 10
  };

  // Counter buttons
  document.querySelectorAll('.counter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      const action = btn.dataset.action;
      const min = minimums[target] || 0;
      const max = maxValues[target] || 10;

      if (action === 'increase') {
        if (state[target] === 0 && minimums[target]) {
          // Jump to minimum when enabling
          state[target] = minimums[target];
        } else if (state[target] < max) {
          state[target]++;
        }
      } else if (action === 'decrease') {
        if (minimums[target] && state[target] === minimums[target]) {
          // Allow going to 0 (disabling the service)
          state[target] = 0;
        } else if (state[target] > 0) {
          state[target]--;
        }
      }

      document.getElementById(target).textContent = state[target];
      updateBudget();
    });
  });

  // Toggle checkboxes
  document.getElementById('drone')?.addEventListener('change', (e) => {
    state.drone = e.target.checked;
    updateBudget();
  });

  document.getElementById('website')?.addEventListener('change', (e) => {
    state.website = e.target.checked;
    updateBudget();
  });

  function updateBudget() {
    let total = 0;
    const breakdown = [];

    if (state.photographers > 0) {
      const val = state.photographers * prices.photographers;
      total += val;
      breakdown.push({ label: `${state.photographers}x Fotógrafo`, value: val });
    }

    if (state.videomakers > 0) {
      const val = state.videomakers * prices.videomakers;
      total += val;
      breakdown.push({ label: `${state.videomakers}x Videomaker`, value: val });
    }

    if (state.storymakers > 0) {
      const val = state.storymakers * prices.storymakers;
      total += val;
      breakdown.push({ label: `${state.storymakers}x Storymaker`, value: val });
    }

    if (state.drone) {
      total += prices.drone;
      breakdown.push({ label: 'Drone', value: prices.drone });
    }

    if (state.website) {
      total += prices.website;
      breakdown.push({ label: 'Site dos noivos', value: prices.website });
    }

    if (state.trends > 0) {
      const val = state.trends * prices.trends;
      total += val;
      breakdown.push({ label: `${state.trends}x Trend`, value: val });
    }

    // Update breakdown
    const breakdownEl = document.getElementById('budgetBreakdown');
    if (breakdownEl) {
      if (breakdown.length === 0) {
        breakdownEl.innerHTML = '<div class="breakdown-item"><span>Selecione os serviços acima</span><span>—</span></div>';
      } else {
        breakdownEl.innerHTML = breakdown.map(item =>
          `<div class="breakdown-item">
            <span>${item.label}</span>
            <span>R$ ${item.value.toLocaleString('pt-BR')}</span>
          </div>`
        ).join('');
      }
    }

    // Update total
    const totalEl = document.getElementById('budgetTotal');
    if (totalEl) {
      totalEl.textContent = `R$ ${total.toLocaleString('pt-BR')}`;
    }

    // Update WhatsApp link with budget info
    const whatsappBtn = document.querySelector('.budget-total .btn-primary');
    if (whatsappBtn) {
      let msg = `Olá! Gostaria de fechar meu orçamento de casamento:\n\n`;
      breakdown.forEach(item => {
        msg += `• ${item.label}: R$ ${item.value.toLocaleString('pt-BR')}\n`;
      });
      msg += `\nTotal estimado: R$ ${total.toLocaleString('pt-BR')}`;
      whatsappBtn.href = `https://wa.me/5515999999999?text=${encodeURIComponent(msg)}`;
    }
  }

  // Initial calculation
  updateBudget();
}

/* ---- SMOOTH SCROLL ---- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const offset = 100; // Account for fixed nav
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}
