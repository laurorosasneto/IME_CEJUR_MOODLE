/* ======================================================================
   painel.js — Slideshow no Dashboard Moodle
   Critério ÚNICO: body#page-my-index
   Insere dentro de #fm-slideshow-slot ou cria no topo de #page
   Ajustes:
   - Retry robusto (Moodle/AMD pode atrasar DOM)
   - Loga a URL encontrada
   - Trata erro de imagem (mostra mensagem no palco)
   - Garante .is-active sempre que carregar (mesmo 1 slide)
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
    if (m && m[1]) {
      return "https://drive.google.com/uc?export=view&id=" + m[1];
    }
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

  function buildSlideshow(urls) {
    var wrap = createEl("div", "fm-slideshow");
    wrap.setAttribute("data-fm-slideshow", "1");

    var stage = createEl("div", "fm-slideshow__stage");
    wrap.appendChild(stage);

    var status = createEl("div", "fm-slideshow__status");
    status.textContent = "Carregando slideshow…";
    stage.appendChild(status);

    function showStatus(msg) {
      status.style.display = "grid";
      status.textContent = msg;
    }

    function hideStatus() {
      status.style.display = "none";
    }

    if (!urls || !urls.length) {
      showStatus("slideshow.info vazio.");
      return wrap;
    }

    var imgs = [];
    var current = 0;
    var timer = null;

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

    urls.forEach(function (src, i) {
      var img = document.createElement("img");
      img.className = "fm-slideshow__img";
      img.alt = "Slide " + (i + 1);
      img.decoding = "async";
      img.loading = "eager";

      img.addEventListener("load", function () {
        // IMPORTANTE: garante visibilidade mesmo se só houver 1 slide
        hideStatus();
        setActive(i);
        startAuto();
      });

      img.addEventListener("error", function () {
        // Se a primeira imagem falhar, mostre status claro
        if (imgs.length === 1 || i === 0) {
          showStatus("Imagem não carregou (link/SSL/permissão).");
        }
      });

      img.src = src;

      stage.appendChild(img);
      imgs.push(img);
    });

    // Se nada carregar em um tempo razoável, informa
    setTimeout(function () {
      var anyActive = wrap.querySelector(".fm-slideshow__img.is-active");
      if (!anyActive) {
        showStatus("Aguardando imagem… verifique se o link abre direto no navegador.");
      }
    }, 2500);

    return wrap;
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

  function boot(attempt) {
    attempt = attempt || 0;

    // Espera body existir
    if (!document.body) {
      if (attempt < 150) setTimeout(function () { boot(attempt + 1); }, 100);
      return;
    }

    if (!isMyIndex()) {
      log("Não é /my/ (body id diferente). Abortado.");
      return;
    }

    // evita duplicar
    if (document.querySelector('[data-fm-slideshow="1"]')) {
      log("Slideshow já existe. Abortando duplicação.");
      return;
    }

    document.body.classList.add("fm-my-enhanced");
    log("Dashboard detectado (page-my-index)");

    // placeholder imediato (prova visual)
    var placeholder = createEl("div", "fm-slideshow");
    placeholder.setAttribute("data-fm-slideshow", "1");
    placeholder.innerHTML =
      '<div class="fm-slideshow__stage">' +
        '<div class="fm-slideshow__status">Carregando slideshow.info…</div>' +
      "</div>";

    // Se #page ainda não existe, tenta novamente
    var inserted = insertSlideshow(placeholder);
    if (!inserted) {
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

        // substitui placeholder
        if (placeholder && placeholder.parentNode) {
          placeholder.parentNode.replaceChild(real, placeholder);
        }
      })
      .catch(function (e) {
        log("Erro ao carregar slideshow.info", e);
        var st = placeholder.querySelector(".fm-slideshow__status");
        if (st) st.textContent = "Erro ao carregar slideshow.";
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    boot(0);
  });

  // fallback para casos em que DOMContentLoaded já passou (AMD/ordem do Moodle)
  setTimeout(function () {
    boot(0);
  }, 700);
})();
