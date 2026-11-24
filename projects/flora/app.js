(() => {
"use strict";
const $ = s => document.querySelector(s);
const products = window.floraCatalog;
const paths = {
  home:'<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z"/>',
  bag:'<path d="M4 8h16l1 13H3L4 8Z"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/>',
  user:'<circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  pin:'<path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 1 1 14 0Z"/><circle cx="12" cy="9" r="2"/>',
  heart:'<path d="M20.5 5.5a5.2 5.2 0 0 0-8.5 1 5.2 5.2 0 0 0-8.5-1C-.3 10 5.5 15.5 12 21c6.5-5.5 12.3-11 8.5-15.5Z"/>',
  flower:Array.from({length:8},(_,i)=>'<ellipse cx="12" cy="6.7" rx="2.8" ry="4.9" transform="rotate('+i*45+' 12 12)"/>').join('')+'<circle cx="12" cy="12" r="2"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  bouquet:'<path d="m5 12 7 9 7-9M8 10l4 11 4-11"/><circle cx="6" cy="8" r="3"/><circle cx="12" cy="5" r="3"/><circle cx="18" cy="8" r="3"/>',
  rose:'<path d="m8 4 5-2 5 3-1 6-5 3-6-4 1-5 6 1 1 4-4-1m2 5v8m0-3q5 0 7-5-5 0-7 5"/>',
  tulip:'<path d="M5 5l5 3 2-5 3 5 4-3v5a7 7 0 0 1-14 0V5Zm7 12v5m0-1-5-3"/>',
  leaf:'<path d="M4 18C1 9 9 3 21 3c0 11-6 18-15 15m-3 3L16 8"/>',
  box:'<path d="M3 9h18v4H3zM5 13v8h14v-8M12 9v12M12 9C2 9 5 0 9 4l3 5Zm0 0c10 0 7-9 3-5l-3 5Z"/>',
  truck:'<path d="M2 5h12v12H2zM14 9h4l4 5v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',plus:'<path d="M12 5v14M5 12h14"/>',check:'<path d="m4 12 5 5L20 6"/>',back:'<path d="m15 5-7 7 7 7"/>'
};
const icon = n => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[n]||paths.flower)+'</svg>';
document.querySelectorAll('[data-i]').forEach(e=>e.innerHTML=icon(e.dataset.i));
function read(key,fallback){try{return JSON.parse(localStorage.getItem('flora.'+key))??fallback}catch{return fallback}}
const saved=read('state',{}), product=id=>products.find(p=>p.id===Number(id));
const F=window.F={products,sizes:['S','M','L'],cart:Array.isArray(saved.cart)?saved.cart.filter(i=>i&&product(i.id)&&['S','M','L'].includes(i.size)&&Number.isInteger(i.qty)&&i.qty>0):[],favorites:Array.isArray(saved.favorites)?saved.favorites.filter(product):[],price:(p,s)=>p.price+({S:0,M:400,L:850}[s]||0),money:n=>new Intl.NumberFormat('uk-UA').format(n)+' ₴',icon,persist,updateCounts,toast,nav,openProduct,card};
let view='home', category='Усі', all=false, current=1, origin='home', positions={}, selected=read('sizes',{}), timer;
const tg=()=>window.Telegram?.WebApp;
function persist(){try{localStorage.setItem('flora.state',JSON.stringify({cart:F.cart,favorites:F.favorites}));localStorage.setItem('flora.sizes',JSON.stringify(selected))}catch{toast('Браузер не зберіг зміни на пристрої.')}updateCounts()}
function updateCounts(){const n=F.cart.reduce((a,i)=>a+i.qty,0);$('#count').hidden=!n;$('#count').textContent=n}
function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(timer);timer=setTimeout(()=>$('#toast').classList.remove('show'),1800)}
function card(p){const on=F.favorites.includes(p.id);return '<article class="product-card" data-product="'+p.id+'"><div class="product-photo"><button data-open="'+p.id+'" aria-label="Переглянути '+p.name+'"><img src="'+p.image+'" alt="'+p.name+'" loading="lazy"></button><button class="heart '+(on?'on':'')+'" data-fav="'+p.id+'" aria-label="Обране: '+p.name+'" aria-pressed="'+on+'">'+icon('heart')+'</button></div><button class="product-name" data-open="'+p.id+'">'+p.name+'</button><p class="composition">'+p.composition+'</p><div class="price-row"><strong>'+F.money(p.price)+'</strong><button class="add" data-add="'+p.id+'" aria-label="Додати в кошик: '+p.name+'">'+icon('plus')+'</button></div></article>'}
const cats=['Усі',...products.map(p=>p.category)],glyphs=['grid','bouquet','rose','flower','tulip','box','leaf'];
function catalog(){ $('#categories').innerHTML=cats.map((c,i)=>'<button class="chip '+(c===category?'active':'')+'" aria-pressed="'+(c===category)+'" data-category="'+i+'">'+icon(glyphs[i])+c+'</button>').join('');$('#listTitle').textContent=category==='Усі'?(all?'Усі букети':'Популярні букети'):category;$('#allProducts').hidden=all&&category==='Усі';const list=category==='Усі'?(all?products:products.slice(0,4)):products.filter(p=>p.category===category);$('#cards').innerHTML=list.map(card).join('')}
function add(id,size){let row=F.cart.find(i=>i.id===id&&i.size===size);if(row){if(row.qty>=99){toast('До 99 букетів одного розміру');return false}row.qty++}else F.cart.push({id,size,qty:1});persist();toast('Букет додано в кошик');return true}
function detail(){const p=product(current),s=selected[p.id]||'S';$('#detailPage').innerHTML='<button class="back" data-return>'+icon('back')+'Назад</button><div class="detail-wrap"><div><div class="gallery" tabindex="0" aria-label="Світлини букета"><img src="'+p.image+'" alt="'+p.name+' — загальний вигляд"><img src="img/p'+p.id+'b.jpg" alt="'+p.name+' — пелюстки зблизька"></div><div class="dots"><button class="current" data-slide="0" aria-label="Перше фото"></button><button data-slide="1" aria-label="Друге фото"></button></div></div><div class="detail-copy"><div class="eyebrow"><i></i>'+p.category+'</div><h1>'+p.name+'</h1><p>'+p.description+'</p><h3>Склад букета</h3><p>'+p.composition+'</p><h3>Розмір букета</h3><div class="sizes">'+F.sizes.map(x=>'<button data-size="'+x+'" aria-pressed="'+(x===s)+'" class="'+(x===s?'active':'')+'">'+x+'</button>').join('')+'</div><div class="detail-price">'+F.money(F.price(p,s))+'</div><div class="detail-actions"><button class="primary" data-add="'+p.id+'">Додати в кошик</button><button class="secondary" data-buy>Замовити</button></div><details><summary>Рекомендації з догляду</summary><p>'+(p.id===5?'Щодня потроху зволожуйте флористичну губку між стеблами. Тримайте композицію подалі від батарей і прямих сонячних променів.':'Оновіть зрізи стебел і зніміть листя нижче рівня води. Міняйте воду щодня та тримайте букет у прохолодному місці.')+'</p></details></div></div>';$('.gallery').onscroll=e=>{const idx=Math.round(e.target.scrollLeft/e.target.clientWidth);document.querySelectorAll('[data-slide]').forEach((b,i)=>b.classList.toggle('current',idx===i))}}
function openProduct(id){if(!product(id))return;origin=view;current=Number(id);nav('detail')}
function nav(next,push=true,restore=false){
  if(view!==next && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    return document.startViewTransition(()=>renderView(next,push,restore)).updateCallbackDone;
  }else renderView(next,push,restore);
}
function renderView(next,push,restore){positions[view]=scrollY;if(next==='home'||next==='detail')window.leaveShop?.();view=next;const pane=next==='home'?$('#homePage'):next==='detail'?$('#detailPage'):$('#shopPage');[$('#homePage'),$('#detailPage'),$('#shopPage')].forEach(e=>e.hidden=e!==pane);if(next==='detail')detail();else if(next!=='home')window.renderShop(next);document.querySelectorAll('.dock button').forEach(b=>{b.classList.toggle('active',b.dataset.nav===(next==='detail'?origin:next==='checkout'?'cart':next))});if(push)history.pushState({view,current,origin,previous:true},'','#'+(next==='detail'?'bouquet-'+current:next));pane.classList.remove('appear');void pane.offsetWidth;pane.classList.add('appear');window.scrollTo({top:restore?(positions[next]||0):0,behavior:'instant'});const backBtn=tg()?.BackButton;if(tg()?.initData && tg().isVersionAtLeast('6.1')){if(next==='home')backBtn.hide();else backBtn.show()}}
function back(){const dlg=document.querySelector('dialog[open]');if(dlg){dlg.querySelector('[data-back]')?.click();if(dlg.open)dlg.dispatchEvent(new Event('cancel',{cancelable:true}));return}if(history.state?.previous)history.back();else {const target=view==='checkout'?'cart':view==='detail'?origin:'home';history.replaceState({view:target,current,origin},'','#'+target);nav(target,false,true)}}
window.addEventListener('popstate',e=>{current=e.state?.current||current;origin=e.state?.origin||'home';nav(e.state?.view||'home',false,true)});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
if(d.nav){if(view!==d.nav)nav(d.nav,true,d.nav==='home');else window.scrollTo({top:0,behavior:'smooth'})}
else if(d.category!==undefined){category=cats[Number(d.category)];all=true;catalog();document.querySelector('.chip.active')?.scrollIntoView({block:'nearest',inline:'nearest'})}
else if(d.open){if(F.sizes.includes(d.cartSize)){selected[d.open]=d.cartSize;persist()}openProduct(d.open)}
else if(d.fav){const id=Number(d.fav),on=!F.favorites.includes(id);if(on)F.favorites.push(id);else F.favorites.splice(F.favorites.indexOf(id),1);persist();document.querySelectorAll('[data-fav="'+id+'"]').forEach(x=>{x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});if(view==='cabinet'&&!on){b.closest('.product-card')?.remove();if(!F.favorites.length)window.renderShop('cabinet')}toast(on?'Збережено в кабінеті':'Букет вилучено з обраного')}
else if(d.add){if(add(Number(d.add),view==='detail'?(selected[current]||'S'):'S')&&b.classList.contains('add')){b.classList.add('done');b.innerHTML=icon('check');setTimeout(()=>{b.classList.remove('done');b.innerHTML=icon('plus')},850)}}
else if(d.size){selected[current]=d.size;persist();document.querySelectorAll('[data-size]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)});$('.detail-price').textContent=F.money(F.price(product(current),d.size))}
else if('buy'in d){if(add(current,selected[current]||'S'))nav('checkout')}
else if('return'in d)back();else if(d.slide!==undefined)$('.gallery').scrollTo({left:$('.gallery').clientWidth*Number(d.slide),behavior:'smooth'});
});
$('#allProducts').onclick=()=>{all=true;category='Усі';catalog()};
$('#collection').onclick=()=>{category='Сезонні квіти';all=true;catalog();$('#categories').scrollIntoView({behavior:'smooth'})};
$('#deliveryLink').onclick=async()=>{if(view!=='home')await nav('home');$('#delivery').scrollIntoView({behavior:'smooth'})};
const route=location.hash.slice(1);
const bouquetId=Number(/^bouquet-([0-9]+)$/.exec(route)?.[1]);
const startView=product(bouquetId)?'detail':['cart','cabinet','checkout'].includes(route)?route:'home';
current=product(bouquetId)?.id||1;
origin=['home','cart','cabinet'].includes(history.state?.origin)?history.state.origin:'home';
history.scrollRestoration='manual';
catalog();updateCounts();
history.replaceState({view:startView,current,origin,previous:!!history.state?.previous},'',location.href);
nav(startView,false);
function connectTelegram(){
 const app=tg();if(!app)return;
 app.ready();
 if(!app.initData)return;
 app.expand();
 if(app.isVersionAtLeast('6.1')){
   app.BackButton.onClick(back);app.setHeaderColor('#fbfaf7');
   if(view!=='home')app.BackButton.show();
 }
}
if(tg())connectTelegram();else document.getElementById('telegram-sdk').addEventListener('load',connectTelegram,{once:true});
})();

