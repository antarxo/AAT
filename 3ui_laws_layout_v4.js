/* ui_laws_layout_v4.js
 * Νόμοι: μονογραμμικοί, χωρίς τίτλο «Νόμος …», χωρίς κενά ανάμεσα, χωρίς scroll.
 */
(function(){
  'use strict';
  function el(id){ return document.getElementById(id); }
  function ensure(){
    const pane = el('laws'), list = el('lawsList'), title = el('lawsTitle');
    if (!pane || !list || !title) return null;
    pane.style.display   = 'block';
    pane.style.overflow  = 'visible';
    pane.style.maxHeight = 'none';
    list.style.listStyle = 'none';
    list.style.padding   = '0';
    list.style.margin    = '0';
    // τίτλος από i18n αν υπάρχει
    try{
      const L = window.LANG || 'gr';
      if (window.i18n && window.i18n[L] && window.i18n[L].lawsTitle) {
        title.textContent = window.i18n[L].lawsTitle;
      } else {
        title.textContent = 'Νόμοι Α.Α.Τ.';
      }
    }catch(_){}
    return {pane, list, title};
  }

  function localizeTrig(txt){
    if (!txt) return txt;
    const L = window.LANG || 'gr';
    if (L === 'gr'){
      return txt.replace(/sin/g,'ημ').replace(/cos/g,'συν');
    } else {
      return txt.replace(/ημ/g,'sin').replace(/συν/g,'cos');
    }
  }

  let COUNT = 0;
  function addLaw(txt, explicitNo){
    const ref = ensure(); if (!ref) return;
    if (typeof explicitNo === 'number') COUNT = explicitNo; else COUNT += 1;
    const line = document.createElement('div');
    line.className = 'law-line';
    line.style.margin  = '0';
    line.style.padding = '0';
    line.textContent = String(localizeTrig(txt)||'').trim() + ' ('+ COUNT +')';
    ref.list.appendChild(line);
    if (typeof window.positionLawCharts === 'function') {
      try{ window.positionLawCharts(); }catch(_){}
    }
  }

  // εξαγωγή ομοιόμορφου addLaw
  window.addLaw = addLaw;

  if (document.readyState !== 'loading') ensure();
  else document.addEventListener('DOMContentLoaded', ensure);
})();
