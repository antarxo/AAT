// act2.js — Πρ.2 full sync με Πρ.1: T, firstThoughtMul, timelineScale, slowFactor (bubbleDurationSec μέσω slider)
// - Δυναμικός υπολογισμός thresholds κάθε frame (ό,τι αλλάξεις στο γρανάζι ισχύει επί τόπου)
// - Χωρίς ρητή διάρκεια σε bubbles (χρησιμοποιείται το bubbleDurationSec της 1ης)
// - Laws χωρίς scroll, charts κατεβαίνουν, κλείσιμο αυλαίας + centered διάλειμμα–φουαγιέ

(() => {
  // ---------- refs ----------
  const stage        = document.getElementById('stage');
  const curtainUpper = document.querySelector('.curtain-upper');
  const springEl     = document.getElementById('spring');
  const markerEl     = document.getElementById('marker');
  const lawsPane     = document.getElementById('laws');
  const lawsTitle    = document.getElementById('lawsTitle');
  const lawCharts    = document.getElementById('lawCharts');
  const signboard    = document.querySelector('.signboard');

  const showThoughtForViewer = window.showThoughtForViewer;
  const addLawOriginal       = window.addLaw;

  // ---------- Act1 gear hooks ----------
  const DEFAULT_FIRST_MUL = 1.1;

  const getT             = () => (typeof window.T === 'number' ? window.T : 6.0);
  const getFirstMul      = () => (typeof window.firstThoughtMul === 'number' ? window.firstThoughtMul : DEFAULT_FIRST_MUL);
  const getTimelineScale = () => (typeof window.timelineScale === 'number' ? window.timelineScale : 1);
  const getSlowFactor    = () => (typeof window.slowFactor === 'number' ? window.slowFactor : 1);

  // observer time της 1ης (όπως χρονίζει Act 1)
  function getObsTime() {
    const pt   = (typeof window.playbackTime === 'number') ? window.playbackTime : 0;
    const off  = (typeof window.obsStartPlaybackOffset === 'number') ? window.obsStartPlaybackOffset : 0;
    const live = (typeof window.obsStarted === 'boolean') ? window.obsStarted : false;
    return live ? (pt - off) : 0;
  }

  // atT (πολλαπλάσιο Τ) -> seconds με ΤΑ ΙΔΙΑ sliders/παράγοντες της 1ης
  function atMulToSeconds(atT) {
    const shiftMul = (getFirstMul() - DEFAULT_FIRST_MUL);
    const baseMul  = atT + shiftMul;
    return baseMul * getT() * getTimelineScale() * getSlowFactor();
  }

  // ---------- Laws pane & charts ----------
  let baselineLawsH = null;
  function slideChartsByLawsHeight(){
    if(!lawCharts || !lawsPane) return;
    if(baselineLawsH == null) baselineLawsH = lawsPane.getBoundingClientRect().height;

    Object.assign(lawsPane.style, { overflow:'visible', maxHeight:'none', position:'relative', left:'-18px' });

    const curH  = lawsPane.getBoundingClientRect().height;
    const delta = Math.max(0, Math.round(curH - baselineLawsH));

    lawCharts.style.willChange = 'transform, opacity';
    lawCharts.style.transition = 'transform .5s ease, opacity .35s ease';
    lawCharts.style.transform  = `translateY(${delta}px)`;

    const rect = lawCharts.getBoundingClientRect();
    const vh   = window.innerHeight || document.documentElement.clientHeight;
    const fullyBelow = rect.top >= vh - 2;
    if (fullyBelow) {
      lawCharts.style.opacity = '0';
      clearTimeout(lawCharts._hideTimer);
      lawCharts._hideTimer = setTimeout(()=>{ lawCharts.style.display='none'; }, 380);
    } else {
      clearTimeout(lawCharts._hideTimer);
      if (lawCharts.style.display==='none') lawCharts.style.display='';
      lawCharts.style.opacity = '1';
    }
  }

  window.addLaw = function(txt){
    try { addLawOriginal(txt); } finally { slideChartsByLawsHeight(); }
  };

  // ---------- Τέλος Πρ.2 → Διάλειμμα–Φουαγιέ ----------
  function endAct2WithBreak(){
    if (window.showActTransition) {
      window.showActTransition({
        title: 'Τέλος Πράξης 2',
        msg:   'Διάλειμμα — Φουαγιέ',
        buttonText: 'Είσοδος στο Φουαγιέ',
        onClick: () => document.dispatchEvent(new Event('act3-start'))
      });
      return;
    }
    // Fallback
    const p = document.getElementById('actBreak');
    const t = document.getElementById('actBreakTitle');
    const m = document.getElementById('actBreakMsg');
    const b = document.getElementById('btnAct2');
    if (p && t && m && b) {
      t.textContent='Τέλος Πράξης 2';
      m.textContent='Διάλειμμα — Φουαγιέ';
      b.textContent='Είσοδος στο Φουαγιέ';
      b.onclick=()=>{ p.style.display='none'; document.dispatchEvent(new Event('act3-start')); };
      p.style.display='block';
    }
  }

  function closeCurtainThenBreak(){
    try{
      if (markerEl){ markerEl.style.opacity='0'; markerEl.style.zIndex='0'; markerEl.style.display='none'; }
      if (curtainUpper && stage){
        curtainUpper.classList.add('slow-close');
        stage.classList.remove('open');
        setTimeout(()=>{ endAct2WithBreak(); }, 1200);
        return;
      }
    }catch{}
    endAct2WithBreak();
  }

  // ---------- Σενάριο Πρ.2 (atT = πολλαπλάσιο T, ΧΩΡΙΣ ρητή διάρκεια bubble) ----------
  const script = [
    { atT:0.05, fn:()=> showThoughtForViewer?.(0, 'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!', undefined, 125, -10) },
    { atT:0.35, fn:()=> showThoughtForViewer?.(2, 'αυτόν ακριβώς τον m₁D₁ τον έχω ξαναδεί σε άλλη παράσταση αλλά με άλλον παραγωγό', undefined, 130, 0) },
    { atT:0.55, fn:()=> showThoughtForViewer?.(3, '…ναι και εκεί πάλι με την ίδια περίοδο κινήθηκε αλλά με μεγαλύτερο πλάτος A′', undefined, 135, 10) },
    { atT:0.80, fn:()=> showThoughtForViewer?.(1, 'Πρωταγωνιστής επομένως είναι ο κινούμενος και τα εργαλεία του μαζί!', undefined, 125, -20) },
    { atT:1.05, fn:()=> showThoughtForViewer?.(4, 'Τώρα καταλαβαίνω γιατί τον λένε m₁, D₁…', undefined, 125, 20) },
    { atT:1.25, fn:()=> showThoughtForViewer?.(0, '…το m₁ είναι η μάζα του, στο D₁ αναφέρεται το «ελαστικό» αίτιο-δύναμη', undefined, 131, -30) },
    { atT:1.45, fn:()=> showThoughtForViewer?.(2, '…m₁ και D₁ πάνε πακέτο!', undefined, 125, 0) },
    { atT:1.65, fn:()=> showThoughtForViewer?.(3, '…κάθε ταλαντωτής χαρακτηρίζεται από τη μάζα του και το ελαστικό αίτιο που ρυθμίζει την ταλάντωση', undefined, 133, 10) },
    { atT:1.90, fn:()=> showThoughtForViewer?.(1, '…γι’ αυτό σαν αριθμό μητρώου έχει τα mD!', undefined, 125, -10) },
    { atT:2.15, fn:()=> window.addLaw?.('ΣF = m·a (γενικά)') },
    { atT:2.35, fn:()=> window.addLaw?.('ΣF(t) = −mω²A·ημ(ωt + φ₀)') },
    { atT:2.60, fn:()=> window.addLaw?.('ΣF(t) = −mω²x(t)') },
    { atT:2.85, fn:()=> showThoughtForViewer?.(4, 'Η ΣF=−mω²x περιέχει τον «σωματότυπο» (m) και την «εμμονή» (ω)', undefined, 125, 18) },
    { atT:3.10, fn:()=> showThoughtForViewer?.(0, 'Να κάνουμε τις δύο σταθερές μία: D = mω²', undefined, 125, -18) },
    { atT:3.30, fn:()=> showThoughtForViewer?.(2, '…χμμμ, γι’ αυτό τον λένε και (m, D)!', undefined, 125, 0) },
    { atT:3.55, fn:()=> window.addLaw?.('Θέτω D = mω²') },
    { atT:3.75, fn:()=> window.addLaw?.('⇒ ΣF = −D·x') },
    { atT:4.20, fn:()=> { closeCurtainThenBreak(); } }
  ];
  script.forEach(e => e.fired = false);

  // ---------- Εκκίνηση ----------
  function setSignboardAct2(){
    if(!signboard) return;
    const h1  = signboard.querySelector('h1');
    const lA  = document.getElementById('sbLineA');
    const lB  = document.getElementById('sbLineB');
    const lC  = document.getElementById('sbLineC');
    if(h1) h1.textContent = 'Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!';
    if(typeof window.m === 'number' && typeof window.D === 'number' && typeof window.E_mech === 'number'){
      if(lA) lA.textContent = `m₁ = ${window.m.toFixed(2)} kg , D₁ = ${window.D.toFixed(2)} N/m`;
      if(lB) lB.textContent = `Eμηχ = ${window.E_mech.toFixed(2)} J`;
    }
    if(lC) lC.textContent = '—';
  }

  function ensureSpringVisible(){ if(springEl) springEl.style.display = 'block'; }

  function runAct2(){
    // Οπτικό κλείσιμο Πρ.1 πριν ξεκινήσει η 2
    try{ if(curtainUpper && stage){ curtainUpper.classList.add('slow-close'); stage.classList.remove('open'); } }catch{}

    setSignboardAct2();
    ensureSpringVisible();
    if(stage) stage.classList.add('open');
    if(markerEl) markerEl.style.opacity = '1';
    if(lawsPane){
      Object.assign(lawsPane.style, { display:'block', overflow:'visible', maxHeight:'none', position:'relative', left:'-18px' });
      if(lawsTitle) lawsTitle.textContent = 'Νόμοι Πράξης 2';
    }
    baselineLawsH = lawsPane ? lawsPane.getBoundingClientRect().height : null;

    const t0Obs = getObsTime(); // reference, ίδιο με Act 1

    const step = () => {
      const rel = getObsTime() - t0Obs;
      for(const e of script){
        if(!e.fired && rel >= atMulToSeconds(e.atT)){
          e.fired = true;
          try{ e.fn(); }catch{}
        }
      }
      if(script.some(ev=>!ev.fired)) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  document.addEventListener('act2-start', runAct2);
})();
