(() => {
  const shell = document.createElement('dialog');
  shell.className = 'player-shell'; shell.setAttribute('aria-label','Игра SpaceRacing');
  shell.innerHTML = '<header class="player-header"><button type="button" class="button outline">← В портфолио</button><span>SpaceRacing</span></header><div class="player-stage"><div class="player-loading"><strong>TINELLAB</strong><progress aria-label="Загрузка приложения"></progress><p>Загрузка приложения…</p><button type="button" class="button outline" hidden>Повторить</button></div></div>';
  document.body.append(shell);
  const stage = shell.querySelector('.player-stage');
  const loading = shell.querySelector('.player-loading');
  const status = loading.querySelector('p');
  const retry = loading.querySelector('button');
  let frame, timer, current, token = 0;
  function close() {
    token++; clearTimeout(timer); frame?.remove(); frame = null;
    shell.close();
    document.querySelector('#project-dialog')?.close();
  }
  function launch() {
    token++; const attempt = token;
    clearTimeout(timer); frame?.remove();
    loading.hidden = false; retry.hidden = true; status.textContent = 'Загрузка приложения…';
    frame = document.createElement('iframe'); frame.title = current.name;
    frame.setAttribute('allow','autoplay'); frame.src = current.launchUrl;
    stage.append(frame);
    timer = setTimeout(() => { if (token === attempt) { status.textContent = 'Приложение не ответило. Попробуйте ещё раз.'; retry.hidden = false; } }, 15000);
  }
  window.addEventListener('message', event => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin) return;
    if (event.data?.type === 'tinellab-game-ready') {
      clearTimeout(timer); loading.hidden = true; frame.focus();
    }
    if (event.data?.type === 'tinellab-game-error') { clearTimeout(timer); status.textContent = 'Не удалось загрузить приложение.'; retry.hidden = false; }
  });
  shell.querySelector('.player-header button').addEventListener('click',close);
  shell.addEventListener('cancel',event => { event.preventDefault(); close(); });
  retry.addEventListener('click',launch);
  window.TinellabPlayer = {
    get active() { return shell.open; },
    open(project) { current = project; shell.setAttribute('aria-label',project.name); shell.querySelector('.player-header span').textContent = project.name; shell.showModal(); launch(); }, close
  };
})();

