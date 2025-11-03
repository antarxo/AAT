// act3.js — Blackboard: x=16%, y=0, width=68%, height up to (rulerY + 20px); draggable freely; starts via event
(() => {
  const audImg = document.querySelector('.audience');
  const foyer = document.getElementById('foyer-root') || (() => {
    const d = document.createElement('div');
    d.id = 'foyer-root';
    Object.assign(d.style, { position:'fixed', inset:'0', zIndex:'1200', display:'none', pointerEvents:'none' });
    document.body.appendChild(d);
    return d;
  })();

  const css = (el,o)=>Object.assign(el.style,o);
  const el  = (t,c,h)=>{ const e=document.createElement(t); if(c) e.className=c; if(h!=null) e.innerHTML=h; return e; };
  const show=()=>{ foyer.style.display='block'; };
  const hide=()=>{ foyer.style.display='none'; };

  function getRulerYpx(){
    const vh = window.innerHeight || document.documentElement.clientHeight || 800;
    let v = 60;
    const style = getComputedStyle(document.documentElement).getPropertyValue('--axis-y');
    if(style && style.includes('vh')){
      const n = parseFloat(style);
      if(!isNaN(n)) v = n;
    } else if(typeof window.A1_JSON_CFG === 'object' && window.A1_JSON_CFG.ui && typeof window.A1_JSON_CFG.ui.axisYvh === 'number'){
      v = window.A1_JSON_CFG.ui.axisYvh;
    }
    return (v/100) * vh;
  }

  let PROOFS = { render:"tex", params:{}, proofs:[] };
  async function loadProofs(){
    try { const r=await fetch('act3_proofs.json',{cache:'no-cache'}); if(r.ok) PROOFS=await r.json(); } catch {}
  }

  function buildOverlay(){
    foyer.innerHTML=''; foyer.style.pointerEvents='none';

    const bb = el('div','blackboard');
    css(bb,{
      position:'absolute',
      background:'rgba(0,0,0,0.45)',
      border:'1px solid rgba(255,255,255,0.25)',
      borderRadius:'12px',
      boxShadow:'inset 0 0 80px rgba(0,0,0,0.35)',
      color:'#fff',
      overflow:'auto',
      padding:'10px 12px',
      pointerEvents:'auto',
      backdropFilter:'blur(1px)'
    });
    foyer.append(bb);

    function layoutInitial(){
      const W = window.innerWidth  || document.documentElement.clientWidth  || 1024;
      const H = window.innerHeight || document.documentElement.clientHeight || 768;
      const left = Math.round(0.16 * W);
      const width = Math.round(0.68 * W);
      const top = 0;
      const bottomPx = Math.max(8, H - (getRulerYpx() + 20));
      css(bb,{ left:left+'px', width:width+'px', top:top+'px', bottom:bottomPx+'px', right:'auto' });
    }
    layoutInitial();

    // draggable ANYWHERE
    let dragging=false, dx=0, dy=0;
    bb.addEventListener('pointerdown', ev=>{
      dragging=true; bb.setPointerCapture(ev.pointerId);
      const r=bb.getBoundingClientRect(); dx=ev.clientX-r.left; dy=ev.clientY-r.top; ev.preventDefault();
    });
    window.addEventListener('pointermove', ev=>{
      if(!dragging) return;
      const nx = ev.clientX - dx, ny = ev.clientY - dy;
      css(bb,{ left:nx+'px', top:ny+'px', right:'auto', bottom:'auto' });
    });
    window.addEventListener('pointerup', ev=>{
      dragging=false; try{ bb.releasePointerCapture(ev.pointerId); }catch(_){}
    });
    window.addEventListener('resize', layoutInitial);

    // Controls removed — auto‑run; no UI buttons.
  }

  function prepareSceneForAct3(){
    // Start via event; optional audience change to koino2.png
    if(audImg){
      const orig = audImg.getAttribute('src') || '';
      audImg.dataset.origSrc = orig;
      audImg.onerror = ()=>{ try{ audImg.src = orig; }catch(_){} };
      try{ audImg.src = 'koino2.png'; }catch(_){}
    }
  }

  async function runAct3(){ await loadProofs(); prepareSceneForAct3(); buildOverlay(); show(); /* curtains stay closed; no UI */ autoRunAll(); }
  document.addEventListener('act3-start', runAct3);
})();
