// intro.js — iframe intro (banner + 'Λίγα λόγια...'), bypassable/disable-able
(() => {
  const qsNoIntro = /(^|[?&])nointro=1(&|$)/.test(location.search);
  async function loadCfg(){
    try{ const r=await fetch('intro.json',{cache:'no-cache'}); if(!r.ok) return null; return await r.json(); }
    catch{ return null; }
  }
  function rootEl(){
    let r=document.getElementById('intro-root');
    if(r) return r;
    r=document.createElement('div'); r.id='intro-root';
    Object.assign(r.style,{position:'fixed',inset:'0',zIndex:'900',display:'none',background:'rgba(0,0,0,.92)'});
    document.body.appendChild(r); return r;
  }
  function el(t,c,h){ const e=document.createElement(t); if(c) e.className=c; if(h!=null) e.innerHTML=h; return e; }
  function css(e,o){ Object.assign(e.style,o); }
  function show(){ root.style.display='grid'; }
  function hide(){ root.style.display='none'; }

  let root;
  async function init(){
    const cfg = await loadCfg();
    const disabledLS = localStorage.getItem('intro:disable') === '1';
    if(qsNoIntro || !cfg || cfg.enabled === false || disabledLS) return;

    root = rootEl();
    root.innerHTML='';
    css(root,{display:'grid',gridTemplateRows:'1fr auto',gap:'12px',padding:'16px',color:'#fff'});

    const wrap = el('div','wrap');
    css(wrap,{display:'grid',placeItems:'center'});
    const iframe = el('iframe');
    iframe.src = (cfg.src || 'intro.html');
    iframe.setAttribute('title','Intro');
    iframe.setAttribute('loading','eager');
    css(iframe,{width:'min(1024px,92vw)',height:'min(720px,80vh)',border:'0',borderRadius:'12px',boxShadow:'0 12px 50px rgba(0,0,0,.55)'});
    wrap.append(iframe);
    root.append(wrap);

    const ctrls = el('div','ctrls');
    css(ctrls,{display:'flex',justifyContent:'space-between',gap:'8px'});
    const left = el('div');
    const btnBypass = el('button',null,'Παράβλεψη');
    Object.assign(btnBypass.style,{padding:'8px 12px',borderRadius:'10px',border:'1px solid #888',background:'#111',color:'#fff',cursor:'pointer'});
    btnBypass.onclick = ()=>{ hide(); revealTitle(); };
    left.append(btnBypass);

    const right = el('div');
    const btnDisable = el('button',null,'Μην το ξαναδείξεις'); 
    Object.assign(btnDisable.style,{padding:'8px 12px',borderRadius:'10px',border:'1px solid #555',background:'#222',color:'#fff',cursor:'pointer',marginRight:'6px'});
    btnDisable.onclick=()=>{ localStorage.setItem('intro:disable','1'); hide(); revealTitle(); };
    const btnContinue = el('button',null,'Συνέχεια'); 
    Object.assign(btnContinue.style,{padding:'10px 14px',borderRadius:'10px',border:'1px solid #7a0',background:'#171',color:'#fff',cursor:'pointer'});
    btnContinue.onclick=()=>{ hide(); revealTitle(); };
    if(cfg.allowBypass === false){ btnBypass.disabled=true; btnDisable.disabled=true; }

    right.append(btnDisable, btnContinue);
    ctrls.append(left,right);
    root.append(ctrls);

    show();
  }

  function revealTitle(){
    const sb=document.querySelector('.signboard');
    if(sb){ sb.style.opacity='1'; }
    const start=document.getElementById('startBtn');
    if(start){ try{ start.scrollIntoView({behavior:'smooth',block:'center'}); }catch{} }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
