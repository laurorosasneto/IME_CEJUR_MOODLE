/* ======================================================================
   login.js — Login enhancements (Moodle login page)
   Carregado no <head> via additionalhtmlhead.

   Inclui:
   1) Select premium customizado (fake select) — mantido
   2) Sidepanel (AJAX) com 5 botões
   3) Modais Bootstrap carregados via fetch(modals.php)
   4) CSS extra apenas para modais (injetado via JS)
   ====================================================================== */

(function () {
  function isLoginPage() {
    return document.body && document.body.classList.contains("pagelayout-login");
  }

  function closest(el, selector) {
    while (el && el.nodeType === 1) {
      if (el.matches(selector)) return el;
      el = el.parentElement;
    }
    return null;
  }

  /* =========================================================
     1) SELECT PREMIUM CUSTOMIZADO — seu código (mantido)
     ========================================================= */
  function initCustomSelect(selectEl) {
    if (!selectEl || selectEl.dataset.customselectInit === "1") return;
    selectEl.dataset.customselectInit = "1";

    selectEl.classList.add("customselect-native");

    var wrapper = document.createElement("div");
    wrapper.className = "customselect";
    wrapper.setAttribute("data-customselect", "1");

    var trigger = document.createElement("div");
    trigger.className = "customselect__trigger";
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("role", "button");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    var label = document.createElement("span");
    label.className = "customselect__label";
    label.textContent = selectEl.options[selectEl.selectedIndex]
      ? selectEl.options[selectEl.selectedIndex].text
      : "";

    var chev = document.createElement("span");
    chev.className = "customselect__chev";
    chev.setAttribute("aria-hidden", "true");

    trigger.appendChild(label);
    trigger.appendChild(chev);

    var menu = document.createElement("div");
    menu.className = "customselect__menu";
    menu.setAttribute("role", "listbox");

    function buildItems() {
      menu.innerHTML = "";
      for (var i = 0; i < selectEl.options.length; i++) {
        (function (opt) {
          var item = document.createElement("div");
          item.className = "customselect__item";
          item.setAttribute("role", "option");
          item.setAttribute("data-value", opt.value);
          item.textContent = opt.text;

          if (opt.selected) item.classList.add("is-selected");

          item.addEventListener("click", function () {
            selectEl.value = opt.value;
            label.textContent = opt.text;

            var all = menu.querySelectorAll(".customselect__item");
            for (var k = 0; k < all.length; k++) all[k].classList.remove("is-selected");
            item.classList.add("is-selected");

            selectEl.dispatchEvent(new Event("change", { bubbles: true }));
            closeMenu();
          });

          menu.appendChild(item);
        })(selectEl.options[i]);
      }
    }

    buildItems();

    selectEl.parentNode.insertBefore(wrapper, selectEl.nextSibling);
    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);

    function openMenu() {
      wrapper.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    }

    function closeMenu() {
      wrapper.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    }

    function toggleMenu() {
      if (wrapper.classList.contains("is-open")) closeMenu();
      else openMenu();
    }

    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    trigger.addEventListener("keydown", function (e) {
      var key = e.key || e.code;

      if (key === "Enter" || key === " " || key === "Spacebar") {
        e.preventDefault();
        toggleMenu();
        return;
      }

      if (key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }
    });

    document.addEventListener("click", function (e) {
      if (!closest(e.target, '[data-customselect="1"]')) closeMenu();
    });

    selectEl.addEventListener("change", function () {
      var opt = selectEl.options[selectEl.selectedIndex];
      if (opt) label.textContent = opt.text;
      buildItems();
    });
  }

  /* =========================================================
     Bootstrap modal helper (BS4 / BS5)
     ========================================================= */
  function showModal(modalEl) {
    if (window.bootstrap && window.bootstrap.Modal) {
      var inst = window.bootstrap.Modal.getOrCreateInstance(modalEl, { backdrop: true, focus: true });
      inst.show();
      return;
    }
    if (window.jQuery && window.jQuery.fn && window.jQuery.fn.modal) {
      window.jQuery(modalEl).modal("show");
      return;
    }
    modalEl.style.display = "block";
    modalEl.classList.add("show");
  }

  /* =========================================================
     Modais via fetch(modals.php)
     ========================================================= */
  var MODALS_URL = "https://laurorosasneto.github.io/IME_CEJUR_MOODLE/FAMETRO/digital/modals.php";

  function ensureModalsFromRemote() {
    if (document.getElementById("fm-login-modal-como")) return Promise.resolve(true);
    if (document.body.dataset.fmModalsLoading === "1") return Promise.resolve(false);

    document.body.dataset.fmModalsLoading = "1";

    return fetch(MODALS_URL, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (html) {
        var wrap = document.createElement("div");
        wrap.id = "fm-login-modals-wrap";
        wrap.innerHTML = html;
        document.body.appendChild(wrap);

        wireModalCleanup();
        return true;
      })
      .catch(function () {
        return false;
      })
      .finally(function () {
        document.body.dataset.fmModalsLoading = "0";
      });
  }

  // Evita áudio preso: reseta o iframe do YouTube quando o modal fecha
  function wireModalCleanup() {
    var modalComo = document.getElementById("fm-login-modal-como");
    var iframe = document.getElementById("fm-login-yt");
    if (!modalComo || !iframe) return;

    var originalSrc = iframe.getAttribute("src");
    if (!originalSrc) return;

    function resetYouTube() {
      iframe.setAttribute("src", "");
      setTimeout(function () {
        iframe.setAttribute("src", originalSrc);
      }, 60);
    }

    modalComo.addEventListener("hidden.bs.modal", resetYouTube);
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

        injectModalStylesOnce();

        // pré-carrega os modais (opcional, mas dá sensação “premium”)
        ensureModalsFromRemote();

        bindPanelActions(panel);
      })
      .catch(function () {
        // silencioso
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

      e.preventDefault();

      // garante modais carregados antes de abrir
      ensureModalsFromRemote().then(function () {
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
    });
  }

  /* =========================================================
     BOOT (JS no <head>) — retry curto
     ========================================================= */
  function boot(attempt) {
    if (!isLoginPage()) return;

    // Select custom
    var selectEl = document.getElementById("entrarComo");
    if (selectEl) initCustomSelect(selectEl);

    // Painel
    var container = document.querySelector("body.pagelayout-login .login-container");
    if (container) injectSidePanel(container);

    if (attempt < 30) {
      setTimeout(function () { boot(attempt + 1); }, 100);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    boot(0);
  });
})();
