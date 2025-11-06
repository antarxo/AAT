/* thought_text_fix_all.js — ασφαλείς διορθώσεις για υποδείκτες/μονάδες (χωρίς normalize) */
(function(){
  'use strict';

  function subscripts(s){
    return s
      .replace(/m1/g,'m₁').replace(/D1/g,'D₁')
      .replace(/t0/g,'t₀').replace(/v0/g,'v₀').replace(/x0/g,'x₀').replace(/φ0/g,'φ₀')
      .replace(/ω\s*\^?\s*2/g,'ω²');
  }
  function spaceUnits(s){
    return s
      .replace(/(\d)(\s*)(m(?![a-z]))/gi, '$1 $3')
      .replace(/(\d)(\s*)(s(?![a-z]))/gi, '$1 $3')
      .replace(/(\d)(\s*)(rad\/s)/gi, '$1 $3')
      .replace(/(\d)(\s*)(m\/s)/gi, '$1 $3')
      .replace(/(\d)(\s*)(N\/m)/gi, '$1 $3')
      .replace(/(\d)(\s*)(Kg|kg|J)/g, '$1 $3');
  }

  window.fixThoughtText = function(s){
    try{
      let out = String(s ?? '');
      out = subscripts(out);
      out = spaceUnits(out);
      return out;
    }catch(_){ return String(s ?? ''); }
  };
})();
