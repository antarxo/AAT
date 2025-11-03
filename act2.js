// act2.js
const A2 = { m:70, T:6.0, A:3.0 };
A2.omega = 2*Math.PI/A2.T;
A2.D = A2.m * A2.omega * A2.omega;
A2.E = 0.5 * A2.D * A2.A * A2.A;

const root2 = document.getElementById('act2-root');
const stage = document.getElementById('stage');
const curtainUpper = document.querySelector('.curtain-upper');
const springEl = document.getElementById('spring');
const markerEl = document.getElementById('marker');
const spotlight = document.getElementById('spotlight');

const css = (el,o)=>Object.assign(el.style,o);
const el  = (t,c,h)=>{ const e=document.createElement(t); if(c) e.className=c; if(h!=null) e.innerHTML=h; return e; };
const show=()=>root2.hidden=false;
const hide=()=>root2.hidden=true;

let META2 = {
  features:{ showSpringOnOpen:true, showMarker:true, showSpotlight:true, showFx:true, showFlashback:true, graphs:{xt:false,vt:false,at:false,ax:false} },
  title:{ autoFill:true, lines:["Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!","m₁ = … kg , D₁ = … N/m","Εμηχ = … J"] },
  flashbackAmpFactor:1.5
};
let timeline2 = [];
let tickerId=null;

async function loadMeta(){
  try{ const r=await fetch('act2_meta.json',{cache:'no-cache'}); if(r.ok) META2 = await r.json(); }catch{}
}
async function loadTimeline(){
  try{ const r=await fetch('act2_timeline.json',{cache:'no-cache'}); timeline2 = r.ok ? await r.json() : []; }catch{ timeline2=[]; }
}

function baseUI2(){
  root2.innerHTML='';
  css(root2,{position:'fixed',inset:'0',zIndex:'600',display:'grid',gridTemplateRows:'auto 1fr auto',gap:'10px',
    background:'rgba(0,0,0,0.72)',color:'#fff',font:'14px/1.45 system-ui,Inter',padding:'16px'});

  const [L1,L2,L3] = META2.title?.lines || [];
  const hdr = el('div','hdr',`
    <div class="t1" style="font-weight:700;font-size:18px">${L1||"Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!"}</div>
    <div class="t2" style="opacity:.9">${L2||"m₁ = … kg , D₁ = … N/m"}</div>
    <div class="t3" style="opacity:.85">${L3||"Εμηχ = … J"}</div>
  `);

  const mid = el('div','mid'); css(mid,{display:'grid',gridTemplateColumns:'1fr 360px',gap:'16px',alignItems:'start'});
  const left = el('div','left'); const thoughtsList = el('ul','thoughts'); css(thoughtsList,{margin:'0',padding:'0 0 0 18px'}); left.append(thoughtsList);
  const right = el('div','right');

  const fxTitle = el('div',null,'<b>Γραφική F–x (κλίση −D)</b>');
  const fxCanvas = el('canvas','fx'); css(fxCanvas,{width:'100%',height:'220px',background:'rgba(255,255,255,0.06)',borderRadius:'8px',marginBottom:'8px'});

  const flashTitle = el('div',null,'<b>Flashback: x–t (A’ &gt; A)</b>');
  const flashCanvas = el('canvas','flash'); css(flashCanvas,{width:'100%',height:'120px',background:'rgba(255,255,255,0.06)',borderRadius:'8px'});

  if(META2.features?.showFx){ right.append(fxTitle, fxCanvas, el('div',null,`<small>D=${A2.D.toFixed(2)} N/m</small>`)); }
  if(META2.features?.showFlashback){ right.append(flashTitle, flashCanvas); }

  const ctrls = el('div','ctrls'); css(ctrls,{display:'flex',gap:'8px',justifyContent:'flex-end'});
  const btnClose = el('button',null,'Κλείσιμο');
  const btnEnd   = el('button',null,'Τέλος Πράξης 2 (Κουρτίνα)');
  [btnClose,btnEnd].forEach(b=>css(b,{padding:'8px 12px',borderRadius:'8px',border:'1px solid #888',background:'#111',color:'#fff',cursor:'pointer'}));
  btnClose.onclick=()=>hide();
  btnEnd.onclick=()=>endAct2Curtain();

  root2.append(hdr, mid, ctrls);
  mid.append(left, right);

  function setAutoTitle(){
    if(!META2.title?.autoFill) return;
    const t2 = root2.querySelector('.t2');
    const t3 = root2.querySelector('.t3');
    if(t2) t2.textContent = `m₁ = ${A2.m.toFixed(2)} kg , D₁ = ${A2.D.toFixed(2)} N/m`;
    if(t3) t3.textContent = `Εμηχ = ${A2.E.toFixed(2)} J`;
  }
  function addThought(txt){ const li=el('li',null,txt); thoughtsList.append(li); }
  function bubble(txt,ms=2400){
    const b=el('div','bubble',txt);
    css(b,{position:'fixed',left:'50%',top:'18%',transform:'translateX(-50%)',maxWidth:'min(780px,82vw)',padding:'12px 14px',
      background:'rgba(255,255,255,0.10)',border:'1px dashed rgba(255,255,255,0.35)',borderRadius:'12px',backdropFilter:'blur(2px)'});
    root2.append(b); setTimeout(()=>b.remove(), ms);
  }
  function drawFx(){
    if(!META2.features?.showFx) return;
    const c=fxCanvas, dpi=window.devicePixelRatio||1, W=(c.clientWidth|0), H=(c.clientHeight|0);
    c.width=W*dpi; c.height=H*dpi; const ctx=c.getContext('2d'); ctx.scale(dpi,dpi);
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1;
    ctx.beginPath(); for(let i=0;i<=6;i++){ const x=i*(W/6); ctx.moveTo(x,0); ctx.lineTo(x,H);} for(let j=0;j<=4;j++){ const y=j*(H/4); ctx.moveTo(0,y); ctx.lineTo(W,y);} ctx.stroke();
    const D=A2.D, A=A2.A, xMin=-A, xMax=A;
    const x2px = x => (x-xMin)/(xMax-xMin)*W;
    const F = x => -D*x;
    const Fmax=D*A, F2py = Fv => { const FMin=-Fmax, FMax=Fmax; return H - (Fv-FMin)/(FMax-FMin)*H; };
    ctx.strokeStyle='#ffd27a'; ctx.lineWidth=2; ctx.beginPath();
    ctx.moveTo(x2px(xMin), F2py(F(xMin))); ctx.lineTo(x2px(xMax), F2py(F(xMax))); ctx.stroke();
    ctx.fillStyle='#fff'; ctx.font='12px system-ui';
    ctx.fillText('x (m)', 8, H-6); ctx.fillText('F (N)', W-40, 14);
    ctx.setLineDash([5,4]); ctx.strokeStyle='rgba(255,255,255,0.5)';
    const y0=F2py(0), x0=x2px(0); ctx.beginPath(); ctx.moveTo(0,y0); ctx.lineTo(W,y0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0,0); ctx.lineTo(x0,H); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillText(`κλίση = -D = ${(-D).toFixed(2)} N/m`, 10, 18);
  }
  function drawFlashback(){
    if(!META2.features?.showFlashback) return;
    const c=flashCanvas, dpi=window.devicePixelRatio||1, W=(c.clientWidth|0), H=(c.clientHeight|0);
    c.width=W*dpi; c.height=H*dpi; const ctx=c.getContext('2d'); ctx.scale(dpi,dpi);
    ctx.clearRect(0,0,W,H);
    ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1; ctx.beginPath();
    for(let i=0;i<=6;i++){ const x=i*(W/6); ctx.moveTo(x,0); ctx.lineTo(x,H); }
    for(let j=0;j<=2;j++){ const y=j*(H/2); ctx.moveTo(0,y); ctx.lineTo(W,y); } ctx.stroke();
    const N=240, T=A2.T, w=A2.omega, A=A2.A, Apr=(META2.flashbackAmpFactor||1.5)*A;
    ctx.lineWidth=2;
    const drawSine=(Aamp, stroke)=>{
      ctx.strokeStyle=stroke; ctx.beginPath();
      for(let i=0;i<=N;i++){
        const t=(i/N)*T, x=i*(W/N), y=H/2 - (Aamp===0?0:(Aamp/(1.6*Apr)))*(H*0.9)*Math.sin(w*t);
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
    };
    drawSine(A,'#7fd7ff');
    drawSine(Apr,'#ffd27a');
    ctx.fillStyle='#fff'; ctx.font='12px system-ui';
    ctx.fillText('τρέχον A', 8, 14);
    ctx.fillText('flashback A′ > A', 8, 28);
  }

  return { setAutoTitle, addThought, bubble, drawFx, drawFlashback };

  function setAutoTitle(){}
  function addThought(){}
  function bubble(){}
  function drawFx(){}
  function drawFlashback(){}
}

function openCurtains2(){
  if(stage) stage.classList.add('open');
  if(springEl) springEl.style.display = META2.features?.showSpringOnOpen ? 'block' : 'none';
  if(markerEl) markerEl.style.opacity = META2.features?.showMarker ? '1' : '0';
  if(spotlight) spotlight.style.display = META2.features?.showSpotlight ? 'block' : 'none';
}
function endAct2Curtain(){
  if(!stage || !curtainUpper) return breakPanel2();
  curtainUpper.classList.add('slow-close');
  stage.classList.remove('open');
  if(markerEl) markerEl.style.opacity='0';
  setTimeout(()=>{ curtainUpper.classList.remove('slow-close'); breakPanel2(); }, 1500);
}
function breakPanel2(){
  root2.innerHTML='';
  const wrap = el('div','break2',`
    <h2 style="margin:0 0 8px">Τέλος Πράξης 2</h2>
    <div style="opacity:.9;margin-bottom:10px">Ο m,D συνεχίζει στο βάθος — σειρά του Φουαγιέ.</div>
  `);
  const btn3 = el('button',null,'Έναρξη Πράξης 3');
  const btnClose = el('button',null,'Κλείσιμο');
  [btn3,btnClose].forEach(b=>css(b,{padding:'10px 14px',borderRadius:'10px',border:'1px solid #888',background:'#111',color:'#fff',cursor:'pointer',marginRight:'8px'}));
  btn3.onclick=()=>{ hide(); document.dispatchEvent(new Event('act3-start')); };
  btnClose.onclick=()=>hide();
  css(root2,{display:'grid',placeItems:'center',background:'rgba(0,0,0,0.75)'});
  css(wrap,{textAlign:'center',padding:'18px 22px',border:'1px solid rgba(255,255,255,0.25)',borderRadius:'14px',background:'rgba(0,0,0,0.35)',backdropFilter:'blur(3px)'});
  wrap.append(btn3, btnClose);
  root2.append(wrap);
}

const t2ms = mul => Math.max(0, mul*A2.T*1000);

async function runAct2(){
  await loadMeta();
  await loadTimeline();
  const ui = baseUI2(); show();
  ui.setAutoTitle();

  const t0 = performance.now();
  function tick(){
    const now = performance.now(); const t = now - t0;
    for(const e of timeline2){
      if(e._done) continue;
      if(t >= t2ms(e.atMul||0)){
        e._done = true;
        if(e.kind==='openCurtain'){ openCurtains2(); }
        else if(e.kind==='title'){ ui.setAutoTitle(); }
        else if(e.kind==='thought'){ ui.addThought(e.text); }
        else if(e.kind==='bubble'){ ui.bubble(e.text, (e.dur?e.dur*1000:2400)); }
        else if(e.kind==='flashback'){ ui.drawFlashback(); }
        else if(e.kind==='graphFx'){ ui.drawFx(); }
        else if(e.kind==='law'){ ui.addThought(e.text); }
        else if(e.kind==='endCurtain'){ endAct2Curtain(); }
      }
    }
    tickerId = requestAnimationFrame(tick);
  }
  tickerId = requestAnimationFrame(tick);
}

document.addEventListener('act2-start', runAct2);
