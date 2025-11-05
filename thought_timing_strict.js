// thought_timing_strict.js (v4)
// Σειριακή ροή σκέψεων: η επόμενη ξεκινά ΜΟΝΟ αφού τελειώσει
// (1) το typewriter, (2) το check/close (~0.8s), (3) ένα post-gap που ΕΞΑΡΤΑΤΑΙ από το slider "Διάρκεια σκέψης".
// Οι Νόμοι: σταθερή αρίθμηση (1…N) + μικρό typewriter. Καμία αλλαγή σε layout.

(function(){
  /* ===== ΡΥΘΜΙΣΕΙΣ (μπορείς να αλλάξεις) ===== */
  const TYPE_MS_PER_CHAR_DEFAULT = 28;  // ms/χαρακτήρα (μικρότερο = πιο γρήγορα)
  const MIN_MS_PER_CHAR          = 10;  // κατώτατο όριο
  const PRE_CHECK_PAUSE_S        = 0.30;// παύση πριν εμφανιστεί το ✓
  const CHECK_CLOSE_MS           = 800; // διάρκεια close animation

  const MAX_BUBBLE_W = 420; // ίδιο με CSS

  // Αν ορίσεις window.TYPE_MS_PER_CHAR αλλού, υπερισχύει:
  const typeMs = ()=> Math.max(MIN_MS_PER_CHAR, +window.TYPE_MS_PER_CHAR || TYPE_MS_PER_CHAR_DEFAULT);

  // Το post-gap προκύπτει από το slider "Διάρκεια σκέψης"
  function postGapAfterCheckS(){
    const base = (typeof window.bubbleDurationSec === 'number') ? window.bubbleDurationSec : 3;
    return Math.max(0.35, base * 0.35); // ήπια κλιμάκωση με το slider
  }

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
    probe.style.padding  = '10px 12px 12px';
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
      // Ανοίγουμε bubble με "τεράστια" διάρκεια και καταργούμε τον παλιό auto-timer
      _origShow(vIdx, ' ', 9999, customLift, xShift);
      try{ if (window.bubbleAutoTimer) { clearTimeout(window.bubbleAutoTimer); window.bubbleAutoTimer = null; } }catch(_){}

      setTimeout(async ()=>{
        const bubble = document.getElementById('bubble0');
        const textEl = bubble ? bubble.querySelector('.text') : null;
        if(!bubble || !textEl) return;

        // κλείδωμα διαστάσεων για να μην «φουσκώνει»
        const {w,h} = measureBubbleSize(text);
        bubble.style.minWidth  = w+'px';
        bubble.style.minHeight = h+'px';

        // typewriter
        textEl.textContent = '';
        await typewrite(textEl, text, typeMs());

        // μικρή παύση πριν το ✓
        await new Promise(r=>setTimeout(r, PRE_CHECK_PAUSE_S*1000));

        // check + close (~0.8s)
        _origResume('run');

        // πρόσθετο διάκενο ΜΕΤΑ το κλείσιμο (ρυθμιζόμενο από slider)
        setTimeout(()=>{
          try{ window.isBubbleActive = true; }catch(_){}
          setTimeout(()=>{
            try{ window.isBubbleActive = false; }catch(_){}
          }, postGapAfterCheckS()*1000);
        }, CHECK_CLOSE_MS + 12);
      }, 20);
    };
  }

  /* ===== Νόμοι: σωστή αρίθμηση + typewriter ===== */
  const _origAddLaw = window.addLaw;
  if (typeof _origAddLaw === 'function'){
    function nextLawIndex(){
      const host = document.getElementById('lawsList');
      if(!host) return 1;
      let maxN=0;
      [...host.children].forEach(ch=>{
        const m = /\((\d+)\)\s*$/.exec(String(ch.textContent||''));
        if(m) maxN = Math.max(maxN, parseInt(m[1],10));
      });
      return maxN + 1;
    }
    function typewriteLaw(li, finalText){
      const msPerChar = Math.max(MIN_MS_PER_CHAR, Math.floor(600/Math.max(1, finalText.length)));
      li.textContent='';
      return typewrite(li, finalText, msPerChar).then(()=>{
        if (typeof window.positionLawCharts === 'function') window.positionLawCharts();
      });
    }
    window.addLaw = function(formula){
      const host = document.getElementById('lawsList');
      const stripped = String(formula||'').replace(/\(\d+\)\s*$/,'').trim();
      _origAddLaw(stripped);
      const li = host && host.lastElementChild; if(!li) return;
      const n = nextLawIndex();
      const finalText = `${String(li.textContent||'').replace(/\(\d+\)\s*$/,'').trim()} (${n})`;
      typewriteLaw(li, finalText);

      const pane = document.getElementById('laws'); if(pane) pane.style.display='block';
      const title= document.getElementById('lawsTitle');
      if(title && !title.textContent.trim()){
        title.textContent = (window.i18n && i18n[window.LANG||'gr'])
          ? i18n[window.LANG||'gr'].lawsTitle
          : 'Νόμοι Α.Α.Τ.';
      }
    };
  }
})();
