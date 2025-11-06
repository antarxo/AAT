/* ui_laws_layout_v4.js — μονογραμμικοί νόμοι χωρίς «Νόμος …», χωρίς scroll, με (n) */
(function(){
  'use strict';
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded',fn); }
  ready(function(){
    var lawsPane   = document.getElementById('laws');
    var lawsList   = document.getElementById('lawsList');
    var lawsTitle  = document.getElementById('lawsTitle');
    if(!lawsPane || !lawsList || !lawsTitle) return;
    try{
      lawsPane.style.overflow = 'visible';
      lawsPane.style.maxHeight = 'none';
      lawsList.style.listStyle = 'none';
      lawsList.style.paddingLeft = '0';
      lawsList.style.margin = '0';
    }catch(_){}

    if (typeof window.addLaw === 'function') {
      var _countRef = (typeof window.lawCount === 'number') ? 'lawCount' : null;
      var _orig = window.addLaw;
      window.addLaw = function(txt, explicitNo){
        try{
          if(typeof window.firstLawShown === 'boolean' && !window.firstLawShown){
            window.firstLawShown = true;
            if(window.i18n && window.i18n[window.LANG||'gr'] && window.i18n[window.LANG||'gr'].lawsTitle){
              lawsTitle.textContent = window.i18n[window.LANG||'gr'].lawsTitle;
            }
            lawsPane.style.display = 'block';
          }
        }catch(_){}
        var n = explicitNo || ((window[_countRef]||0) + 1);
        var line = document.createElement('div');
        line.className = 'law-line';
        line.style.margin = '0';
        line.style.padding = '0';
        line.textContent = (String(txt||'').trim()) + ' (' + n + ')';
        lawsList.appendChild(line);
        if(_countRef){ window[_countRef] = (window[_countRef]||0) + 1; }
        if(typeof window.positionLawCharts === 'function'){ try{ window.positionLawCharts(); }catch(_){ } }
      };
    }
  });
})();
