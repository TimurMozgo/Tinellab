(() => {
  const button = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#atelier-menu');
  const mobile = matchMedia('(max-width: 900px)');
  function setOpen(open, focus = false) {
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
    nav.inert = mobile.matches && !open;
    if (focus) button.focus();
  }
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => { if(event.target.closest('a') && mobile.matches) setOpen(false,true); });
  document.addEventListener('keydown', event => { if(event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') setOpen(false,true); });
  document.addEventListener('click', event => { if(!event.target.closest('.logo-and__nav') && mobile.matches) setOpen(false); });
  mobile.addEventListener('change', () => setOpen(false));
  setOpen(false);
  document.documentElement.classList.add('menu-enabled');
})();
