// act3.js — Same stage, closed curtains; audience switches to koino2.png; top blackboard overlay
(() => {
  const stage  = document.getElementById('stage');
  const audImg = document.querySelector('.audience');

  const foyer = document.getElementById('foyer-root') || (() => {
    const d = document.createElement('div');
    d.id = 'foyer-root';
    Object.assign(d.style, { position:'fixed', inset:'0', zIndex:'650', display:'none', pointerEvents:'none' });
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

  // build overlay: blackboard occupying top area (titles+stage), leave audience visible
  function buildOverlay(){
    foyer.innerHTML='';
    foyer.style.pointerEvents='none';

    // top blackboard covering down to top of audience image
    const bb = el('div','blackboard');
    const audH = (audImg && audImg.clientHeight) ? audImg.clientHeight : Math.floor(window.innerHeight*0.18);
    css(bb,{
      position:'absolute', left:0, right:0, top:0, bottom: (audH + 12) +'px',
      background:'radial-gradient(800px 420px at 20% 10%, rgba(255,255,255,0.05), rgba(0,0,0,0.92)), #0c0f10',
      border:'1px solid rgba(255,255,255,0.15)', borderRadius:'12px', margin:'8px',
      boxShadow:'inset 0 0 80px rgba(0,0,0,0.6)', overflow:'auto', color:'#fff',
      pointerEvents:'auto'
    });
    foyer.append(bb);

    // controls floating (play/next/prev/reset/close) — top-right on the board
    const ctrls = el('div','ctrls');
    css(ctrls,{position:'absolute', right:'18px', top:'18px', display:'flex', gap:'8px', pointerEvents:'auto'});
    function mkBtn(txt){ const b=el('button',null,txt); css(b,{padding:'8px 10px',borderRadius:'10px',border:'1px solid #888',background:'#111',color:'#fff',cursor:'pointer'}); return b; }
    const btnPrev=mkBtn('← Πίσω'), btnNext=mkBtn('Επόμ.'), btnPlay=mkBtn('Auto ▶'), btnReset=mkBtn('Reset'), btnClose=mkBtn('Κλείσιμο');
    foyer.append(ctrls); ctrls.append(btnPrev,btnNext,btnPlay,btnReset,btnClose);

    // bubbles host (over the board)
    const bHost = el('div','bHost');
    css(bHost,{position:'absolute', left:0, right:0, top:0, bottom:(audH+12)+'px', pointerEvents:'none'});
    foyer.append(bHost);

    // chalk line helper
    function chalkLine(text, isBox=false){
      const row = el('div','chalk', isBox ? `⟦ ${text} ⟧` : text);
      css(row,{whiteSpace:'pre-wrap',borderLeft:'3px solid rgba(255,255,255,0.2)',padding:'4px 8px',margin:'4px 0',
               font:'15px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'});
      bb.append(row);
      row.animate([{opacity:0, filter:'blur(3px)'},{opacity:1, filter:'blur(0)'}],{duration:220, easing:'ease-out'});
    }
    function say(text, ms=2800){
      const b=el('div','bubble',text);
      css(b,{position:'absolute',left:'50%',top:'14%',transform:'translateX(-50%)',maxWidth:'min(840px,84vw)',padding:'12px 14px',color:'#fff',
             background:'rgba(0,0,0,0.55)',border:'1px dashed rgba(255,255,255,0.35)',borderRadius:'12px',backdropFilter:'blur(2px)'});
      bHost.append(b);
      setTimeout(()=>{try{b.remove()}catch(_){}} , ms);
    }

    // controller
    let proofIdx=0, stepIdx=0, autoTimer=null;
    function cur(){ return PROOFS.proofs[proofIdx] || {title:"", steps:[]}; }
    function renderTitle(){ chalkLine(`• ${cur().title}`); }
    function clearBoard(){ bb.innerHTML=''; }
    function doStep(s){
      if(!s) return;
      if(s.type==='say'){ say(s.text, s.dur? s.dur*1000 : 2800); }
      else if(s.type==='write'){ chalkLine(s.text); }
      else if(s.type==='derive'){ chalkLine(s.text); }
      else if(s.type==='box'){ chalkLine(s.text, true); window.addLaw?.(s.text); } // τελικό αποτέλεσμα → στους νόμους αριστερά
    }
    function next(){
      const p=cur();
      if(stepIdx===0) renderTitle();
      if(stepIdx < p.steps.length){ doStep(p.steps[stepIdx]); stepIdx++; }
      else { proofIdx = Math.min(PROOFS.proofs.length-1, proofIdx+1); stepIdx=0; clearBoard(); renderTitle(); }
    }
    function prev(){
      if(stepIdx>0){ stepIdx-=1; clearBoard(); renderTitle(); const p=cur(); for(let i=0;i<stepIdx;i++) doStep(p.steps[i]); }
    }
    function reset(){ stepIdx=0; clearBoard(); renderTitle(); }
    function toggleAuto(){ if(autoTimer){ clearInterval(autoTimer); autoTimer=null; btnPlay.textContent='Auto ▶'; } else { btnPlay.textContent='Auto ⏸'; autoTimer=setInterval(next, 1200); } }
    btnPrev.onclick=prev; btnNext.onclick=next; btnPlay.onclick=toggleAuto; btnReset.onclick=reset; btnClose.onclick=hide;
  }

  function prepareSceneForAct3(){
    // Close curtains and update audience src to koino2.png (fallback to original if missing)
    if(stage) stage.classList.remove('open');
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
