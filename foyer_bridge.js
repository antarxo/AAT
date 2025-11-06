/* foyer_bridge.js — κουμπί τέλους 2ης → εκκινεί 3η (act3-start) */
(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function wire(){
    const btn = $('btnAct2');
    if(!btn) return;
    btn.addEventListener('click', function(){
      // Κρύψε το πλαίσιο και δώσε σήμα για 3η πράξη
      const actBreak = $('actBreak');
      if (actBreak) actBreak.style.display = 'none';
      try{ document.dispatchEvent(new CustomEvent('act3-start')); }catch(_){}
    }, { once:true });
  }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);
})();
