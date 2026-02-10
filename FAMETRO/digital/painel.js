/* ======================================================================
   painel.js — Slideshow no Dashboard (/my/) — robusto
   - NÃO depende de pathname exato (/my vs /moodle/my etc.)
   - Detecta dashboard por: body.pagelayout-mydashboard OU URL contendo /my
   - Re-tries por até 15s procurando #page
   - Sempre insere um placeholder (se JS executou, você verá)
   ====================================================================== */

(function () {
  var INFO_URL = "https://laurorosasneto.github.io/IME_CEJUR_MOODLE/FAMETRO/digital/slideshow.info";
  var DEBUG = true;

  function log() {
    if (!DEBUG) return;
    try { console.log.apply(console, ["FM-SLIDES:"].concat([].slice.call(arguments))); } catch (e) {}
  }

  function isDashboardPage() {
    try {
      var b = document.body;
      if (b && (b.classList.contains("pagelayout-mydashboard") || b.classList.contains("pagelayout-mypublic"))) {
        return true;
      }
      // fallback por URL: pega qualquer path que contenha "/my" como segmento
      var path = (location && location.pathname) ? location.pathname : "";
      return /(^|\/)my(\/|$)/.test(path);
    } catch (e) {
      return false;
    }
  }

  function patchSlickIfMissing() {
    // evita crash do tema: $(...).slick is not a function
    try {
      if (!window.jQuery) return;
      var $ = window.jQuery;
      if (!$.fn) $.fn = {};
      if (typeof $.fn.slick !== "function") {
        $.fn.slick = function () { return this; };
        log("Stub slick() aplicado (evita crash do tema).");
      }
    } catch (e) {}
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
      return wrap;
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
      if (timer) { clearInterval(timer); timer = null; }
    }

    function start() {
      stop();
      if (imgs.length > 1) {
        timer = setInterval(function () { setActive(current + 1); }, INTERVAL);
      }
    }

    var ok = 0;
    var done = 0;

    function onDone(total) {
      done++;
      if (done === total && ok === 0) {
        setStatus(true, "Imagens não carregaram (links/SSL).");
      }
    }

    function onFirstOk() {
      setStatus(false);
      setActive(0);
      start();
    }

    for (var u = 0; u < urls.length; u++) {
      (function (src, idx, total) {
        var img = document.createElement("img");
        img.className = "fm-slideshow__img";
        img.alt = "Slide " + (idx + 1);
        img.decoding = "async";
        img.loading = "eager";

        img.addEventListener("load", function () {
          ok++;
          if (ok === 1) onFirstOk();
          onDone(total);
        });

        img.addEventListener("error", function () {
          onDone(total);
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
      })(urls[u], u, urls.length);
    }

    btnPrev.addEventListener("click", function () { setActive(current - 1); start(); });
    btnNext.addEventListener("click", function () { setActive(current + 1); start(); });

    wrap.addEventListener("mouseenter", stop);
    wrap.addEventListener("mouseleave", start);

    return wrap;
  }

  function insertIntoPage(root) {
    var page = document.getElementById("page");
    if (!page) return false;
    if (page.querySelector('[data-fm-slideshow="1"]')) return true;

    page.insertBefore(root, page.firstChild);
    return true;
  }

  function boot(tryN) {
    patchSlickIfMissing();

    if (!document.body) {
      if (tryN < 150) setTimeout(function () { boot(tryN + 1); }, 100);
      return;
    }

    if (!isDashboardPage()) {
      log("Não é dashboard (/my). Abortando.");
      return;
    }

    document.body.classList.add("fm-my-enhanced");

    var page = document.getElementById("page");
    if (!page) {
      if (tryN < 150) setTimeout(function () { boot(tryN + 1); }, 100);
      return;
    }

    if (page.querySelector('[data-fm-slideshow="1"]')) return;

    log("Dashboard detectado. Inserindo placeholder…");

    // Placeholder visível sempre (se não aparecer, JS não rodou)
    var ph = createEl("div", "fm-slideshow");
    ph.setAttribute("data-fm-slideshow", "1");

    var st = createEl("div", "fm-slideshow__stage");
    var ov = createEl("div", "fm-slideshow__overlay");
    var tx = createEl("div", "fm-slideshow__status");
    tx.textContent = "Carregando slideshow.info…";

    st.appendChild(ov);
    st.appendChild(tx);
    ph.appendChild(st);

    insertIntoPage(ph);

    fetch(INFO_URL, { cache: "no-store" })
      .then(function (r) {
        log("Fetch slideshow.info status:", r.status);
        return r.text();
      })
      .then(function (txtInfo) {
        var urls = parseInfo(txtInfo);
        log("URLs no slideshow.info:", urls.length);

        if (ph.parentNode) ph.parentNode.removeChild(ph);

        var built = buildSlideshow(urls);
        insertIntoPage(built);
      })
      .catch(function (e) {
        log("Falha fetch slideshow.info:", e);
        tx.textContent = "Falha ao buscar slideshow.info (CORS/SSL/URL).";
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    boot(0);
  });

  // fallback
  setTimeout(function () { boot(0); }, 600);
})();
