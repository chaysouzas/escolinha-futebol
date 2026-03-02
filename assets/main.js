// assets/main.js
(() => {
  const header = document.querySelector(".header[data-elevate]");
  const toggle = document.querySelector(".nav__toggle");
  const panel = document.querySelector(".nav__panel");
  const backdrop = document.querySelector("[data-backdrop]");
  const links = document.querySelectorAll(".nav__link");

  const setScrolled = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  setScrolled();
  window.addEventListener("scroll", setScrolled, { passive: true });

  const openMenu = () => {
    panel.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    backdrop.hidden = false;
    document.documentElement.style.overflow = "hidden";
  };

  const closeMenu = () => {
    panel.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    backdrop.hidden = true;
    document.documentElement.style.overflow = "";
  };

  if (toggle && panel && backdrop) {
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
  }
})();

(() => {
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightboxImg");
  const lbTitle = document.getElementById("lightboxTitle");

  if (!lb || !lbImg || !lbTitle) return;

  const open = (src, title, alt) => {
    lbImg.src = src;
    lbImg.alt = alt || title || "Foto";
    lbTitle.textContent = title || "";
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
  };

  const close = () => {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    // limpa depois da animação pra não piscar
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
      if (src) open(src, title, alt);
      return;
    }

    if (e.target.matches("[data-lb-close]")) {
      close();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lb.classList.contains("is-open")) close();
  });
})();