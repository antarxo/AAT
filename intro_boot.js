// intro_boot.js — force intro overlay early (fallback if intro.js delays)
(function(){
  function showFallbackIntro(){
    var root = document.getElementById('intro-root');
    if(!root){
      root = document.createElement('div'); root.id='intro-root';
      Object.assign(root.style,{position:'fixed',inset:'0',zIndex:'9999',display:'grid',gridTemplateRows:'1fr auto',gap:'12px',padding:'16px',background:'rgba(0,0,0,.92)',color:'#fff'});
      document.body.appendChild(root);
      var wrap = document.createElement('div'); Object.assign(wrap.style,{display:'grid',placeItems:'center'}); root.appendChild(wrap);
      var frame = document.createElement('iframe'); frame.src='intro.html'; frame.title='Intro'; frame.loading='eager';
      Object.assign(frame.style,{width:'min(1024px,92vw)',height:'min(720px,80vh)',border:'0',borderRadius:'12px',boxShadow:'0 12px 50px rgba(0,0,0,.55)'});
      wrap.appendChild(frame);
      var ctrls = document.createElement('div'); Object.assign(ctrls.style,{display:'flex',justifyContent:'space-between',gap:'8px'}); root.appendChild(ctrls);
      var left=document.createElement('div'), right=document.createElement('div'); ctrls.appendChild(left); ctrls.appendChild(right);
      var btnBypass = document.createElement('button'); btnBypass.textContent='Παράβλεψη';
      Object.assign(btnBypass.style,{padding:'8px 12px',borderRadius:'10px',border:'1px solid #888',background:'#111',color:'#fff',cursor:'pointer'});
      btnBypass.onclick=function(){ root.style.display='none'; revealTitle(); };
      left.appendChild(btnBypass);
      var btnDisable=document.createElement('button'); btnDisable.textContent='Μην το ξαναδείξεις';
      Object.assign(btnDisable.style,{padding:'8px 12px',borderRadius:'10px',border:'1px solid #555',background:'#222',color:'#fff',cursor:'pointer',marginRight:'6px'});
      btnDisable.onclick=function(){ localStorage.setItem('intro:disable','1'); root.style.display='none'; revealTitle(); };
      var btnContinue=document.createElement('button'); btnContinue.textContent='Συνέχεια';
      Object.assign(btnContinue.style,{padding:'10px 14px',borderRadius:'10px',border:'1px solid #7a0',background:'#171',color:'#fff',cursor:'pointer'});
      btnContinue.onclick=function(){ root.style.display='none'; revealTitle(); };
      right.appendChild(btnDisable); right.appendChild(btnContinue);
    } else {
      root.style.display='grid';
    }
  }
  function revealTitle(){
    var sb=document.querySelector('.signboard'); if(sb) sb.style.opacity='1';
    var start=document.getElementById('startBtn'); if(start){ try{ start.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){} }
  }
  function maybeShowIntro(){
    if(/[?&]nointro=1(&|$)/.test(location.search)) return;
    // if intro.js handled it already, do nothing
    if(document.getElementById('intro-root') && document.getElementById('intro-root').style.display!=='none') return;
    // fetch config quickly; if fails, show fallback
    fetch('intro.json',{cache:'no-cache'}).then(function(r){
      if(!r.ok) throw new Error('no cfg');
      return r.json();
    }).then(function(cfg){
      var disabledLS = (localStorage.getItem('intro:disable') === '1');
      var respectDisable = !!(cfg && cfg.respectDisable);
      if(cfg.enabled === false) return;
      if(respectDisable && disabledLS) return;
      showFallbackIntro();
    }).catch(function(){ showFallbackIntro(); });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', maybeShowIntro);
  } else {
    setTimeout(maybeShowIntro, 0);
  }
})();