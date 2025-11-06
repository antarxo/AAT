/* thought_text_fix_all.js — ενιαία διόρθωση δεικτών/εκθετών & μονάδων σε όλες τις σκέψεις */
(function () {
  'use strict';
  if (window.__textFixWrapped) return;
  const orig = window.showThoughtForViewer;
  if (typeof orig !== 'function') return;

  function fixTxt(t) {
    if (!t) return t;
    let s = String(t);
    s = s.replace(/\bm1\b/g, 'm₁')
         .replace(/\bD1\b/g,  'D₁')
         .replace(/t0\b/g,    't₀')
         .replace(/v0\b/g,    'v₀')
         .replace(/x0\b/g,    'x₀')
         .replace(/φ0\b/g,    'φ₀')
         .replace(/\bfo\b/g,  'φ₀');
    s = s.replace(/-?\s*ω2\b/g, (m)=>m.replace('ω2','ω²'));
    s = s.replace(/(\d)(m)([^a-zA-Z]|$)/g, '$1 $2$3')
         .replace(/(\d)(s)([^a-zA-Z]|$)/g, '$1 $2$3')
         .replace(/(\d)\s*rad\/s\b/g, '$1 rad/s');
    return s;
  }

  window.__textFixWrapped = true;
  window.showThoughtForViewer = function(viewer, text, durationSecs, lift, xShift){
    try { text = fixTxt(text); } catch(_) {}
    return orig(viewer, text, durationSecs, lift, xShift);
  };
})();