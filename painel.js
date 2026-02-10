/* ======================================================================
   painel.js — Enhancements para /my/ (Dashboard)
   - Só executa em /my/ (incluindo /my/index.php)
   - Adiciona classe no <body> para escopo de CSS
   - Observa mudanças dinâmicas (AJAX) e aplica classe de “card”
   ====================================================================== */

(function () {
  function isMyPage() {
    try {
      var path = (location && location.pathname) ? location.pathname : "";
      // cobre /my/ e /my/index.php (e variações com barra final)
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

  function enhanceBlocks(root) {
    if (!root) root = document;

    // Moodle Boost/variantes: blocos costumam estar em .block/.card
    // Não vamos reestruturar nada; só padronizar: garantir classe utilitária.
    var blocks = root.querySelectorAll(
      ".block, .block.card, .dashboard-card, .card.dashboard-card"
    );

    for (var i = 0; i < blocks.length; i++) {
      var el = blocks[i];

      // Evita mexer em cards que já são “card bootstrap” do core, mas ainda podemos aplicar acabamento
      if (!el.classList.contains("fm-my-card")) el.classList.add("fm-my-card");

      // Alguns temas colocam header fora do padrão, tentamos padronizar se existir
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
    // Dashboard pode carregar blocos dinamicamente
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

  function boot(attempt) {
    if (!isMyPage()) return;

    if (!document.body) {
      if (attempt < 40) setTimeout(function () { boot(attempt + 1); }, 50);
      return;
    }

    addBodyScope();
    enhanceBlocks(document);
    observeDynamicContent();
  }

  document.addEventListener("DOMContentLoaded", function () {
    boot(0);
  });
})();
