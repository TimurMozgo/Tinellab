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
  form.addEventListener('submit', event => {
    event.preventDefault();
    const t = text => window.TinellabI18n?.translate(text) || text;
    const phoneInput = form.elements.phone;
    const telegramInput = form.elements.telegram;
    phoneInput.setCustomValidity('');
    telegramInput.setCustomValidity('');
    const phone = phoneInput.value.trim();
    const telegram = telegramInput.value.trim();
    const digits = phone.replace(/\D/g, '');
    if (!/^380\d{9}$/.test(digits) || !/^\+?[\d\s().-]+$/.test(phone)) {
      phoneInput.setCustomValidity(t('Введите украинский номер: +380 и 9 цифр.'));
    }
    if (!/^(?:@|https:\/\/t\.me\/)?[a-zA-Z][a-zA-Z0-9_]{4,31}\/?$/.test(telegram)) {
      telegramInput.setCustomValidity(t('Укажите Telegram в формате @username или https://t.me/username.'));
    }
    if (!form.reportValidity()) return;
    const name = form.elements.name.value.trim();
    const idea = form.elements.idea.value.trim();
    if (!name || !idea) {
      status.textContent = t('Заполните имя, телефон, Telegram и описание проекта.');
      return;
    }
    const ukrainian = window.TinellabI18n?.language === 'uk';
    const text = ukrainian
      ? `Вітаю, TINELLAB!\n\nІм’я: ${name}\nТелефон: +${digits}\nTelegram: ${telegram}\n\nПро проєкт:\n${idea}`
      : `Здравствуйте, TINELLAB!\n\nИмя: ${name}\nТелефон: +${digits}\nTelegram: ${telegram}\n\nО проекте:\n${idea}`;
    const url = 'https://t.me/TinellabStudio?text=' + encodeURIComponent(text);
    const tg = window.Telegram?.WebApp;
    if (tg?.initData && tg.isVersionAtLeast?.('7.0')) tg.openTelegramLink(url);
    else window.open(url, '_blank', 'noopener,noreferrer');
    status.textContent = t('Открываем Telegram с черновиком. Проверьте текст и отправьте сообщение.');
  });
  for (const field of [form.elements.phone, form.elements.telegram]) {
    field.addEventListener('input', () => field.setCustomValidity(''));
  }

})();
