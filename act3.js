// act3.js
(() => {
  const A3 = { m: 70, T: 6.0, A: 3.0 };
  A3.omega = 2*Math.PI/A3.T;
  A3.D = A3.m * A3.omega * A3.omega;
  A3.E = 0.5 * A3.D * A3.A * A3.A;

  const foyer = document.getElementById('foyer-root') || (() => {
    const d = document.createElement('div');
    d.id = 'foyer-root';
    Object.assign(d.style, { position:'fixed', inset:'0', zIndex:'650', display:'none' });
    document.body.appendChild(d);
    return d;
  })();

  const css = (el,o)=>Object.assign(el.style,o);
  const el  = (t,c,h)=>{ const e=document.createElement(t); if(c) e.className=c; if(h!=null) e.innerHTML=h; return e; };
  const show=()=>{ foyer.style.display='grid'; };
  const hide=()=>{ foyer.style.display='none'; };

  let PROOFS = { render:"plain", params:{}, proofs:[] };
  async function loadProofs(){
    try { const r=await fetch('act3_proofs.json',{cache:'no-cache'}); if(r.ok) PROOFS=await r.json(); } catch {}
  }

  function chalkArea(){
    const bb = el('div','blackboard');
    css(bb,{
      background:'radial-gradient(800px 420px at 20% 10%, rgba(255,255,255,0.05), rgba(0,0,0,0.92)), #0c0f10',
      border:'1px solid rgba(255,255,255,0.15)', borderRadius:'12px', padding:'12px', minHeight:'260px',
      boxShadow:'inset 0 0 80px rgba(0,0,0,0.6)', overflow:'auto'
    });
    return bb;
  }
  function chalkLine(container, text, isBox=false){
    const row = el('div','chalk', isBox ? `⟦ ${text} ⟧` : text);
    css(row,{whiteSpace:'pre-wrap',borderLeft:'3px solid rgba(255,255,255,0.2)',padding:'4px 8px',margin:'4px 0',
             font:'15px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', color:'#fff'});
    container.append(row);
    row.animate([{opacity:0, filter:'blur(3px)'},{opacity:1, filter:'blur(0px)'}],{duration:260, easing:'ease-out'});
  }

  function bubbleHost(){
    let host = foyer.querySelector('#foyer-bubbles');
    if(!host){
      host = el('div'); host.id='foyer-bubbles';
      css(host,{position:'fixed', inset:'0', pointerEvents:'none', zIndex:'700'});
      foyer.append(host);
    }
    return host;
  }
  function showBubble(text, ms=2800){
    const host = bubbleHost();
    const b = el('div','bubble', text);
    css(b,{
      position:'absolute', left:'50%', top:'18%', transform:'translateX(-50%)',
      maxWidth:'min(780px,82vw)', padding:'12px 14px', color:'#fff',
      background:'rgba(0,0,0,0.55)', border:'1px dashed rgba(255,255,255,0.35)',
      borderRadius:'12px', backdropFilter:'blur(2px)', pointerEvents:'auto'
    });
    host.append(b);
    b.animate([{opacity:0},{opacity:1}],{duration:150, easing:'ease-out'});
    const t = setTimeout(()=>close(), ms);
    function close(){ try{ b.remove(); }catch(_){} clearTimeout(t); }
    b.addEventListener('click', close);
  }

  function baseUI(){
    foyer.innerHTML='';
    css(foyer,{ background:'linear-gradient(180deg,#0e0e14 0%,#0a0a0f 100%)', color:'#fff',
                display:'grid', gridTemplateRows:'auto 1fr auto', gap:'10px', padding:'16px' });

    const hdr = el('div','hdr',`<h2 style="margin:0 0 6px">Πράξη 3η — Φουαγιέ</h2>
      <div style="opacity:.85">Διάλογοι σε bubbles · Αποδείξεις στον μαυροπίνακα</div>`);

    const grid = el('div','grid'); css(grid,{display:'grid',gridTemplateColumns:'1fr',gap:'12px',alignItems:'start'});
    const bb = chalkArea(); grid.append(bb);

    const ctrls = el('div','ctrls'); css(ctrls,{display:'flex',gap:'8px',justifyContent:'space-between'});
    const leftC = el('div'); const rightC = el('div');
    const btnPrev = el('button',null,'← Πίσω');
    const btnNext = el('button',null,'Επόμ.');
    const btnPlay = el('button',null,'Auto ▶');
    const btnReset= el('button',null,'Reset Απόδειξης');
    [btnPrev,btnNext,btnPlay,btnReset].forEach(b=>css(b,{padding:'8px 12px',borderRadius:'10px',border:'1px solid #888',background:'#111',color:'#fff',cursor:'pointer'}));
    leftC.append(btnPrev, btnNext, btnPlay, btnReset);

    const btnClose = el('button',null,'Κλείσιμο Φουαγιέ');
    css(btnClose,{padding:'8px 12px',borderRadius:'10px',border:'1px solid #888',background:'#111',color:'#fff',cursor:'pointer'});
    rightC.append(btnClose);
    ctrls.append(leftC, rightC);

    foyer.append(hdr, grid, ctrls);

    let proofIdx=0, stepIdx=0, autoTimer=null;
    function cur(){ return PROOFS.proofs[proofIdx] || {title:"", steps:[]}; }
    function renderTitle(){ chalkLine(bb, `• ${cur().title}`); }
    function clearBoard(){ bb.innerHTML=''; }
    function doStep(s){
      if(!s) return;
      if(s.type==='say'){ showBubble(s.text, s.dur? s.dur*1000 : 2800); }
      else if(s.type==='write'){ chalkLine(bb, s.text); }
      else if(s.type==='derive'){ chalkLine(bb, s.text); }
      else if(s.type==='box'){ chalkLine(bb, s.text, true); }
    }
    function next(){
      const p=cur();
      if(stepIdx===0) renderTitle();
      if(stepIdx < p.steps.length){ doStep(p.steps[stepIdx]); stepIdx++; }
      else {
        proofIdx = Math.min(PROOFS.proofs.length-1, proofIdx+1);
        stepIdx=0; clearBoard(); renderTitle();
      }
    }
    function prev(){
      if(stepIdx>0){ stepIdx-=1; clearBoard(); renderTitle();
        const p=cur(); for(let i=0;i<stepIdx;i++) doStep(p.steps[i]); }
    }
    function reset(){ stepIdx=0; clearBoard(); renderTitle(); }
    function toggleAuto(){
      if(autoTimer){ clearInterval(autoTimer); autoTimer=null; btnPlay.textContent='Auto ▶'; }
      else { btnPlay.textContent='Auto ⏸'; autoTimer=setInterval(next, 1200); }
    }
    btnPrev.onclick=prev; btnNext.onclick=next; btnPlay.onclick=toggleAuto; btnReset.onclick=reset;
    btnClose.onclick=hide;

    if(PROOFS.proofs && PROOFS.proofs.length){ clearBoard(); renderTitle(); }
  }

  async function runAct3(){ await loadProofs(); baseUI(); show(); }
  document.addEventListener('act3-start', runAct3);
})();
