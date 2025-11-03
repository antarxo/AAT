// leaflet.js (banner + σύντομη περιγραφή + start)
(() => {
  const root = document.getElementById('leaflet-root') || (() => {
    const d = document.createElement('div');
    d.id = 'leaflet-root';
    Object.assign(d.style,{position:'fixed',inset:'0',zIndex:'700',display:'none'});
    document.body.appendChild(d);
    return d;
  })();

  const css=(el,o)=>Object.assign(el.style,o);
  const el=(t,c,h)=>{ const e=document.createElement(t); if(c) e.className=c; if(h!=null) e.innerHTML=h; return e; };
  const show=()=>{ root.style.display='grid'; };
  const hide=()=>{ root.style.display='none'; };

  async function loadLeaflet(){
    try{ const r=await fetch('leaflet.json',{cache:'no-cache'}); if(!r.ok) return null; return await r.json(); }
    catch{ return null; }
  }

  function render({ banner, bannerAlt, html, ctaText }){
    root.innerHTML='';
    css(root,{background:'rgba(0,0,0,0.82)',color:'#fff',display:'grid',
      gridTemplateRows:'auto 1fr auto',gap:'12px',padding:'16px'});

    const bWrap = el('div','banner');
    css(bWrap,{display:'grid',placeItems:'center'});
    if(banner){
      const img = new Image();
      img.src = banner;
      img.alt = bannerAlt || '';
      Object.assign(img.style,{
        maxWidth:'min(980px, 90vw)', width:'100%', height:'auto',
        borderRadius:'10px', boxShadow:'0 8px 30px rgba(0,0,0,0.45)'
      });
      bWrap.append(img);
    }
    root.append(bWrap);

    const body = el('div','leaflet-body', html || '');
    css(body,{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.25)',
      borderRadius:'12px',padding:'14px 16px',overflow:'auto',maxHeight:'60vh'});
    root.append(body);

    const ctrls = el('div','ctrls'); css(ctrls,{display:'flex',gap:'8px',justifyContent:'space-between'});
    const left = el('div');
    const btnSkip = el('button',null,'Παράβλεψη');
    Object.assign(btnSkip.style,{padding:'8px 12px',borderRadius:'10px',border:'1px solid #888',background:'#111',color:'#fff',cursor:'pointer'});
    btnSkip.onclick=hide; left.append(btnSkip);

    const right = el('div');
    const btnStart = el('button',null, ctaText || 'Έναρξη Πράξης 1');
    Object.assign(btnStart.style,{padding:'10px 14px',borderRadius:'10px',border:'1px solid #7a0',background:'#171',color:'#fff',cursor:'pointer'});
    btnStart.onclick=()=>{
      hide();
      const b = document.getElementById('startBtn');
      if(b) b.click();
      else document.dispatchEvent(new Event('act1-start'));
    };
    right.append(btnStart);
    ctrls.append(left,right);
    root.append(ctrls);
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    const data = await loadLeaflet();
    if(!data) return;
    render({
      banner: data.banner || null,
      bannerAlt: data.bannerAlt || '',
      html: data.html || '',
      ctaText: data.ctaText || 'Έναρξη Πράξης 1'
    });
    show();
  });
})();
