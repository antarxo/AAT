// ui_overrides_v2.js
// - Serif font για καθαρά σύμβολα (χωρίς webfonts)
// - Typewriter στις Σκέψεις με ΠΡΟ-ΜΕΤΡΗΣΗ => bubble δεν «φουσκώνει» όσο γράφει
// - Typewriter στους Νόμους με σωστή αρίθμηση που συνεχίζει από τα ήδη γραμμένα
// - Δεν αλλάζει ρυθμούς/slider ούτε κρύβει το κουτί νόμων

(function(){
  /* ---------- A. ΣΤΥΛ ---------- */
  const style = document.createElement('style');
  style.textContent = `
    :root{ --ui-serif: ui-serif, Georgia, "Times New Roman", Times, serif; }
    /* Εφαρμογή serif όπου θέλουμε καθαρούς τύπους */
    .thought-bubble .text,
    #laws, #lawsList, #lawsList > *,
    .actbreak .box, .params-box, .signboard { font-family: var(--ui-serif) !important; }

    /* Κουτί Νόμων πάντα ορατό, χωρίς τεχνητά ύψη/scroll */
    #laws { overflow: visible !important; max-height: none !important; }
    #lawsList {
      list-style: none !important; margin: 0 !important; padding-left: 0 !important;
      display: flex; flex-direction: column; gap: 6px;
    }
    #lawsList > * { color:#fff; line-height:1.45; font-size:16px; white-space:normal; }

    /* Για να μη «χοροπηδάνε» οι σκέψεις */
    .thought-bubble .text { display:block; }
  `;
  document.head.appendChild(style);

  /* ---------- B. ΒΟΗΘΗΤΙΚΑ ---------- */
  const PAD_SEC = 0.12;         // μικρό headroom
  const MIN_MS_PER_CHAR = 8;    // κάτω όριο
  const MAX_BUBBLE_W = 420;     // ίδιο με CSS max-width του bubble

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

  // Μετράμε τελικό μέγεθος κειμένου σκέψης για να «κλειδώσουμε» bubble
  function measureBubbleSize(text){
    const probe = document.createElement('div');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    probe.style.left = '-9999px';
    probe.style.top  = '0';
    probe.style.maxWidth = MAX_BUBBLE_W + 'px';
    probe.style.padding = '10px 12px 12px'; // ίδια padding με bubble
    probe.style.border = '2px solid transparent';
    probe.style.fontFamily = getComputedStyle(document.body).getPropertyValue('--ui-serif') || 'Georgia, "Times New Roman", serif';
    probe.style.fontSize = '16px';
    probe.style.lineHeight = '1.5';
    probe.textContent = String(text||'');
    document.body.appendChild(probe);
    const w = Math.min(probe.offsetWidth, MAX_BUBBLE_W);
    const h = probe.offsetHeight;
    document.body.removeChild(probe);
    return {w, h};
  }

  /* ---------- C. TYPEWRITER ΣΤΙΣ ΣΚΕΨΕΙΣ (χωρίς αλλαγή ρυθμού) ---------- */
  const _origShow = window.showThoughtForViewer;
  if (typeof _origShow === 'function'){
    window.showThoughtForViewer = function(vIdx, text, durationSecs, customLift, xShift){
      const baseDur  = (typeof durationSecs === 'number' ? durationSecs : (window.bubbleDurationSec||3));
      const L        = Math.max(1, String(text||'').length);
      const msPerChar= Math.max(MIN_MS_PER_CHAR, Math.floor(((baseDur - PAD_SEC) * 1000) / L));

      // 1) Κάλεσε το original για να εμφανίσει ΤΩΡΑ το bubble (κενό κείμενο, ίδια διάρκεια)
      _origShow(vIdx, ' ', baseDur, customLift, xShift);

      // 2) Κλείδωσε διαστάσεις bubble πριν αρχίσει το γράψιμο, ώστε να μην μεγαλώνει όσο γράφει
      setTimeout(()=>{
        const bubble = document.getElementById('bubble0');
        const textEl = bubble ? bubble.querySelector('.text') : null;
        if(!bubble || !textEl) return;

        // μέτρηση τελικού κειμένου
        const {w,h} = measureBubbleSize(text);

        // κλείδωμα ελάχιστων διαστάσεων (δεν αφήνουμε να «φουσκώνει»)
        bubble.style.minWidth  = w + 'px';
        bubble.style.minHeight = h + 'px';

        // 3) Γράψε χαρακτήρα-χαρακτήρα μέσα στον προβλεπόμενο χρόνο
        textEl.textContent = '';
        typewrite(textEl, text, msPerChar).then(()=>{
          // Optionally μπορούμε να ελευθερώσουμε min sizes στο τέλος του κύκλου,
          // αλλά δεν είναι απαραίτητο (το επόμενο bubble θα τα ξαναγράψει).
        });
      }, 20);
    };
  }

  /* ---------- D. TYPEWRITER & ΑΡΙΘΜΗΣΗ ΣΤΟΥΣ ΝΟΜΟΥΣ ---------- */
  const _origAddLaw = window.addLaw;
  if (typeof _origAddLaw === 'function'){
    function nextLawIndex(){
      // Σκανάρουμε ό,τι υπάρχει και βρίσκουμε το μεγαλύτερο (n)
      const host = document.getElementById('lawsList');
      if(!host) return 1;
      let maxN = 0;
      [...host.children].forEach(ch=>{
        const m = /\((\d+)\)\s*$/.exec(String(ch.textContent||''));
        if(m){ maxN = Math.max(maxN, parseInt(m[1],10)); }
      });
      return maxN + 1;
    }

    window.addLaw = function(formulaText){
      try{
        const host = document.getElementById('lawsList');

        // 1) Καθάρισε τυχόν ήδη-υπάρχουσα (n) για να μην διπλασιαστεί
        const stripped = String(formulaText||'').replace(/\(\d+\)\s*$/,'').trim();

        // 2) Κάλεσε original για να εμφανίσει/ανοίξει pane/counters
        _origAddLaw(stripped);

        // 3) Πιάσε ΤΕΛΕΥΤΑΙΟ στοιχείο (το νέο)
        const node = host && host.lastElementChild;
        if(!node) return;

        // 4) Υπολόγισε σωστό index με scan, πρόσθεσε typewriter
        const n = nextLawIndex();
        const finalText = `${String(node.textContent||'').replace(/\(\d+\)\s*$/,'').trim()} (${n})`;

        // 0.6s συνολικά για εμφάνιση νόμου (ανεξάρτητα από μήκος)
        const msPerChar = Math.max(MIN_MS_PER_CHAR, Math.floor(600 / Math.max(1, finalText.length)));
        node.textContent = '';
        typewrite(node, finalText, msPerChar).then(()=>{
          if (typeof window.positionLawCharts === 'function') window.positionLawCharts();
        });

        // 5) Βεβαιώσου ότι φαίνεται ο τίτλος/κουτί
        const pane = document.getElementById('laws'); if(pane) pane.style.display='block';
        const title= document.getElementById('lawsTitle');
        if(title && !title.textContent.trim()){
          title.textContent = (window.i18n && i18n[window.LANG||'gr'])
            ? i18n[window.LANG||'gr'].lawsTitle
            : 'Νόμοι Α.Α.Τ.';
        }
      }catch(e){ console.error('ui_overrides_v2 addLaw error:', e); }
    };
  }
})();
