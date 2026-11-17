(() => {
  const projects = window.TINELLAB_PROJECTS;
  const grid = document.querySelector('#project-grid');
  const dialog = document.querySelector('#project-dialog');
  const details = document.querySelector('#project-details');
  const screenshotViewer = document.createElement('dialog');
  screenshotViewer.className = 'screenshot-viewer';
  screenshotViewer.setAttribute('aria-label', 'Просмотр скриншота');
  const closeScreenshot = document.createElement('button');
  closeScreenshot.type = 'button';
  closeScreenshot.className = 'close';
  closeScreenshot.setAttribute('aria-label', 'Закрыть скриншот');
  closeScreenshot.textContent = '×';
  const screenshot = document.createElement('img');
  screenshotViewer.append(closeScreenshot, screenshot);
  document.body.append(screenshotViewer);
  closeScreenshot.addEventListener('click', () => screenshotViewer.close());
  screenshotViewer.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    screenshotViewer.close();
  });
  screenshotViewer.addEventListener('click', event => {
    if (event.target === screenshotViewer) screenshotViewer.close();
  });

  let tg = window.Telegram?.WebApp;
  let closing = false;
  let closeTimer;
  tg?.ready();
  function closeProject() {
    if (screenshotViewer.open) { screenshotViewer.close(); return; }
    if (window.TinellabPlayer?.active) { window.TinellabPlayer.close(); return; }
    if (!dialog.open || closing) return;
    closing = true;
    dialog.classList.add('leaving');
    closeTimer = setTimeout(() => dialog.close(), document.documentElement.dataset.motion === 'reduced' ? 0 : 220);
  }
  function createCover(project, isCard = false) {
    const cover = document.createElement('div');
    cover.className = 'cover';
    if (project.coverImage && isCard) {
      cover.classList.add('cover-with-art', `cover-${project.id}`);
      const image = document.createElement('img');
      image.src = project.coverImage;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      cover.append(image);
      return cover;
    }
    if (project.coverClass) cover.classList.add(project.coverClass);
    return cover;
  }
  function openProject(project) {
    details.replaceChildren();
    const cover = createCover(project);
    cover.textContent = project.monogram || project.name;
    const body = document.createElement('div'); body.className = 'detail-body';
    const label = document.createElement('p'); label.className = 'eyebrow'; label.textContent = project.label;
    const title = document.createElement('h2'); title.id = 'project-title'; title.textContent = project.name;
    const description = document.createElement('p'); description.textContent = project.detail;
    const note = document.createElement('p'); note.className = 'integration-note'; note.textContent = 'Запуск приложения пока не подключён';
    body.append(label, title, description);
    dialog.classList.toggle('has-gallery', Boolean(project.gallery));
    for (const item of project.gallery || []) {
      const row = document.createElement('section'); row.className = 'case-row';
      const thumbnail = document.createElement('button');
      thumbnail.type = 'button';
      thumbnail.className = 'screenshot-thumbnail';
      thumbnail.setAttribute('aria-label', 'Увеличить: ' + item.title);
      thumbnail.addEventListener('click', () => {
        screenshot.src = item.image;
        screenshot.alt = item.title + ' — ' + project.name;
        screenshotViewer.showModal();
        closeScreenshot.focus();
      });
      const img = document.createElement('img'); img.src = item.image; img.alt = item.title + ' — ' + project.name; img.loading = 'lazy'; img.width = 390; img.height = 650; thumbnail.append(img);
      const copy = document.createElement('div'); const heading = document.createElement('h3'); heading.textContent = item.title;
      const text = document.createElement('p'); text.textContent = item.text; copy.append(heading,text); row.append(thumbnail,copy); body.append(row);
    }
    const launch = dialog.querySelector('.project-launch');
    launch.hidden = !project.launchUrl;
    launch.textContent = project.category === 'games' ? 'Играть ↗' : 'Открыть приложение ↗';
    launch.onclick = project.launchUrl ? () => window.TinellabPlayer.open(project) : null;
    if (!project.launchUrl) body.append(note);
    details.append(cover, body);
    dialog.showModal(); dialog.scrollTop = 0; document.body.classList.add('modal-open'); tg?.BackButton?.show();
  }
  function render(category) {
    grid.replaceChildren();
    projects.filter(project => category === 'templates' || project.category === category).forEach(project => {
      const card = document.createElement('button'); card.type = 'button'; card.className = 'project-card';
      const cover = createCover(project, true);
      if (!project.coverImage) {
      const type = document.createElement('span'); type.className = 'cover-type'; type.textContent = project.type;
      const mark = document.createElement('strong'); mark.textContent = project.monogram;
      const caption = document.createElement('span'); caption.className = 'cover-caption'; caption.textContent = 'TINELLAB / ' + project.name;
      cover.append(type, mark, caption);
      (project.gallery || []).slice(0,2).forEach((item,index)=>{
        const screenshot=document.createElement('img');screenshot.src=item.image;screenshot.alt='';screenshot.loading='lazy';screenshot.decoding='async';screenshot.className='project-preview'+(index?' project-preview-secondary':'');cover.append(screenshot);
      });
      }
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
  let currentCategory = 'templates';
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
  document.querySelectorAll('[data-category]').forEach(tab=>{const count=tab.dataset.category==='templates'?projects.length:projects.filter(project=>project.category===tab.dataset.category).length;tab.querySelector('span').textContent=String(count).padStart(2,'0');});
  render('templates');
  window.dispatchEvent(new Event('tinellab-ready'));
})();
