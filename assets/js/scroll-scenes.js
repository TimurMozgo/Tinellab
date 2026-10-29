(() => {
  let items=[],frame=0,ready=false;
  const clamp=value=>Math.max(0,Math.min(1,value));
  function collect(){
    document.querySelectorAll('.project-card').forEach(card=>card.classList.add('motion-item'));
    items=[...document.querySelectorAll('main .motion-item')];schedule();
  }
  function paint(){
    frame=0;if(!ready)return;
    const h=window.innerHeight;
    const topEdge=document.querySelector(".topbar").getBoundingClientRect().height+4,bottomEdge=h-18;
    const active=document.activeElement;
    const values=items.map(element=>{
      const box=element.getBoundingClientRect();
      const range=Math.min(125,Math.max(45,box.height*.6));
      const entrance=clamp((bottomEdge-box.top)/range);
      const exit=window.scrollY<5?1:clamp((box.bottom-topEdge)/range);
      const focused=element===active||element.contains(active);
      return {element,opacity:focused?1:Math.min(entrance,exit),y:focused?0:(1-entrance)*24-(1-exit)*16};
    });
    values.forEach(({element,opacity,y})=>{
      element.style.setProperty('--motion-opacity',opacity.toFixed(3));
      element.style.setProperty('--motion-y',y.toFixed(2)+'px');
    });
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
  function start(){ready=true;document.documentElement.classList.add('motion-ready');collect();}
  window.addEventListener('tinellab-boot-ready',start,{once:true});
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('focusin',schedule);
  const grid=document.querySelector('#project-grid');
  new MutationObserver(collect).observe(grid,{childList:true});
  setTimeout(()=>{if(!ready)start();},6500);
})();

