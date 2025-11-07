/* thought_autoduration_v1.js */
(function(){
  'use strict';
  const doc=document, $id=(x)=>doc.getElementById(x);
  const stageEl=$id('stage');

  function _randInt(a,b){ return Math.floor(a+Math.random()*(b-a+1)); }
  const randInt=(typeof window.randInt==='function')?window.randInt:_randInt;

  function computeThoughtDuration(text){
    const s=(text??''); const len=s.length;
    const BASE=0.8, PER_CHAR=0.055, MIN=2.2, MAX=10.0;
    let auto=BASE+PER_CHAR*len; auto=Math.max(MIN,Math.min(MAX,auto));
    const DEFAULT=3.0;
    const scale=(typeof window.bubbleDurationSec==='number' && window.bubbleDurationSec>0)
      ? (window.bubbleDurationSec/DEFAULT) : 1.0;
    return Math.max(MIN, Math.min(MAX, auto*scale));
  }
  window.computeThoughtDuration=computeThoughtDuration;

  window.showThoughtForViewer=function(vIdx,text,durationSecs,customLift,xShift=0){
    const bubbleEl=$id('bubble0');
    const viewerEl=doc.querySelector(`.viewer[data-idx="${vIdx}"]`);
    if(!bubbleEl||!viewerEl||!stageEl) return;
    const textBox=bubbleEl.querySelector('.text');
    if(textBox) textBox.textContent=text||'';

    const W=stageEl.clientWidth, pad=12;
    const leftCurtainRight=W*0.18, rightCurtainLeft=W*0.82;

    const vRect=viewerEl.getBoundingClientRect(); const sRect=stageEl.getBoundingClientRect();
    const viewerCenterX=(vRect.left+vRect.width/2 - sRect.left);
    let desiredCenterX=viewerCenterX + (xShift||0);

    bubbleEl.style.display='block'; bubbleEl.style.opacity='0';
    bubbleEl.style.left='0px'; bubbleEl.style.top='0px';
    const bw=bubbleEl.offsetWidth||240;

    const minLeft=leftCurtainRight+pad, maxLeft=rightCurtainLeft-pad-bw;
    let leftPx=desiredCenterX-bw/2; if(leftPx<minLeft) leftPx=minLeft; if(leftPx>maxLeft) leftPx=maxLeft;

    const BASE_LIFT=(typeof window.BASE_BUBBLE_LIFT==='number')?window.BASE_BUBBLE_LIFT:96;
    const baseLift=(typeof customLift==='number')?customLift:BASE_LIFT;

    let alt=(typeof window.bubbleAltLower==='boolean')?window.bubbleAltLower:false;
    const downShift=alt?randInt(15,30):0; window.bubbleAltLower=!alt;
    let topPx=(vRect.top - sRect.top - baseLift + downShift); topPx=Math.max(10,topPx);

    bubbleEl.style.left=leftPx+'px'; bubbleEl.style.top=topPx+'px';
    void bubbleEl.offsetWidth;
    bubbleEl.classList.add('active'); bubbleEl.style.opacity='1';
    if(typeof window.isBubbleActive!=='boolean') window.isBubbleActive=false;
    window.isBubbleActive=true;
    if(typeof window.setMode==='function') window.setMode('slow');

    const dur=(typeof durationSecs==='number')?durationSecs:computeThoughtDuration(text);

    if(typeof window.bubbleAutoTimer!=='undefined' && window.bubbleAutoTimer){
      clearTimeout(window.bubbleAutoTimer); window.bubbleAutoTimer=null;
    }
    window.bubbleAutoTimer=setTimeout(()=>{
      if(typeof window.resumeFromBubble==='function'){ window.resumeFromBubble('run'); }
      else{
        bubbleEl.classList.add('closing');
        setTimeout(()=>{
          bubbleEl.classList.remove('active','closing');
          bubbleEl.style.display='none'; bubbleEl.style.opacity='0';
          window.isBubbleActive=false;
          if(typeof window.setMode==='function') window.setMode('run');
        },600);
      }
    }, Math.max(500,dur*1000));
  };
})();
