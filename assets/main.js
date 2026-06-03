
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

  const openMenu = () => {
    panel.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    backdrop.hidden = false;
    document.documentElement.style.overflow = "hidden";
    // Move foco para o primeiro item interativo do menu
    const firstLink = panel.querySelector("a, button");
    if (firstLink) firstLink.focus();
  };

  const closeMenu = () => {
    panel.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    backdrop.hidden = true;
    document.documentElement.style.overflow = "";
    // Devolve foco ao botão que abriu o menu
    toggle.focus();
  };

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    expanded ? closeMenu() : openMenu();
  });

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
