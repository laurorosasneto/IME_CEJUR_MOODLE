/* ======================================================================
   painel.js — Slideshow no Dashboard Moodle
   Critério ÚNICO: body#page-my-index
   - Lê URLs de slideshow.info (uma por linha)
   - Suporta links do Google Drive (converte para link direto)
   - Insere em #fm-slideshow-slot se existir; senão, no topo do #page
   - Crossfade + auto-play + setas
   - Não cobre UI do Moodle (CSS resolve z-index)
   ====================================================================== */

(function () {
  var INFO_URL = "https://laurorosasneto.github.io/IME_CEJUR_MOODLE/FAMETRO/digital/slideshow.info";
  var DEBUG = true;

  function log() {
    if (!DEBUG) return;
    try {
      console.log.apply(console, ["FM-SLIDES:"].concat([].slice.call(arguments)));
    } catch (e) {}
  }

  function isMyIndex() {
    return document.body && document.body.id === "page-my-index";
  }

  function createEl(tag, cls) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  }

  function stripBOM(s) {
    return (s || "").replace(/^\uFEFF/, "");
  }

  function toDirectDrive(url) {
    if (!url) return url;
    var m = url.match(/drive\.google\.com\/file\/d\/([^\/\?]+)/);
    if (m && m[1]) return "https://drive.google.com/uc?export=view&id=" + m[1];
    return url;
  }

  function parseInfo(txt) {
    txt = stripBOM(txt || "");
    var lines = txt.split(/\r?\n/);
    var out = [];

    lines.forEach(function (l) {
      l = (l || "").trim();
      if (!l || l.startsWith("#")) return;
      out.push(toDirectDrive(l));
    });

    return out;
  }

  function insertSlideshow(node) {
    var slot = document.getElementById("fm-slideshow-slot");
    if (slot) {
      slot.appendChild(node);
      log("Inserido no fm-slideshow-slot");
      return true;
    }

    var page = document.getElementById("page");
    if (!page) {
      log("ERRO: #page não encontrado");
      return false;
    }

    page.insertBefore(node, page.firstChild);
    log("Inserido no topo do #page");
    return true;
  }

  function buildSlideshow(urls) {
    var wrap = createEl("div", "fm-slideshow");
    wrap.setAttribute("data-fm-slideshow", "1");

    var stage = createEl("div", "fm-slideshow__stage");
    wrap.appendChild(stage);

    var status = createEl("div", "fm-slideshow__status");
    status.textContent = "Carregando slideshow…";
    status.classList.add("is-visible");
    stage.appendChild(status);

    function showStatus(msg) {
      status.textContent = msg;
      status.classList.add("is-visible");
    }

    function hideStatus() {
      status.classList.remove("is-visible");
    }

    if (!urls || !urls.length) {
      showStatus("slideshow.info vazio.");
      return wrap;
    }

    var imgs = [];
    var current = 0;
    var timer = null;
    var firstLoaded = false;

    function setActive(idx) {
      if (!imgs.length) return;

      if (idx < 0) idx = imgs.length - 1;
      if (idx >= imgs.length) idx = 0;

      for (var i = 0; i < imgs.length; i++) {
        imgs[i].classList.toggle("is-active", i === idx);
      }
      current = idx;
    }

    function startAuto() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      if (imgs.length > 1) {
        timer = setInterval(function () {
          setActive(current + 1);
        }, 6000);
      }
    }

    function stopAuto() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    // NAV (setas)
    var nav = createEl("div", "fm-slideshow__nav");

    function makeBtn(dir) {
      var btn = createEl("button", "fm-slideshow__btn");
      btn.type = "button";
      btn.setAttribute("aria-label", dir === "prev" ? "Slide anterior" : "Próximo slide");

      // ícone fino e curvilíneo (stroke)
      btn.innerHTML =
        dir === "prev"
          ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>'
          : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        stopAuto();
        setActive(dir === "prev" ? current - 1 : current + 1);
        startAuto();
      });

      return btn;
    }

    var btnPrev = makeBtn("prev");
    var btnNext = makeBtn("next");
    nav.appendChild(btnPrev);
    nav.appendChild(btnNext);
    stage.appendChild(nav);

    // Cria imagens
    urls.forEach(function (src, i) {
      var img = document.createElement("img");
      img.className = "fm-slideshow__img";
      img.alt = "Slide " + (i + 1);
      img.decoding = "async";
      img.loading = i === 0 ? "eager" : "lazy";

      img.addEventListener("load", function () {
        // IMPORTANTE: só define o ativo na PRIMEIRA imagem carregada (evita “pular” para a 2ª)
        if (!firstLoaded) {
          firstLoaded = true;
          hideStatus();
          setActive(0);
          startAuto();
        }
      });

      img.addEventListener("error", function () {
        if (!firstLoaded) {
          showStatus("Imagem não carregou. Verifique se o link abre direto no navegador.");
        }
      });

      img.src = src;

      stage.appendChild(img);
      imgs.push(img);
    });

    // Se só tem 1 imagem, esconda setas (opcional)
    if (imgs.length <= 1) {
      nav.style.display = "none";
    }

    // fallback: se demorar demais, mostra aviso (mas some ao carregar)
    setTimeout(function () {
      if (!firstLoaded) {
        showStatus("Aguardando imagem… verifique se o link abre direto no navegador.");
      }
    }, 2200);

    return wrap;
  }

  function boot(attempt) {
    attempt = attempt || 0;

    if (!document.body) {
      if (attempt < 150) setTimeout(function () { boot(attempt + 1); }, 100);
      return;
    }

    if (!isMyIndex()) {
      return;
    }

    // evita duplicar
    if (document.querySelector('[data-fm-slideshow="1"]')) {
      return;
    }

    // placeholder imediato
    var placeholder = createEl("div", "fm-slideshow");
    placeholder.setAttribute("data-fm-slideshow", "1");
    placeholder.innerHTML =
      '<div class="fm-slideshow__stage">' +
        '<div class="fm-slideshow__status is-visible">Carregando slideshow.info…</div>' +
      "</div>";

    if (!insertSlideshow(placeholder)) {
      if (attempt < 150) setTimeout(function () { boot(attempt + 1); }, 100);
      return;
    }

    fetch(INFO_URL, { cache: "no-store" })
      .then(function (r) {
        log("Fetch slideshow.info:", r.status);
        return r.text();
      })
      .then(function (txt) {
        var urls = parseInfo(txt);
        log("Imagens encontradas:", urls.length);
        if (urls[0]) log("Primeira URL:", urls[0]);

        var real = buildSlideshow(urls);

        if (placeholder && placeholder.parentNode) {
          placeholder.parentNode.replaceChild(real, placeholder);
        }
      })
      .catch(function (e) {
        log("Erro ao carregar slideshow.info", e);
        var st = placeholder.querySelector(".fm-slideshow__status");
        if (st) {
          st.classList.add("is-visible");
          st.textContent = "Erro ao carregar slideshow.";
        }
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    boot(0);
  });

  // fallback se o DOMContentLoaded já passou
  setTimeout(function () {
    boot(0);
  }, 700);
})();
