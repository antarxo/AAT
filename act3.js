<script>
// act3.js — Blackboard ΜΟΝΟ στον χώρο τίτλων+σκηνής, ΧΩΡΙΣ να καλύπτει τις κουρτίνες
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

  const rect = el => (el && el.getBoundingClientRect) ? el.getBoundingClientRect() : null;
  const vw = ()=> window.innerWidth  || document.documentElement.clientWidth  || 1024;
  const vh = ()=> window.innerHeight || document.documentElement.clientHeight || 768;

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
    const top    = Math.max(stR.top + pad, (upR ? upR.bottom + pad : 0)); // ΚΑΤΩ από την πάνω κουρτίνα
    let bottomPx;
    if(loR){
      bottomPx = Math.max(pad, vh() - loR.top + pad); // ΠΑΝΩ από την κάτω κουρτίνα
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
      background:'rgba(0,0,0,0.45)',  // διαφανές, να φαίνεται το σκηνικό πίσω
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

    // Controls πάνω δεξιά στον πίνακα
    const ctrls = el('div','ctrls');
    css(ctrls,{position:'absolute', right:'18px', top:'18px', display:'flex', gap:'8px', pointerEvents:'auto'});
    const mkBtn = t => { const b=el('button',null,t); css(b,{padding:'8px 10px',borderRadius:'10px',border:'1px solid #888',background:'#111',color:'#fff',cursor:'pointer'}); return b; };
    const btnPrev=mkBtn('← Πίσω'), btnNext=mkBtn('Επόμ.'), btnPlay=mkBtn('Auto ▶'), btnReset=mkBtn('Reset'), btnClose=mkBtn('Κλείσιμο');
    foyer.append(ctrls); ctrls.append(btnPrev,btnNext,btnPlay,btnReset,btnClose);

    // Helpers
    const addLaw = window.addLaw;
    const showThoughtForViewer = window.showThoughtForViewer;
    const chalkLine = (text, box=false) => {
      const row = el('div','chalk', box ? `⟦ ${text} ⟧` : text);
      css(row,{whiteSpace:'pre-wrap',borderLeft:'3px solid rgba(255,255,255,0.25)',padding:'4px 8px',margin:'4px 0',
               font:'15px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'});
      bb.append(row);
      row.animate([{opacity:0, filter:'blur(2px)'},{opacity:1, filter:'blur(0)'}],{duration:220, easing:'ease-out'});
    };

    let proofIdx=0, stepIdx=0, autoTimer=null, rot=0;
    const fallbackViewers=[0,2,4,1,3];
    const cur = () => PROOFS.proofs[proofIdx] || {title:'', steps:[]};
    const renderTitle = () => chalkLine(`• ${cur().title || 'Πράξη 3η — Φουαγιέ'}`);
    const clearBoard  = () => { bb.innerHTML=''; };

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
        addLaw?.(s.text); // τελικά αποτελέσματα → στους «Νόμους» αριστερά
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

    // Re-layout σε resize/loads
    const relayout = ()=> layoutBoard(bb);
    window.addEventListener('resize', relayout);
    audImg?.addEventListener('load', relayout);
    curtainUpper?.addEventListener('load', relayout);
    curtainLower?.addEventListener('load', relayout);
    setTimeout(relayout,0);
  }

  function prepareSceneForAct3(){
    // Κουρτίνες κλειστές (παραμένουν ορατές), κοινό -> koino2.png (fallback αν λείπει)
    stage?.classList.remove('open');
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
</script>
