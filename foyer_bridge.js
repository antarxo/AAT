/* foyer_bridge.js — μεταγωγή actBreak κουμπιού προς act3-start όταν γραφτεί "Φουαγιέ" */
(function () {
  'use strict';
  var actBreak = document.getElementById('actBreak');
  var btn = document.getElementById('btnAct2');
  if (!actBreak || !btn) return;

  function rewireIfFoyer() {
    var txt = (btn.textContent || '').trim();
    if (/Φουαγιέ/i.test(txt)) {
      var clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
      clone.addEventListener('click', function () {
        actBreak.style.display = 'none';
        try { document.dispatchEvent(new CustomEvent('act3-start')); } catch(_) {}
      }, { once: true });
    }
  }
  var mo = new MutationObserver(rewireIfFoyer);
  mo.observe(actBreak, { childList: true, subtree: true, characterData: true });
  rewireIfFoyer();
})();