(() => {
  const paths = {
    '↗': 'M5 19 19 5M5 5h14v14',
    '↘': 'M5 5 19 19M5 19h14V5',
    '↓': 'M12 4v16m-7-7 7 7 7-7',
    '←': 'M20 12H4m7-7-7 7 7 7',
    '→': 'M4 12h16m-7-7 7 7-7 7',
    '✕': 'm6 6 12 12M18 6 6 18',
    '✳': 'M12 2v20M2 12h20M5 5l14 14M19 5 5 19'
  };
  const pattern = /[↗↘↓←→✕✳]/g;
  function replaceSymbols(root) {
    const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) {
      const node=walker.currentNode;
      if(node.parentElement?.closest('svg,script,style,textarea,input,select,[contenteditable]'))continue;
      pattern.lastIndex=0;
      if(pattern.test(node.nodeValue))nodes.push(node);
    }
    for(const node of nodes){
      const fragment=document.createDocumentFragment();let position=0;pattern.lastIndex=0;
      for(const match of node.nodeValue.matchAll(pattern)){
        fragment.append(document.createTextNode(node.nodeValue.slice(position,match.index)));
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.setAttribute('class','ui-icon');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.6');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
        const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',paths[match[0]]);svg.append(path);fragment.append(svg);position=match.index+match[0].length;
      }
      fragment.append(document.createTextNode(node.nodeValue.slice(position)));node.replaceWith(fragment);
    }
  }
  const observer=new MutationObserver(()=>{
    observer.disconnect();replaceSymbols(document.body);observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  });
  replaceSymbols(document.body);
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
})();

