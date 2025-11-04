// act2.js — Πράξη 2 (strict sync με Πρ.1, + “ghost” ανάμνηση, χωρίς επανάληψη στην Πρ.3)
// Χρονισμός: (atT + (firstThoughtMul - 1.1)) * T * timelineScale
// Ρολόι: tObs = playbackTime - obsStartPlaybackOffset (fallback: local)
// Gate: !isBubbleActive | Διάρκεια bubble: bubbleDurationSec
// Laws: χωρίς scroll, αριστερά διαγράμματα (#lawCharts) κατεβαίνουν & σβήνουν
// Τέλος: κλείσιμο αυλαίας → “Διάλειμμα — Φουαγιέ” (κουμπί → dispatch 'act3-start')

(() => {
  if (window.__ACT2_INSTALLED__) return;
  window.__ACT2_INSTALLED__ = true;

  const DEFAULT_FIRST_MUL = 1.1;

  // ===== Helpers (πατούν πάνω σε global bindings της Πρ.1) =====
  const atT_to_sec = (atT) => {
    const fMul = (typeof firstThoughtMul === 'number' ? firstThoughtMul : DEFAULT_FIRST_MUL);
    const Tloc = (typeof T === 'number' ? T : 6.0);
    const scale = (typeof timelineScale === 'number' ? timelineScale : 1);
    return (atT + (fMul - DEFAULT_FIRST_MUL)) * Tloc * scale;
  };
  const getBubbleDur = () => (typeof bubbleDurationSec === 'number' ? bubbleDurationSec : 3.0);
  const tObsNow = () => {
    if (typeof playbackTime === 'number' && typeof obsStartPlaybackOffset === 'number') {
      return (playbackTime - obsStartPlaybackOffset);
    }
    return (performance.now() - __act2_t0Local) / 1000;
  };
  const isBusy = () => {
    if (typeof isBubbleActive === 'boolean') return isBubbleActive;
    if (typeof isBubbleActive === 'function') { try { return !!isBubbleActive(); } catch {} }
    return false;
  };

  // ===== DOM refs =====
  const stage      = document.getElementById('stage');
  const curtainUp  = document.querySelector('.curtain-upper');
  const springEl   = document.getElementById('spring');
  const markerEl   = document.getElementById('marker');
  const signboard  = document.querySelector('.signboard');
  const lawsPane   = document.getElementById('laws');
  const lawsTitle  = document.getElementById('lawsTitle');
  const lawCharts  = document.getElementById('lawCharts');

  const showThought = window.showThoughtForViewer;
  const addLawOrig  = window.addLaw;

  // ===== Laws χωρίς scroll + slide/hide αριστερών διαγραμμάτων =====
  let baselineLawsH = null;
  function slideLeftChartsByLawsHeight(){
    if(!lawCharts || !lawsPane) return;
    if(baselineLawsH == null) baselineLawsH = lawsPane.getBoundingClientRect().height;

    Object.assign(lawsPane.style, {
      overflow:'visible', maxHeight:'none', position:'relative', left:'-18px'
    });

    const curH  = lawsPane.getBoundingClientRect().height;
    const delta = Math.max(0, Math.round(curH - baselineLawsH));

    lawCharts.style.willChange = 'transform, opacity';
    lawCharts.style.transition = 'transform .5s ease, opacity .35s ease';
    lawCharts.style.transform  = `translateY(${delta}px)`;

    const rect = lawCharts.getBoundingClientRect();
    const vh   = window.innerHeight || document.documentElement.clientHeight;
    const out  = rect.top >= vh - 2;
    if(out){
      lawCharts.style.opacity = '0';
      clearTimeout(lawCharts._hideTimer);
      lawCharts._hideTimer = setTimeout(()=>{ lawCharts.style.display='none'; }, 380);
    } else {
      clearTimeout(lawCharts._hideTimer);
      if(lawCharts.style.display==='none') lawCharts.style.display='';
      lawCharts.style.opacity = '1';
    }
  }
  if (!window.__ACT2_ADDLAW_HOOKED__) {
    window.__ACT2_ADDLAW_HOOKED__ = true;
    window.addLaw = function(txt){
      try { addLawOrig(txt); } finally { slideLeftChartsByLawsHeight(); }
    };
  }

  // ===== Τίτλοι Πράξης 2 (signboard) =====
  function setSignboardAct2(){
    try{
      const h1 = signboard?.querySelector('h1');
      const lA = document.getElementById('sbLineA');
      const lB = document.getElementById('sbLineB');
      const lC = document.getElementById('sbLineC');
      if(h1) h1.textContent = 'Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!';
      const has_m = (typeof m !== 'undefined' && typeof m === 'number');
      const has_D = (typeof D !== 'undefined' && typeof D === 'number');
      const has_E = (typeof E_mech !== 'undefined' && typeof E_mech === 'number');
      if(lA && (has_m || has_D)){
        const sm = has_m ? m.toFixed(2) : '…';
        const sD = has_D ? D.toFixed(2) : '…';
        lA.textContent = `m₁ = ${sm} kg , D₁ = ${sD} N/m`;
      }
      if(lB && has_E){ lB.textContent = `Eμηχ = ${E_mech.toFixed(2)} J`; }
      if(lC){ lC.textContent = '—'; }
    }catch{}
  }

  // ===== GHOST ανάμνηση (μεγαλύτερο πλάτος A′, ίδια περίοδος) =====
  let ghostRunning = false;
  function showGhostMemory(durationSec = 3.2){
    if (ghostRunning) return;
    ghostRunning = true;

    // Προσάρτηση ghost actor
    const ghost = document.createElement('div');
    ghost.id = 'ghostActor';
    ghost.style.position = 'absolute';
    ghost.style.bottom = getComputedStyle(document.getElementById('actor')).bottom || 'calc(32vh + 133px)';
    ghost.style.width = '144px';
    ghost.style.height = '96px';
    ghost.style.zIndex = '105'; // κάτω από κανονικό actor (110)
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '0';
    ghost.style.filter = 'grayscale(1) brightness(1.2) drop-shadow(0 4px 8px rgba(0,0,0,.55))';
    ghost.innerHTML = `<img src="skater.png" alt="ghost" style="width:100%;height:auto;display:block;opacity:.55;mix-blend-mode:screen">`;
    stage.appendChild(ghost);

    const start = performance.now();
    const centerX = stage.clientWidth/2;
    const pxPerMeterLocal = (typeof pxPerMeter === 'number') ? pxPerMeter : 50;
    const A_base = (typeof A_m === 'number') ? A_m : 3.0;
    const Aghost_m = A_base * 1.5;                // μεγαλύτερο πλάτος
    const Aghost_px = Aghost_m * pxPerMeterLocal;
    const omegaLoc = (typeof omega === 'number') ? omega : (2*Math.PI/6);
    const imgW = 144;
    const hookOffsetPx = imgW/2;

    function loop(now){
      const t = (now - start)/1000;
      // Απόλυτος χρόνος σκηνής (ίδιος με Πρ.1)
      const tPlay = (typeof playbackTime === 'number') ? playbackTime : t;
      const x = centerX + Aghost_px * Math.sin(omegaLoc * tPlay) - hookOffsetPx;

      // Fade in/out
      const a = Math.min(1, Math.max(0, t / 0.35));                 // in 350ms
      const b = Math.min(1, Math.max(0, (durationSec - t) / 0.45)); // out 450ms
      const op = Math.min(a, b) * 0.85;
      ghost.style.opacity = op.toFixed(2);

      ghost.style.left = `${x}px`;

      if (t < durationSec){
        requestAnimationFrame(loop);
      } else {
        try{ ghost.remove(); }catch{}
        ghostRunning = false;
      }
    }
    requestAnimationFrame(loop);
  }

  // ===== Σενάριο Πράξης 2 (αντιστοιχία με λίστα χρήστη) =====
  const S = [
    // (1) Άνοιγμα/ελατήριο → στο runAct2()
    // (2) Τίτλος → setSignboardAct2()

    // (3)–(12) Σκέψεις θεατών
    { atT:0.05, run:()=> showThought?.(0,'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!', getBubbleDur(),125,-10) },
    { atT:0.35, run:()=> showThought?.(2,'αυτόν ακριβώς τον m₁D₁ τον έχω ξαναδεί σε άλλη παράσταση αλλά με άλλον παραγωγό', getBubbleDur(),130,  0) },
    { atT:0.55, run:()=> showThought?.(3,'…ναι και εκεί πάλι με την ίδια περίοδο κινήθηκε αλλά με μεγαλύτερο πλάτος A′',       getBubbleDur(),135, 10) },

    // (6) Θύμιση — Ghost εμφάνιση (μεγαλύτερη Εμηχ γιατί A′>A)
    { atT:0.62, run:()=> showGhostMemory(getBubbleDur()+0.8) },

    { atT:0.80, run:()=> showThought?.(1,'Πρωταγωνιστής επομένως είναι ο κινούμενος και τα εργαλεία του μαζί!',               getBubbleDur(),125,-20) },
    { atT:1.05, run:()=> showThought?.(4,'Τώρα καταλαβαίνω γιατί τον λένε m₁, D₁…',                                           getBubbleDur(),125, 20) },
    { atT:1.25, run:()=> showThought?.(0,'…το m₁ είναι η μάζα του αλλά ως ταλαντωτής συνοδεύεται από «ελαστικό» αίτιο-δύναμη, στο οποίο αναφέρεται το D₁!', getBubbleDur(),131,-30) },
    { atT:1.45, run:()=> showThought?.(2,'…m₁ και D₁ πάνε πακέτο!',                                                          getBubbleDur(),125,  0) },
    { atT:1.65, run:()=> showThought?.(3,'…δηλαδή κάθε ταλαντωτής χαρακτηρίζεται από τη μάζα του και το ελαστικό αίτιο-δύναμη που του ρυθμίζει την ταλάντωση!', getBubbleDur(),133,10) },
    { atT:1.90, run:()=> showThought?.(1,'…γι’ αυτό σαν αριθμό μητρώου έχει τα mD!',                                          getBubbleDur(),125,-10) },

    // (13) Ερώτηση για 2ο Νόμο
    { atT:2.05, run:()=> showThought?.(0,'Πώς γράφεται ο 2ος Νόμος του Νεύτωνα για την περίπτωση του ταλαντωτή;', getBubbleDur(),125,-18) },

    // (14) ΣF=ma γενικά ΚΑΙ με (3): ΣF=−mω²A·ημ(ωt+φ₀)
    { atT:2.20, run:()=> window.addLaw?.('ΣF = m·a (γενικά)') },
    { atT:2.35, run:()=> window.addLaw?.('ΣF(t) = −mω²A·ημ(ωt + φ₀)') },

    // (15) Με βάση (4): ΣF=−mω²x
    { atT:2.60, run:()=> window.addLaw?.('ΣF(t) = −mω²x(t)') },

    // (16) Σχόλιο για «σωματότυπο» m και «εμμονή» ω
    { atT:2.85, run:()=> showThought?.(4,'Η ΣF=−mω²x περιέχει δύο σταθερές του πρωταγωνιστή: τον «σωματότυπο» (m) και την «εμμονή» (ω).', getBubbleDur(),125, 18) },

    // (17) Θέτω D = mω²
    { atT:3.10, run:()=> showThought?.(0,'Να κάνουμε τις δύο σταθερές μία: D = mω², που περιλαμβάνει και τα δύο σταθερά χαρακτηριστικά του…', getBubbleDur(),125,-18) },

    // (18) Σχόλιο για (m,D)
    { atT:3.30, run:()=> showThought?.(2,'…χμμμ, γι’ αυτό τον λένε και (m, D)!', getBubbleDur(),125,  0) },

    // (19) Άρα ΣF = −D·x
    { atT:3.55, run:()=> window.addLaw?.('Θέτω D = mω²') },
    { atT:3.75, run:()=> window.addLaw?.('⇒ ΣF = −D·x') },

    // Φινάλε Πρ.2
    { atT:4.20, run:()=> endAct2() }
  ];

  // ===== Τέλος Πράξης 2 → Διάλειμμα—Φουαγιέ =====
  function endAct2(){
    try{
      if(markerEl){ markerEl.style.opacity='0'; markerEl.style.zIndex='0'; markerEl.style.display='none'; }
    }catch{}
    if (typeof window.closeCurtainsSequence === 'function') {
      try{ window.closeCurtainsSequence(); }catch{}
      setTimeout(setBreakPanelForFoyer, 1200);
    } else {
      try{ curtainUp?.classList.add('slow-close'); stage?.classList.remove('open'); }catch{}
      setTimeout(setBreakPanelForFoyer, 1200);
    }
  }
  function setBreakPanelForFoyer(){
    const p = document.getElementById('actBreak');
    const t = document.getElementById('actBreakTitle');
    const m = document.getElementById('actBreakMsg');
    const b = document.getElementById('btnAct2'); // επαναχρησιμοποιείται για Act 3
    if (p && t && m && b){
      t.textContent='Τέλος Πράξης 2';
      m.textContent='Διάλειμμα — Φουαγιέ';
      b.textContent='Είσοδος στο Φουαγιέ';
      b.onclick=()=>{ p.style.display='none'; document.dispatchEvent(new Event('act3-start')); };
      // κεντράρισμα μέσα στο άνοιγμα της κεντρικής κουρτίνας (όπως στην Πρ.1)
      try{
        const sRect = stage.getBoundingClientRect();
        const centralLeftPx  = stage.clientWidth*0.18;
        const centralWidthPx = stage.clientWidth*0.64;
        const cuRect = curtainUp.getBoundingClientRect();
        p.style.left   = (centralLeftPx) + 'px';
        p.style.top    = (cuRect.top  - sRect.top) + 'px';
        p.style.width  = centralWidthPx + 'px';
        p.style.height = cuRect.height + 'px';
      }catch{}
      p.style.display='flex';
    }
  }

  // ===== Runner Πράξης 2 =====
  let __act2_t0Obs = 0;
  let __act2_t0Local = performance.now();

  function runAct2(){
    // (1) Άνοιγμα & ελατήριο ορατό
    try{ stage?.classList.add('open'); }catch{}
    try{ if(springEl) springEl.style.display='block'; }catch{}

    // (2) Τίτλοι
    setSignboardAct2();

    // Νόμοι Pane
    if(lawsPane){
      Object.assign(lawsPane.style, { display:'block', overflow:'visible', maxHeight:'none', position:'relative', left:'-18px' });
      if(lawsTitle) lawsTitle.textContent = 'Νόμοι Πράξης 2';
      baselineLawsH = lawsPane.getBoundingClientRect().height;
    }

    // Αναφορά χρόνου
    __act2_t0Local = performance.now();
    __act2_t0Obs   = tObsNow();

    const thresholds = S.map(s => atT_to_sec(s.atT));
    let i = 0;

    function loop(){
      const rel = tObsNow() - __act2_t0Obs;
      while (!isBusy() && i < S.length && rel >= thresholds[i]) {
        try{ S[i].run(); }catch(e){ console.error('act2 run error', e); }
        i++;
      }
      if (i < S.length) requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // Εκκίνηση Πρ.2 όταν πατηθεί το κουμπί μετά την Πρ.1
  document.addEventListener('act2-start', runAct2);
})();
