/* ======================================================================
   login.js — Select premium customizado para a página de login
   - Mantém o <select> real (Moodle) para POST
   - Cria UI moderna com bordas arredondadas e sombra
   ====================================================================== */

(function () {
  function closest(el, selector) {
    while (el && el.nodeType === 1) {
      if (el.matches(selector)) return el;
      el = el.parentElement;
    }
    return null;
  }

  function initCustomSelect(selectEl) {
    // Evita duplicar
    if (selectEl.dataset.customselectInit === "1") return;
    selectEl.dataset.customselectInit = "1";

    // Marca o select nativo para CSS esconder sem remover
    selectEl.classList.add("customselect-native");

    // Wrapper
    var wrapper = document.createElement("div");
    wrapper.className = "customselect";
    wrapper.setAttribute("data-customselect", "1");

    // Trigger (acessível por teclado)
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
    menu.setAttribute("tabindex", "-1");

    // Itens
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

            // Dispara change no select real (caso algum JS do Moodle dependa)
            var evt = new Event("change", { bubbles: true });
            selectEl.dispatchEvent(evt);

            closeMenu();
          });

          menu.appendChild(item);
        })(selectEl.options[i]);
      }
    }

    buildItems();

    // Inserção: coloca o wrapper logo após o select
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

    // Click no trigger
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      toggleMenu();
    });

    // Teclado: Enter/Espaço abre/fecha, Esc fecha
    trigger.addEventListener("keydown", function (e) {
      var key = e.key || e.code;
      if (key === "Enter" || key === " " || key === "Spacebar") {
        e.preventDefault();
        toggleMenu();
      } else if (key === "Escape") {
        e.preventDefault();
        closeMenu();
      }
    });

    // Fecha ao clicar fora
    document.addEventListener("click", function (e) {
      if (!closest(e.target, '[data-customselect="1"]')) {
        closeMenu();
      }
    });

    // Se o select real mudar por qualquer motivo, atualiza UI
    selectEl.addEventListener("change", function () {
      var opt = selectEl.options[selectEl.selectedIndex];
      if (opt) label.textContent = opt.text;
      buildItems();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Seu select específico do login:
    var selectEl = document.getElementById("entrarComo");
    if (selectEl) initCustomSelect(selectEl);
  });
})();
