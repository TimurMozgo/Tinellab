(() => {
  Object.defineProperty(window,'MILITARYCOIN_API_ORIGIN',{get:()=>new URL('.',location.href).href.replace(/\/$/,''),set() {}});
  if(new URLSearchParams(location.search).has('showcase')) document.addEventListener('DOMContentLoaded',()=>{const banner=document.body.firstElementChild; if(banner) banner.textContent='Демонстраційні дані · профіль і залишки вигадані · замовлення не надсилаються';});
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    const method = options.method || (input instanceof Request ? input.method : 'GET');
    if (new URLSearchParams(location.search).has('showcase') && method === 'GET') {
      if(url.pathname.endsWith('/api/shop/me')) return Response.json({id:'demo',name:'Демонстраційний профіль',username:'',admin:false});
      if(url.pathname.endsWith('/api/shop/orders')) return Response.json({orders:[],hasMore:false});
      if(url.pathname.endsWith('/api/shop/catalog')) {const data=await (await originalFetch(new URL('catalog.json',location.href))).json();data.products=data.products.map(p=>({...p,stock:10}));return Response.json(data);}
    }
    if (url.pathname.includes('/api/shop/')) {
      if (method !== 'GET' || !url.pathname.endsWith('/api/shop/catalog')) {
        return new Response(JSON.stringify({error:'У портфоліо доступний перегляд каталогу. Замовлення та особисті дані вимкнено.'}),{status:403,headers:{'Content-Type':'application/json'}});
      }
    }
    if(url.pathname.endsWith('/api/shop/catalog')) return originalFetch(new URL('catalog.json',location.href));
    return originalFetch(input,{...options,signal:options.signal || AbortSignal.timeout(12000)});
  };
  // No user identity is passed from the portfolio bot to the client project.
  window.Telegram = {WebApp:{initData:'',initDataUnsafe:{},ready(){},expand(){},isVersionAtLeast(){return false}}};
  function check() {
    if(document.querySelector('#root')?.children.length) {
      observer.disconnect();
      parent.postMessage({type:'tinellab-game-ready'},location.origin);
    }
  }
  const observer = new MutationObserver(check);
  window.addEventListener('DOMContentLoaded',()=>{observer.observe(document.querySelector('#root'),{childList:true});check();});
})();



