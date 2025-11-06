/* thought_text_fix_all.js
 * Ενιαίος διορθωτής για υποδείκτες/εκθέτες & μονάδες μέσα στις σκέψεις.
 */
(function(){
  'use strict';

  function toSup2(s){
    // ω^2, ω 2, ω2 -> ω² (προσέχουμε να μην πειράξουμε π.χ. ω20)
    return s.replace(/ω\s*\^\s*2/g, 'ω²')
            .replace(/ω\s*2(?!\d)/g, 'ω²');
  }

  function basicSubs(s){
    return s
      .replace(/m1/g, 'm₁')
      .replace(/D1/g, 'D₁')
      .replace(/t0/g, 't₀')
      .replace(/v0/g, 'v₀')
      .replace(/x0/g, 'x₀')
      .replace(/φ0/g, 'φ₀')
      .replace(/φo/g, 'φ₀')
      .replace(/ω2/g, 'ω²');
  }

  function unitSpaces(s){
    // Κενό ανάμεσα σε αριθμό και μονάδες
    return s        .replace(/(\d)(m\/s)\b/g, '$1 $2')        .replace(/(\d)(rad\/s)\b/g, '$1 $2')        .replace(/(\d)(m)\b/g, '$1 $2')        .replace(/(\d)(s)\b/g, '$1 $2');
  }

  function fixThoughtText(s){
    if (s == null) return s;
    let out = String(s);
    out = toSup2(out);
    out = basicSubs(out);
    out = unitSpaces(out);
    return out;
  }

  window.fixThoughtText = fixThoughtText;
})();
