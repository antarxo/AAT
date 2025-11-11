// act3.js — Foyer: auto-run, no controls; blackboard x=16%, y=0, width=68%, height up to (rulerY + 20px) +30px; curtains stay closed
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

  let PROOFS = { render:'tex', params:{}, proofs:[] };
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
      const bottomPx = Math.max(0, H - (getRulerYpx() + 20) - 30); // taller by 30px
      css(bb,{ left:left+'px', width:width+'px', top:top+'px', bottom:bottomPx+'px', right:'auto' });
    }
    layoutInitial();
    window.addEventListener('resize', layoutInitial);

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

    // Auto sequence
    function autoRunAll(){
      const STEP_MS = 1200;
      let t = 0;
      const proofs = Array.isArray(PROOFS.proofs) ? PROOFS.proofs : [];
      proofs.forEach((p) => {
        const steps = Array.isArray(p.steps) ? p.steps : [];
        setTimeout(()=>{ bb.innerHTML=''; chalkLine(`• ${p.title || 'Πράξη 3η — Φουαγιέ'}`); }, t); t += STEP_MS;
        steps.forEach(s => {
          setTimeout(()=>{
            if(s.type==='say'){
              const idx = (typeof s.viewer==='number') ? s.viewer : 0;
              showThoughtForViewer && showThoughtForViewer(idx, s.text, s.dur? s.dur : 3.0, 125, 0);
            } else if(s.type==='write' || s.type==='derive'){
              chalkLine(s.text);
            } else if(s.type==='box'){
              chalkLine(s.text, true);
              addLaw && addLaw(typeof s.lawText==='string' ? s.lawText : s.text);
            }
          }, t); t += STEP_MS;
        });
      });
      setTimeout(()=>{
        const endTitle = el('div','finale','ΤΕΛΟΣ ΠΑΡΑΣΤΑΣΗΣ');
        css(endTitle,{
          position:'absolute', left:'50%', top:'-42px', transform:'translateX(-50%)',
          font:'700 20px/1.2 system-ui, sans-serif', letterSpacing:'1px',
          padding:'6px 10px', borderRadius:'10px', background:'rgba(0,0,0,.6)',
          border:'1px solid rgba(255,255,255,.25)', color:'#fff', textShadow:'0 2px 8px rgba(0,0,0,.8)'
        });
        foyer.append(endTitle);
        endTitle.animate([{opacity:0, transform:'translate(-50%,-8px)'},{opacity:1, transform:'translate(-50%,0)'}],{duration:420, easing:'ease-out'});
      }, t + 400);
    }

    autoRunAll();
  }

  function prepareSceneForAct3(){
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
