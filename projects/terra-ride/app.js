import {routes,guides,duration,money,kyivNow,times} from './routes.js';
const paths={home:'<path d="m3 10 9-7 9 7v10h-6v-7H9v7H3z"/>',cart:'<path d="M2 3h3l3 12h11l3-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',pin:'<path d="M19 10c0 6-7 11-7 11S5 16 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 6-5 2 3-6z"/>',heart:'<path d="M12 21 3.8 13C-2 6.5 6 0 12 7c6-7 14-.5 8.2 6Z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',plus:'<path d="M12 5v14M5 12h14"/>',level:'<path d="M4 18v-3m5 3v-6m5 6V9m5 9V5"/>',check:'<path d="m4 12 5 5L20 6"/>',back:'<path d="m14 5-7 7 7 7"/>',trash:'<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15"/>',mount:'<path d="m2 19 8-14 6 10 3-5 4 9zM7 10l3 2 2-3"/>',shield:'<path d="m12 2 8 4v6c0 5-8 10-8 10s-8-5-8-10V6z"/><path d="m8 12 3 3 5-6"/>',map:'<path d="m2 5 7-2 6 3 7-2v15l-7 2-6-3-7 2zm7-2v15m6-12v15"/>'};
const I=k=>'<svg class="ico" aria-hidden="true" viewBox="0 0 24 24">'+paths[k]+'</svg>';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s), main=$('#main'), modal=$('#modal'), byId=id=>routes.find(x=>x.id===id), img=id=>'./images/'+id+'.jpg';
function read(k,d){try{return JSON.parse(localStorage.getItem('terra.'+k))??d}catch{return d}}
function save(k,v){try{localStorage.setItem('terra.'+k,JSON.stringify(v))}catch{notice('Пам’ять пристрою недоступна')}}
let cart=read('cart',{}),fav=read('fav',[]),draft=read('draft',{}),filter='all',expandedOrders=false,orders=[],homeY=0,previous='home',formOrigin='cart',slotsVersion=0,reviewKey='',lastBooking=null,submitting=false;
const page=()=>location.hash.slice(1)||'home';
let lastPage='',toastTimer,browseCatalog=false;
function notice(msg){let t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2300)}
function go(p){if(p!==page())location.hash=p;else render()}
function nav(){const p=page();$('#nav').innerHTML=[['home','home','Головна'],['cart','cart','Кошик'],['account','user','Кабінет']].map(([id,ico,label])=>'<button data-go="'+id+'" class="'+((p===id||id==='home'&&p.startsWith('route')||id==='cart'&&p==='book')?'active':'')+'">'+I(ico)+(id==='cart'?' <b class="count" '+(totalQty()?'':'hidden')+'>'+totalQty()+'</b>':'')+label+'</button>').join('')}
// The persisted cart holds participants. One two-person ride represents two participants.
function partySize(id){return id==='couple'?2:1}
function units(id){return (cart[id]||0)/partySize(id)}
function totalQty(){return routes.reduce((sum,r)=>sum+units(r.id),0)}
function cartTotal(){return routes.reduce((sum,r)=>sum+(cart[r.id]||0)*r.price,0)}
const reducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
async function fadeOut(el,duration){
 if(!el?.animate)return;
 const end=reducedMotion()?{opacity:0}:{opacity:0,transform:'translateY(-5px)'};
 const animation=el.animate([{opacity:1},end],{duration,easing:'ease-in'});
 await animation.finished.catch(()=>{});
}
async function closeDialog(){
 if(!modal.open||modal.dataset.closing||submitting)return;
 modal.dataset.closing='true';
 modal.inert=true;
 await fadeOut(modal,150);
 modal.close();
 delete modal.dataset.closing;
 modal.inert=false;
}
function pop(el){if(!el)return;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')}
function updateCount(){const b=$('.count');b.hidden=!totalQty();b.textContent=totalQty();pop(b)}
function add(id,el){let n=cart[id]||0,step=partySize(id);if(n+step>8)return notice('В одній групі — до 8 учасників');cart[id]=n+step;save('cart',cart);updateCount();pop(el);notice('Додано до кошика')}
function card(r){let on=fav.includes(r.id);return '<article class="card"><div class="photo"><a href="#route/'+r.id+'" aria-label="'+r.name+'"><img loading="lazy" src="'+img(r.id)+'" alt="'+r.name+' в Карпатах"></a><button class="circle fav '+(on?'on':'')+'" aria-label="Вподобати маршрут '+r.name+'" aria-pressed="'+on+'" data-fav="'+r.id+'">'+I('heart')+'</button></div><div class="cardBody"><h3><a href="#route/'+r.id+'">'+r.name+'</a></h3><div class="ride-specs"><span>'+r.km+' км</span><span>'+duration(r.minutes)+'</span><span>'+r.level+'</span></div><div class="row cardFoot"><div><strong>'+money(r.price)+'</strong> <small>/ учасник</small></div><button class="circle add" data-add="'+r.id+'" aria-label="Додати '+r.name+' в кошик">'+I('plus')+'</button></div></div></article>'}
function catalogue(){let filtered=[byId('mountain'),...routes.filter(r=>r.id!=='mountain')].filter(r=>filter==='all'||r.minutes===Number(filter));return '<div class="secHead"><h2>Маршрути</h2><span>'+filtered.length+' із '+routes.length+'</span></div><div class="filters" aria-label="Тривалість поїздки">'+[['all','Усі маршрути'],[60,'1 година'],[90,'1,5 години'],[120,'2 години'],[240,'4 години']].map(([id,n])=>'<button aria-pressed="'+(String(id)===filter)+'" class="chip '+(String(id)===filter?'active':'')+'" data-filter="'+id+'">'+n+'</button>').join('')+'</div><div class="grid">'+filtered.map(card).join('')+'</div>'}
function home(){return '<div class="wrap"><section class="hero"><img class="heroImg" fetchpriority="high" src="'+img('traction')+'" alt="Квадроцикл на кам’янистому карпатському підйомі"><h1>Тяга</h1><p class="hero-caption">Прокат квадроциклів<br>у Карпатах</p><button class="primary" data-action="catalog">Обрати поїздку <span aria-hidden="true">↗</span></button></section><section id="catalog">'+catalogue()+'</section><section class="how"><h2>Як проходить поїздка</h2><div class="steps">'+[['map','Оберіть маршрут','Визначте тривалість поїздки, дату та склад групи.'],['shield','Підготуйтеся до старту','Інструктор підбере шолом і покаже, як керувати квадроциклом.'],['mount','Вирушайте в гори','Їдьте за інструктором із зупинками для відпочинку й фото.']].map(([i,t,d])=>'<div class="step">'+I(i)+'<h3>'+t+'</h3><p>'+d+'</p></div>').join('')+'</div></section></div>'}
const back=(p,label)=>'<button class="back" data-go="'+p+'">'+I('back')+label+'</button>';
const frame=s=>'<div class="wrap page">'+s+'</div>';
function detail(r){return frame(back(previous,previous==='account'?'До кабінету':previous==='cart'?'До кошика':'До маршрутів')+'<div class="gallery">'+r.gallery.map((x,i)=>'<img src="'+img(x)+'" alt="'+r.name+' · фото '+(i+1)+'">').join('')+'</div><div class="dots">'+r.gallery.map((_,i)=>'<button class="'+(!i?'active':'')+'" data-slide="'+i+'" aria-label="Фото '+(i+1)+'"><i></i></button>').join('')+'</div><span class="eyebrow">'+I('pin')+' Українські Карпати</span><h1>'+r.name+'</h1><span class="minor">'+I('clock')+duration(r.minutes)+' · '+r.km+' км · '+r.level+' рівень</span><p>'+r.desc+'</p><div class="row box"><strong>'+money(r.price)+' / учасник</strong><button class="circle '+(fav.includes(r.id)?'on':'')+'" data-fav="'+r.id+'" aria-pressed="'+fav.includes(r.id)+'" aria-label="Вподобати">'+I('heart')+'</button></div><div class="actions"><button class="primary" data-book="'+r.id+'">Обрати поїздку</button><button class="secondary" data-add="'+r.id+'">'+I('cart')+'Додати в кошик</button></div><h2>Про поїздку</h2><div class="box"><strong>У вартість входить</strong><p>Оренда квадроцикла, пальне, шолом, рукавички, інструктаж і супровід на маршруті.</p><hr><strong>Місце зустрічі</strong><p>'+r.place+'. Точну точку старту узгоджуємо після бронювання.</p><hr><strong>Вимоги до учасників</strong><p>Водії — від 18 років. Одягніть закрите взуття та зручний одяг. '+(r.id==='expedition'?'Потрібен досвід керування на бездоріжжі.':r.id==='couple'?'Бронювання для пар учасників.':'Перед стартом обов’язковий інструктаж.')+'</p></div><h2>Ваш інструктор</h2><div class="box guide"><img src="'+img('instructor')+'" alt="Остап Мельник"><div><strong>'+guides[0]+'</strong><p>Проводить групи карпатськими стежками та допомагає впевнено пройти перші підйоми.</p></div></div>')}
function empty(icon,title,desc,button='Обрати маршрут'){return '<div class="empty">'+I(icon)+'<h3>'+title+'</h3><p>'+desc+'</p>'+(button?'<button class="secondary" data-action="browse">'+button+'</button>':'')+'</div>'}
function basketRow(r){
 const size=partySize(r.id);
 const rate=size===2?money(r.price*size)+' / поїздка для двох':money(r.price)+' / учасник';
 return '<div class="cartRow" data-row="'+r.id+'"><img src="'+img(r.id)+'" alt=""><div class="grow"><h3><a href="#route/'+r.id+'">'+r.name+'</a></h3><small>'+duration(r.minutes)+' · '+rate+'</small><div><span class="stepper"><button aria-label="Зменшити кількість" data-delta="-1" data-id="'+r.id+'">−</button><b>'+units(r.id)+'</b><button aria-label="Збільшити кількість" data-delta="1" data-id="'+r.id+'" '+(cart[r.id]>=8?'disabled':'')+'>+</button></span></div></div><strong class="subtotal">'+money(cart[r.id]*r.price)+'</strong><button aria-label="Видалити позицію" data-remove="'+r.id+'">'+I('trash')+'</button></div>'
}
function basket(){
 const list=routes.filter(r=>cart[r.id]);
 return frame('<h1>Кошик</h1>'+(list.length?list.map(basketRow).join('')+'<div class="row total"><strong>Разом</strong><strong id="cart-total">'+money(cartTotal())+'</strong></div><button class="primary" data-book="">Забронювати</button>':empty('cart','Кошик поки порожній','Додайте маршрут, щоб обрати дату та кількість учасників.')))
}
async function changeCart(button){
 const id=button.dataset.remove||button.dataset.id;
 const row=button.closest('.cartRow');
 if(!row||!cart[id])return;
 const next=button.dataset.remove?0:Math.max(0,Math.min(8,cart[id]+Number(button.dataset.delta)*partySize(id)));
 if(next)cart[id]=next;else delete cart[id];
 save('cart',cart);
 updateCount();
 $('#cart-total').textContent=money(cartTotal());
 if(next){
   const count=row.querySelector('.stepper b');
   count.textContent=units(id);pop(count);
   row.querySelector('[data-delta="1"]').disabled=next>=8;
   row.querySelector('.subtotal').textContent=money(next*byId(id).price);
 }else{
   row.inert=true;
   if(!totalQty())main.querySelector('[data-book]').disabled=true;
   await fadeOut(row,155);
   if(!row.isConnected)return;
   row.remove();
   if(!totalQty())main.innerHTML=basket();
 }
}
const fmtDate=s=>new Intl.DateTimeFormat('uk-UA',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
const labels={name:'Ім’я',phone:'Номер телефону',route:'Обраний маршрут',qty:'Кількість учасників',guide:'Інструктор',date:'Майбутня дата',time:'Майбутній час'};
function form(){const allowed=formOrigin==='cart'?routes.filter(r=>cart[r.id]):formOrigin.startsWith('route/')?routes.filter(r=>r.id===formOrigin.split('/')[1]):routes;let controls={name:'<input name="name" autocomplete="given-name" maxlength="80">',phone:'<input name="phone" type="tel" autocomplete="tel" maxlength="24">',route:'<select name="route"><option value=""></option>'+allowed.map(r=>'<option value="'+r.id+'">'+r.name+'</option>').join('')+'</select>',qty:'<input name="qty" type="number" inputmode="numeric" min="1" max="8">',guide:'<select name="guide"><option value=""></option><option>'+guides[0]+'</option></select>',date:'<input name="date" type="date" min="'+kyivNow().slice(0,10)+'">'};return frame(back(formOrigin,'Назад')+'<h1>Бронювання</h1>'+(allowed.length>1&&formOrigin==='cart'?'<p class="muted">Оформіть кожен маршрут окремо, щоб обрати зручний час для кожної поїздки.</p>':'')+'<form novalidate id="booking"><div class="box"><div class="fields">'+Object.entries(controls).map(([k,el])=>'<div class="field"><label for="field-'+k+'">'+labels[k]+'</label>'+el.replace('name=', 'required id="field-'+k+'" aria-describedby="err-'+k+'" name=')+'<span class="err" id="err-'+k+'"></span></div>').join('')+'</div><p style="margin-top:18px">'+labels.time+' <small>· за Києвом</small></p><div id="slots"></div><span class="err" id="err-time"></span></div><div id="cost"></div><button class="primary" type="submit">Перевірити дані</button></form>')}
function cost(){let r=byId(draft.route);$('#cost').innerHTML=r&&Number.isInteger(+draft.qty)&&+draft.qty>0&&+draft.qty<=8&&(r.id!=='couple'||+draft.qty%2===0)?'<div class="row total"><strong>Вартість поїздки</strong><strong>'+money(r.price*draft.qty)+'</strong></div>':''}
async function api(path,opt={}){
 const tg=window.Telegram?.WebApp?.initData||'';
 let res,data;
 try{
   res=await fetch('/api/'+path,{...opt,headers:{'Content-Type':'application/json','X-Telegram-Init':tg},cache:'no-store'});
   data=await res.json();
 }catch{throw new Error('Не вдалося отримати відповідь. Перевірте з’єднання та спробуйте ще раз.')}
 if(!res.ok)throw Object.assign(new Error(data.error||'Не вдалося завантажити дані. Спробуйте ще раз.'),{status:res.status});
 return data
}
let available=[];
async function slots(){let v=++slotsVersion,t=$('#slots');if(!t)return;available=[];if(!byId(draft.route)||!draft.date||!draft.guide){t.innerHTML='<small>Оберіть маршрут, інструктора та дату, щоб побачити вільний час.</small>';return}t.textContent='Шукаємо вільний час…';try{let busy=await api('slots?date='+encodeURIComponent(draft.date));if(v!==slotsVersion||!t.isConnected)return;available=times(byId(draft.route),draft.date,busy);if(!available.some(s=>s.free&&s.time===draft.time)){draft.time='';save('draft',draft)}t.innerHTML='<div class="slots">'+available.map(s=>'<button type="button" aria-pressed="'+(draft.time===s.time)+'" class="slot '+(draft.time===s.time?'active':'')+'" '+(s.free?'':'disabled')+' data-time="'+s.time+'">'+s.time+'</button>').join('')+'</div>'+(available.some(x=>x.free)?'':'<small>На цю дату вільного часу немає. Оберіть інший день.</small>')}catch{if(v===slotsVersion&&t.isConnected)t.innerHTML='<p class="err">Не вдалося завантажити час.</p><button type="button" class="secondary" data-action="slots">Спробувати ще раз</button>'}}
function summary(o){let r=byId(o.route);return '<dl class="summary">'+Object.entries({Клієнт:o.name,Телефон:o.phone,Маршрут:r.name,Учасників:o.qty,Інструктор:o.guide,Дата:fmtDate(o.date),Час:o.time+' · Київ',Вартість:money(o.total??r.price*o.qty)}).map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+esc(v)+'</dd></div>').join('')+'</dl>'}
function review(){let errors={},d=draft;if(!d.name?.trim()||d.name.trim().length<2)errors.name='Введіть ім’я, щонайменше два символи.';if(!/^\+?[\d ()-]+$/.test((d.phone||'').trim())||!/^\d{10,15}$/.test((d.phone||'').replace(/\D/g,'')))errors.phone='Введіть номер із 10–15 цифр.';if(!byId(d.route))errors.route='Оберіть маршрут.';if(!Number.isInteger(+d.qty)||+d.qty<1||+d.qty>8||d.route==='couple'&&+d.qty%2)errors.qty=d.route==='couple'?'Оберіть парну кількість від 2 до 8.':'Вкажіть від 1 до 8 учасників.';if(!guides.includes(d.guide))errors.guide='Оберіть інструктора.';if(!d.date||d.date<kyivNow().slice(0,10))errors.date='Оберіть сьогоднішню або майбутню дату.';if(!available.some(x=>x.free&&x.time===d.time)||d.date+'T'+d.time<=kyivNow())errors.time='Оберіть доступний майбутній час.';for(let k in labels)$('#err-'+k).textContent=errors[k]||'';if(Object.keys(errors).length){let k=Object.keys(errors)[0];($('#booking [name="'+k+'"]')||$('#slots button'))?.focus();return}if(!reviewKey)reviewKey=crypto.randomUUID();modal.innerHTML='<h2>Перевірка даних</h2>'+summary(d)+'<div id="submitError" class="err" role="alert"></div><div class="actions"><button class="secondary" data-action="close">Назад</button><button class="primary" data-action="confirm">Далі</button></div>';modal.classList.remove('success');modal.showModal()}
async function confirm(){if(submitting)return;submitting=true;modal.querySelector('[data-action="close"]').disabled=true;let btn=modal.querySelector('[data-action="confirm"]');btn.disabled=true;btn.textContent='Бронюємо…';try{let o=await api('bookings',{method:'POST',body:JSON.stringify({...draft,key:reviewKey})});await fadeOut(modal,120);lastBooking=o;expandedOrders=false;if(formOrigin==='cart'){delete cart[o.route];save('cart',cart)}draft={};save('draft',draft);reviewKey='';updateCount();modal.classList.add('success');modal.innerHTML='<span class="eyebrow">'+I('check')+' В обробці</span><h2>Поїздку заброньовано</h2><p>Код бронювання <strong class="code">'+esc(o.code)+'</strong></p>'+summary(o)+'<button class="primary" data-action="cabinet">Перейти до кабінету</button>'}catch(e){$('#submitError').textContent=e.message;btn.disabled=false;btn.textContent='Далі';modal.querySelector('[data-action="close"]').disabled=false;if(e.status===409){btn.disabled=true;slots()}}finally{submitting=false}}
function bookingCard(o){
 return '<div class="booking"><div class="row"><strong class="code">№ '+esc(o.code)+'</strong><span class="status">В обробці</span></div><h3>'+byId(o.route).name+'</h3><div>'+fmtDate(o.date)+' · '+esc(o.time)+'</div><small>Учасників: '+Number(o.qty)+' · '+money(o.total)+'</small></div>'
}
function orderList(){
 if(!orders.length)return empty('map','Бронювань ще немає','Тут з’являться ваші поїздки після першого бронювання.','');
 const recent=orders.slice(0,3).map(bookingCard).join('');
 if(orders.length<=3)return recent;
 return recent+'<div id="older-orders" '+(expandedOrders?'':'hidden')+'>'+orders.slice(3).map(bookingCard).join('')+'</div><button class="secondary" data-action="orders" aria-controls="older-orders" aria-expanded="'+expandedOrders+'">'+(expandedOrders?'Згорнути':'Переглянути всі')+'</button>'
}
function account(){return frame('<h1>Кабінет</h1><div id="profile"></div><h2>Мої бронювання</h2><div id="orders" aria-live="polite">Завантажуємо бронювання…</div><h2>Улюблені маршрути</h2><div id="favorites">'+favorites()+'</div>')}
function favorites(){return fav.length?'<div class="grid">'+routes.filter(r=>fav.includes(r.id)).map(card).join('')+'</div>':empty('heart','Збережіть маршрут на потім','Натисніть серце на картці, і маршрут з’явиться тут.')}
async function loadAccount(){try{orders=await api('bookings');if(page()!=='account')return;let o=orders[0];$('#profile').innerHTML='<div class="box profile"><strong>'+esc(o?.name||'Ваш профіль')+'</strong><p class="muted">'+esc(o?.phone||'Ім’я та телефон з’являться після першого бронювання.')+'</p></div>';$('#orders').innerHTML=orderList()}catch{if($('#orders'))$('#orders').innerHTML='<p class="err">Не вдалося отримати бронювання.</p><button class="secondary" data-action="reload">Спробувати ще раз</button>'}}
function render(){let p=page();
 if(p==='book'){
   const source=history.state?.formOrigin||formOrigin;
   formOrigin=source==='cart'||routes.some(r=>'route/'+r.id===source)?source:'cart';
   history.replaceState({...history.state,formOrigin},'');
   if(formOrigin==='cart'&&!totalQty()){location.replace('#cart');return}
 }
 if(modal.open&&!submitting)modal.close();
if(lastPage==='home')homeY=window.scrollY;if(p.startsWith('route/')&&['account','home','cart'].includes(lastPage))previous=lastPage;lastPage=p;nav();main.innerHTML=p==='cart'?basket():p==='account'?account():p==='book'?form():p.startsWith('route/')&&byId(p.split('/')[1])?detail(byId(p.split('/')[1])):home();main.classList.remove('enter');void main.offsetWidth;main.classList.add('enter');window.scrollTo({top:p==='home'?homeY:0,behavior:'instant'});if(p==='book'){for(let el of $('#booking').elements){if(el.name)el.value=draft[el.name]||''}if(!$('#booking [name=route]').value)draft.route='';slots();cost()}if(p==='home'&&browseCatalog){browseCatalog=false;$('#catalog').scrollIntoView()}if(p==='account'){expandedOrders=false;loadAccount()}let g=$('.gallery');if(g)g.onscroll=()=>document.querySelectorAll('.dots button').forEach((el,i)=>el.classList.toggle('active',i===Math.round(g.scrollLeft/g.clientWidth)));let b=window.Telegram?.WebApp?.BackButton;if(b&&window.Telegram.WebApp.isVersionAtLeast?.('6.1')){p==='home'?b.hide():b.show();b.offClick(tgBack);b.onClick(tgBack)}}
function tgBack(){if(modal.open){closeDialog()}else if(page()==='book')go(formOrigin);else if(page().startsWith('route'))go(previous);else go('home')}
document.addEventListener('click',e=>{let b=e.target.closest('button');if(!b)return;let d=b.dataset;if(d.go)return go(d.go);if(d.filter){filter=d.filter;$('#catalog').innerHTML=catalogue();return}if(d.add)return add(d.add,b);if(d.fav){fav=fav.includes(d.fav)?fav.filter(x=>x!==d.fav):[...fav,d.fav];save('fav',fav);b.classList.toggle('on',fav.includes(d.fav));b.setAttribute('aria-pressed',fav.includes(d.fav));pop(b);if($('#favorites'))$('#favorites').innerHTML=favorites();return}if(d.slide!==undefined){$('.gallery').scrollTo({left:Number(d.slide)*$('.gallery').clientWidth,behavior:'smooth'});return}if(d.delta||d.remove)return changeCart(b);
if(d.book!==undefined){formOrigin=page();if(d.book&&draft.route&&draft.route!==d.book){draft.route='';draft.time=''}go('book');return}if(d.time){draft.time=d.time;reviewKey='';save('draft',draft);document.querySelectorAll('.slot').forEach(s=>{s.classList.toggle('active',s===b);s.setAttribute('aria-pressed',s===b)});$('#err-time').textContent='';return}if(d.action==='orders'){
 expandedOrders=!expandedOrders;
 $('#older-orders').hidden=!expandedOrders;
 b.textContent=expandedOrders?'Згорнути':'Переглянути всі';
 b.setAttribute('aria-expanded',expandedOrders);
 return
}
switch(d.action){case 'browse':browseCatalog=true;go('home');break;case 'catalog':$('#catalog').scrollIntoView();break;case 'close':closeDialog();break;case 'confirm':confirm();break;case 'cabinet':closeDialog();break;case 'reload':loadAccount();break;case 'slots':slots();break}});
document.addEventListener('input',e=>{let el=e.target;if(!el.closest('#booking')||!el.name)return;draft[el.name]=el.value;reviewKey='';$('#err-'+el.name).textContent='';if(['route','guide','date'].includes(el.name)){draft.time='';if(el.name==='route'&&formOrigin==='cart'&&cart[el.value]){draft.qty=cart[el.value];$('#booking [name=qty]').value=draft.qty;$('#err-qty').textContent=''}slots()}save('draft',draft);cost()});
document.addEventListener('submit',e=>{if(e.target.id==='booking'){e.preventDefault();review()}});
modal.addEventListener('cancel',e=>{e.preventDefault();closeDialog()});modal.addEventListener('close',()=>{if(lastBooking){lastBooking=null;go('account')}});let navigationSequence=0;
window.addEventListener('hashchange',async()=>{
 const sequence=++navigationSequence;
 main.inert=true;
 await fadeOut(main,105);
 if(sequence!==navigationSequence)return;
 main.inert=false;
 render();
});
render();
