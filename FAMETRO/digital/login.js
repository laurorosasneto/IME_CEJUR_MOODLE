/* ======================================================================
   login.js — Select premium customizado para a página de login
   Carregado no <head> via additionalhtmlhead.
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

  function initCustomSelect(selectEl) {
    if (!selectEl || selectEl.dataset.customselectInit === "1") return;
    selectEl.dataset.customselectInit = "1";

    // Esconde o select nativo (sem remover do DOM)
    selectEl.classList.add("customselect-native");

    // Cria wrapper
    var wrapper = document.createElement("div");
    wrapper.className = "customselect";
    wrapper.setAttribute("data-customselect", "1");

    // Trigger acessível
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

    // Menu
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

            // dispara change no select real
            selectEl.dispatchEvent(new Event("change", { bubbles: true }));

            closeMenu();
          });

          menu.appendChild(item);
        })(selectEl.options[i]);
      }
    }

    buildItems();

    // Insere logo após o select
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

    // Fecha ao clicar fora
    document.addEventListener("click", function (e) {
      if (!closest(e.target, '[data-customselect="1"]')) closeMenu();
    });

    // Se o select nativo mudar por qualquer motivo, atualiza UI
    selectEl.addEventListener("change", function () {
      var opt = selectEl.options[selectEl.selectedIndex];
      if (opt) label.textContent = opt.text;
      buildItems();
    });
  }

  function boot(attempt) {
    if (!isLoginPage()) return;

    var selectEl = document.getElementById("entrarComo");
    if (selectEl) {
      initCustomSelect(selectEl);
      return;
    }

    // Retry curto (caso o DOM ainda não tenha o select)
    if (attempt < 30) {
      setTimeout(function () { boot(attempt + 1); }, 100);
    }
  }

  // Como o JS está no <head>, esperamos DOM pronto
  document.addEventListener("DOMContentLoaded", function () {
    boot(0);
  });
})();
