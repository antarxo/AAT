// act3.js — Blackboard ONLY in the titles+stage area, NOT covering the two curtains
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

  function layoutBoard(bb){
    const pad = 8;
    const stR = rect(stage);
    if(!stR){
      const aR = rect(audImg);
      const bottom = aR? Math.max(pad, (vh() - aR.top) + pad) : Math.floor(vh()*0.18);
      css(bb,{ left: pad+'px', right: pad+'px', top: pad+'px', bottom: bottom+'px' });
      return;
    }
    const upR = rect(curtainUpper);
    const loR = rect(curtainLower);

    const left   = Math.max(pad, stR.left + pad);
    const right  = Math.max(pad, vw() - stR.right + pad);
    const top    = Math.max(stR.top + pad, (upR ? upR.bottom + pad : 0)); // below upper curtain
    let bottomPx;
    if(loR){
      bottomPx = Math.max(pad, vh() - loR.top + pad); // above lower curtain
    } else {
      const aR = rect(audImg);
      bottomPx = aR? Math.max(pad, (vh() - aR.top) + pad) : Math.floor(vh()*0.18);
    }

    css(bb,{ left:left+'px', right:right+'px', top:top+'px', bottom:bottomPx+'px' });
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
    layoutBoard(bb);

    // Controls top-right inside board
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

    const relayout = ()=> layoutBoard(bb);
    window.addEventListener('resize', relayout);
    if(audImg) audImg.addEventListener('load', relayout);
    if(curtainUpper) curtainUpper.addEventListener('load', relayout);
    if(curtainLower) curtainLower.addEventListener('load', relayout);
    setTimeout(relayout, 0);
  }

  function prepareSceneForAct3(){
    if(stage) stage.classList.remove('open'); // curtains closed but visible
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
