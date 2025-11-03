// adapter.js — core loader for Acts + helpers + optional MathJax
(() => {
  async function loadJSON() {
    try { const r = await fetch('act1.json', { cache: 'no-cache' }); return r.ok ? await r.json() : null; }
    catch { return null; }
  }
  const cssVar = (k,v)=>document.documentElement.style.setProperty(k,v);
  function applyConfig(cfg){
    if(!cfg) return;
    if(cfg.ui && typeof cfg.ui.axisYvh==='number') cssVar('--axis-y', cfg.ui.axisYvh+'vh');
    window.A1_JSON_CFG = cfg;
    document.dispatchEvent(new CustomEvent('act1:config:ready',{detail:cfg}));
  }
  function ensureModule(src){
    if([...(document.scripts||[])].some(s => (s.src||'').includes(src))) return;
    const s=document.createElement('script'); s.type='module'; s.src=src; s.defer=true; document.body.appendChild(s);
  }
  document.addEventListener('DOMContentLoaded', async ()=>{
    // MathJax for TeX rendering on blackboard (Act 3)
    if(!window.MathJax){
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
      s.async=true; document.head.appendChild(s);
    }
    // Helpers
    const m1=document.createElement('script'); m1.type='module'; m1.src='transitions.js'; document.body.appendChild(m1);
    const m2=document.createElement('script'); m2.type='module'; m2.src='intro.js';        document.body.appendChild(m2);

    applyConfig(await loadJSON());
    ensureModule('act2.js');
    ensureModule('act3.js');

    // Wire act2 start if button exists
    const b2 = document.getElementById('btnAct2');
    if(b2) b2.addEventListener('click', ()=> document.dispatchEvent(new Event('act2-start')));
  });
})();
