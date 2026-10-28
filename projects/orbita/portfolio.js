window.addEventListener('load', () => {
  const ready = document.querySelector('#ships')?.children.length > 0;
  parent.postMessage({type:ready?'tinellab-game-ready':'tinellab-game-error'},location.origin);
});
