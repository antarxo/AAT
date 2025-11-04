// act2.js — Πρ.2: ίδιο tempo με Πρ.1, laws χωρίς scroll, charts κατεβαίνουν, σωστό κλείσιμο αυλαίας
(() => {
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

  // Ρολόι Πρ.1
  const CLOCK = (()=> {
    const has = typeof window.ACT1_CLOCK === 'object' && window.ACT1_CLOCK;
    const nowMs = has && typeof window.ACT1_CLOCK.nowMs === 'function'
      ? () => window.ACT1_CLOCK.nowMs()
      : () => performance.now();
    const getTraw = has && typeof window.ACT1_CLOCK.getT === 'function'
      ? () => window.ACT1_CLOCK.getT()
      : () => (typeof window.T === 'number' ? window.T : 6.0);
    return { nowMs, getTraw };
  })();

  // Προσπαθώ να πιάσω ΑΚΡΙΒΩΣ το «effective» T που χρησιμοποιεί η Πρ.1
  function getEffectiveT(){
    if (typeof window.ACT1_THOUGHT_T === 'number') return window.ACT1_THOUGHT_T;
    const C = window.ACT1_CLOCK;
    let T = CLOCK.getTraw();
    if (C && typeof C.getTempoScale === 'function') T *= Math.max(0.1, C.getTempoScale());
    else if (C && typeof C.tempoScale === 'number') T *= Math.max(0.1, C.tempoScale);
    else if (typeof window.ACT1_THOUGHT_SCALE === 'number') T *= Math.max(0.1, window.ACT1_THOUGHT_SCALE);
    else if (typeof window.uXT === 'number') T *= Math.max(0.1, window.uXT);
    return T;
  }

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

  // Laws pane: no scroll + αριστερό nudge
  let baselineLawsH = null;
  function slideChartsByLawsHeight(){
    if(!lawCharts || !lawsPane) return;
    if(baselineLawsH == null) baselineLawsH = lawsPane.getBoundingClientRect().height;

    Object.assign(lawsPane.style, { overflow:'visible', maxHeight:'none', position:'relative', left:'-18px' });

    const curH = lawsPane.getBoundingClientRect().height;
    const delta = Math.max(0, Math.round(curH - baselineLawsH));

    lawCharts.style.willChange = 'transform, opacity';
    lawCharts.style.transition = 'transform .5s ease, opacity .35s ease';
    lawCharts.style.transform  = `translateY(${delta}px)`;

    const rect = lawCharts.getBoundingClientRect();
    const vh   = window.innerHeight || document.documentElement.clientHeight;
    const fullyBelow = rect.top >= vh - 2;
    if(fullyBelow){
      lawCharts.style.opacity = '0';
      clearTimeout(lawCharts._hideTimer);
      lawCharts._hideTimer = setTimeout(()=>{ lawCharts.style.display='none'; }, 380);
    } else {
      clearTimeout(lawCharts._hideTimer);
      if(lawCharts.style.display==='none') lawCharts.style.display='';
      lawCharts.style.opacity = '1';
    }
  }

  window.addLaw = function(txt){
    try { addLawOriginal(txt); } finally { slideChartsByLawsHeight(); }
  };

  function endAct2WithBreak(){
    if(window.showActTransition){
      window.showActTransition({
        title:'Τέλος Πράξης 2',
        msg:'Διάλειμμα — Φουαγιέ',
        buttonText:'Είσοδος στο Φουαγιέ',
        onClick:()=>document.dispatchEvent(new Event('act3-start'))
      });
      return;
    }
    // Fallback
    const p = document.getElementById('actBreak');
    const t = document.getElementById('actBreakTitle');
    const m = document.getElementById('actBreakMsg');
    const b = document.getElementById('btnAct2');
    if(p && t && m && b){
      t.textContent='Τέλος Πράξης 2';
      m.textContent='Διάλειμμα — Φουαγιέ';
      b.textContent='Είσοδος στο Φουαγιέ';
      b.onclick=()=>{ p.style.display='none'; document.dispatchEvent(new Event('act3-start')); };
      p.style.display='block';
    }
  }

  function closeCurtainThenBreak(){
    try{
      if(markerEl){ markerEl.style.opacity='0'; markerEl.style.zIndex='0'; markerEl.style.display='none'; }
      if(curtainUpper && stage){
        curtainUpper.classList.add('slow-close');
        stage.classList.remove('open');
        setTimeout(()=>{ endAct2WithBreak(); }, 1200);
        return;
      }
    }catch{}
    endAct2WithBreak();
  }

  // Χρονισμός: πολλαπλάσια του effective T (ίδιο με Πρ.1)
  const events = [
    { atMul:0.05, fn:()=> showThoughtForViewer?.(0, 'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!', 2.2, 125, -10) },
    { atMul:0.35, fn:()=> showThoughtForViewer?.(2, 'αυτόν ακριβώς τον m₁D₁ τον έχω ξαναδεί σε άλλη παράσταση αλλά με άλλον παραγωγό', 2.4, 130, 0) },
    { atMul:0.55, fn:()=> showThoughtForViewer?.(3, '…ναι και εκεί πάλι με την ίδια περίοδο κινήθηκε αλλά με μεγαλύτερο πλάτος A′', 2.6, 135, 10) },
    { atMul:0.80, fn:()=> showThoughtForViewer?.(1, 'Πρωταγωνιστής επομένως είναι ο κινούμενος και τα εργαλεία του μαζί!', 2.2, 125, -20) },
    { atMul:1.05, fn:()=> showThoughtForViewer?.(4, 'Τώρα καταλαβαίνω γιατί τον λένε m₁, D₁…', 2.0, 125, 20) },
    { atMul:1.25, fn:()=> showThoughtForViewer?.(0, '…το m₁ είναι η μάζα του, στο D₁ αναφέρεται το «ελαστικό» αίτιο-δύναμη', 2.4, 131, -30) },
    { atMul:1.45, fn:()=> showThoughtForViewer?.(2, '…m₁ και D₁ πάνε πακέτο!', 2.0, 125, 0) },
    { atMul:1.65, fn:()=> showThoughtForViewer?.(3, '…κάθε ταλαντωτής χαρακτηρίζεται από τη μάζα του και το ελαστικό αίτιο που ρυθμίζει την ταλάντωση', 2.6, 133, 10) },
    { atMul:1.90, fn:()=> showThoughtForViewer?.(1, '…γι’ αυτό σαν αριθμό μητρώου έχει τα mD!', 2.2, 125, -10) },
    { atMul:2.15, fn:()=> window.addLaw?.('ΣF = m·a (γενικά)') },
    { atMul:2.35, fn:()=> window.addLaw?.('ΣF(t) = −mω²A·ημ(ωt + φ₀)') },
    { atMul:2.60, fn:()=> window.addLaw?.('ΣF(t) = −mω²x(t)') },
    { atMul:2.85, fn:()=> showThoughtForViewer?.(4, 'Η ΣF=−mω²x περιέχει τον «σωματότυπο» (m) και την «εμμονή» (ω)', 2.6, 125, 18) },
    { atMul:3.10, fn:()=> showThoughtForViewer?.(0, 'Να κάνουμε τις δύο σταθερές μία: D = mω²', 2.2, 125, -18) },
    { atMul:3.30, fn:()=> showThoughtForViewer?.(2, '…χμμμ, γι’ αυτό τον λένε και (m, D)!', 2.0, 125, 0) },
    { atMul:3.55, fn:()=> window.addLaw?.('Θέτω D = mω²') },
    { atMul:3.75, fn:()=> window.addLaw?.('⇒ ΣF = −D·x') },
    { atMul:4.20, fn:()=> { closeCurtainThenBreak(); } }
  ];
  events.forEach(e => e.fired = false);

  function runAct2(){
    // Οπτικό κλείσιμο Πρ.1 πριν την 2
    try{
      if(curtainUpper && stage){ curtainUpper.classList.add('slow-close'); stage.classList.remove('open'); }
    }catch{}

    setSignboardAct2();
    ensureSpringVisible();
    if(stage) stage.classList.add('open');
    if(markerEl) markerEl.style.opacity = '1';
    if(lawsPane){
      Object.assign(lawsPane.style, { display:'block', overflow:'visible', maxHeight:'none', position:'relative', left:'-18px' });
      if(lawsTitle) lawsTitle.textContent = 'Νόμοι Πράξης 2';
    }
    baselineLawsH = lawsPane ? lawsPane.getBoundingClientRect().height : null;

    const startMs = (typeof CLOCK.nowMs === 'function' ? CLOCK.nowMs() : performance.now());

    const step = () => {
      const elapsed = ((typeof CLOCK.nowMs === 'function' ? CLOCK.nowMs() : performance.now()) - startMs) / 1000.0;
      const Tsec = getEffectiveT();              // ίδιος ρυθμός με Πρ.1
      for(const e of events){
        if(!e.fired && elapsed >= e.atMul * Tsec){
          e.fired = true;
          try{ e.fn(); }catch{}
        }
      }
      if(events.some(ev=>!ev.fired)) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  document.addEventListener('act2-start', runAct2);
})();
