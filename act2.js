// act2.js — Laws list grows (no scrollbar); right-side lawCharts descend accordingly and fade out off-screen.
(() => {
  const stage        = document.getElementById('stage');
  const curtainUpper = document.querySelector('.curtain-upper');
  const springEl     = document.getElementById('spring');
  const markerEl     = document.getElementById('marker');
  const lawsPane     = document.getElementById('laws');
  const lawsTitle    = document.getElementById('lawsTitle');
  const lawCharts    = document.getElementById('lawCharts'); // δεξί/πλάι διάγραμμα Νόμων
  const signboard    = document.querySelector('.signboard');

  const showThoughtForViewer = window.showThoughtForViewer;
  const addLawOriginal       = window.addLaw;

  // Sync clock with Act 1
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

  // Capture baseline Laws height at Act2 start; translate right-side charts by delta height
  let baselineLawsH = null;
  function slideChartsByLawsHeight(){
    if(!lawCharts || !lawsPane) return;
    if(baselineLawsH == null) baselineLawsH = lawsPane.getBoundingClientRect().height;
    // ensure laws have no internal scrollbar and can grow
    lawsPane.style.overflow = 'visible';
    lawsPane.style.maxHeight = 'none';
    const curH = lawsPane.getBoundingClientRect().height;
    const delta = Math.max(0, curH - baselineLawsH);
    lawCharts.style.transition = lawCharts.style.transition || 'transform .6s ease, opacity .6s ease';
    lawCharts.style.transform  = `translateY(${Math.round(delta)}px)`;
    // fade out when pushed below viewport
    const rect = lawCharts.getBoundingClientRect();
    const vh   = window.innerHeight || document.documentElement.clientHeight;
    const off  = (rect.top + rect.height + 16) > vh;
    if(off){
      lawCharts.style.opacity = '0';
      setTimeout(()=>{ lawCharts.style.display='none'; }, 620);
    } else {
      lawCharts.style.opacity = '1';
      if(lawCharts.style.display==='none') lawCharts.style.display='';
    }
  }

  // Patch addLaw: append law as usual, then update charts position
  window.addLaw = function(txt){
    try { addLawOriginal(txt); } finally { slideChartsByLawsHeight(); }
  };

  function endAct2WithBreak(){
    const actBreak   = document.getElementById('actBreak');
    const actBrTitle = document.getElementById('actBreakTitle');
    const actBrMsg   = document.getElementById('actBreakMsg');
    const btnAct2    = document.getElementById('btnAct2');
    if(actBreak && actBrTitle && actBrMsg && btnAct2){
      actBrTitle.textContent = 'Τέλος Πράξης 2';
      actBrMsg.textContent   = 'Διάλειμμα με κλειστές κουρτίνες. Πάμε Φουαγιέ (Πράξη 3);';
      btnAct2.textContent    = 'Έναρξη Πράξης 3';
      btnAct2.onclick = () => {
        actBreak.style.display='none';
        document.dispatchEvent(new Event('act3-start'));
      };
      actBreak.style.display='block';
    }
  }

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
    { atMul:4.20, fn:()=> {
      if(curtainUpper && stage){
        curtainUpper.classList.add('slow-close');
        stage.classList.remove('open');
        setTimeout(()=>{ curtainUpper.classList.remove('slow-close'); endAct2WithBreak(); }, 1500);
      } else { endAct2WithBreak(); }
    }}
  ];
  events.forEach(e=>e.fired=false);

  function runAct2(){
    setSignboardAct2();
    ensureSpringVisible();
    if(stage) stage.classList.add('open');
    if(markerEl) markerEl.style.opacity = '1';
    if(lawsPane){ 
      lawsPane.style.display='block'; 
      lawsPane.style.overflow='visible'; 
      lawsPane.style.maxHeight='none';
      lawsTitle.textContent = 'Νόμοι Πράξης 2'; 
    }
    baselineLawsH = lawsPane ? lawsPane.getBoundingClientRect().height : null;

    const Tsec = CLOCK.getT();
    const startMs = CLOCK.nowMs();

    function raf(){
      const now = CLOCK.nowMs();
      const elapsed = (now - startMs) / 1000.0;
      for(const e of events){
        if(!e.fired && elapsed >= e.atMul * Tsec){
          e.fired = true;
          try{ e.fn(); }catch{}
        }
      }
      if(events.some(ev=>!ev.fired)) requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  document.addEventListener('act2-start', runAct2);
})();
