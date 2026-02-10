/* ======================================================================
   painel.js — Enhancements para /my/ (Dashboard) + Slideshow
   - Só executa em /my/ (incluindo /my/index.php)
   - Adiciona classe no <body> para escopo de CSS
   - Slideshow: lê URLs do slideshow.info e monta um carrossel responsivo
   ====================================================================== */

(function () {
  var SLIDESHOW_INFO_URL =
    "https://laurorosasneto.github.io/IME_CEJUR_MOODLE/FAMETRO/digital/slideshow.info";

  function isMyPage() {
    try {
      var path = (location && location.pathname) ? location.pathname : "";
      return /^\/my\/?$/.test(path) || /^\/my\/index\.php$/.test(path);
    } catch (e) {
      return false;
    }
  }

  function addBodyScope() {
    if (!document.body) return false;
    document.body.classList.add("fm-my-enhanced");
    return true;
  }

  function closest(el, selector) {
    while (el && el.nodeType === 1) {
      if (el.matches(selector)) return el;
      el = el.parentElement;
    }
    return null;
  }

  function enhanceBlocks(root) {
    if (!root) root = document;

    var blocks = root.querySelectorAll(
      ".block, .block.card, .dashboard-card, .card.dashboard-card"
    );

    for (var i = 0; i < blocks.length; i++) {
      var el = blocks[i];
      if (!el.classList.contains("fm-my-card")) el.classList.add("fm-my-card");

      var header = el.querySelector(".card-header, .block-header, .header");
      if (header && !header.classList.contains("fm-my-card__header")) {
        header.classList.add("fm-my-card__header");
      }

      var body = el.querySelector(".card-body, .content, .block-content");
      if (body && !body.classList.contains("fm-my-card__body")) {
        body.classList.add("fm-my-card__body");
      }
    }
  }

  function observeDynamicContent() {
    var target = document.querySelector("#page-content") || document.body;
    if (!target || !window.MutationObserver) return;

    var obs = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.addedNodes && m.addedNodes.length) {
          for (var j = 0; j < m.addedNodes.length; j++) {
            var node = m.addedNodes[j];
            if (node && node.nodeType === 1) {
              enhanceBlocks(node);
            }
          }
        }
      }
    });

    obs.observe(target, { childList: true, subtree: true });
  }

  /* =========================================================
     Slideshow: utilitários
     ========================================================= */

  function normalizeDriveUrl(url) {
    // Aceita:
    // - https://drive.google.com/file/d/<ID>/view?...
    // - https://drive.google.com/open?id=<ID>
    // - https://drive.google.com/uc?id=<ID>&export=download
    // Retorna: https://drive.google.com/uc?export=view&id=<ID>
    try {
      var u = String(url || "").trim();
      if (!u) return "";

      // Já é "uc?export=view&id="
      if (u.indexOf("drive.google.com/uc?export=view&id=") !== -1) return u;

      var id = "";

      // /file/d/<id>/
      var m1 = u.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
      if (m1 && m1[1]) id = m1[1];

      // ?id=<id>
      if (!id) {
        var m2 = u.match(/[?&]id=([^&]+)/i);
        if (m2 && m2[1]) id = m2[1];
      }

      // /uc?id=<id>
      if (!id) {
        var m3 = u.match(/drive\.google\.com\/uc\?id=([^&]+)/i);
        if (m3 && m3[1]) id = m3[1];
      }

      if (id) return "https://drive.google.com/uc?export=view&id=" + encodeURIComponent(id);

      return u; // link direto ou outro host
    } catch (e) {
      return String(url || "").trim();
    }
  }

  function parseInfoFile(text) {
    // Formato esperado: uma URL por linha
    // Ignora: linhas vazias e comentários começando com # ou //
    var lines = String(text || "").split(/\r?\n/);
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      if (line.indexOf("#") === 0) continue;
      if (line.indexOf("//") === 0) continue;

      // Permite "URL | alt" (opcional)
      var parts = line.split("|");
      var url = (parts[0] || "").trim();
      var alt = (parts[1] || "").trim();

      url = normalizeDriveUrl(url);
      if (url) out.push({ url: url, alt: alt });
    }
    return out;
  }

  function safeFetchText(url, timeoutMs) {
    // fetch com timeout simples
    timeoutMs = timeoutMs || 8000;
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error("timeout"));
      }, timeoutMs);

      fetch(url, { cache: "no-store" })
        .then(function (r) {
          if (!r.ok) throw new Error("http_" + r.status);
          return r.text();
        })
        .then(function (t) {
          clearTimeout(timer);
          resolve(t);
        })
        .catch(function (e) {
          clearTimeout(timer);
          reject(e);
        });
    });
  }

  /* =========================================================
     Slideshow: montagem
     ========================================================= */

  function findInsertPoint() {
    // Preferência: no topo do region-main, antes do primeiro bloco grande
    var regionMain = document.querySelector("#region-main");
    if (!regionMain) return null;

    // Se já existir, não duplica
    if (regionMain.querySelector("#fm-my-slideshow")) return null;

    // Tenta inserir depois do cabeçalho "Olá, ..." se existir
    // Moodle pode ter h2/h3 no miolo — vamos achar o primeiro heading visível
    var headings = regionMain.querySelectorAll("h1, h2, h3");
    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      if (h && h.offsetParent !== null) {
        return { parent: regionMain, before: h.nextSibling };
      }
    }

    return { parent: regionMain, before: regionMain.firstChild };
  }

  function buildSlideshowShell() {
    var wrap = document.createElement("section");
    wrap.id = "fm-my-slideshow";
    wrap.className = "fm-slideshow fm-my-card";
    wrap.setAttribute("aria-label", "Slideshow");

    wrap.innerHTML =
      '<div class="fm-slideshow__viewport">' +
        '<div class="fm-slideshow__track" role="list"></div>' +
        '<button type="button" class="fm-slideshow__nav fm-slideshow__nav--prev" aria-label="Anterior"></button>' +
        '<button type="button" class="fm-slideshow__nav fm-slideshow__nav--next" aria-label="Próximo"></button>' +
      '</div>' +
      '<div class="fm-slideshow__dots" role="tablist" aria-label="Indicadores"></div>';

    return wrap;
  }

  function setButtonIcon(btn, dir) {
    // ícone em mask-image via CSS fallback: aqui usamos texto invisível e CSS desenha
    btn.innerHTML = '<span class="sr-only">' + (dir === "prev" ? "Anterior" : "Próximo") + "</span>";
  }

  function mountSlides(shell, items) {
    var track = shell.querySelector(".fm-slideshow__track");
    var dots = shell.querySelector(".fm-slideshow__dots");
    track.innerHTML = "";
    dots.innerHTML = "";

    for (var i = 0; i < items.length; i++) {
      var it = items[i];

      var slide = document.createElement("div");
      slide.className = "fm-slideshow__slide";
      slide.setAttribute("role", "listitem");
      slide.setAttribute("data-index", String(i));

      // imagem
      var img = document.createElement("img");
      img.className = "fm-slideshow__img";
      img.alt = it.alt || ("Slide " + (i + 1));
      img.loading = i === 0 ? "eager" : "lazy";
      img.decoding = "async";
      img.src = it.url;

      // fallback: se a imagem falhar, marca e esconde o slide
      img.addEventListener("error", function (e) {
        var sl = closest(e.target, ".fm-slideshow__slide");
        if (sl) sl.classList.add("is-error");
      });

      slide.appendChild(img);
      track.appendChild(slide);

      // dot
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "fm-slideshow__dot";
      dot.setAttribute("aria-label", "Ir para slide " + (i + 1));
      dot.setAttribute("data-index", String(i));
      dots.appendChild(dot);
    }

    // nav buttons
    var prev = shell.querySelector(".fm-slideshow__nav--prev");
    var next = shell.querySelector(".fm-slideshow__nav--next");
    setButtonIcon(prev, "prev");
    setButtonIcon(next, "next");
  }

  function initSlideshowBehavior(shell, opts) {
    opts = opts || {};
    var intervalMs = opts.intervalMs || 6000;

    var track = shell.querySelector(".fm-slideshow__track");
    var slides = shell.querySelectorAll(".fm-slideshow__slide");
    var dots = shell.querySelectorAll(".fm-slideshow__dot");
    var prev = shell.querySelector(".fm-slideshow__nav--prev");
    var next = shell.querySelector(".fm-slideshow__nav--next");

    var index = 0;
    var timer = null;
    var hovering = false;

    function validSlidesCount() {
      // ignora slides com erro
      var count = 0;
      for (var i = 0; i < slides.length; i++) {
        if (!slides[i].classList.contains("is-error")) count++;
      }
      return count;
    }

    function goTo(i) {
      var total = slides.length;
      if (!total) return;

      // pula slides com erro
      var attempts = 0;
      var target = i;

      while (attempts < total && slides[target] && slides[target].classList.contains("is-error")) {
        target = (target + 1) % total;
        attempts++;
      }

      index = target;

      // move track
      track.style.transform = "translateX(" + (-index * 100) + "%)";

      // dots
      for (var k = 0; k < dots.length; k++) {
        if (k === index) dots[k].classList.add("is-active");
        else dots[k].classList.remove("is-active");
      }
    }

    function nextSlide() {
      goTo((index + 1) % slides.length);
    }

    function prevSlide() {
      goTo((index - 1 + slides.length) % slides.length);
    }

    function start() {
      stop();
      if (slides.length <= 1) return;
      if (validSlidesCount() <= 1) return;

      timer = setInterval(function () {
        if (hovering) return;
        nextSlide();
      }, intervalMs);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    // click handlers
    if (prev) prev.addEventListener("click", function (e) { e.preventDefault(); prevSlide(); start(); });
    if (next) next.addEventListener("click", function (e) { e.preventDefault(); nextSlide(); start(); });

    for (var i = 0; i < dots.length; i++) {
      dots[i].addEventListener("click", function (e) {
        e.preventDefault();
        var idx = parseInt(this.getAttribute("data-index") || "0", 10);
        goTo(idx);
        start();
      });
    }

    // hover pause
    shell.addEventListener("mouseenter", function () { hovering = true; });
    shell.addEventListener("mouseleave", function () { hovering = false; });

    // swipe (mobile)
    var startX = 0, dx = 0, isDown = false;

    shell.addEventListener("pointerdown", function (e) {
      isDown = true;
      startX = e.clientX;
      dx = 0;
    });

    shell.addEventListener("pointermove", function (e) {
      if (!isDown) return;
      dx = e.clientX - startX;
    });

    shell.addEventListener("pointerup", function () {
      if (!isDown) return;
      isDown = false;
      if (Math.abs(dx) > 40) {
        if (dx < 0) nextSlide();
        else prevSlide();
        start();
      }
      dx = 0;
    });

    shell.addEventListener("pointercancel", function () {
      isDown = false;
      dx = 0;
    });

    // init
    goTo(0);
    start();

    // respeita reduced-motion: sem autoplay
    try {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        stop();
      }
    } catch (e) {}
  }

  function initSlideshow(attempt) {
    if (!isMyPage()) return;

    var insert = findInsertPoint();
    if (!insert) {
      if (attempt < 40) setTimeout(function () { initSlideshow(attempt + 1); }, 200);
      return;
    }

    var shell = buildSlideshowShell();
    insert.parent.insertBefore(shell, insert.before);

    // estado: loading
    shell.classList.add("is-loading");

    safeFetchText(SLIDESHOW_INFO_URL, 10000)
      .then(function (text) {
        var items = parseInfoFile(text);

        if (!items.length) {
          shell.classList.add("is-empty");
          shell.classList.remove("is-loading");
          return;
        }

        mountSlides(shell, items);
        shell.classList.remove("is-loading");
        initSlideshowBehavior(shell, { intervalMs: 6500 });
      })
      .catch(function () {
        shell.classList.add("is-empty");
        shell.classList.remove("is-loading");
      });
  }

  function boot(attempt) {
    if (!isMyPage()) return;

    if (!document.body) {
      if (attempt < 40) setTimeout(function () { boot(attempt + 1); }, 50);
      return;
    }

    addBodyScope();
    enhanceBlocks(document);
    observeDynamicContent();

    // Slideshow
    initSlideshow(0);
  }

  document.addEventListener("DOMContentLoaded", function () {
    boot(0);
  });
})();
