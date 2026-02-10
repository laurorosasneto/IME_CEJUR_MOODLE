/* ======================================================================
   login.js — Login enhancements:
   1) Select premium customizado (#entrarComo)
   2) Sidepanel de atalhos (carregado via AJAX)
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
     SELECT PREMIUM
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
     SIDEPANEL (AJAX)
     ========================================================= */
  function injectSidePanel(containerEl) {
    if (!containerEl || containerEl.dataset.sidepanelInit === "1") return;
    containerEl.dataset.sidepanelInit = "1";

    // Marca layout em 2 colunas via CSS
    containerEl.classList.add("has-sidepanel");

    // Cria painel com loading
    var panel = document.createElement("aside");
    panel.className = "login-sidepanel";
    panel.setAttribute("aria-label", "Atalhos de ajuda e acesso");
    panel.innerHTML = '<div class="login-sidepanel__loading">Carregando atalhos...</div>';

    // Insere ao lado do loginform (dentro do .login-container)
    // A loginform já existe; o CSS grid fará o layout.
    containerEl.appendChild(panel);

    var url = "https://laurorosasneto.github.io/IME_CEJUR_MOODLE/FAMETRO/digital/login_bot.php";

    fetch(url, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (html) {
        // Segurança simples: injeta o HTML como veio (controle seu endpoint)
        panel.innerHTML = html;

        // Se o endpoint não vier com estrutura esperada, cai para um template interno
        if (!panel.querySelector(".login-sidepanel__grid")) {
          panel.innerHTML = getFallbackPanelHtml();
        }
      })
      .catch(function () {
        panel.innerHTML = getFallbackPanelHtml();
      });
  }

  function getFallbackPanelHtml() {
    // Template interno caso o AJAX falhe — links ficam como "#"
    return [
      '<div class="login-sidepanel__title">Acessos rápidos</div>',
      '<div class="login-sidepanel__grid">',

      itemHtml('#', 'Como acessar', 'Guia rápido de acesso', iconKey()),
      itemHtml('#', 'Problemas de acesso', 'Recuperação e suporte', iconHelp()),
      itemHtml('#', 'Site', 'Portal institucional', iconGlobe()),
      itemHtml('#', 'Portal do Aluno', 'Serviços e atendimento', iconUser()),

      '</div>'
    ].join('');
  }

  function itemHtml(href, label, sub, iconSvg) {
    return [
      '<a class="login-sidepanel__item" href="', href, '">',
        '<div class="login-sidepanel__icon">', iconSvg, '</div>',
        '<div class="login-sidepanel__textwrap">',
          '<div class="login-sidepanel__label">', escapeHtml(label), '</div>',
          '<div class="login-sidepanel__sub">', escapeHtml(sub), '</div>',
        '</div>',
      '</a>'
    ].join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* Ícones SVG inline (brancos via CSS fill) */
  function iconKey() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 14a4.5 4.5 0 1 1 3.93-2.3l2.07 2.07h2v2h-2v2h-2v-2.17l-1.2-1.2A4.48 4.48 0 0 1 7.5 14Zm0-2.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>';
  }
  function iconHelp() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 15a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 12 17Zm1.6-5.9c-.9.6-1.1.9-1.1 1.9v.5h-2v-.7c0-1.7.6-2.5 2-3.4.9-.6 1.2-.9 1.2-1.5 0-.8-.7-1.3-1.7-1.3-1 0-1.7.5-1.8 1.5H8.2C8.4 6.2 10 5 12 5c2.2 0 3.8 1.2 3.8 3 0 1.4-.8 2.2-2.2 3.1Z"/></svg>';
  }
  function iconGlobe() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm7.7 9h-3.1a15 15 0 0 0-1.3-5A8.03 8.03 0 0 1 19.7 11ZM12 4c.9 0 2.2 2.1 2.8 7H9.2C9.8 6.1 11.1 4 12 4ZM4.3 13h3.1a15 15 0 0 0 1.3 5A8.03 8.03 0 0 1 4.3 13Zm0-2A8.03 8.03 0 0 1 8.7 6a15 15 0 0 0-1.3 5H4.3Zm7.7 9c-.9 0-2.2-2.1-2.8-7h5.6c-.6 4.9-1.9 7-2.8 7Zm3.3-2a15 15 0 0 0 1.3-5h3.1a8.03 8.03 0 0 1-4.4 5Z"/></svg>';
  }
  function iconUser() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.4 0-8 2.3-8 5v1h16v-1c0-2.7-3.6-5-8-5Z"/></svg>';
  }

  /* =========================================================
     BOOT
     ========================================================= */
  function boot(attempt) {
    if (!isLoginPage()) return;

    var container = document.querySelector("body.pagelayout-login .login-container");
    var selectEl = document.getElementById("entrarComo");

    if (selectEl) initCustomSelect(selectEl);
    if (container) injectSidePanel(container);

    // Retry curto se algo ainda não existir
    if ((!container || !selectEl) && attempt < 30) {
      setTimeout(function () { boot(attempt + 1); }, 100);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    boot(0);
  });
})();
