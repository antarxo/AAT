// typewriter_overrides.js — typewriter για σκέψεις & νόμους (χωρίς fonts/CSS)

// ΡΥΘΜΙΣΕΙΣ
(function(){
  const MS_PER_CHAR   = 24;   // ταχύτητα "γραφομηχανής" (ms/χαρακτήρα)
  const EXTRA_SEC_PAD = 0.18; // extra buffer για να μη κλείνει το bubble πριν τελειώσει το γράψιμο

  // μικρό helper
  function typewrite(el, fullText, msPerChar=MS_PER_CHAR){
    return new Promise(resolve=>{
      if(!el){ resolve(); return; }
      const s = String(fullText ?? '');
      let i = 0;
      function step(){
        if(i<=s.length){
          el.textContent = s.slice(0, i++);
          setTimeout(()=>requestAnimationFrame(step), msPerChar);
        } else resolve();
      }
      step();
    });
  }

  // ===== WRAP: ΣΚΕΨΕΙΣ =====
  const _origShow = window.showThoughtForViewer;
  if (typeof _origShow === 'function'){
    window.showThoughtForViewer = function(vIdx, text, durationSecs, customLift, xShift){
      const baseDur  = (typeof durationSecs === 'number' ? durationSecs : (window.bubbleDurationSec||3));
      const typingMs = Math.round(String(text||'').length * MS_PER_CHAR);
      const totalDur = baseDur + (typingMs/1000) + EXTRA_SEC_PAD;

      // 1) άνοιξε bubble με κενό κείμενο αλλά αυξημένη διάρκεια
      _origShow(vIdx, ' ', totalDur, customLift, xShift);

      // 2) γράψε χαρακτήρα-χαρακτήρα μέσα στο ίδιο bubble
      setTimeout(()=>{
        const textEl = document.querySelector('.thought-bubble .text');
        if(!textEl) return;
        textEl.textContent = '';
        typewrite(textEl, text);
      }, 30);
    };
  }

  // ===== WRAP: ΝΟΜΟΙ =====
  const _origAddLaw = window.addLaw;
  if (typeof _origAddLaw === 'function'){
    window.addLaw = function(formulaText){
      // άσε το original να φτιάξει τον νόμο
      _origAddLaw(formulaText);

      // βρες το ΤΕΛΕΥΤΑΙΟ στοιχείο στο #lawsList (li ή div, ανάλογα με την υλοποίηση σου)
      try{
        const host = document.getElementById('lawsList');
        const node = host && host.lastElementChild;
        if(!node) return;

        // πάρε το n από το global lawCount (μετά το _origAddLaw έχει ήδη αυξηθεί)
        const n = (typeof window.lawCount === 'number' ? window.lawCount : host.children.length);

        const full = String(node.textContent || '');
        let finalText = full;
        // αν δεν έχει ήδη " (n)" στο τέλος, πρόσθεσέ το
        if (!/\(\d+\)\s*$/.test(full)) {
          finalText = `${full} (${n})`;
        }
        node.textContent = '';
        // typewriter στο κείμενο του νόμου
        typewrite(node, finalText).then(()=>{
          if (typeof window.positionLawCharts === 'function') window.positionLawCharts();
        });
      }catch(e){ console.error('typewriter addLaw wrap:', e); }
    };
  }
})();
