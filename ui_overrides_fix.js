// thought_timing_strict.js
// Σειριακή ροή σκέψεων: η επόμενη ξεκινά ΜΟΝΟ αφού τελειώσει:
// (1) το typewriter, (2) το check/close, ΚΑΙ (3) ένα configurable post-close gap.
// Δεν αλλάζουμε fonts/layout. Διορθώνουμε και αρίθμηση νόμων.

(function(){
  /* ===== ΡΥΘΜΙΣΕΙΣ ===== */
  const TYPE_MS_PER_CHAR        = 28;   // ταχύτητα γραψίματος (ms/char)
  const MIN_MS_PER_CHAR         = 10;   // κατώτατο όριο
  const POST_PAUSE_BEFORE_CHECK = 0.30; // s, μικρό κενό αφού τελειώσει το γράψιμο ΠΡΙΝ το check
  const CHECK_CLOSE_MS          = 800;  // ms, όσο κάνει το υπάρχον close animation στον κώδικά σου
  const EXTRA_GAP_AFTER_CHECK   = 0.60; // s, επιπλέον διάκενο ΜΕΤΑ το check/close πριν επιτραπεί η επόμενη σκέψη

  const MAX_BUBBLE_W = 420; // ίδιο με CSS max-width του bubble

  /* ===== helpers ===== */
  function typewrite(el, text, msPerChar){
    return new Promise(resolve=>{
      if(!el){ resolve(); return; }
      const s = String(text ?? '');
      let i = 0;
      (function step(){
        if(i <= s.length){
          el.textContent = s.slice(0, i++);
          setTimeout(()=>requestAnimationFrame(step), msPerChar);
        } else resolve();
      })();
    });
  }

  function measureBubbleSize(text){
    const probe = document.createElement('div');
    probe.style.position='absolute';
    probe.style.visibility='hidden';
    probe.style.pointerEvents='none';
    probe.style.left='-9999px';
    probe.style.top='0';
    probe.style.maxWidth = MAX_BUBBLE_W+'px';
    probe.style.padding  = '10px 12px 12px'; // ίδιο με .thought-bubble
    probe.style.fontSize = '16px';
    probe.style.lineHeight='1.5';
    probe.textContent = String(text||'');
    document.body.appendChild(probe);
    const w = Math.min(probe.offsetWidth, MAX_BUBBLE_W);
    const h = probe.offsetHeight;
    document.body.removeChild(probe);
    return {w,h};
  }

  /* ===== override showThoughtForViewer ===== */
  const _origShow    = window.showThoughtForViewer;
  const _origResume  = window.resumeFromBubble;

  if (typeof _origShow === 'function' && typeof _origResume === 'function'){
    window.showThoughtForViewer = function(vIdx, text, durationSecs, customLift, xShift){
      // 1) Άνοιξε ΑΜΕΣΑ bubble με “τεράστια” διάρκεια και ακύρωσε τον παλιό auto-timer
      const BIG_SECS = 9999;
      _origShow(vIdx, ' ', BIG_SECS, customLift, xShift);
      try{ if (window.bubbleAutoTimer) { clearTimeout(window.bubbleAutoTimer); window.bubbleAutoTimer = null; } }catch(_){}

      // 2) Κλειδώνουμε διαστάσεις ώστε να μην «φουσκώνει» όσο γράφει
      setTimeout(async ()=>{
        const bubble = document.getElementById('bubble0');
        const textEl = bubble ? bubble.querySelector('.text') : null;
        if(!bubble || !textEl) return;

        const {w,h} = measureBubbleSize(text);
        bubble.style.minWidth  = w+'px';
        bubble.style.minHeight = h+'px';

        // 3) Typewriter με σταθερή ταχύτητα — duration του slider αγνοείται για συνέπεια
        const msPerChar = Math.max(MIN_MS_PER_CHAR, TYPE_MS_PER_CHAR);
        textEl.textContent = '';
        await typewrite(textEl, text, msPerChar);

        // 4) Μικρή παύση ΠΡΙΝ το check
        await new Promise(r=>setTimeout(r, POST_PAUSE_BEFORE_CHECK*1000));

        // 5) Check/close (τρέχει ~800ms μέσα στο original)
        _origResume('run');

        // 6) Όταν τελειώσει το close, κρατάμε ΤΕΧΝΗΤΑ μπλοκαρισμένη τη ροή για EXTRA_GAP_AFTER_CHECK
        setTimeout(()=>{
          // Βάλε πάλι gate: true, ώστε να μην επιτραπεί νέα σκέψη
          try{ window.isBubbleActive = true; }catch(_){}
          setTimeout(()=>{
            try{ window.isBubbleActive = false; }catch(_){}
          }, EXTRA_GAP_AFTER_CHECK*1000);
        }, CHECK_CLOSE_MS + 10);
      }, 20);
    };
  }

  /* ===== Νόμοι: σωστή αρίθμηση 1…N και μικρό typewriter ===== */
  const _origAddLaw = window.addLaw;
  if (typeof _origAddLaw === 'function'){
    function nextLawIndex(){
      const host = document.getElementById('lawsList');
      if(!host) return 1;
      let maxN = 0;
      [...host.children].forEach(ch=>{
        const m = /\((\d+)\)\s*$/.exec(String(ch.textContent || ''));
        if(m){ maxN = Math.max(maxN, parseInt(m[1],10)); }
      });
      return maxN + 1;
    }

    function typewriteLaw(li, finalText){
      // 0.6s περίπου συνολικός χρόνος για τον νόμο, ανεξάρτητα μήκους
      const msPerChar = Math.max(MIN_MS_PER_CHAR, Math.floor(600 / Math.max(1, finalText.length)));
      li.textContent = '';
      return typewrite(li, finalText, msPerChar).then(()=>{
        if (typeof window.positionLawCharts === 'function') window.positionLawCharts();
      });
    }

    window.addLaw = function(formula){
      const host = document.getElementById('lawsList');
      const stripped = String(formula||'').replace(/\(\d+\)\s*$/,'').trim();

      // Αφήνουμε το original να προσθέσει DOM/τίτλους
      _origAddLaw(stripped);

      // Πιάσε το τελευταίο στοιχείο (ο νέος νόμος)
      const li = host && host.lastElementChild;
      if(!li) return;

      const n = nextLawIndex();
      const finalText = `${String(li.textContent||'').replace(/\(\d+\)\s*$/,'').trim()} (${n})`;
      typewriteLaw(li, finalText);

      // σιγουρέψου ότι το pane/τίτλος φαίνονται
      try{
        const pane = document.getElementById('laws'); if(pane) pane.style.display='block';
        const title= document.getElementById('lawsTitle');
        if(title && !title.textContent.trim()){
          title.textContent = (window.i18n && i18n[window.LANG||'gr'])
            ? i18n[window.LANG||'gr'].lawsTitle
            : 'Νόμοι Α.Α.Τ.';
        }
      }catch(_){}
    };
  }
})();
