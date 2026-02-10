/* ======================================================================
   painel.js — /my/ slideshow fullwidth dentro de #page (anti-quebra)
   - JS puro (sem jQuery)
   - Roda mesmo se existir erro de outros scripts (retries)
   - Busca slideshow.info (1 URL por linha; ignora vazias e comentários #)
   - Converte links comuns do Drive para uc?export=view&id=
   ====================================================================== */

(function () {
  var INFO_URL = "https://laurorosasneto.github.io/IME_CEJUR_MOODLE/FAMETRO/digital/slideshow.info";
  var MAX_TRIES = 80;
  var TRY_DELAY = 120;

  function isMyPage() {
    try {
      var path = (location && location.pathname) ? location.pathname : "";
      path = path.replace(/\/+$/, "");
      return path === "/my" || path === "/my/index.php";
    } catch (e) {
      return false;
    }
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function stripBOM(s) {
    return (s || "").replace(/^\uFEFF/, "");
  }

  function toDirectDrive(url) {
    try {
      if (!url) return url;

      var m1 = url.match(/drive\.google\.com\/file\/d\/([^\/\?]+)\//i);
      if (m1 && m1[1]) return "https://drive.google.com/uc?export=view&id=" + m1[1];

      var m2 = url.match(/[?&]id=([^&]+)/i);
      if (m2 && m2[1] && /drive\.google\.com/i.test(url)) {
        return "https://drive.google.com/uc?export=view&id=" + m2[1];
      }

      if (/drive\.google\.com\/uc\?export=view&id=/i.test(url)) return url;

      return url;
    } catch (e) {
      return url;
    }
  }

  function parseInfo(text) {
    text = stripBOM(text || "");
    var lines = text.split(/\r?\n/);
    var urls = [];

    for (var i = 0; i < lines.length; i++) {
      var ln = (lines[i] || "").trim();
      if (!ln) continue;
      if (ln.startsWith("#")) continue;

      // comentário inline: "url # comentario"
      ln = ln.split(" #")[0].trim();
      if (!ln) continue;

      urls.push(toDirectDrive(ln));
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
    status.textContent = "Carregando slideshow…";
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
      status.textContent = "slideshow.info vazio (sem imagens).";
      return { root: wrap, api: null };
    }

    var imgs = [];
    var dotEls = [];
    var current = 0;
    var timer = null;
    var INTERVAL = 6000;

    function setStatus(visible, msg) {
      status.style.display = visible ? "grid" : "none";
      if (msg) status.textContent = msg;
    }

    function setActive(idx) {
      if (!imgs.length) return;
      if (idx < 0) idx = imgs.length - 1;
      if (idx >= imgs.length) idx = 0;

      for (var i = 0; i < imgs.length; i++) {
        imgs[i].classList.toggle("is-active", i === idx);
        if (dotEls[i]) dotEls[i].classList.toggle("is-active", i === idx);
      }
      current = idx;
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      stop();
      if (imgs.length > 1) {
        timer = setInterval(function () {
          setActive(current + 1);
        }, INTERVAL);
      }
    }

    var loadedOk = 0;
    var loadedTotal = 0;

    function onAnyDone() {
      loadedTotal++;
      if (loadedTotal === urls.length) {
        if (loadedOk === 0) {
          setStatus(true, "Imagens não carregaram. Verifique links/SSL.");
        }
      }
    }

    function onFirstOk() {
      setStatus(false);
      setActive(0);
      start();
    }

    for (var u = 0; u < urls.length; u++) {
      (function (src, idx) {
        var img = document.createElement("img");
        img.className = "fm-slideshow__img";
        img.alt = "Slide " + (idx + 1);
        img.decoding = "async";
        img.loading = "eager";

        img.addEventListener("load", function () {
          loadedOk++;
          if (loadedOk === 1) onFirstOk();
          onAnyDone();
        });

        img.addEventListener("error", function () {
          onAnyDone();
        });

        img.src = src;

        stage.appendChild(img);
        imgs.push(img);

        var dot = createEl("button", "fm-slideshow__dot");
        dot.type = "button";
        dot.setAttribute("aria-label", "Ir para o slide " + (idx + 1));
        dot.addEventListener("click", function () {
          setActive(idx);
          start();
        });

        dots.appendChild(dot);
        dotEls.push(dot);
      })(urls[u], u);
    }

    btnPrev.addEventListener("click", function () { setActive(current - 1); start(); });
    btnNext.addEventListener("click", function () { setActive(current + 1); start(); });

    wrap.addEventListener("mouseenter", stop);
    wrap.addEventListener("mouseleave", start);

    // swipe simples
    var startX = 0, deltaX = 0;
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
        if (deltaX < 0) setActive(current + 1);
        else setActive(current - 1);
        start();
      }
      startX = 0; deltaX = 0;
    });

    return { root: wrap, api: { setActive: setActive } };
  }

  function insertIntoPage(root) {
    var page = document.getElementById("page");
    if (!page) return false;

    if (page.querySelector('[data-fm-slideshow="1"]')) return true;

    // coloca como primeiro filho dentro de #page
    page.insertBefore(root, page.firstChild);
    return true;
  }

  function ensureScope() {
    if (document.body) document.body.classList.add("fm-my-enhanced");
  }

  function boot(tryN) {
    if (!isMyPage()) return;

    ensureScope();

    var page = document.getElementById("page");
    if (!page) {
      if (tryN < MAX_TRIES) setTimeout(function () { boot(tryN + 1); }, TRY_DELAY);
      return;
    }

    // já inserido
    if (page.querySelector('[data-fm-slideshow="1"]')) return;

    // coloca um placeholder IMEDIATO (para você ver que entrou)
    var placeholder = createEl("div", "fm-slideshow");
    placeholder.setAttribute("data-fm-slideshow", "1");

    var stage = createEl("div", "fm-slideshow__stage");
    var overlay = createEl("div", "fm-slideshow__overlay");
    stage.appendChild(overlay);

    var status = createEl("div", "fm-slideshow__status");
    status.textContent = "Carregando slideshow.info…";
    stage.appendChild(status);

    placeholder.appendChild(stage);
    insertIntoPage(placeholder);

    fetch(INFO_URL, { cache: "no-store" })
      .then(function (r) { return r.text(); })
      .then(function (txt) {
        var urls = parseInfo(txt);

        // remove placeholder e insere real
        placeholder.parentNode && placeholder.parentNode.removeChild(placeholder);

        var built = buildSlideshow(urls);
        insertIntoPage(built.root);
      })
      .catch(function () {
        status.textContent = "Falha ao buscar slideshow.info (CORS/SSL/URL).";
      });
  }

  // roda cedo + retries
  try { addBodyScope(); } catch (e) {}
  document.addEventListener("DOMContentLoaded", function () { boot(0); });

  // backup se DOMContentLoaded não disparar por algum motivo
  setTimeout(function () { boot(0); }, 600);
})();
