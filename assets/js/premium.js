(() => {
  let frame = 0;
  function stopScroll(){cancelAnimationFrame(frame);frame=0;}
  ['wheel','touchstart','pointerdown'].forEach(type=>window.addEventListener(type,stopScroll,{passive:true}));
  window.addEventListener('keydown',event=>{if(['PageDown','PageUp','Home','End','ArrowDown','ArrowUp',' '].includes(event.key))stopScroll();});
  function scrollToSection(target){
    stopScroll();
    const start=window.scrollY;
    const header=document.querySelector('.topbar').getBoundingClientRect().height;
    const destination=target.id==='home'?0:target.getBoundingClientRect().top+start-header-20;
    const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
    const end=Math.max(0,Math.min(destination,max)),distance=end-start;
    if(Math.abs(distance)<2)return;
    const duration=Math.min(1100,Math.max(650,Math.abs(distance)*.32));
    const beginning=performance.now();
    function tick(now){
      const t=Math.min(1,(now-beginning)/duration);
      const eased=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
      window.scrollTo({top:start+distance*eased,behavior:'instant'});
      frame=t<1?requestAnimationFrame(tick):0;
    }
    frame=requestAnimationFrame(tick);
  }
  document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
    const target=document.getElementById(link.hash.slice(1)||'home');
    if(!target)return;
    event.preventDefault();history.replaceState(null,'',link.hash||'#home');scrollToSection(target);
  }));
  const links=document.querySelectorAll('.floating-nav a[href^="#"]');
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting)links.forEach(link=>link.classList.toggle('active',link.hash==='#'+entry.target.id));});
  },{rootMargin:'-15% 0px -65% 0px'});
  document.querySelectorAll('main section[id]').forEach(section=>observer.observe(section));
})();
