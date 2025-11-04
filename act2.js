// act2.js — Πράξη 2 σε strict sync με Πράξη 1
// Χρονισμός: (atT + (firstThoughtMul - 1.1)) * T * timelineScale
// Ρολόι: tObs = playbackTime - obsStartPlaybackOffset
// Gate: !isBubbleActive  |  Διάρκεια bubble: bubbleDurationSec
// Laws: χωρίς scroll, τα ΑΡΙΣΤΕΡΑ διαγράμματα (#lawCharts) κατεβαίνουν & σβήνουν
// Τέλος: κλείσιμο αυλαίας → “Διάλειμμα — Φουαγιέ” (κουμπί → dispatch 'act3-start')

(() => {
  if (window.__ACT2_INSTALLED__) return;
  window.__ACT2_INSTALLED__ = true;

  const DEFAULT_FIRST_MUL = 1.1;

  // ===== Hooks / getters από Πρ.1 (υπάρχουν global στο index.html) =====
  const atT_to_sec = (atT) => {
    const fMul = (typeof firstThoughtMul === 'number' ? firstThoughtMul : DEFAULT_FIRST_MUL);
    const Tloc = (typeof T === 'number' ? T : 6.0);
    const scale = (typeof timelineScale === 'number' ? timelineScale : 1);
    return (atT + (fMul - DEFAULT_FIRST_MUL)) * Tloc * scale;
  };
  const getBubbleDur = () => (typeof bubbleDurationSec === 'number' ? bubbleDurationSec : 2.0);
  const tObsNow = () => {
    if (typeof playbackTime === 'number' && typeof obsStartPlaybackOffset === 'number') {
      return (playbackTime - obsStartPlaybackOffset);
    }
    // fallback: local
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
      overflow: 'visible', maxHeight: 'none', position: 'relative', left: '-18px'
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
      // m, D, E_mech μπορεί να είναι global bindings (όχι window). Έλεγχος με typeof.
      const has_m = (typeof m !== 'undefined' && typeof m === 'number');
      const has_D = (typeof D !== 'undefined' && typeof D === 'number');
      const has_E = (typeof E_mech !== 'undefined' && typeof E_mech === 'number');
      if(lA && (has_m || has_D)){
        const sm = has_m ? m.toFixed(2) : '?';
        const sD = has_D ? D.toFixed(2) : '?';
        lA.textContent = `m₁ = ${sm} kg , D₁ = ${sD} N/m`;
      }
      if(lB && has_E){ lB.textContent = `Eμηχ = ${E_mech.toFixed(2)} J`; }
      if(lC){ lC.textContent = '—'; }
    }catch{}
  }

  // ===== Σενάριο Πράξης 2 (atT = πολλαπλάσια T) =====
  const S = [
    { atT:0.05, run:()=> showThought?.(0,'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!', getBubbleDur(),125,-10) },
    { atT:0.35, run:()=> showThought?.(2,'αυτόν ακριβώς τον m₁D₁ τον έχω ξαναδεί σε άλλη παράσταση αλλά με άλλον παραγωγό', getBubbleDur(),130,  0) },
    { atT:0.55, run:()=> showThought?.(3,'…ναι και εκεί πάλι με την ίδια περίοδο κινήθηκε αλλά με μεγαλύτερο πλάτος A′',       getBubbleDur(),135, 10) },
    { atT:0.80, run:()=> showThought?.(1,'Πρωταγωνιστής επομένως είναι ο κινούμενος και τα εργαλεία του μαζί!',               getBubbleDur(),125,-20) },
    { atT:1.05, run:()=> showThought?.(4,'Τώρα καταλαβαίνω γιατί τον λένε m₁, D₁…',                                           getBubbleDur(),125, 20) },
    { atT:1.25, run:()=> showThought?.(0,'…το m₁ είναι η μάζα του, στο D₁ αναφέρεται το «ελαστικό» αίτιο-δύναμη',            getBubbleDur(),131,-30) },
    { atT:1.45, run:()=> showThought?.(2,'…m₁ και D₁ πάνε πακέτο!',                                                          getBubbleDur(),125,  0) },
    { atT:1.65, run:()=> showThought?.(3,'…κάθε ταλαντωτής χαρακτηρίζεται από τη μάζα του και το ελαστικό αίτιο που ρυθμίζει την ταλάντωση', getBubbleDur(),133,10) },
    { atT:1.90, run:()=> showThought?.(1,'…γι’ αυτό σαν αριθμό μητρώου έχει τα mD!',                                          getBubbleDur(),125,-10) },
    { atT:2.15, run:()=> window.addLaw?.('ΣF = m·a (γενικά)') },
    { atT:2.35, run:()=> window.addLaw?.('ΣF(t) = −mω²A·ημ(ωt + φ₀)') },
    { atT:2.60, run:()=> window.addLaw?.('ΣF(t) = −mω²x(t)') },
    { atT:2.85, run:()=> showThought?.(4,'Η ΣF=−mω²x περιέχει τον «σωματότυπο» (m) και την «εμμονή» (ω)',                     getBubbleDur(),125, 18) },
    { atT:3.10, run:()=> showThought?.(0,'Να κάνουμε τις δύο σταθερές μία: D = mω²',                                         getBubbleDur(),125,-18) },
    { atT:3.30, run:()=> showThought?.(2,'…χμμμ, γι’ αυτό τον λένε και (m, D)!',                                             getBubbleDur(),125,  0) },
    { atT:3.55, run:()=> window.addLaw?.('Θέτω D = mω²') },
    { atT:3.75, run:()=> window.addLaw?.('⇒ ΣF = −D·x') },
    { atT:4.20, run:()=> endAct2() }
  ];

  // ===== Τέλος Πράξης 2 → Διάλειμμα—Φουαγιέ =====
  function endAct2(){
    try{ if(markerEl){ markerEl.style.opacity='0'; markerEl.style.zIndex='0'; markerEl.style.display='none'; } }catch{}
    // Προτίμηση: χρησιμοποίησε την ίδια ρουτίνα κλεισίματος με την Πράξη 1, αν υπάρχει
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
    const b = document.getElementById('btnAct2'); // θα επαναχρησιμοποιηθεί για Act 3
    if (p && t && m && b){
      t.textContent='Τέλος Πράξης 2';
      m.textContent='Διάλειμμα — Φουαγιέ';
      b.textContent='Είσοδος στο Φουαγιέ';
      b.onclick=()=>{ p.style.display='none'; document.dispatchEvent(new Event('act3-start')); };
      p.style.display='flex';
    }
  }

  // ===== Runner Πράξης 2 =====
  let __act2_t0Obs = 0;
  let __act2_t0Local = performance.now();

  function runAct2(){
    // ίδια σκηνή με Πρ.1, με ελατήριο ορατό
    try{ stage?.classList.add('open'); }catch{}
    try{ if(springEl) springEl.style.display='block'; }catch{}
    setSignboardAct2();

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
      const rel = tObsNow() - __act2_t0Obs; // ίδιο ρολόι με Πρ.1
      // gate: !isBubbleActive
      while (!isBusy() && i < S.length && rel >= thresholds[i]) {
        try{ S[i].run(); }catch(e){ console.error('act2 run error', e); }
        i++;
      }
      if (i < S.length) requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // Εκκίνηση Πράξης 2 όταν πατηθεί το κουμπί της μετάβασης
  document.addEventListener('act2-start', runAct2);
})();
