// act2.js — FULL SYNC με Πράξη 1 (T, firstThoughtMul, timelineScale, gate !isBubbleActive)
// Ρολόι: Act1 tObs αν υπάρχει, αλλιώς τοπικό. Διάρκεια bubble: bubbleDurationSec.
// Laws: χωρίς scroll + #lawCharts κατεβαίνουν και εξαφανίζονται κάτω. Τέλος: κλείσιμο αυλαίας → Φουαγιέ.

(() => {
  const DEFAULT_FIRST_MUL = 1.1;

  // ---- Gear hooks (όπως Act 1) ----
  const getT             = () => (typeof window.T === 'number' ? window.T : 6.0);
  const getFirstMul      = () => (typeof window.firstThoughtMul === 'number' ? window.firstThoughtMul : DEFAULT_FIRST_MUL);
  const getTimelineScale = () => (typeof window.timelineScale === 'number' ? window.timelineScale : 1);
  const getBubbleDur     = () => (typeof window.bubbleDurationSec === 'number' ? window.bubbleDurationSec : 2.0);

  // Act1 observer-time (αν υπάρχει), αλλιώς local
  const hasObs = () => (typeof window.obsStarted === 'boolean' && window.obsStarted &&
                        typeof window.playbackTime === 'number' &&
                        typeof window.obsStartPlaybackOffset === 'number');

  const tObsNow = () => (window.playbackTime - window.obsStartPlaybackOffset);

  // ίδια φόρμουλα χρονισμού με Act 1
  const atT_to_sec = (atT) => ((atT + (getFirstMul() - DEFAULT_FIRST_MUL)) * getT() * getTimelineScale());

  // ---- refs ----
  const stage        = document.getElementById('stage');
  const curtainUpper = document.querySelector('.curtain-upper');
  const springEl     = document.getElementById('spring');
  const markerEl     = document.getElementById('marker');
  const signboard    = document.querySelector('.signboard');
  const lawsPane     = document.getElementById('laws');
  const lawsTitle    = document.getElementById('lawsTitle');
  const lawCharts    = document.getElementById('lawCharts');

  const showThought  = window.showThoughtForViewer;
  const addLawOrig   = window.addLaw;

  // ---- Laws: χωρίς scroll + charts slide/hide ----
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
    window.addLaw = function(txt){ try{ addLawOrig(txt); } finally{ slideChartsByLawsHeight(); } };
  }

  // ---- Script Πρ.2 (atT = πολλαπλάσια T) ----
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
  S.forEach(e => e.fired = false);

  function endAct2(){
    try{ if(markerEl){ markerEl.style.opacity='0'; markerEl.style.zIndex='0'; markerEl.style.display='none'; } }catch{}
    try{ curtainUpper?.classList.add('slow-close'); stage?.classList.remove('open'); }catch{}
    setTimeout(()=>{
      if (window.showActTransition) {
        window.showActTransition({
          title:'Τέλος Πράξης 2',
          msg:'Διάλειμμα — Φουαγιέ',
          buttonText:'Είσοδος στο Φουαγιέ',
          onClick: () => document.dispatchEvent(new Event('act3-start'))
        });
      }
    }, 1200);
  }

  function setSignboardAct2(){
    try{
      const h1 = signboard?.querySelector('h1');
      const lA = document.getElementById('sbLineA');
      const lB = document.getElementById('sbLineB');
      const lC = document.getElementById('sbLineC');
      if(h1) h1.textContent = 'Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!';
      if(typeof window.m==='number' && typeof window.D==='number' && typeof window.E_mech==='number'){
        if(lA) lA.textContent = `m₁ = ${window.m.toFixed(2)} kg , D₁ = ${window.D.toFixed(2)} N/m`;
        if(lB) lB.textContent = `Eμηχ = ${window.E_mech.toFixed(2)} J`;
      }
      if(lC) lC.textContent = '—';
    }catch{}
  }

  function runAct2(){
    // σκηνή/ελατήριο/νόμοι
    try{ stage?.classList.add('open'); }catch{}
    try{ if(springEl) springEl.style.display='block'; }catch{}
    setSignboardAct2();
    if(lawsPane){
      Object.assign(lawsPane.style,{ display:'block', overflow:'visible', maxHeight:'none', position:'relative', left:'-18px' });
      if(lawsTitle) lawsTitle.textContent = 'Νόμοι Πράξης 2';
      baselineLawsH = lawsPane.getBoundingClientRect().height;
    }

    // reference χρόνου
    const t0Local = performance.now();
    const t0Obs   = hasObs() ? tObsNow() : 0;

    let i = 0;
    function loop(){
      const rel = hasObs()
        ? (tObsNow() - t0Obs)
        : ((performance.now() - t0Local)/1000);

      // ίδιο gate με Act 1
      const busy = (typeof window.isBubbleActive === 'boolean') ? window.isBubbleActive : false;

      // catch-up για να μη χάνονται events αν αλλάξεις sliders on the fly
      while(!busy && i < S.length && rel >= atT_to_sec(S[i].atT)){
        try{ S[i].run(); }catch(e){ console.error('act2 run error', e); }
        i++;
      }
      if(i < S.length) requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  document.addEventListener('act2-start', runAct2);
})();
