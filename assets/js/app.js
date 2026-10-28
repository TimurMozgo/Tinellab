(() => {
  const projects = window.TINELLAB_PROJECTS;
  const grid = document.querySelector('#project-grid');
  const dialog = document.querySelector('#project-dialog');
  const details = document.querySelector('#project-details');
  let tg = window.Telegram?.WebApp;
  let closing = false;
  let closeTimer;
  tg?.ready();
  function closeProject() {
    if (window.TinellabPlayer?.active) { window.TinellabPlayer.close(); return; }
    if (!dialog.open || closing) return;
    closing = true;
    dialog.classList.add('leaving');
    closeTimer = setTimeout(() => dialog.close(), document.documentElement.dataset.motion === 'reduced' ? 0 : 220);
  }
  function openProject(project) {
    details.replaceChildren();
    const cover = document.createElement('div');
    cover.className = `cover ${project.coverClass}`;
    cover.textContent = project.monogram;
    const body = document.createElement('div'); body.className = 'detail-body';
    const label = document.createElement('p'); label.className = 'eyebrow'; label.textContent = project.label;
    const title = document.createElement('h2'); title.id = 'project-title'; title.textContent = project.name;
    const description = document.createElement('p'); description.textContent = project.detail;
    const note = document.createElement('p'); note.className = 'integration-note'; note.textContent = 'Запуск приложения пока не подключён';
    body.append(label, title, description);
    dialog.classList.toggle('has-gallery', Boolean(project.gallery));
    for (const item of project.gallery || []) {
      const row = document.createElement('section'); row.className = 'case-row';
      const link = document.createElement('a'); link.href = item.image; link.target = '_blank'; link.rel = 'noopener'; link.setAttribute('aria-label', 'Увеличить: ' + item.title);
      const img = document.createElement('img'); img.src = item.image; img.alt = item.title + ' — ' + project.name; img.loading = 'lazy'; img.width = 390; img.height = 650; link.append(img);
      const copy = document.createElement('div'); const heading = document.createElement('h3'); heading.textContent = item.title;
      const text = document.createElement('p'); text.textContent = item.text; copy.append(heading,text); row.append(link,copy); body.append(row);
    }
    if (project.launchUrl) {
      const play = document.createElement('button'); play.className = 'button gold'; play.textContent = project.category === 'games' ? 'Играть ↗' : 'Открыть проект ↗';
      play.addEventListener('click', () => window.TinellabPlayer.open(project)); body.append(play);
    } else body.append(note);
    details.append(cover, body);
    dialog.showModal(); document.body.classList.add('modal-open'); tg?.BackButton?.show();
  }
  function render(category) {
    grid.replaceChildren();
    projects.filter(project => project.category === category).forEach(project => {
      const card = document.createElement('button'); card.type = 'button'; card.className = 'project-card';
      const cover = document.createElement('div'); cover.className = `cover ${project.coverClass}`;
      const type = document.createElement('span'); type.className = 'cover-type'; type.textContent = project.type;
      const mark = document.createElement('strong'); mark.textContent = project.monogram;
      const caption = document.createElement('span'); caption.className = 'cover-caption'; caption.textContent = 'TINELLAB / ' + project.name;
      cover.append(type, mark, caption);
      (project.gallery || []).slice(0,2).forEach((item,index)=>{
        const screenshot=document.createElement('img');screenshot.src=item.image;screenshot.alt='';screenshot.loading='lazy';screenshot.decoding='async';screenshot.className='project-preview'+(index?' project-preview-secondary':'');cover.append(screenshot);
      });
      const body = document.createElement('div'); body.className = 'card-body';
      const label = document.createElement('span'); label.className = 'badge'; label.textContent = project.label;
      const title = document.createElement('h3'); title.textContent = project.name;
      const description = document.createElement('p'); description.textContent = project.description;
      const action = document.createElement('span'); action.className = 'card-action'; action.textContent = '↗'; action.setAttribute('aria-hidden','true');
      body.append(label, title, description, action); card.append(cover, body);
      card.addEventListener('click', () => openProject(project)); grid.append(card);
    });
  }
  let categoryVersion = 0;
  let currentCategory = 'completed';
  document.querySelectorAll('[data-category]').forEach(tab => tab.addEventListener('click', async () => {
    const nextCategory = tab.dataset.category;
    if (nextCategory === currentCategory) return;
    currentCategory = nextCategory;
    const version = ++categoryVersion;
    document.querySelectorAll('[data-category]').forEach(item => item.setAttribute('aria-pressed', String(item === tab)));
    grid.getAnimations().forEach(animation => animation.cancel());
    const oldHeight = grid.getBoundingClientRect().height;
    grid.setAttribute('aria-busy', 'true'); grid.inert = true;
    try {
      await grid.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(9px)'}],{duration:190,easing:'ease-in',fill:'forwards'}).finished;
    } catch {}
    if (version !== categoryVersion) return;
    grid.getAnimations().forEach(animation => animation.cancel());
    render(nextCategory);
    const newHeight = grid.getBoundingClientRect().height;
    const appear = grid.animate([{opacity:0,transform:'translateY(15px)'},{opacity:1,transform:'translateY(0)'}],{duration:430,easing:'cubic-bezier(.2,.7,.2,1)'});
    const resize = grid.animate([{height:oldHeight+'px'},{height:newHeight+'px'}],{duration:430,easing:'cubic-bezier(.2,.7,.2,1)'});
    grid.style.overflow = 'clip';
    try { await Promise.all([appear.finished,resize.finished]); } catch {}
    if (version !== categoryVersion) return;
    grid.style.overflow = ''; grid.inert = false; grid.removeAttribute('aria-busy');
  }));
  dialog.querySelector('.close').addEventListener('click', closeProject);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeProject(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeProject(); } });
  dialog.addEventListener('close', () => { clearTimeout(closeTimer); closing = false; dialog.classList.remove('leaving'); document.body.classList.remove('modal-open'); tg?.BackButton?.hide(); });
  function connectTelegram() {
    tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.BackButton?.offClick(closeProject);
    tg?.BackButton?.onClick(closeProject);
    if (dialog.open) tg?.BackButton?.show();
  }
  window.addEventListener('telegram-ready', connectTelegram, {once:true});
  connectTelegram();
  render('completed');
  window.dispatchEvent(new Event('tinellab-ready'));
})();








