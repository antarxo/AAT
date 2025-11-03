// act2.js — Laws grow w/o scroll; right lawCharts descend by Δheight and fade/hide; laws pane nudged left
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

  const CLOCK = (()=>{
    const has = typeof window.ACT1_CLOCK === 'object' && window.ACT1_CLOCK;
    const nowMs = has && typeof window.ACT1_CLOCK.nowMs === 'function'
      ? ()=>window.ACT1_CLOCK.nowMs()
      : ()=>performance.now();
    const getT  = has && typeof window.ACT1_CLOCK.T === 'number'
      ? ()=>window.ACT1_CLOCK.T
      : ()=> (typeof window.T === 'number' ? window.T : 6.0);
    return { nowMs, getT };
  })();

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

  let baselineLawsH = null;
  function slideChartsByLawsHeight(){
    if(!lawCharts || !lawsPane) return;
    if(baselineLawsH == null) baselineLawsH = lawsPane.getBoundingClientRect().height;
    // grow laws, no scroll; nudge left w/o width change
    Object.assign(lawsPane.style, { overflow:'visible', maxHeight:'none', position:'relative', left:'-18px' });

    const curH = lawsPane.getBoundingClientRect().height;
    const delta = Math.max(0, Math.round(curH - baselineLawsH));

    lawCharts.style.willChange = 'transform, opacity';
    lawCharts.style.transition = 'transform .5s ease, opacity .35s ease';
    lawCharts.style.transform  = `translateY(${delta}px)`;

    // robust off-screen detection
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

  function closeCurtainThenBreak(){
    try{
      const curtainUpper = document.querySelector('.curtain-upper');
      const stage = document.getElementById('stage');
      if(curtainUpper && stage){
        curtainUpper.classList.add('slow-close');
        stage.classList.remove('open');
        setTimeout(()=>{ endAct2WithBreak(); }, 1200);
        return;
      }
    }catch{}
    endAct2WithBreak();
  }

  function endAct2WithBreak(){
    // Unified transition panel
    if(window.showActTransition){
      window.showActTransition({ title:'Τέλος Πράξης 2', msg:'Διάλειμμα — Φουαγιέ', buttonText:'Είσοδος στο Φουαγιέ', onClick:()=>document.dispatchEvent(new Event('act3-start')) });
      return;
    }
    // Fallback (if helper missing)
    const actBreak   = document.getElementById('actBreak');
    const actBrTitle = document.getElementById('actBreakTitle');
    const actBrMsg   = document.getElementById('actBreakMsg');
    const btnAct2    = document.getElementById('btnAct2');
    if(actBreak && actBrTitle && actBrMsg && btnAct2){
      actBrTitle.textContent = 'Τέλος Πράξης 2';
      actBrMsg.textContent   = 'Διάλειμμα. Πάμε Φουαγιέ (Πράξη 3);';
      btnAct2.textContent    = 'Έναρξη Πράξης 3';
      btnAct2.onclick = () => {
        actBreak.style.display='none';
        document.dispatchEvent(new Event('act3-start'));
      };
      actBreak.style.display='block';
    }
  }

  // Events (same timing as Act 1)
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
  events.forEach(e=>e.fired=false);

  function runAct2(){
    // close curtain quickly to visually end Act 1 before starting Act 2
    try{
      const curtainUpper = document.querySelector('.curtain-upper');
      const stageEl = document.getElementById('stage');
      if(curtainUpper && stageEl){ curtainUpper.classList.add('slow-close'); stageEl.classList.remove('open'); }
    }catch{}

    setSignboardAct2();
    ensureSpringVisible();
    if(stage) stage.classList.add('open');
    if(markerEl) markerEl.style.opacity = '1';
    if(lawsPane){ 
      Object.assign(lawsPane.style, { display:'block', overflow:'visible', maxHeight:'none', position:'relative', left:'-18px' });
      lawsTitle.textContent = 'Νόμοι Πράξης 2'; 
    }
    baselineLawsH = lawsPane ? lawsPane.getBoundingClientRect().height : null;

    const Tsec = CLOCK.getT();
    const startMs = CLOCK.nowMs();

    const step = ()=>{
      const elapsed = (CLOCK.nowMs() - startMs) / 1000.0;
      for(const e of events){
        if(!e.fired && elapsed >= e.atMul * Tsec){
          e.fired = true; try{ e.fn(); }catch{}
        }
      }
      if(events.some(ev=>!ev.fired)) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  document.addEventListener('act2-start', runAct2);
})();
