/* ghost_sync_strict_v2.js */
(function(){
  'use strict';
  const $ = (s,r=document)=>r.querySelector(s);
  const byId = (id)=>document.getElementById(id);

  let stage, actor, springEl;
  function ensureBase(){
    stage    = stage    || byId('stage');
    actor    = actor    || byId('actor');   // DIV του skater
    springEl = springEl || byId('spring');  // IMG ελατηρίου (κανονικό)
    return !!stage && !!actor && !!springEl;
  }

  let ghostWrap=null, ghostImg=null, gSpring=null;
  function ω(){ return (typeof window.omega==='number'?window.omega:(2*Math.PI/(window.T||6))); }
  function px(){ return (typeof window.pxPerMeter==='number'?window.pxPerMeter:50); }
  function tPlay(){ return (typeof window.playbackTime==='number'?window.playbackTime:performance.now()/1000); }
  function anchorX(){ return (typeof window.anchorX==='function'?window.anchorX():stage.clientWidth*0.18); }

  let Aghost_m = 5;
  function setGhostAmplitude(m){ Aghost_m = Math.max(0,+m||0); }
  let L0_px = null;

  function makeGhost(){
    if(!ensureBase()) return false;

    const csActor  = getComputedStyle(actor);
    const csSpring = getComputedStyle(springEl);
    const aRect    = actor.getBoundingClientRect();

    if(!ghostWrap){
      ghostWrap = document.createElement('div');
      ghostWrap.id = 'ghostActor';
      Object.assign(ghostWrap.style,{
        position:'absolute',
        left:'50%',
        bottom: csActor.bottom,
        width: (aRect.width||144)+'px',
        height:(aRect.height||96)+'px',
        transform:'none',
        zIndex:'120',
        pointerEvents:'none',
      });
      stage.appendChild(ghostWrap);
    }
    if(!ghostImg){
      const realImg = actor.querySelector('img');
      ghostImg = document.createElement('img');
      ghostImg.src = realImg ? realImg.src : 'skater.png';
      Object.assign(ghostImg.style,{
        width:'100%',height:'auto',display:'block',
        opacity:'0.40',filter:'drop-shadow(0 4px 6px rgba(0,0,0,.6))'
      });
      ghostWrap.appendChild(ghostImg);
    }
    if(!gSpring){
      const sRect = springEl.getBoundingClientRect();
      gSpring = document.createElement('img');
      gSpring.id = 'ghostSpring';
      gSpring.src = springEl.src;
      Object.assign(gSpring.style,{
        position:'absolute',
        left:  anchorX()+'px',
        bottom: csSpring.bottom,
        height: (sRect.height||96)+'px',
        width:  (sRect.width ||160)+'px',
        transformOrigin:'left center',
        transform:'scaleX(1)',
        opacity:'0.40',
        zIndex:'119',
        pointerEvents:'none',
        filter:'drop-shadow(0 4px 6px rgba(0,0,0,.55))',
      });
      stage.appendChild(gSpring);
    }
    if(!L0_px){
      const realW = springEl.getBoundingClientRect().width;
      L0_px = Math.max(1, realW);
    }
    return true;
  }

  let rafId=0, stopTs=0;
  function step(){
    if(!ensureBase() || !ghostWrap || !gSpring){ rafId=0; return; }
    const w = ω(), kpx=px(), Apx=Aghost_m*kpx, t=tPlay();
    const centerX = stage.clientWidth/2;
    const realRect = actor.getBoundingClientRect();
    const hookOff  = (realRect.width||(ghostWrap.getBoundingClientRect().width)||144)/2;
    const xHook = centerX + Apx*Math.sin(w*t);

    ghostWrap.style.left = (xHook - hookOff)+'px';

    const ax = anchorX();
    const dist = xHook - ax;
    const scale = (L0_px>0)?(dist/L0_px):1;
    gSpring.style.left     = ax+'px';
    gSpring.style.transform= `scaleX(${scale})`;

    if(performance.now()<stopTs){ rafId=requestAnimationFrame(step); }
    else { stopGhostSync(); }
  }

  function startGhostSync(ms=10000){
    if(!makeGhost()) return;
    syncBottoms();
    stopTs = performance.now()+Math.max(0,ms|0);
    if(!rafId) rafId=requestAnimationFrame(step);
  }
  function stopGhostSync(){
    if(rafId){ cancelAnimationFrame(rafId); rafId=0; }
    try{ if(ghostWrap) ghostWrap.remove(); }catch(_){}
    try{ if(gSpring)   gSpring.remove(); }catch(_){}
    ghostWrap=null; ghostImg=null; gSpring=null;
  }
  function syncBottoms(){
    if(!ensureBase()) return;
    const csActor  = getComputedStyle(actor);
    const csSpring = getComputedStyle(springEl);
    if(ghostWrap) ghostWrap.style.bottom = csActor.bottom;
    if(gSpring)   gSpring.style.bottom   = csSpring.bottom;
  }
  window.addEventListener('resize', syncBottoms);

  window.setGhostAmplitude = setGhostAmplitude;
  window.startGhostSync    = startGhostSync;
  window.stopGhostSync     = stopGhostSync;
  window.GHOST = { start:startGhostSync, stop:stopGhostSync, setA:setGhostAmplitude };
})();
