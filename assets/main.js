
function getFocusable(container) {
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  );
}

/** Cria um focus trap: Tab/Shift+Tab ficam dentro do container */
function createFocusTrap(container) {
  function handler(e) {
    if (e.key !== "Tab") return;
    const focusable = getFocusable(container);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  return {
    activate() { container.addEventListener("keydown", handler); },
    deactivate() { container.removeEventListener("keydown", handler); },
  };
}

// ── Header: scroll elevation ───────────────────────────────────────────────────
(() => {
  const header = document.querySelector(".header[data-elevate]");
  if (!header) return;

  // Respeita prefers-reduced-motion: desativa smooth scroll
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.style.scrollBehavior = "auto";
  }

  let ticking = false;
  const setScrolled = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    ticking = false;
  };
  setScrolled();

  // rAF como debounce: no máximo 1 update por frame
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(setScrolled);
        ticking = true;
      }
    },
    { passive: true }
  );
})();

// ── Nav mobile ────────────────────────────────────────────────────────────────
(() => {
  const toggle = document.querySelector(".nav__toggle");
  const panel = document.querySelector(".nav__panel");
  const backdrop = document.querySelector("[data-backdrop]");
  const links = document.querySelectorAll(".nav__link");

  if (!toggle || !panel || !backdrop) return;

  const closeBtn = panel.querySelector(".nav__close");

  const openMenu = () => {
    panel.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(() => {
      const target = closeBtn || panel.querySelector("a, button");
      if (target) target.focus();
    });
  };

  const closeMenu = () => {
    panel.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    backdrop.hidden = true;
    document.documentElement.style.overflow = "";
    toggle.focus();
  };

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    expanded ? closeMenu() : openMenu();
  });

  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  backdrop.addEventListener("click", closeMenu);

  links.forEach((a) => {
    a.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 640px)").matches) closeMenu();
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
})();

// ── Lightbox ──────────────────────────────────────────────────────────────────
(() => {
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightboxImg");
  const lbTitle = document.getElementById("lightboxTitle");

  if (!lb || !lbImg || !lbTitle) return;

  const panel = lb.querySelector(".lightbox__panel");
  const trap = createFocusTrap(panel);
  let triggerEl = null;

  const open = (src, title, alt, trigger) => {
    triggerEl = trigger || null;
    lbImg.src = src;
    lbImg.alt = alt || title || "Foto";
    lbTitle.textContent = title || "";
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    trap.activate();
    // Foca o botão fechar quando o modal abrir
    requestAnimationFrame(() => {
      const closeBtn = lb.querySelector("[data-lb-close]");
      if (closeBtn) closeBtn.focus();
    });
  };

  const close = () => {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    trap.deactivate();
    // Restaura foco ao elemento que abriu o lightbox
    if (triggerEl) { triggerEl.focus(); triggerEl = null; }
    setTimeout(() => {
      lbImg.src = "";
      lbImg.alt = "";
      lbTitle.textContent = "";
    }, 180);
  };

  document.addEventListener("click", (e) => {
    const item = e.target.closest(".gItem");
    if (item) {
      const src = item.getAttribute("data-full") || item.querySelector("img")?.src;
      const title = item.getAttribute("data-title") || "";
      const alt = item.querySelector("img")?.alt || title;
      if (src) open(src, title, alt, item);
      return;
    }
    if (e.target.closest("[data-lb-close]")) close();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lb.classList.contains("is-open")) close();
  });
})();

// ── Polaroid Carousel ─────────────────────────────────────────────────────────
(() => {
  const gallery = document.querySelector('.gallery[aria-label="Galeria de fotos"]');
  if (!gallery) return;

  const items = Array.from(gallery.querySelectorAll('.gItem'));
  if (!items.length) return;

  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  const n = items.length;
  let active = 0;

  const cfg = () => {
    const mob = window.matchMedia('(max-width: 640px)').matches;
    return { x: mob ? 115 : 188, y: mob ? 12 : 20, rot: mob ? 9 : 11, sc: 0.11, max: 2 };
  };

  const update = () => {
    const { x, y, rot, sc, max } = cfg();
    items.forEach((item, i) => {
      let d = i - active;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      const a = Math.abs(d);
      item.style.transform = `translateX(-50%) translateY(-50%) translateX(${d * x}px) translateY(${a * y}px) rotate(${d * rot}deg) scale(${Math.max(0.6, 1 - a * sc)})`;
      item.style.opacity   = a > max ? 0 : Math.max(0.3, 1 - a * 0.22);
      item.style.zIndex    = 10 - a;
      item.style.pointerEvents = a > max ? 'none' : 'auto';
      item.dataset.active  = a === 0 ? 'true' : 'false';
    });
  };

  // Clicar no card ativo abre lightbox; clicar em outro navega até ele
  items.forEach((item, i) => {
    item.addEventListener('click', (e) => {
      if (i !== active) {
        e.stopPropagation();
        active = i;
        update();
      }
    });
  });

  prevBtn?.addEventListener('click', () => { active = (active - 1 + n) % n; update(); });
  nextBtn?.addEventListener('click', () => { active = (active + 1) % n; update(); });

  // Swipe touch
  let tx0 = 0;
  gallery.addEventListener('touchstart', e => { tx0 = e.touches[0].clientX; }, { passive: true });
  gallery.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx0;
    if (Math.abs(dx) > 48) { active = dx < 0 ? (active + 1) % n : (active - 1 + n) % n; update(); }
  });

  update();
})();
