(() => {
  const root = document.documentElement;
  const loader = document.querySelector('#boot');
  const bar = loader.querySelector('[role="progressbar"]');
  const label = loader.querySelector('.boot-label');
  let observer;
  let started = false;
  function progress(value, text) {
    bar.setAttribute('aria-valuenow', value);
    bar.firstElementChild.style.transform = `scaleX(${value / 100})`;
    label.textContent = text;
  }
  root.dataset.motion = 'full';
  // Reveal only after loader is dismissed; unobserved content stays accessible without JS.
  function reveal() {
    const nodes = document.querySelectorAll('.hero > *, .section-heading, .tabs, .grid, .approach > *, .contact > *');
    if (!('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: .08 });
    nodes.forEach((node, i) => {
      node.classList.add('reveal');
      node.style.setProperty('--reveal-delay', `${Math.min(i % 4, 3) * 65}ms`);
      observer.observe(node);
    });
  }
  async function ready() {
    if (started) return;
    started = true;
    progress(75, 'Каталог готов');
    await document.fonts.ready;
    await Promise.all([...document.images].filter(img => img.loading !== 'lazy').map(img => img.decode().catch(() => {})));
    requestAnimationFrame(() => {
      progress(100, 'Готово');
      requestAnimationFrame(() => {
        clearTimeout(window.bootDeadline);
        loader.classList.add('done');
        reveal();
        setTimeout(() => { loader.hidden = true; }, root.dataset.motion === 'full' ? 360 : 0);
      });
    });
  }
  progress(40, 'Оформление готово');
  window.addEventListener('tinellab-ready', ready, {once:true});
  window.addEventListener('telegram-ready', () => window.Telegram?.WebApp?.ready(), {once:true});
})();

