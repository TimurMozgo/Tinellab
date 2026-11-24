(() => {
  'use strict';
  const F = () => window.F;
  const page = () => document.getElementById('shopPage');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const el = (name, attrs, inner) => '<' + name + ' ' + attrs + '>' + inner + '</' + name + '>';
  const slots = ['09:00–12:00','12:00–15:00','15:00–18:00','18:00–21:00'];
  const labels = {buyer:'Ім’я замовника', phone:'Номер телефону', address:'Адреса доставки', date:'Дата доставки', time:'Час доставки', comment:'Коментар до замовлення'};
  const button = (caption,action,cls='sf-primary') => '<button type="button" class="' + cls + '" data-shop="' + action + '">' + caption + '</button>';
  const money = n => esc(F().money(n));
  const draftKey = 'flora.order.draft.v1';
  let draft = {}, pending = null, accountTask = null, orders = null, view = '', ticket = 0, sending = false, dialog = null, focusReturn = null, timer = null, showAll = false;
  try { draft = JSON.parse(sessionStorage.getItem(draftKey)) || {}; } catch {}
  function remember() { try { sessionStorage.setItem(draftKey,JSON.stringify(draft)); } catch {} }
  function kyiv() {
    const p = Object.fromEntries(new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(o => [o.type,o.value]));
    return {day:p.year+'-'+p.month+'-'+p.day,time:p.hour+':'+p.minute};
  }
  const formatDay = date => new Date(date+'T12:00:00Z').toLocaleDateString('uk-UA',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Kyiv'});
  function lines() {
    return F().cart.flatMap(r => {
      const p = F().products.find(p => p.id === r.id);
      return p ? [{...r,name:p.name,image:p.image,price:F().price(p,r.size)}] : [];
    });
  }
  const total = items => items.reduce((n,r) => n+r.price*r.qty,0);
  const summaryRows = items => items.map(r => '<div class="sf-order-line"><span>'+esc(r.name)+' <small>'+esc(r.size)+' × '+r.qty+'</small></span><b>'+money(r.price*r.qty)+'</b></div>').join('');
  function empty(title,body,action=true) {
    return '<div class="sf-empty"><span class="sf-flower" aria-hidden="true">✿</span><h3>'+title+'</h3><p>'+body+'</p>'+(action ? button('До букетів','home','sf-secondary') : '')+'</div>';
  }
  let accountKey;
  try {accountKey=localStorage.getItem('flora.account.v1');} catch {}
  async function api(opts={}) {
    let res;
    try { res=await fetch('/api/orders',{credentials:'same-origin',...opts,headers:{...opts.headers,...(accountKey?{Authorization:'Bearer '+accountKey}:{})}}); }
    catch { throw Error('Перевірте інтернет-з’єднання та спробуйте ще раз.'); }
    let data;
    try { data=await res.json(); } catch { throw Error('Сервіс замовлень тимчасово недоступний.'); }
    if (!res.ok) throw Object.assign(Error(data.message || 'Не вдалося зберегти замовлення.'),{fields:data.errors,status:res.status});
    if (data.accountKey) {
      accountKey=data.accountKey;
      try {localStorage.setItem('flora.account.v1',accountKey);} catch {}
    }
    return data;
  }
  function account(refresh=false) {
    if (accountTask) return accountTask;
    if (!refresh && orders) return Promise.resolve(orders);
    accountTask = api().then(r => {
      if (!Array.isArray(r.orders)) throw Error('Не вдалося завантажити замовлення.');
      orders=r.orders;return orders;
    }).finally(() => { accountTask=null; });
    return accountTask;
  }
  const head = title => '<header class="sf-heading"><h1>'+title+'</h1></header>';
  function cart() {
    const items = lines();
    if (!items.length) return head('Кошик')+empty('Кошик поки порожній','Оберіть букет, і він з’явиться тут.');
    return head('Кошик')+'<div class="sf-columns"><div class="sf-cart-list">'+items.map(r =>
      '<article class="sf-cart-item"><button class="sf-photo" data-open="'+r.id+'" data-cart-size="'+r.size+'" aria-label="Відкрити '+esc(r.name)+'"><img src="'+esc(r.image)+'" alt=""></button><div class="sf-cart-info"><button class="sf-name" data-open="'+r.id+'" data-cart-size="'+r.size+'">'+esc(r.name)+'</button><span class="sf-muted">Розмір '+esc(r.size)+'</span><div class="sf-step"><button data-shop="dec" data-id="'+r.id+'" data-variant="'+r.size+'" aria-label="Зменшити кількість">−</button><output>'+r.qty+'</output><button data-shop="inc" data-id="'+r.id+'" data-variant="'+r.size+'" aria-label="Збільшити кількість" '+(r.qty>=99?'disabled':'')+'>+</button></div></div><div class="sf-cart-end"><strong>'+money(r.price*r.qty)+'</strong><button class="sf-remove" data-shop="remove" data-id="'+r.id+'" data-variant="'+r.size+'">Видалити</button></div></article>').join('')+'</div><aside class="sf-total"><h2>Ваше замовлення</h2>'+summaryRows(items)+'<div class="sf-sum"><span>Разом</span><strong>'+money(total(items))+'</strong></div>'+button('Оформити замовлення','checkout')+'</aside></div>';
  }
  function field(key) {
    const type = key==='date'?'date':/phone/i.test(key)?'tel':'text';
    const attr = ' id="sf-'+key+'" name="'+key+'" aria-describedby="sf-err-'+key+'" '+(key==='comment'?'':'required ')+'maxlength="'+({address:350,comment:1000,phone:32}[key] || 100)+'"';
    let input;
    if (key==='time') input = '<div id="sf-time" class="sf-times" role="group" aria-labelledby="sf-time-label">'+timeButtons()+'</div>';
    else if (key==='comment') input = el('textarea',attr+' rows="3"',esc(draft[key]));
    else input = '<input '+attr+' type="'+type+'" value="'+esc(draft[key])+'" '+(key==='date'?'min="'+kyiv().day+'"':'')+' autocomplete="'+({buyer:'section-buyer name',phone:'section-buyer tel',address:'street-address'}[key]||'off')+'">';
    return '<div class="sf-field '+(['address','time','comment','date'].includes(key)?'sf-wide':'')+'">'+(key==='time'?'<span id="sf-time-label">Час доставки</span>':'<label for="sf-'+key+'">'+labels[key]+(key==='comment'?' <small>необов’язково</small>':'')+'</label>')+input+'<span class="sf-error" id="sf-err-'+key+'" aria-live="polite"></span></div>';
  }
  function available(s) { const now=kyiv(); return draft.date>now.day || (draft.date===now.day && s.slice(0,5)>now.time); }
  function timeButtons() {
    return slots.map((s,i) => '<button type="button" data-shop="slot" data-slot="'+i+'" aria-pressed="'+(draft.time===s)+'" '+(available(s)?'':'disabled')+'>'+s+'</button>').join('');
  }
  function refreshTime() {
    const box=document.getElementById('sf-time');
    if (!box || !page().isConnected) return;
    if (draft.time && !available(draft.time)) { draft.time='';remember(); }
    box.innerHTML=timeButtons();
    document.getElementById('sf-date').min=kyiv().day;
  }
  function checkout() {
    const items=lines();
    if (!items.length) return cart();
    const section=(title,keys)=>'<fieldset><legend>'+title+'</legend><div class="sf-grid">'+keys.map(field).join('')+'</div></fieldset>';
    return button('‹ До кошика','cart','sf-back')+head('Оформлення замовлення')+'<div class="sf-columns"><form id="sf-form" novalidate>'+section('Замовник',['buyer','phone'])+section('Доставка',['address','date','time','comment'])+'<button type="submit" class="sf-primary">Перевірити замовлення</button></form><aside class="sf-total"><h2>Ваше замовлення</h2>'+summaryRows(items)+'<div class="sf-sum"><span>Разом</span><strong>'+money(total(items))+'</strong></div></aside></div>';
  }
  function errors() {
    const result={};
    for (const key of Object.keys(labels)) if (key!=='comment' && !String(draft[key]||'').trim()) result[key]='Заповніть це поле.';
    if (draft.phone && !/^\+?\d{10,15}$/.test(draft.phone.trim().replace(/[\s()-]/g,''))) result.phone='Введіть номер телефону від 10 до 15 цифр.';
    if (!draft.date || draft.date<kyiv().day) result.date='Оберіть сьогоднішню або майбутню дату.';
    if (!slots.includes(draft.time) || !available(draft.time)) result.time='Оберіть доступний час доставки.';
    return result;
  }
  function mark(obj) {
    for (const key of Object.keys(labels)) {
      const input=document.getElementById('sf-'+key),err=document.getElementById('sf-err-'+key);
      if (err) err.textContent=obj[key] || '';
      if (input) input.setAttribute('aria-invalid',String(Boolean(obj[key])));
    }
    const key=Object.keys(obj)[0],node=key && document.getElementById('sf-'+key);
    if (node) { node.scrollIntoView({block:'center',behavior:'smooth'}); (key==='time'?node.querySelector('button:enabled'):node)?.focus({preventScroll:true}); }
  }
  function close(restore=true) {
    if (!dialog) return;
    dialog.close();dialog.remove();dialog=null;
    if (restore && focusReturn?.isConnected) focusReturn.focus({preventScroll:true});
  }
  async function dismiss(toCabinet=false) {
    const panel=dialog;
    if(!panel || panel.classList.contains('sf-closing') || sending)return;
    panel.classList.add('sf-closing');
    await Promise.allSettled(panel.getAnimations().map(animation=>animation.finished));
    if(dialog!==panel)return;
    close(!toCabinet);
    if(toCabinet)F().nav('cabinet');
  }
  let dialogPage;
  function modal(title,html,success=false) {
    if (!dialog) {
      focusReturn=document.activeElement;dialogPage={state:window.history.state,url:location.href};
      dialog=document.createElement('dialog');dialog.className='sf-dialog';dialog.setAttribute('aria-labelledby','sf-modal-title');document.body.append(dialog);
      dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss(dialog.dataset.success==='1');});
    }
    dialog.dataset.success=success?'1':'0';
    dialog.innerHTML='<div class="sf-dialog-content">'+(success?'<span class="sf-seal" aria-hidden="true">✓</span>':'')+'<h2 id="sf-modal-title">'+title+'</h2>'+html+'</div>';
    if (!dialog.open) dialog.showModal();
  }
  function review() {
    const obj=errors(); mark(obj);
    if (Object.keys(obj).length) return;
    const items=lines();
    const rows=Object.entries(labels).map(([k,l]) => '<div><dt>'+l+'</dt><dd>'+esc(k==='date'?formatDay(draft.date):draft[k]||'Без коментаря')+'</dd></div>').join('');
    modal('Перевірка даних','<dl class="sf-details">'+rows+'</dl>'+summaryRows(items)+'<div class="sf-sum"><span>Разом</span><strong>'+money(total(items))+'</strong></div><p id="sf-network" class="sf-error" role="alert"></p><div class="sf-actions">'+button('Назад','close','sf-secondary')+button('Далі','confirm')+'</div>');
  }
  async function confirm() {
    if (sending || !dialog || dialog.classList.contains('sf-closing')) return;
    const obj=errors();
    if (Object.keys(obj).length) {close();refreshTime();mark(obj);return;}
    const items=lines().map(({id,size,qty})=>({id,size,qty}));
    const body={items,details:Object.fromEntries(Object.keys(labels).map(k=>[k,(draft[k] || '').trim()]))};
    const signature=JSON.stringify(body);
    if (!pending || pending.signature!==signature) pending={signature,id:crypto.randomUUID()};
    draft._pending=pending;remember();
    sending=true;
    dialog.querySelectorAll('button').forEach(b=>b.disabled=true);
    dialog.querySelector('[data-shop="confirm"]').textContent='Оформлюємо…';
    document.getElementById('sf-network').textContent='';
    try {
      await account();
      const {order}=await api({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,requestId:pending.id})});
      orders=[order,...(orders||[]).filter(o=>o.code!==order.code)];
      F().cart.splice(0);F().persist();F().updateCounts();draft={};remember();pending=null;showAll=false;
      modal('Замовлення оформлено','<p class="sf-muted">Код вашого замовлення</p><div class="sf-code">'+esc(order.code)+'</div>'+summaryRows(order.items)+'<div class="sf-sum"><span>Разом</span><strong>'+money(order.total)+'</strong></div><dl class="sf-details"><div><dt>Замовник</dt><dd>'+esc(order.details.buyer)+'</dd></div><div><dt>Доставка</dt><dd>'+esc(formatDay(order.details.date))+'<br>'+esc(order.details.time)+'</dd></div></dl>'+button('Перейти до кабінету','done'),true);
    } catch(err) {
      if (err.fields && !err.fields.cart) {close();refreshTime();mark(err.fields);}
      else if (dialog) {
        document.getElementById('sf-network').textContent=err.message;
        dialog.querySelectorAll('button').forEach(b=>b.disabled=false);
        dialog.querySelector('[data-shop="confirm"]').textContent='Далі';
      }
    } finally { sending=false; }
  }
  pending=draft._pending || null;
  function orderCard(o) {
    const statuses = {'В обробці':'В очікуванні','Скасовано':'Відхилено','Доставлено':'Схвалено','Схвалено':'Схвалено','Відхилено':'Відхилено'};
    const status=statuses[o.status] || 'В очікуванні';
    return '<article class="sf-order"><div class="sf-order-top"><h3>№ '+esc(o.code)+'</h3><span class="sf-status" data-status="'+esc(status)+'">'+esc(status)+'</span></div><p class="sf-muted">'+esc(formatDay(o.details.date))+' · '+esc(o.details.time)+'</p>'+summaryRows(o.items)+'<div class="sf-sum"><span>Разом</span><strong>'+money(o.total)+'</strong></div></article>';
  }
  function history() {
    if (!orders?.length) return empty('Замовлень поки немає','Тут з’явиться ваш букет після оформлення.',false);
    const visible=showAll?orders:orders.slice(0,3);
    const toggle=orders.length>3?button(showAll?'Згорнути':'Переглянути всі','toggle-orders','sf-secondary'):'';
    return visible.map(orderCard).join('')+toggle;
  }
  function cabinet() {
    const u=orders?.[0]?.details, tg=window.Telegram?.WebApp?.initDataUnsafe?.user;
    const name=u?.buyer || tg?.first_name || 'Покупець';
    const saved=F().products.filter(p=>F().favorites.includes(p.id));
    return head('Кабінет')+'<section class="sf-profile"><span class="sf-initial">'+esc(name[0].toLocaleUpperCase('uk'))+'</span><div><h2>'+esc(name)+'</h2><p>'+esc(u?.phone || 'Ім’я та телефон збережуться після замовлення.')+'</p></div></section><section class="sf-section"><h2>Мої замовлення</h2><div id="sf-orders">'+(orders?history():'<p class="sf-muted" role="status">Завантажуємо замовлення…</p>')+'</div></section><section class="sf-section"><h2>Обрані букети</h2>'+(saved.length?'<div class="sf-favs">'+saved.map(p=>F().card(p)).join('')+'</div>':empty('Збережіть те, що до душі','Торкніться сердечка на картці букета, щоб повернутися до нього пізніше.'))+'</section>';
  }
  function updateHistory(token) {
    account(true).then(()=>{if(token===ticket && view==='cabinet' && document.getElementById('sf-orders')) page().innerHTML='<div class="sf-wrap">'+cabinet()+'</div>';}).catch(err=>{
      const box=document.getElementById('sf-orders');
      if(token===ticket && view==='cabinet' && box) {box.innerHTML='<p class="sf-error">'+esc(err.message)+'</p>'+button('Спробувати ще','reload','sf-secondary')+(orders?history():'');}
    });
  }
  window.addEventListener('popstate',event=>{
    if(!dialog?.open)return;
    event.stopImmediatePropagation();
    window.history.pushState(dialogPage.state,'',dialogPage.url);
    if(!sending)dialog.dispatchEvent(new Event('cancel',{cancelable:true}));
  },true);
  window.leaveShop = function() {
    ++ticket;clearInterval(timer);close(false);view='';
  };
  window.renderShop = function(route) {
    const token=++ticket;
    clearInterval(timer);close(false);if(view!==route)showAll=false;view=route;
    page().innerHTML='<div class="sf-wrap">'+(route==='cart'?cart():route==='checkout'?checkout():cabinet())+'</div>';
    if(route==='cabinet')updateHistory(token);
    if(route==='checkout' && document.getElementById('sf-form')){refreshTime();timer=setInterval(refreshTime,30000);account().catch(()=>{});}
  };
  document.addEventListener('submit',e=>{if(e.target.id==='sf-form'){e.preventDefault();review();}});
  document.addEventListener('input',e=>{
    const node=e.target;
    if(!node.closest('#sf-form') || !Object.hasOwn(labels,node.name))return;
    draft[node.name]=node.value;remember();
    document.getElementById('sf-err-'+node.name).textContent='';node.setAttribute('aria-invalid','false');
    if(node.name==='date')refreshTime();
  });
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-shop]');if(!b)return;
    const a=b.dataset.shop;
    if(a==='home'||a==='cart'||a==='checkout'){F().nav(a);return;}
    if(a==='inc'||a==='dec'||a==='remove'){
      const i=F().cart.findIndex(r=>r.id===Number(b.dataset.id)&&r.size===b.dataset.variant);
      if(i<0)return;
      if(a==='remove'||(a==='dec'&&F().cart[i].qty===1))F().cart.splice(i,1);else F().cart[i].qty=Math.max(1,Math.min(99,F().cart[i].qty+(a==='inc'?1:-1)));
      F().persist();
      const row=b.closest('.sf-cart-item');
      const remaining=lines();
      if(!remaining.length){
        page().querySelector('.sf-wrap').innerHTML=cart();
        return;
      }
      const item=remaining.find(r=>r.id===Number(b.dataset.id)&&r.size===b.dataset.variant);
      if(item){
        const count=row.querySelector('output');
        count.textContent=item.qty;
        row.querySelector('[data-shop="inc"]').disabled=item.qty>=99;
        row.querySelector('.sf-cart-end strong').textContent=F().money(item.price*item.qty);
        const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
        count.animate(reduced?[{opacity:.35},{opacity:1}]:[{transform:'scale(1.2)'},{transform:'scale(1)'}],{duration:210});
      }else row.remove();
      const totalBox=page().querySelector('.sf-total');
      totalBox.querySelectorAll('.sf-order-line').forEach(line=>line.remove());
      totalBox.querySelector('.sf-sum').insertAdjacentHTML('beforebegin',summaryRows(remaining));
      totalBox.querySelector('.sf-sum strong').textContent=F().money(total(remaining));
    } else if(a==='slot') {draft.time=slots[Number(b.dataset.slot)];remember();refreshTime();document.getElementById('sf-err-time').textContent='';}
    else if(a==='close')dismiss();
    else if(a==='confirm')confirm();
    else if(a==='done')dismiss(true);
    else if(a==='toggle-orders'){showAll=!showAll;document.getElementById('sf-orders').innerHTML=history();}
    else if(a==='reload'){window.renderShop('cabinet');}
  });
})();


