// act2.js — Πράξη 2 σε strict sync με Πράξη 1
// Χρονισμός: (atT + (firstThoughtMul - 1.1)) * T * timelineScale
// Ρολόι: tObs = playbackTime - obsStartPlaybackOffset (όπως Act 1)
// Gate: !isBubbleActive (όπως Act 1)
// Διάρκεια bubble: bubbleDurationSec (slider γραναζιού)
// Laws: χωρίς scroll, ΑΡΙΣΤΕΡΑ διαγράμματα κατεβαίνουν & σβήνουν όταν φύγουν κάτω
// Τέλος: κλείσιμο αυλαίας → “Διάλειμμα — Φουαγιέ”

(() => {
  if (window.__ACT2_INSTALLED__) return;
  window.__ACT2_INSTALLED__ = true;

  const DEFAULT_FIRST_MUL = 1.1;

  // ===== hooks Πράξης 1 =====
  const getT             = () => (typeof window.T === 'number' ? window.T : 6);
  const getFirstMul      = () => (typeof window.firstThoughtMul === 'number' ? window.firstThoughtMul : DEFAULT_FIRST_MUL);
  const getTimelineScale = () => (typeof window.timelineScale === 'number' ? window.timelineScale : 1);
  const getBubbleDur     = () => (typeof window.bubbleDurationSec === 'number' ? window.bubbleDurationSec : 2);

  const tObs = () => (window.obsStarted ? (window.playbackTime - window.obsStartPlaybackOffset) : 0);
  const atT_to_sec = (atT) => ( (atT + (getFirstMul() - DEFAULT_FIRST_MUL)) * getT() * getTimelineScale() );

  // ===== DOM refs =====
  const stage      = document.getElementById('stage');
  const curtainUp  = document.querySelector('.curtain-upper');
  const springEl   = document.getElementById('spring');
  const markerEl   = document.getElementById('marker');
  const signboard  = document.querySelector('.signboard');
  const lawsPane   = document.getElementById('laws');
  const lawsTitle  = document.getElementById('lawsTitle');

  // Αριστερά διαγράμματα (πιάσε ό,τι υπάρχει)
  const leftCharts = document.querySelector(
    '#leftCharts, #chartsLeft, #lawChartsLeft, .left-charts, .charts-left, #lawCharts'
  );

  const showThought = window.showThoughtForViewer;
  const addLawOrig  = window.addLaw;

  // ===== Laws χωρίς scroll + slide/hide αριστερών διαγραμμάτων =====
  let baselineLawsH = null;
  function slideLeftChartsByLawsHeight(){
    if(!leftCharts || !lawsPane) return;
    if(baselineLawsH == null) baselineLawsH = lawsPane.getBoundingClientRect().height;

    Object.assign(lawsPane.style, { overflow:'visible', maxHeight:'none', position:'relative', left:'-18px' });

    const curH  = lawsPane.getBoundingClientRect().height;
    const delta = Math.max(0, Math.round(curH - baselineLawsH));

    leftCharts.style.willChange = 'transform, opacity';
    leftCharts.style.transition = 'transform .5s ease, opacity .35s ease';
    leftCharts.style.transform  = `translateY(${delta}px)`;

    const rect = leftCharts.getBoundingClientRect();
    const vh   = window.innerHeight || document.documentElement.clientHeight;
    const out  = rect.top >= vh - 2;
    if(out){
      leftCharts.style.opacity = '0';
      clearTimeout(leftCharts._hideTimer);
      leftCharts._hideTimer = setTimeout(()=>{ leftCharts.style.display='none'; }, 380);
    } else {
      clearTimeout(leftCharts._hideTimer);
      if(leftCharts.style.display==='none') leftCharts.style.display='';
      leftCharts.style.opacity = '1';
    }
  }

  if (!window.__ACT2_ADDLAW_HOOKED__) {
    window.__ACT2_ADDLAW_HOOKED__ = true;
    window.addLaw = function(txt){ try{ addLawOrig(txt); } finally{ slideLeftChartsByLawsHeight(); } };
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

  // ===== Τέλος Πρ.2 → Διάλειμμα—Φουαγιέ =====
  function endAct2(){
    try{ if(markerEl){ markerEl.style.opacity='0'; markerEl.style.zIndex='0'; markerEl.style.display='none'; } }catch{}
    try{ curtainUp?.classList.add('slow-close'); stage?.classList.remove('open'); }catch{}
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

  // ===== Runner =====
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

  document.addEventListener('act2-start', () => {
    try{ stage?.classList.add('open'); }catch{}
    try{ if(springEl) springEl.style.display='block'; }catch{}
    setSignboardAct2();

    if(lawsPane){
      Object.assign(lawsPane.style,{ display:'block', overflow:'visible', maxHeight:'none', position:'relative', left:'-18px' });
      if(lawsTitle) lawsTitle.textContent = 'Νόμοι Πράξης 2';
      baselineLawsH = lawsPane.getBoundingClientRect().height;
    }

    const thresholds = S.map(s => atT_to_sec(s.atT));
    const t0 = tObs(); // ίδια αναφορά με Act 1

    let i = 0;
    function loop(){
      const rel = tObs() - t0;
      const busy = (typeof window.isBubbleActive === 'boolean') ? window.isBubbleActive : false;

      if (!busy && i < S.length && rel >= thresholds[i]) {
        try{ S[i].run(); }catch(e){ console.error('act2 run error', e); }
        i++;
      }
      if (i < S.length) requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });
})();
