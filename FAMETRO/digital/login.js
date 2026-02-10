/* ======================================================================
   login.js — Login enhancements (Moodle login page)
   Inclui:
   1) Select “premium” (mantém o comportamento do select personalizado)
   2) Sidepanel (AJAX) com 5 botões
   3) Modais Bootstrap:
      - Como acessar (YouTube)
      - Problemas de acesso (texto)
      - Redes sociais (cards)
   ====================================================================== */

(function () {
  function isLoginPage() {
    return document.body && document.body.classList.contains("pagelayout-login");
  }

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function closest(el, selector) {
    while (el && el.nodeType === 1) {
      if (el.matches(selector)) return el;
      el = el.parentElement;
    }
    return null;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* =========================================================
     1) SELECT “premium”
     - Não tenta “estilizar o dropdown nativo” (isso não é possível via CSS puro)
     - Faz refinamentos que realmente funcionam:
       * classe has-value
       * melhora foco/teclado
       * protege contra inicialização duplicada
     ========================================================= */
  function initPremiumSelect(root) {
    if (!isLoginPage()) return;

    var select = qs('body.pagelayout-login form#login select#entrarComo', root);
    if (!select) return;

    if (select.dataset.fmSelectInit === "1") return;
    select.dataset.fmSelectInit = "1";

    // Marca se tem valor selecionado (para CSS opcional, se você quiser)
    function syncValueClass() {
      var hasValue = !!select.value && String(select.value).trim().length > 0;
      select.classList.toggle("has-value", hasValue);
    }

    // Primeira sincronização
    syncValueClass();

    // Eventos
    select.addEventListener("change", syncValueClass);
    select.addEventListener("blur", syncValueClass);

    // Acessibilidade: se o user navegar por teclado, mantém o outline consistente
    select.addEventListener("keydown", function (e) {
      // Apenas garante que Enter/Espaço não disparará nada estranho (nativo)
      if (e.key === "Enter") {
        // nativo; não bloquear.
      }
    });
  }

  /* =========================================================
     Bootstrap modal helper (BS4 / BS5)
     ========================================================= */
  function showModal(modalEl) {
    // BS5
    if (window.bootstrap && window.bootstrap.Modal) {
      var inst = window.bootstrap.Modal.getOrCreateInstance(modalEl, { backdrop: true, focus: true });
      inst.show();
      return;
    }
    // BS4/jQuery
    if (window.jQuery && window.jQuery.fn && window.jQuery.fn.modal) {
      window.jQuery(modalEl).modal("show");
      return;
    }
    // fallback mínimo
    modalEl.style.display = "block";
    modalEl.classList.add("show");
  }

  /* =========================================================
     Modals markup (injetar uma vez)
     ========================================================= */
  function ensureModals() {
    if (document.getElementById("fm-login-modal-como")) return;

    // Troque pelo ID real do seu vídeo
    var YOUTUBE_VIDEO_ID = "dQw4w9WgXcQ";

    var html = [
      // Modal: Como acessar (YouTube)
      '<div class="modal fade" id="fm-login-modal-como" tabindex="-1" role="dialog" aria-hidden="true">',
      '  <div class="modal-dialog modal-dialog-centered modal-lg" role="document">',
      '    <div class="modal-content">',
      '      <div class="modal-header">',
      '        <h5 class="modal-title">Como acessar</h5>',
      '        <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">',
      '          <span aria-hidden="true">&times;</span>',
      '        </button>',
      '      </div>',
      '      <div class="modal-body">',
      '        <div class="fm-video-wrap">',
      '          <iframe id="fm-login-yt" class="fm-video-iframe" ',
      '            src="https://www.youtube.com/embed/' + escapeHtml(YOUTUBE_VIDEO_ID) + '?rel=0&modestbranding=1" ',
      '            title="Como acessar" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
      '        </div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>',

      // Modal: Problemas de acesso (texto)
      '<div class="modal fade" id="fm-login-modal-problemas" tabindex="-1" role="dialog" aria-hidden="true">',
      '  <div class="modal-dialog modal-dialog-centered modal-md" role="document">',
      '    <div class="modal-content">',
      '      <div class="modal-header">',
      '        <h5 class="modal-title">Problemas de acesso</h5>',
      '        <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">',
      '          <span aria-hidden="true">&times;</span>',
      '        </button>',
      '      </div>',
      '      <div class="modal-body">',
      '        <div class="fm-modal-text">',
      '          <p><strong>Texto de suporte</strong> (vamos montar em seguida).</p>',
      '          <p>Inclua aqui as orientações de recuperação de senha, contato, horários e procedimentos.</p>',
      '        </div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>',

      // Modal: Redes sociais (3 cards)
      '<div class="modal fade" id="fm-login-modal-redes" tabindex="-1" role="dialog" aria-hidden="true">',
      '  <div class="modal-dialog modal-dialog-centered modal-lg" role="document">',
      '    <div class="modal-content">',
      '      <div class="modal-header">',
      '        <h5 class="modal-title">Redes sociais</h5>',
      '        <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">',
      '          <span aria-hidden="true">&times;</span>',
      '        </button>',
      '      </div>',
      '      <div class="modal-body">',
      '        <div class="fm-social-grid">',
      '          <a class="fm-social-card" href="#" target="_blank" rel="noopener">',
      '            <div class="fm-social-ico" aria-hidden="true">f</div>',
      '            <div class="fm-social-name">Facebook</div>',
      '            <div class="fm-social-sub">Notícias e comunicados</div>',
      '          </a>',
      '          <a class="fm-social-card" href="#" target="_blank" rel="noopener">',
      '            <div class="fm-social-ico" aria-hidden="true">◎</div>',
      '            <div class="fm-social-name">Instagram</div>',
      '            <div class="fm-social-sub">Eventos e bastidores</div>',
      '          </a>',
      '          <a class="fm-social-card" href="#" target="_blank" rel="noopener">',
      '            <div class="fm-social-ico" aria-hidden="true">▶</div>',
      '            <div class="fm-social-name">YouTube</div>',
      '            <div class="fm-social-sub">Aulas e conteúdos</div>',
      '          </a>',
      '        </div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join("");

    var wrap = document.createElement("div");
    wrap.innerHTML = html;
    document.body.appendChild(wrap);

    // Parar vídeo ao fechar modal (evita áudio “preso”)
    var modalComo = document.getElementById("fm-login-modal-como");
    var iframe = document.getElementById("fm-login-yt");
    var originalSrc = iframe ? iframe.getAttribute("src") : null;

    function resetYouTube() {
      if (!iframe || !originalSrc) return;
      iframe.setAttribute("src", "");
      setTimeout(function () {
        iframe.setAttribute("src", originalSrc);
      }, 60);
    }

    // BS5
    modalComo.addEventListener("hidden.bs.modal", resetYouTube);
    // BS4/jQuery
    if (window.jQuery) {
      window.jQuery(modalComo).on("hidden.bs.modal", resetYouTube);
    }
  }

  /* =========================================================
     CSS extra para modais (injetado via JS)
     ========================================================= */
  function injectModalStylesOnce() {
    if (document.getElementById("fm-login-modal-styles")) return;

    var css = `
      .fm-video-wrap{
        width:100%;
        border-radius:14px;
        overflow:hidden;
        background:#000;
        box-shadow: rgba(0,0,0,0.18) 0 18px 35px;
      }
      .fm-video-iframe{
        width:100%;
        aspect-ratio:16/9;
        display:block;
      }
      .fm-modal-text p{ margin:0 0 10px; }
      .fm-social-grid{
        display:grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
      }
      .fm-social-card{
        display:flex;
        flex-direction:column;
        gap:8px;
        padding:16px 14px;
        border-radius:16px;
        text-decoration:none;
        border:1px solid rgba(15,23,42,0.10);
        background: rgba(255,255,255,0.96);
        box-shadow: rgba(0,0,0,0.10) 0 14px 28px -18px;
        transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
        color: rgba(15,23,42,0.92);
      }
      .fm-social-card:hover{
        transform: translateY(-1px);
        border-color: rgba(13,110,253,0.25);
        box-shadow: rgba(13,110,253,0.22) 0 14px 28px -18px, rgba(0,0,0,0.12) 0 18px 32px -22px;
      }
      .fm-social-ico{
        width:44px;height:44px;border-radius:14px;
        display:grid;place-items:center;
        background: linear-gradient(180deg, #2f5b6f, #2c5364);
        color:#fff;
        font-weight:800;
        box-shadow: rgba(0,0,0,0.12) 0 12px 20px -16px;
      }
      .fm-social-name{
        font-weight:800;
        font-size:14px;
      }
      .fm-social-sub{
        font-size:12.5px;
        color: rgba(44,49,63,0.75);
      }
      @media (max-width: 992px){
        .fm-social-grid{ grid-template-columns:1fr; }
      }
    `;

    var style = document.createElement("style");
    style.id = "fm-login-modal-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* =========================================================
     Sidepanel injection (AJAX)
     ========================================================= */
  function injectSidePanel(containerEl) {
    if (!containerEl || containerEl.dataset.sidepanelInit === "1") return;
    containerEl.dataset.sidepanelInit = "1";

    containerEl.classList.add("has-sidepanel");

    var panel = document.createElement("aside");
    panel.className = "login-sidepanel";
    panel.setAttribute("aria-label", "Atalhos de ajuda e acesso");
    panel.innerHTML = '<div class="login-sidepanel__loading">Carregando...</div>';
    containerEl.appendChild(panel);

    var url = "https://laurorosasneto.github.io/IME_CEJUR_MOODLE/FAMETRO/digital/login_bot.php";

    fetch(url, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (html) {
        panel.innerHTML = html;
        ensureModals();
        bindPanelActions(panel);
      })
      .catch(function () {
        ensureModals();
      });
  }

  function bindPanelActions(panel) {
    panel.addEventListener("click", function (e) {
      var a = closest(e.target, "a.login-sidepanel__item");
      if (!a) return;

      var action = a.getAttribute("data-action");
      if (!action) return;

      // links tradicionais
      if (action === "link-site" || action === "link-portal") return;

      // modais
      e.preventDefault();

      if (action === "como-acessar") {
        var m1 = document.getElementById("fm-login-modal-como");
        if (m1) showModal(m1);
        return;
      }

      if (action === "problemas-acesso") {
        var m2 = document.getElementById("fm-login-modal-problemas");
        if (m2) showModal(m2);
        return;
      }

      if (action === "redes-sociais") {
        var m3 = document.getElementById("fm-login-modal-redes");
        if (m3) showModal(m3);
        return;
      }
    });
  }

  /* =========================================================
     BOOT com retry (Moodle pode atrasar render)
     ========================================================= */
  function boot(attempt) {
    if (!isLoginPage()) return;

    // 1) select premium
    initPremiumSelect(document);

    // 2) modais css + sidepanel
    injectModalStylesOnce();

    var container = qs("body.pagelayout-login .login-container");
    if (container) {
      injectSidePanel(container);
      return;
    }

    if (attempt < 30) {
      setTimeout(function () { boot(attempt + 1); }, 100);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    boot(0);
  });
})();
