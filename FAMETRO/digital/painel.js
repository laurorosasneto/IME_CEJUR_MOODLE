/* ======================================================================
   painel.js — Slideshow no Dashboard Moodle
   Critério ÚNICO: body#page-my-index
   Insere dentro de #fm-slideshow-slot ou cria no topo de #page
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
    txt = stripBOM(txt);
    var lines = txt.split(/\r?\n/);
    var out = [];

    lines.forEach(function (l) {
      l = l.trim();
      if (!l || l.startsWith("#")) return;
      out.push(toDirectDrive(l));
    });

    return out;
  }

  function buildSlideshow(urls) {
    var wrap = createEl("div", "fm-slideshow");
    var stage = createEl("div", "fm-slideshow__stage");
    wrap.appendChild(stage);

    var status = createEl("div", "fm-slideshow__status");
    status.textContent = "Carregando slideshow…";
    stage.appendChild(status);

    if (!urls.length) {
      status.textContent = "slideshow.info vazio.";
      return wrap;
    }

    var imgs = [];
    var current = 0;

    urls.forEach(function (src, i) {
      var img = document.createElement("img");
      img.className = "fm-slideshow__img";
      img.src = src;
      img.alt = "Slide " + (i + 1);
      img.onload = function () {
        if (i === 0) {
          status.style.display = "none";
          img.classList.add("is-active");
        }
      };
      stage.appendChild(img);
      imgs.push(img);
    });

    if (imgs.length > 1) {
      setInterval(function () {
        imgs[current].classList.remove("is-active");
        current = (current + 1) % imgs.length;
        imgs[current].classList.add("is-active");
      }, 6000);
    }

    return wrap;
  }

  function insertSlideshow(node) {
    var slot = document.getElementById("fm-slideshow-slot");
    if (slot) {
      slot.appendChild(node);
      log("Inserido no fm-slideshow-slot");
      return;
    }

    var page = document.getElementById("page");
    if (!page) {
      log("ERRO: #page não encontrado");
      return;
    }

    page.insertBefore(node, page.firstChild);
    log("Inserido no topo do #page");
  }

  function boot() {
    if (!isMyIndex()) {
      log("Não é /my/ (body id diferente). Abortado.");
      return;
    }

    document.body.classList.add("fm-my-enhanced");
    log("Dashboard detectado (page-my-index)");

    // placeholder imediato (prova visual)
    var placeholder = createEl("div", "fm-slideshow");
    placeholder.innerHTML =
      '<div class="fm-slideshow__stage">' +
      '<div class="fm-slideshow__status">Carregando slideshow.info…</div>' +
      "</div>";

    insertSlideshow(placeholder);

    fetch(INFO_URL, { cache: "no-store" })
      .then(function (r) {
        log("Fetch slideshow.info:", r.status);
        return r.text();
      })
      .then(function (txt) {
        var urls = parseInfo(txt);
        log("Imagens encontradas:", urls.length);

        var real = buildSlideshow(urls);
        placeholder.replaceWith(real);
      })
      .catch(function (e) {
        log("Erro ao carregar slideshow.info", e);
        placeholder.querySelector(".fm-slideshow__status").textContent =
          "Erro ao carregar slideshow.";
      });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
