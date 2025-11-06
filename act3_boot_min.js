/* act3_boot_min.js — ελάχιστο φουαγιέ με μαυροπίνακα (τίτλοι+σκηνή, όχι πλαϊνές κουρτίνες) */
(function () {
  'use strict';
  function mountBlackboard() {
    var stage  = document.getElementById('stage');
    var ruler  = document.getElementById('ruler');
    if (!stage || !ruler) return;
    var bb = document.getElementById('blackboard');
    if (!bb) {
      bb = document.createElement('div');
      bb.id = 'blackboard';
      bb.style.position = 'absolute';
      bb.style.left     = '16%';
      bb.style.width    = '68%';
      bb.style.top      = '0';
      var sRect = stage.getBoundingClientRect();
      var rRect = ruler.getBoundingClientRect();
      var hPx   = Math.max(120, (rRect.bottom - sRect.top) + 20);
      bb.style.height   = hPx + 'px';
      bb.style.background = 'rgba(10,10,10,0.94)';
      bb.style.border     = '1px solid rgba(255,255,255,0.12)';
      bb.style.boxShadow  = '0 8px 20px rgba(0,0,0,0.6) inset, 0 0 40px rgba(0,0,0,0.4)';
      bb.style.color      = '#e6ffd6';
      bb.style.fontFamily = 'Inter, system-ui, sans-serif';
      bb.style.padding    = '18px 22px';
      bb.style.zIndex     = '300';
      bb.style.pointerEvents = 'none';
      bb.style.borderRadius  = '8px';
      var h = document.createElement('div');
      h.style.fontWeight = '700';
      h.style.fontSize   = '20px';
      h.style.marginBottom = '6px';
      h.textContent = 'Φουαγιέ — Απόψεις & Αποδείξεις';
      var sub = document.createElement('div');
      sub.style.fontSize   = '14px';
      sub.style.opacity    = '0.8';
      sub.textContent = 'Η 3η πράξη ξεκίνησε. Ο μαυροπίνακας θα γεμίσει με τις αποδείξεις από το PDF/JSON.';
      bb.appendChild(h); bb.appendChild(sub);
      stage.appendChild(bb);
    }
    var ro = new ResizeObserver(function(){
      var sRect = stage.getBoundingClientRect();
      var rRect = ruler.getBoundingClientRect();
      var hPx   = Math.max(120, (rRect.bottom - sRect.top) + 20);
      bb.style.height = hPx + 'px';
    });
    ro.observe(stage);
  }
  document.addEventListener('act3-start', mountBlackboard);
})();