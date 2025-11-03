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

    // Controls
    const ctrls = el('div','ctrls');
    css(ctrls,{position:'absolute', right:'18px', top:'18px', display:'flex', gap:'8px', pointerEvents:'auto'});
    function mkBtn(txt){ const b=el('button',null,txt); css(b,{padding:'8px 10px',borderRadius:'10px',border:'1px solid #888',background:'#111',color:'#fff',cursor:'pointer'}); return b; }
    const btnPrev=mkBtn('← Πίσω'), btnNext=mkBtn('Επόμ.'), btnPlay=mkBtn('Auto ▶'), btnReset=mkBtn('Reset'), btnClose=mkBtn('Κλείσιμο');
    foyer.append(ctrls); ctrls.append(btnPrev,btnNext,btnPlay,btnReset,btnClose);

    // Chalk + MathJax
    const useTex = (PROOFS && (PROOFS.render==='tex'));
    function chalkLine(text, boxed=false){
      const row = el('div','chalk');
      if(useTex){
        const s = (text.trim().startsWith('\\(') || text.trim().startsWith('\\[')) ? text : `\\(${text}\\)`;
        row.innerHTML = boxed ? `⟦ ${s} ⟧` : s;
      } else {
        row.textContent = boxed ? `⟦ ${text} ⟧` : text;
      }
      css(row,{whiteSpace:'pre-wrap',borderLeft:'3px solid rgba(255,255,255,0.25)',padding:'4px 8px',margin:'4px 0',
               font:'15px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'});
      bb.append(row);
      row.animate([{opacity:0, filter:'blur(2px)'},{opacity:1, filter:'blur(0)'}],{duration:220, easing:'ease-out'});
      if(useTex && window.MathJax && window.MathJax.typesetPromise){ window.MathJax.typesetPromise([row]); }
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
        addLaw?.(typeof s.lawText==='string' ? s.lawText : s.text);
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

  async function runAct3(){ await loadProofs(); prepareSceneForAct3(); buildOverlay(); show(); }
  document.addEventListener('act3-start', runAct3);
})();
