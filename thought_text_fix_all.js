/* thought_text_fix_all.js — ασφαλείς υποδείκτες/μονάδες, χωρίς πείραγμα ελληνικών */
(function(){
  'use strict';

  // ΜΟΝΟ εκεί που πρέπει: λατινικά μοτίβα μετατρέπονται σε υποδείκτες
  function subscripts(s){
    return s
      .replace(/\bm1\b/g,'m₁').replace(/\bD1\b/g,'D₁')
      .replace(/\bt0\b/g,'t₀').replace(/\bv0\b/g,'v₀').replace(/\bx0\b/g,'x₀').replace(/φ0/g,'φ₀')
      .replace(/ω\s*\^?\s*2/g,'ω²'); // ω^2, ω 2, κλπ
  }
  function spaceUnits(s){
    return s
      .replace(/(\d)(?=\s*(m(?![a-z])))/gi,'$1 ')
      .replace(/(\d)(?=\s*(s(?![a-z])))/gi,'$1 ')
      .replace(/(\d)(?=\s*(rad\/s))/gi,'$1 ')
      .replace(/(\d)(?=\s*(m\/s))/gi,'$1 ')
      .replace(/(\d)(?=\s*(N\/m))/gi,'$1 ')
      .replace(/(\d)(?=\s*(Kg|kg|J))/g,'$1 ');
  }

  window.fixThoughtText = function(s){
    try{
      let out = String(s ?? '');
      // Δεν πειράζουμε ελληνικά/τονισμούς· μόνο στοχευμένα patterns.
      out = subscripts(out);
      out = spaceUnits(out);
      return out;
    }catch(_){ return String(s ?? ''); }
  };
})();
