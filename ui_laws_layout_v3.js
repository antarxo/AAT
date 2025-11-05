<script>
/* ui_laws_layout_v4.js — Μία γραμμή/νόμο, χωρίς «Νόμος (…)» τίτλους. Καμία λίστα, κανένα scroll. */
(function(){
  const stage    = document.getElementById('stage');
  const lawsPane = document.getElementById('laws');
  const lawsList = document.getElementById('lawsList');
  const lawsTitle= document.getElementById('lawsTitle');
  const lawCharts= document.getElementById('lawCharts');

  const css = `
    #laws{ overflow:visible!important; max-height:none!important; }
    #lawsList{ list-style:none!important; margin:0!important; padding:0!important; }
    #lawsList>li{ display:none!important; }
    .law-line{ display:block; margin:6px 0 10px; padding:6px 8px;
      background:rgba(0,0,0,.25); border:1px solid rgba(255,255,255,.25);
      border-radius:8px; color:#fff; line-height:1.48; font-size:16px; }
  `;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  let box = lawsList.querySelector('.law-box');
  if(!box){ box=document.createElement('div'); box.className='law-box'; lawsList.innerHTML=''; lawsList.appendChild(box); }

  function ensureShown(){
    if(!lawsPane) return;
    lawsPane.style.display='block';
    if(lawsTitle && !lawsTitle.textContent.trim()){
      const L=(window.i18n && window.i18n[window.LANG||'gr'] && i18n[window.LANG||'gr'].lawsTitle) || 'Νόμοι Α.Α.Τ.';
      lawsTitle.textContent=L;
    }
  }
  function countLaws(){ return box.querySelectorAll('.law-line').length; }

  function syncCharts(){
    if(!lawCharts || !lawsPane) return;
    const s = stage.getBoundingClientRect(), p=lawsPane.getBoundingClientRect();
    lawCharts.style.position='absolute';
    lawCharts.style.left='2%';
    lawCharts.style.top = (p.bottom - s.top + 8) + 'px';
    const out = (lawCharts.getBoundingClientRect().top - s.top) > (stage.clientHeight - 16);
    lawCharts.style.visibility = out ? 'hidden' : 'visible';
  }

  const _origAdd = window.addLaw;
  window.addLaw = function(formulaText){
    ensureShown();
    const stripped = String(formulaText||'').replace(/\(\d+\)\s*$/,'').trim();
    const n = countLaws() + 1;
    const line = document.createElement('div');
    line.className='law-line';
    line.textContent = (window.localizeTrig ? localizeTrig(stripped) : stripped) + ` (${n})`;
    box.appendChild(line);
    syncCharts();
  };

  window.positionLawCharts = syncCharts;
  window.addEventListener('resize', syncCharts);
  setTimeout(syncCharts,60);
})();
</script>
