// act2.js — ONLY left (central) diagrams slide; right side stays put.
(() => {
  const stage        = document.getElementById('stage');
  const curtainUpper = document.querySelector('.curtain-upper');
  const springEl     = document.getElementById('spring');
  const markerEl     = document.getElementById('marker');
  const lawsPane     = document.getElementById('laws');
  const lawsTitle    = document.getElementById('lawsTitle');
  const xtChart      = document.getElementById('xtChart');  // κεντρικό/αριστερό διάγραμμα
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

  // ONLY left-side (central) diagram slides down as laws append
  function slideLeftAfterLaw(){
    if(!xtChart) return;
    const lc = (window.lawCount||0);
    const stepPx = 56;
    const shift  = Math.max(0, lc * stepPx);
    xtChart.style.transition = xtChart.style.transition || 'transform .6s ease, opacity .6s ease';
    xtChart.style.transform  = `translateX(-50%) translateY(${shift}px)`; // keep center align if originally translateX(-50%)
    const rect = xtChart.getBoundingClientRect();
    const vh   = window.innerHeight || document.documentElement.clientHeight;
    const off  = (rect.top + rect.height + 24) > vh;
    if(off){
      xtChart.style.opacity = '0';
      setTimeout(()=>{ xtChart.style.display='none'; }, 620);
    }
  }

  // Patch addLaw for Act 2
  window.addLaw = function(txt){
    try { addLawOriginal(txt); } finally { slideLeftAfterLaw(); }
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
    if(lawsPane){ lawsPane.style.display='block'; lawsTitle.textContent = 'Νόμοι Πράξης 2'; }

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
