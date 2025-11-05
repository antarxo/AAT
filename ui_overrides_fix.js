// ui_overrides_fix.js
// 1) Καθαρή, ευανάγνωστη γραμματοσειρά (χωρίς web fonts)
// 2) Laws: ΠΟΤΕ δεν «εξαφανίζονται», κλασική λίστα χωρίς bullets, overflow visible
// 3) Typewriter σε σκέψεις/νόμους ΧΩΡΙΣ να αλλάζει ο χρονισμός
// 4) Foyer fail-safe: αν κλείσει η κουρτίνα και δεν εμφανιστεί το actBreak, το εμφανίζει

(function(){
  /* ---------- Α. FONT & ΛΙΣΤΑ ΝΟΜΩΝ ---------- */
  const style = document.createElement('style');
  style.textContent = `
    :root{ --ui-serif: ui-serif, Georgia, "Times New Roman", Times, serif; }
    /* Σκέψεις, Νόμοι, actBreak: κλασική serif για καθαρά σύμβολα */
    .thought-bubble .text,
    #laws, #lawsList, #lawsList > *,
    .actbreak .box, .params-box, .signboard,
    .mb-title { font-family: var(--ui-serif) !important; }

    /* Αριστερό κουτί Νόμων: ποτέ κρυφό από overflow/ύψος */
    #laws {
      overflow: visible !important;
      max-height: none !important;
    }
    /* Λίστα Νόμων: χωρίς bullets/αρίθμηση browser */
    #lawsList {
      list-style: none !important;
      margin: 0 !important;
      padding-left: 0 !important;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    #lawsList > * {
      color: #fff;
      line-height: 1.45;
      font-size: 16px;
      white-space: normal;
    }
    /* Μήνυμα actBreak: παράδειγμα γραμματοσειράς στο “Είστε έτοιμοι για τη Δεύτερη Πράξη;” */
    .actbreak .box { font-family: var(--ui-serif) !important; }
  `;
  document.head.appendChild(style);

  /* ---------- Β. TYPEWRITER ΧΩΡΙΣ ΑΛΛΑΓΗ ΡΥΘΜΟΥ ---------- */
  const PAD_SEC = 0.12;        // μικρό headroom ώστε να προλαβαίνει να τελειώσει
  const MIN_MS_PER_CHAR = 8;   // κάτω όριο για πολύ μεγάλα texts

  function typewrite(el, fullText, msPerChar){
    return new Promise(res=>{
      if(!el){ res(); return; }
      const s = String(fullText ?? "");
      let i=0;
      (function step(){
        if(i<=s.length){
          el.textContent = s.slice(0, i++);
          setTimeout(()=>requestAnimationFrame(step), msPerChar);
        } else res();
      })();
    });
  }

  // Wrap σκέψεων: δεν αλλάζουμε duration — προσαρμόζουμε την ταχύτητα γραφής
  const _origShow = window.showThoughtForViewer;
  if (typeof _origShow === "function"){
    window.showThoughtForViewer = function(vIdx, text, durationSecs, customLift, xShift){
      const baseDur = (typeof durationSecs === 'number' ? durationSecs : (window.bubbleDurationSec||3));
      const L = Math.max(1, String(text||'').length);
      const msPerChar = Math.max(MIN_MS_PER_CHAR, Math.floor(((baseDur - PAD_SEC) * 1000) / L));

      // 1) Άνοιξε το bubble με το ΚΑΝΟΝΙΚΟ baseDur (δεν αλλάζουμε ροή)
      _origShow(vIdx, ' ', baseDur, customLift, xShift);

      // 2) Γράψε χαρακτήρα-χαρακτήρα εντός του ίδιου χρόνου
      setTimeout(()=>{
        const textEl = document.querySelector('.thought-bubble .text');
        if(!textEl) return;
        textEl.textContent = '';
        typewrite(textEl, text, msPerChar);
      }, 30);
    };
  }

  // Wrap νόμων: εξασφαλίζουμε ΠΑΝΤΑ ορατό το #laws και typewriter στο τελευταίο item
  const _origAddLaw = window.addLaw;
  if (typeof _origAddLaw === "function"){
    window.addLaw = function(formulaText){
      // 1) Κάλεσε τον αρχικό μηχανισμό (ενεργοποιεί τίτλο, pane, counters κ.λπ.)
      _origAddLaw(formulaText);

      // 2) Fail-safe: φρόντισε να είναι ορατό το κουτί
      try{
        const pane = document.getElementById('laws');
        if(pane) pane.style.display = 'block';
        const title = document.getElementById('lawsTitle');
        if(title && !title.textContent.trim()){
          title.textContent = (window.i18n && i18n[window.LANG||'gr'])
            ? i18n[window.LANG||'gr'].lawsTitle
            : 'Νόμοι Α.Α.Τ.';
        }
      }catch(_){}

      // 3) Πιάσε το τελευταίο στοιχείο και «ξαναγράψ’ το» typewriter με …(n) στο τέλος αν λείπει
      try{
        const host = document.getElementById('lawsList');
        if(!host) return;

        let node = host.lastElementChild;
        // Αν δεν πρόσθεσε τίποτα το original (απίθανο), πρόσθεσε εμείς.
        if(!node){
          node = document.createElement('li');
          node.textContent = String(formulaText || '');
          host.appendChild(node);
        }

        // Υπολόγισε n (από lawCount ή fallback στο πλήθος παιδιών)
        const n = (typeof window.lawCount === 'number' ? window.lawCount : host.children.length);
        const current = String(node.textContent||'');
        const finalText = /\(\d+\)\s*$/.test(current) ? current : `${current} (${n})`;

        // typewriter χωρίς να «τινάξουμε» layout
        const L = Math.max(1, finalText.length);
        const msPerChar = Math.max(MIN_MS_PER_CHAR, Math.floor((600 /*~0.6s*/)/L));
        node.textContent = '';
        typewrite(node, finalText, msPerChar).then(()=>{
          if (typeof window.positionLawCharts === 'function') window.positionLawCharts();
        });
      }catch(e){ console.error('addLaw wrap:', e); }
    };
  }

  /* ---------- Γ. FOYER FAIL-SAFE ---------- */
  // Αν κλείσει η κουρτίνα (stage χωρίς 'open') και ΔΕΝ φαίνεται actBreak, προσπάθησε να το εμφανίσεις
  try{
    const stage = document.getElementById('stage');
    const curtainUpper = document.querySelector('.curtain-upper');
    const actBreak = document.getElementById('actBreak');
    if(stage && curtainUpper && actBreak){
      const obs = new MutationObserver(()=>{
        if(!stage.classList.contains('open')){
          setTimeout(()=>{
            const hidden = (actBreak.style.display === '' || actBreak.style.display === 'none');
            if(hidden){
              if (typeof window.closeCurtainsSequence === 'function'){
                // θα το κάνει εκείνη (έχει και κεντράρισμα)
                window.closeCurtainsSequence();
              } else {
                // χειροκίνητο κεντράρισμα στο κεντρικό άνοιγμα
                const sRect = stage.getBoundingClientRect();
                const cuRect = curtainUpper.getBoundingClientRect();
                actBreak.style.left = (sRect.width*0.18) + 'px';
                actBreak.style.top = (cuRect.top - sRect.top) + 'px';
                actBreak.style.width = (sRect.width*0.64) + 'px';
                actBreak.style.height = cuRect.height + 'px';
                actBreak.style.display = 'flex';
              }
            }
          }, 1600); // όσο αργεί το κλείσιμο
        }
      });
      obs.observe(stage, {attributes:true, attributeFilter:['class']});
    }
  }catch(_){}
})();
