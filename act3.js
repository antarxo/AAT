// act3.js — Blackboard inside stage (between curtains/sides), draggable within that area; curtains closed; koino2 audience
(() => {
  const stage        = document.getElementById('stage');
  const curtainUpper = document.querySelector('.curtain-upper');
  const curtainLower = document.querySelector('.curtain-lower');
  const audImg       = document.querySelector('.audience');

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

  let PROOFS = { render:"plain", params:{}, proofs:[] };
  async function loadProofs(){
    try { const r=await fetch('act3_proofs.json',{cache:'no-cache'}); if(r.ok) PROOFS=await r.json(); } catch {}
  }

  function rect(el){ try{ return el.getBoundingClientRect(); }catch(_){ return null; } }
  function vw(){ return window.innerWidth || document.documentElement.clientWidth || 1024; }
  function vh(){ return window.innerHeight || document.documentElement.clientHeight || 768; }

  function stageBounds(){
    const pad = 8;
    const stR = rect(stage);
    const upR = rect(curtainUpper);
    const loR = rect(curtainLower);
    if(!stR) return { left: pad, right: vw()-pad, top: pad, bottom: vh()-pad };
    const left = Math.max(pad, stR.left + pad);
    const right = Math.min(vw()-pad, stR.right - pad);
    const top = Math.max(stR.top + pad, (upR ? upR.bottom + pad : stR.top + pad));
    const bottom = Math.min(vh()-pad, (loR ? loR.top - pad : (rect(audImg) ? rect(audImg).top - pad : vh()*0.82)));
    return { left, right, top, bottom };
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

    // initial fit inside stage
    const B = stageBounds();
    css(bb,{ left:B.left+'px', right:(vw()-B.right)+'px', top:B.top+'px', bottom:(vh()-B.bottom)+'px' });

    // make draggable inside bounds
    let dragging=false, dx=0, dy=0, startX=0, startY=0, bbStartLeft=0, bbStartTop=0;
    function onPointerDown(ev){
      dragging=true;
      bb.setPointerCapture(ev.pointerId);
      const r = bb.getBoundingClientRect();
      startX = ev.clientX; startY = ev.clientY;
      bbStartLeft = r.left; bbStartTop = r.top;
      dx = startX - r.left; dy = startY - r.top;
      ev.preventDefault();
    }
    function onPointerMove(ev){
      if(!dragging) return;
      const B = stageBounds();
      const r = bb.getBoundingClientRect();
      let nx = ev.clientX - dx, ny = ev.clientY - dy;
      nx = Math.max(B.left, Math.min(nx, B.right - r.width));
      ny = Math.max(B.top,  Math.min(ny, B.bottom - r.height));
      // set via left/top + reset right/bottom to auto
      css(bb,{ left:nx+'px', top:ny+'px', right:'auto', bottom:'auto' });
    }
    function onPointerUp(ev){
      dragging=false;
      try{ bb.releasePointerCapture(ev.pointerId); }catch(_){}
    }
    bb.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Controls inside board
    const ctrls = el('div','ctrls');
    css(ctrls,{position:'absolute', right:'18px', top:'18px', display:'flex', gap:'8px', pointerEvents:'auto'});
    function mkBtn(txt){ const b=el('button',null,txt); css(b,{padding:'8px 10px',borderRadius:'10px',border:'1px solid #888',background:'#111',color:'#fff',cursor:'pointer'}); return b; }
    const btnPrev=mkBtn('← Πίσω'), btnNext=mkBtn('Επόμ.'), btnPlay=mkBtn('Auto ▶'), btnReset=mkBtn('Reset'), btnClose=mkBtn('Κλείσιμο');
    foyer.append(ctrls); ctrls.append(btnPrev,btnNext,btnPlay,btnReset,btnClose);

    // Helpers
    function chalkLine(text, isBox=false){
      const row = el('div','chalk', isBox ? `⟦ ${text} ⟧` : text);
      css(row,{whiteSpace:'pre-wrap',borderLeft:'3px solid rgba(255,255,255,0.25)',padding:'4px 8px',margin:'4px 0',
               font:'15px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'});
      bb.append(row);
      row.animate([{opacity:0, filter:'blur(2px)'},{opacity:1, filter:'blur(0)'}],{duration:220, easing:'ease-out'});
    }

    const addLaw = window.addLaw;
    const showThoughtForViewer = window.showThoughtForViewer;
    let proofIdx=0, stepIdx=0, autoTimer=null, rot=0;
    const fallbackViewers=[0,2,4,1,3];

    function cur(){ return PROOFS.proofs[proofIdx] || {title:'', steps:[]}; }
    function renderTitle(){ chalkLine(`• ${cur().title || 'Πράξη 3η — Φουαγιέ'}`); }
    function clearBoard(){ bb.innerHTML=''; }

    function doStep(s){
      if(!s) return;
      if(s.type==='say'){
        const idx = (typeof s.viewer==='number') ? s.viewer : fallbackViewers[rot % fallbackViewers.length];
        rot++;
        showThoughtForViewer?.(idx, s.text, s.dur? s.dur : 3.0, 125, 0);
      } else if(s.type==='write' || s.type==='derive'){
        chalkLine(s.text);
      } else if(s.type==='box'){
        chalkLine(s.text, true);
        addLaw?.(s.text);
      }
    }

    function next(){
      const p=cur();
      if(stepIdx===0) renderTitle();
      if(stepIdx < p.steps.length){ doStep(p.steps[stepIdx]); stepIdx++; }
      else if(proofIdx < PROOFS.proofs.length-1){ proofIdx++; stepIdx=0; clearBoard(); renderTitle(); }
    }
    function prev(){
      if(stepIdx>0){ stepIdx-=1; clearBoard(); renderTitle(); const p=cur(); for(let i=0;i<stepIdx;i++) doStep(p.steps[i]); }
    }
    function reset(){ stepIdx=0; clearBoard(); renderTitle(); }
    function toggleAuto(){ if(autoTimer){ clearInterval(autoTimer); autoTimer=null; btnPlay.textContent='Auto ▶'; } else { btnPlay.textContent='Auto ⏸'; autoTimer=setInterval(next, 1200); } }

    btnPrev.onclick=prev; btnNext.onclick=next; btnPlay.onclick=toggleAuto; btnReset.onclick=reset; btnClose.onclick=hide;

    const relayout = ()=>{
      const B = stageBounds();
      const r = bb.getBoundingClientRect();
      // clamp current position inside new bounds
      let nx = Math.max(B.left, Math.min(r.left, B.right - r.width));
      let ny = Math.max(B.top,  Math.min(r.top,  B.bottom - r.height));
      css(bb,{ left:nx+'px', top:ny+'px', right:'auto', bottom:'auto' });
    };
    window.addEventListener('resize', relayout);
    audImg?.addEventListener('load', relayout);
    curtainUpper?.addEventListener('load', relayout);
    curtainLower?.addEventListener('load', relayout);
    setTimeout(relayout, 0);
  }

  function prepareSceneForAct3(){
    stage?.classList.remove('open'); // curtains closed but visible
    if(audImg){
      const orig = audImg.getAttribute('src') || '';
      audImg.dataset.origSrc = orig;
      audImg.onerror = ()=>{ try{ audImg.src = orig; }catch(_){} };
      audImg.src = 'koino2.png';
    }
  }

  async function runAct3(){ await loadProofs(); prepareSceneForAct3(); buildOverlay(); show(); }
  document.addEventListener('act3-start', runAct3);
})();
