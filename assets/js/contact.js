(() => {
  const dialog = document.querySelector('#contact-dialog');
  const form = document.querySelector('#inquiry-form');
  const status = form.querySelector('.form-status');
  let closing = false, timer;
  function dismiss() {
    if (!dialog.open || closing) return;
    closing = true; dialog.classList.add('leaving');
    timer = setTimeout(() => dialog.close(), document.documentElement.dataset.motion === 'reduced' ? 0 : 220);
  }
  document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click',event => {
    event.preventDefault();if(dialog.open)return;clearTimeout(timer);closing=false;dialog.classList.remove('leaving');status.textContent='';dialog.showModal();document.body.classList.add('modal-open');
  }));
  dialog.querySelector('.close').addEventListener('click',dismiss);
  dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dismiss();}});
  dialog.addEventListener('close',()=>{clearTimeout(timer);closing=false;dialog.classList.remove('leaving');if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');});
  form.addEventListener('submit',event=>{
    event.preventDefault();if(!form.reportValidity())return;
    const values=new FormData(form);
    const name=String(values.get('name')).trim(),contact=String(values.get('contact')).trim(),idea=String(values.get('idea')).trim(),email=String(values.get('email')).trim();
    if(!name||!contact||!idea){status.textContent='Заполните имя, контакт и описание проекта.';return;}
    const text=`Здравствуйте, TINELLAB!\n\nМеня зовут: ${name}\nКонтакт: ${contact}${email?'\nПочта: '+email:''}\n\nИдея проекта:\n${idea}`;
    if(values.get('channel')==='email'){
      location.href='mailto:tinellabstudio@gmail.com?subject='+encodeURIComponent('Новый проект / TINELLAB')+'&body='+encodeURIComponent(text);
      status.textContent='Открываем черновик в почтовом приложении. Проверьте текст и отправьте письмо.';
    } else {
      const url='https://t.me/TinellabStudio?text='+encodeURIComponent(text);
      const tg=window.Telegram?.WebApp;
      if(tg?.initData&&tg.isVersionAtLeast?.('7.0'))tg.openTelegramLink(url);else window.open(url,'_blank','noopener,noreferrer');
      status.textContent='Открываем Telegram с черновиком. Проверьте текст и отправьте сообщение.';
    }
  });
})();
