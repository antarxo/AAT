// transitions.js — center panel dead-center
(() => {
  function ensurePanel(){
    let p=document.getElementById('actBreak');
    if(p) return p;
    p=document.createElement('div'); p.id='actBreak';
    Object.assign(p.style,{position:'fixed',inset:'0',zIndex:'3000',display:'none',background:'rgba(0,0,0,.82)',color:'#fff',display:'none'});
    p.innerHTML = `
      <div style="display:grid;place-items:center;min-height:100vh;padding:16px">
        <div style="min-width:min(560px,90vw);max-width:90vw;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.28);border-radius:14px;padding:18px 20px;box-shadow:0 10px 40px rgba(0,0,0,.55)">
          <h3 id="actBreakTitle" style="margin:0 0 8px;text-align:center">Μετάβαση</h3>
          <p id="actBreakMsg" style="margin:0 0 12px;opacity:.9;text-align:center">—</p>
          <div style="display:flex;justify-content:center;gap:8px">
            <button id="btnAct2" style="padding:10px 14px;border-radius:10px;border:1px solid #7a0;background:#171;color:#fff;cursor:pointer">Συνέχεια</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(p);
    return p;
  }
  function showActTransition({title,msg,buttonText,onClick}){
    const p=ensurePanel();
    const t=p.querySelector('#actBreakTitle');
    const m=p.querySelector('#actBreakMsg');
    const b=p.querySelector('#btnAct2');
    if(t) t.textContent = title || 'Μετάβαση';
    if(m) m.textContent = msg || '';
    if(b){
      b.textContent = buttonText || 'Συνέχεια';
      b.onclick = ()=>{ p.style.display='none'; try{ onClick && onClick(); }catch{} };
    }
    p.style.display='block';
  }
  window.showActTransition = showActTransition;
  document.addEventListener('DOMContentLoaded', ensurePanel);
})();