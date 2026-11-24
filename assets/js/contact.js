(() => {
  const dialog = document.querySelector('#contact-dialog');
  const form = document.querySelector('#inquiry-form');
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('[type="submit"]');
  const success = dialog.querySelector('.inquiry-success');
  const fields = [...form.querySelectorAll('input, textarea')];
  const t = text => window.TinellabI18n?.translate(text) || text;
  let closing = false;
  let timer;
  let sending = false;
  let requestId;
  let lastPayload;

  function dismiss() {
    if (!dialog.open || closing || sending) return;
    closing = true;
    dialog.classList.add('leaving');
    timer = setTimeout(() => dialog.close(), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220);
  }

  function validate(field) {
    field.setCustomValidity('');
    const value = field.value.trim();
    if (field.name === 'name' && !value) {
      field.setCustomValidity(t('Укажите ваше имя.'));
    }
    if (field.name === 'phone') {
      const digits = value.replace(/\D/g, '');
      if (!/^380\d{9}$/.test(digits) || !/^\+?[\d\s().-]+$/.test(value)) {
        field.setCustomValidity(t('Введите украинский номер: +380 и 9 цифр.'));
      }
    }
    const valid = field.validity.valid;
    field.classList.toggle('field-valid', Boolean(value) && valid);
    field.classList.toggle('field-invalid', !valid);
    field.setAttribute('aria-invalid', String(!valid));
    return valid;
  }

  for (const field of fields) {
    field.addEventListener('input', () => {
      status.textContent = '';
      validate(field);
    });
    field.addEventListener('blur', () => validate(field));
  }

  document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    if (dialog.open) return;
    clearTimeout(timer);
    closing = false;
    dialog.classList.remove('leaving');
    status.textContent = '';
    success.hidden = true;
    dialog.querySelector('.contact-form-inner').hidden = false;
    dialog.showModal();
    document.body.classList.add('modal-open');
  }));
  dialog.querySelector('.close').addEventListener('click', dismiss);
  success.querySelector('button').addEventListener('click', dismiss);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    dismiss();
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dismiss();
  });
  dialog.addEventListener('close', () => {
    clearTimeout(timer);
    closing = false;
    dialog.classList.remove('leaving');
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal-open');
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    const valid = fields.map(validate).every(Boolean);
    if (!valid) {
      form.querySelector('.field-invalid')?.focus();
      return;
    }
    const endpoint = document.querySelector('meta[name="inquiry-endpoint"]')?.content;
    if (!endpoint) {
      status.textContent = t('Заявка не отправлена. Приём через форму ещё не подключён.');
      return;
    }
    const payload = {
      name: form.elements.name.value.trim(),
      phone: '+' + form.elements.phone.value.replace(/\D/g, ''),
      idea: form.elements.idea.value.trim(),
      language: window.TinellabI18n?.language || 'ru'
    };
    const serialized = JSON.stringify(payload);
    if (serialized !== lastPayload) {
      requestId = crypto.randomUUID();
      lastPayload = serialized;
    }
    sending = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = t('Отправляем заявку…');
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Idempotency-Key': requestId},
        body: serialized,
        signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error('Inquiry was not accepted');
      dialog.querySelector('.contact-form-inner').hidden = true;
      success.hidden = false;
      dialog.scrollTop = 0;
      success.querySelector('h2').focus();
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        success.animate([{opacity: 0, transform: 'translateY(12px)'}, {opacity: 1, transform: 'none'}], {
          duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)'
        });
      }
      form.reset();
      requestId = undefined;
      lastPayload = undefined;
      fields.forEach(field => {
        field.classList.remove('field-valid', 'field-invalid');
        field.removeAttribute('aria-invalid');
        field.setCustomValidity('');
      });
    } catch {
      status.textContent = t('Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      clearTimeout(deadline);
      sending = false;
      submit.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
})();
