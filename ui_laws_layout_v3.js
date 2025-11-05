// ui_laws_layout_v3.js
// — Νόμοι: ΟΧΙ λίστα, σωστή αρίθμηση (1…N), χωρίς scrollbar.
// — Τα mini-γραφήματα (#lawCharts) κατεβαίνουν όσο μεγαλώνει το πλαίσιο νόμων και κρύβονται όταν βγουν κάτω από τη σκηνή.

(function(){
  const stage    = document.getElementById('stage');
  const lawsPane = document.getElementById('laws');
  const lawsList = document.getElementById('lawsList');
  const lawsTitle= document.getElementById('lawsTitle');
  const lawCharts= document.getElementById('lawCharts');

  // Ασφαλιστικό CSS
  const css = `
    #laws { overflow: visible !important; max-height: none !important; }
    #lawsList {
      list-style: none !important;
      margin: 0 !important;
      padding: 0 !important;
      display: block !important;
    }
    #lawsList > li { display:none !important; } /* αν μείνει τίποτα παλιό */
    .law-entry {
      display: block;
      margin: 6px 0 10px 0;
      padding: 6px 8px;
      background: rgba(0,0,0,0.25);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 8px;
      color: #fff;
      line-height: 1.48;
      font-size: 16px;
    }
    .law-entry .law-title {
      text-align: center;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .law-entry .law-formula {
      text-align: left;
      white-space: normal;
    }
  `;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  // container: αν δεν υπάρχει, φτιάξε το
  let lawContainer = lawsList.querySelector('.law-container');
  if(!lawContainer){
    lawContainer = document.createElement('div');
    lawContainer.className = 'law-container';
    // καθάρισε τυχόν παλιά <li>
    lawsList.innerHTML = '';
    lawsList.appendChild(lawContainer);
  }

  function localize(txt){
    try{ return (window.localizeTrig ? window.localizeTrig(txt) : txt); }catch(_){ return txt; }
  }

  function currentMaxIndex(){
    const items = lawContainer.querySelectorAll('.law-entry .law-title');
    let maxN = 0;
    items.forEach(t=>{
      const m = /Νόμος\s*\((\d+)\)/.exec(t.textContent||'');
      if(m) maxN = Math.max(maxN, parseInt(m[1],10));
    });
    return maxN;
  }

  function ensureShown(){
    if(!lawsPane) return;
    lawsPane.style.display = 'block';
    if(lawsTitle && !lawsTitle.textContent.trim()){
      const LANG = (window.LANG || 'gr');
      if (window.i18n && window.i18n[LANG] && window.i18n[LANG].lawsTitle){
        lawsTitle.textContent = window.i18n[LANG].lawsTitle;
      } else {
        lawsTitle.textContent = 'Νόμοι Α.Α.Τ.';
      }
    }
  }

  function syncCharts(){
    if(!lawCharts || !lawsPane) return;
    const sRect = stage.getBoundingClientRect();
    const pRect = lawsPane.getBoundingClientRect();
    const bottom = pRect.bottom - sRect.top;
    // Τοποθέτηση ακριβώς 8px κάτω από το πλαίσιο νόμων, αριστερά σταθερά
    lawCharts.style.position = 'absolute';
    lawCharts.style.left = '2%';
    lawCharts.style.top  = (bottom + 8) + 'px';

    // Απόκρυψη όταν βγουν εκτός «κεντρικού» ύψους σκηνής
    const chartsRect = lawCharts.getBoundingClientRect();
    const out = (chartsRect.top - sRect.top) > (stage.clientHeight - 16);
    lawCharts.style.visibility = out ? 'hidden' : 'visible';
  }

  // Override addLaw -> δημιουργεί block .law-entry αντί για <li>
  const _origAddLaw = window.addLaw;
  window.addLaw = function(formulaText){
    try{
      ensureShown();

      // αφαίρεσε τυχόν παλιά (n) από το τέλος
      const stripped = String(formulaText||'').replace(/\(\d+\)\s*$/,'').trim();
      const n = currentMaxIndex() + 1;

      // φτιάξε block
      const entry = document.createElement('div');
      entry.className = 'law-entry';

      const title = document.createElement('div');
      title.className = 'law-title';
      title.textContent = `Νόμος (${n})`;

      const body = document.createElement('div');
      body.className = 'law-formula';
      body.textContent = localize(stripped);

      entry.appendChild(title);
      entry.appendChild(body);
      lawContainer.appendChild(entry);

      // αναπροσαρμογή γραφημάτων
      syncCharts();
    }catch(e){
      console.error('ui_laws_layout_v3 addLaw failed, fallback to original', e);
      if(typeof _origAddLaw === 'function') _origAddLaw(formulaText);
      syncCharts();
    }
  };

  // Επανυπολογισμός σε resize
  window.addEventListener('resize', syncCharts);

  // Εξαγωγή για να το καλέσουν άλλα scripts μετά από κάθε προσθήκη
  window.positionLawCharts = syncCharts;

  // αρχικό sync (αν υπήρχαν ήδη νόμοι)
  setTimeout(syncCharts, 60);
})();
