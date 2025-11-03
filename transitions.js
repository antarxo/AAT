// transitions.js — unified panel for act transitions
(() => {
  function ensurePanel(){
    let p=document.getElementById('actBreak');
    if(p) return p;
    p=document.createElement('div'); p.id='actBreak';
    Object.assign(p.style,{position:'fixed',inset:'0',zIndex:'850',display:'none',background:'rgba(0,0,0,.82)',color:'#fff'});
    p.innerHTML = `
      <div style="position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);min-width:min(560px,90vw);max-width:90vw;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.25);border-radius:14px;padding:16px 18px;box-shadow:0 10px 40px rgba(0,0,0,.55)">
        <h3 id="actBreakTitle" style="margin:0 0 8px">Μετάβαση</h3>
        <p id="actBreakMsg" style="margin:0 0 12px;opacity:.9">—</p>
        <div style="display:flex;justify-content:flex-end;gap:8px">
          <button id="btnAct2" style="padding:10px 14px;border-radius:10px;border:1px solid #7a0;background:#171;color:#fff;cursor:pointer">Συνέχεια</button>
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
