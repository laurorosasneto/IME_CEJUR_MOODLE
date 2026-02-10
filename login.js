/* ======================================================================
   login.js — Ajustes opcionais do login (não invasivo)
   ====================================================================== */
(function () {
  // Garante que só roda no login
  if (!document.body.classList.contains('pagelayout-login')) return;

  // Exemplo: cria uma camada decorativa no fundo (sem mexer no HTML do core)
  const bg = document.createElement('div');
  bg.className = 'login-bg-layer';
  bg.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bg);
})();
