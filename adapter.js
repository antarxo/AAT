// adapter.js
(() => {
  async function loadJSON() {
    try { const r = await fetch('act1.json', { cache: 'no-cache' }); return r.ok ? await r.json() : null; }
    catch { return null; }
  }
  const cssVar = (k,v)=>document.documentElement.style.setProperty(k,v);
  const setText = (el, s)=>{ if(el && typeof s==='string') el.textContent = s; };

  function applyConfig(cfg){
    if(!cfg) return;
    if(cfg.ui && typeof cfg.ui.axisYvh==='number') cssVar('--axis-y', cfg.ui.axisYvh+'vh');
    if(cfg.title && Array.isArray(cfg.title.lines)){
      const sb=document.querySelector('.signboard');
      if(sb){
        const [h1,l1,l2,l3,l4]=cfg.title.lines;
        const h1el=sb.querySelector('h1');
        setText(h1el, h1 || (h1el?h1el.textContent:''));
        setText(sb.querySelector('.l1'), l1||'');
        setText(sb.querySelector('.l2'), l2||'');
        setText(sb.querySelector('.l3'), l3||'');
        setText(sb.querySelector('.l4'), l4||'');
      }
    }
    if(cfg.ui && typeof cfg.ui.audienceHpx==='number'){
      const aud=document.getElementById('audience'); if(aud) aud.style.height = cfg.ui.audienceHpx+'px';
    }
    if(typeof cfg.countdown==='number'){
      const btn=document.getElementById('startBtn'); if(btn) btn.dataset.countdown=String(cfg.countdown);
    }
    window.A1_JSON_CFG = cfg;
    document.dispatchEvent(new CustomEvent('act1:config:ready',{detail:cfg}));
  }

  function ensureRoot(id){
    if(document.getElementById(id)) return;
    const el = document.createElement('div');
    el.id = id;
    el.hidden = true;
    Object.assign(el.style,{position:'fixed',inset:'0',zIndex:'600'});
    document.body.appendChild(el);
  }

  function ensureModule(src){
    if([...(document.scripts||[])].some(s => (s.src||'').includes(src))) return;
    const s=document.createElement('script'); s.type='module'; s.src=src; s.defer=true; document.body.appendChild(s);
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    const cfg = await loadJSON();
    applyConfig(cfg);

    ensureRoot('act2-root');
    ensureRoot('foyer-root');

    ensureModule('act2.js');
    ensureModule('act3.js');
    ensureModule('leaflet.js');

    // Hook existing Act 2 button to our custom event
    const b2 = document.getElementById('btnAct2');
    if(b2) b2.addEventListener('click', ()=> document.dispatchEvent(new Event('act2-start')));
  });
})();
