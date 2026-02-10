/* ======================================================================
   painel.js — /my/ slideshow fullwidth dentro de #page
   - Executa somente em /my/ e /my/index.php
   - Busca slideshow.info (1 URL por linha; ignora vazias e comentários)
   - Insere o slideshow como primeiro filho de #page (fullwidth)
   ====================================================================== */

(function () {
  var INFO_URL = "https://laurorosasneto.github.io/IME_CEJUR_MOODLE/FAMETRO/digital/slideshow.info";

  function isMyPage() {
    try {
      var path = (location && location.pathname) ? location.pathname : "";
      return /^\/my\/?$/.test(path) || /^\/my\/index\.php$/.test(path);
    } catch (e) {
      return false;
    }
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function addBodyScope() {
    if (!document.body) return false;
    document.body.classList.add("fm-my-enhanced");
    return true;
  }

  function parseInfo(text) {
    var lines = text.split(/\r?\n/);
    var urls = [];
    for (var i = 0; i < lines.length; i++) {
      var ln = (lines[i] || "").trim();
      if (!ln) continue;
      if (ln.startsWith("#")) continue;
      urls.push(ln);
    }
    return urls;
  }

  function createEl(tag, cls) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  }

  function buildSlideshow(urls) {
    var wrap = createEl("div", "fm-slideshow");
    wrap.setAttribute("data-fm-slideshow", "1");

    var stage = createEl("div", "fm-slideshow__stage");
    var overlay = createEl("div", "fm-slideshow__overlay");
    stage.appendChild(overlay);

    var status = createEl("div", "fm-slideshow__status");
    status.textContent = "Carregando…";
    stage.appendChild(status);

    var dots = createEl("div", "fm-slideshow__dots");

    var controls = createEl("div", "fm-slideshow__controls");
    var btnPrev = createEl("button", "fm-slideshow__btn");
    btnPrev.type = "button";
    btnPrev.setAttribute("aria-label", "Anterior");
    btnPrev.textContent = "‹";

    var btnNext = createEl("button", "fm-slideshow__btn");
    btnNext.type = "button";
    btnNext.setAttribute("aria-label", "Próximo");
    btnNext.textContent = "›";

    controls.appendChild(btnPrev);
    controls.appendChild(btnNext);

    stage.appendChild(dots);
    stage.appendChild(controls);
    wrap.appendChild(stage);

    if (!urls || !urls.length) {
      status.textContent = "Nenhuma imagem configurada.";
      return { root: wrap, api: null };
    }

    var imgs = [];
    var dotsEls = [];
    var current = 0;
    var timer = null;
    var INTERVAL = 6000;

    function setStatusVisible(visible, msg) {
      status.style.display = visible ? "grid" : "none";
      if (msg) status.textContent = msg;
    }

    function setActive(idx) {
      if (!imgs.length) return;

      if (idx < 0) idx = imgs.length - 1;
      if (idx >= imgs.length) idx = 0;

      for (var i = 0; i < imgs.length; i++) {
        imgs[i].classList.toggle("is-active", i === idx);
        if (dotsEls[i]) dotsEls[i].classList.toggle("is-active", i === idx);
      }
      current = idx;
    }

    function next() { setActive(current + 1); }
    function prev() { setActive(current - 1); }

    function restartTimer() {
      stopTimer();
      if (imgs.length > 1) {
        timer = setInterval(function () { next(); }, INTERVAL);
      }
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    var loadedCount = 0;

    function onImgLoaded() {
      loadedCount++;
      if (loadedCount === 1) {
        setStatusVisible(false);
        setActive(0);
        restartTimer();
      }
    }

    function onImgError() {
      loadedCount++;
      if (loadedCount === urls.length) {
        setStatusVisible(true, "Não foi possível carregar as imagens.");
      }
    }

    for (var u = 0; u < urls.length; u++) {
      (function (src, idx) {
        var img = document.createElement("img");
        img.className = "fm-slideshow__img";
        img.alt = "Slide " + (idx + 1);
        img.decoding = "async";
        img.loading = "eager";
        img.addEventListener("load", onImgLoaded);
        img.addEventListener("error", onImgError);
        img.src = src;

        stage.appendChild(img);
        imgs.push(img);

        var dot = createEl("button", "fm-slideshow__dot");
        dot.type = "button";
        dot.setAttribute("aria-label", "Ir para o slide " + (idx + 1));
        dot.addEventListener("click", function () {
          setActive(idx);
          restartTimer();
        });
        dots.appendChild(dot);
        dotsEls.push(dot);
      })(urls[u], u);
    }

    btnNext.addEventListener("click", function () {
      next();
      restartTimer();
    });

    btnPrev.addEventListener("click", function () {
      prev();
      restartTimer();
    });

    wrap.addEventListener("mouseenter", stopTimer);
    wrap.addEventListener("mouseleave", function () {
      restartTimer();
    });

    // swipe simples
    var startX = 0;
    var deltaX = 0;

    wrap.addEventListener("touchstart", function (e) {
      if (!e.touches || !e.touches[0]) return;
      startX = e.touches[0].clientX;
      deltaX = 0;
    }, { passive: true });

    wrap.addEventListener("touchmove", function (e) {
      if (!e.touches || !e.touches[0]) return;
      deltaX = e.touches[0].clientX - startX;
    }, { passive: true });

    wrap.addEventListener("touchend", function () {
      if (Math.abs(deltaX) > 40) {
        if (deltaX < 0) next();
        else prev();
        restartTimer();
      }
      startX = 0;
      deltaX = 0;
    });

    return { root: wrap, api: { next: next, prev: prev, setActive: setActive } };
  }

  function insertIntoPage(slideshowRoot) {
    var page = document.getElementById("page");
    if (!page) return false;

    // se já existe, não duplica
    if (page.querySelector('[data-fm-slideshow="1"]')) return true;

    // insere como PRIMEIRO filho do #page
    page.insertBefore(slideshowRoot, page.firstChild);
    return true;
  }

  function boot(attempt) {
    if (!isMyPage()) return;

    if (!document.body) {
      if (attempt < 80) setTimeout(function () { boot(attempt + 1); }, 50);
      return;
    }

    addBodyScope();

    // evita duplicar
    if ($('[data-fm-slideshow="1"]')) return;

    fetch(INFO_URL, { cache: "no-store" })
      .then(function (r) { return r.text(); })
      .then(function (txt) {
        var urls = parseInfo(txt);
        var built = buildSlideshow(urls);
        insertIntoPage(built.root);
      })
      .catch(function () {
        var built = buildSlideshow([]);
        var status = built.root.querySelector(".fm-slideshow__status");
        if (status) status.textContent = "Não foi possível carregar o slideshow.";
        insertIntoPage(built.root);
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    boot(0);
  });
})();
