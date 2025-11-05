// ui_overrides_sync.js
// Σκέψεις: ο χρόνος «μένω ανοιχτό» = (typewriter) + (post gap).
// Το check/close (≈0.8s) παραμένει όπως είναι και ΜΕΤΑ τελειώνει το bubble -> τότε μόνο επιτρέπεται η επόμενη σκέψη.
// Νόμοι: σταθερή αρίθμηση (συνεχίζει 1…N) + typewriter. Δεν αγγίζουμε ρυθμίσεις/slider.

(function(){
  /* === ΡΥΘΜΙΣΕΙΣ === */
  const TYPE_MS_PER_CHAR      = 32;   // ταχύτητα γραψίματος (ms/χαρακτ.)
  const MIN_MS_PER_CHAR       = 10;   // κατώφλι
  const POST_GAP_AFTER_TYPING = 0.45; // extra κενό ΜΕΤΑ το τέλος του κειμένου (s)
  // ΣΗΜ.: το check+close (~0.80s) έρχεται ΜΕΤΑ από το παραπάνω αυτόματα από το δικό σου resumeFromBubble()

  const MAX_BUBBLE_W = 420; // ίδιο με CSS max-width του bubble

  /* === helpers === */
  function typewrite(el, fullText, msPerChar){
    return new Promise(res=>{
      if(!el){ res(); return; }
      const s = String(fullText ?? '');
      let i=0;
      (function step(){
        if(i<=s.length){
          el.textContent = s.slice(0, i++);
          setTimeout(()=>requestAnimationFrame(step), msPerChar);
        } else res();
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
    probe.style.padding  = '10px 12px 12px'; // ίδιο με bubble
    probe.style.fontSize = '16px';
    probe.style.lineHeight='1.5';
    // κρατάει την τρέχουσα γραμματοσειρά σου (δεν την αλλάζουμε)
    probe.textContent = String(text||'');
    document.body.appendChild(probe);
    const w = Math.min(probe.offsetWidth, MAX_BUBBLE_W);
    const h = probe.offsetHeight;
    document.body.removeChild(probe);
    return {w,h};
  }

  /* === Σκέψεις: ακριβής διάρκεια bubble = typing + post gap === */
  const _origShow = window.showThoughtForViewer;
  if (typeof _origShow === 'function'){
    window.showThoughtForViewer = function(vIdx, text, durationSecs, customLift, xShift){
      // βασική διάρκεια από slider (ως ΕΛΑΧΙΣΤΟ)
      const baseDur  = (typeof durationSecs === 'number' ? durationSecs : (window.bubbleDurationSec||3));
      const L        = Math.max(1, String(text||'').length);
      const msPerChar= Math.max(MIN_MS_PER_CHAR, TYPE_MS_PER_CHAR);
      const typingSec= (L * msPerChar) / 1000;

      // Κλείδωμα διαστάσεων bubble ώστε να μην «φουσκώνει» όσο γράφει
      // (ανοίγουμε το bubble άδειο, αλλά το κάνουμε στοχομετρικά sized)
      _origShow(vIdx, ' ', Math.max(baseDur, typingSec + POST_GAP_AFTER_TYPING), customLift, xShift);

      setTimeout(()=>{
        const bubble = document.getElementById('bubble0');
        const textEl = bubble ? bubble.querySelector('.text') : null;
        if(!bubble || !textEl) return;

        const {w,h} = measureBubbleSize(text);
        bubble.style.minWidth  = w+'px';
        bubble.style.minHeight = h+'px';

        textEl.textContent = '';
        typewrite(textEl, text, msPerChar);
        // ΣΗΜ.: Μετά το (typingSec + POST_GAP) θα καλεστεί το resumeFromBubble()
        // από το original, που εμφανίζει check και 0.8s αργότερα κλείνει.
        // Άρα το επόμενο event ΕΠΙΤΡΕΠΕΤΑΙ μόνο μετά το check+close.
      }, 20);
    };
  }

  /* === Νόμοι: σταθερή αρίθμηση + typewriter === */
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

    window.addLaw = function(formula){
      const host = document.getElementById('lawsList');
      const stripped = String(formula||'').replace(/\(\d+\)\s*$/,'').trim();

      // φτιάξε τον νόμο με το original
      _origAddLaw(stripped);

      // πιάσε το τελευταίο στοιχείο (ο νέος νόμος)
      const node = host && host.lastElementChild;
      if(!node) return;

      const n = nextLawIndex();
      const finalText = `${String(node.textContent||'').replace(/\(\d+\)\s*$/,'').trim()} (${n})`;

      // 0.6s σύνολο για να «γραφτεί» ο νόμος (ανεξάρτητα μήκους)
      const msPerChar = Math.max(MIN_MS_PER_CHAR, Math.floor(600/Math.max(1, finalText.length)));
      node.textContent='';
      typewrite(node, finalText, msPerChar).then(()=>{
        if (typeof window.positionLawCharts === 'function') window.positionLawCharts();
      });

      // ορατότητα pane & τίτλου
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
