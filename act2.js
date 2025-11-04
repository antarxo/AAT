// act2.js — FULL SYNC με Πράξη 1 (ίδιος ρυθμός, ίδια διάρκεια bubble, ίδια λογική gate)
// - Χρονοδότηση: rel = (playbackTime - obsStartPlaybackOffset) - t0Act2
// - eventAtSec = (atT + (firstThoughtMul-1.1)) * T * timelineScale
// - Gate: !isBubbleActive (όπως Act 1)
// - Διάρκεια bubbles: bubbleDurationSec (slider γραναζιού)
// - Laws χωρίς scroll, #lawCharts κατεβαίνουν & σβήνουν όταν φύγουν κάτω
// - Τέλος: reuse closeCurtainsSequence() και αλλάζω το actBreak σε “Διάλειμμα — Φουαγιέ”
(() => {
  const DEFAULT_FIRST_MUL = 1.1;

  // ---- hooks στα globals της Πρ.1 ----
  const getT             = () => (typeof window.T === 'number' ? window.T : 6.0);
  const getFirstMul      = () => (typeof window.firstThoughtMul === 'number' ? window.firstThoughtMul : DEFAULT_FIRST_MUL);
  const getTimelineScale = () => (typeof window.timelineScale === 'number' ? window.timelineScale : 1);
  const getObsStarted    = () => (typeof window.obsStarted === 'boolean' ? window.obsStarted : false);
  const getPlaybackTime  = () => (typeof window.playbackTime === 'number' ? window.playbackTime : 0);
  const getObsOffset     = () => (typeof window.obsStartPlaybackOffset === 'number' ? window.obsStartPlaybackOffset : 0);
  const getBubbleDur     = () => (typeof window.bubbleDurationSec === 'number' ? window.bubbleDurationSec : 2.0);

  const stage        = document.getElementById('stage');
  const springEl     = document.getElementById('spring');
  const markerEl     = document.getElementById('marker');
  const lawsPane     = document.getElementById('laws');
  const lawsTitle    = document.getElementById('lawsTitle');
  const lawCharts    = document.getElementById('lawCharts');
  const signboard    = document.querySelector('.signboard');

  const showThought  = window.showThoughtForViewer;
  const addLawOrig   = window.addLaw;

  // ---- ίδιο layout για Laws + slide κάτω τα charts ----
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
  window.addLaw = function(txt){ try{ addLawOrig(txt); } finally{ slideChartsByLawsHeight(); } };

  // ---- helpers ρυθμού ----
  function tObs(){ return getObsStarted() ? (getPlaybackTime() - getObsOffset()) : 0; }
  function atT_to_sec(atT){
    const shift = (getFirstMul() - DEFAULT_FIRST_MUL);
    return ( (atT ?? 0) + shift ) * getT() * getTimelineScale();
  }

  // ---- script Πρ.2 (atT = πολλαπλάσιο Τ, ΚΑΜΙΑ ρητή διάρκεια -> ισχύει bubbleDurationSec) ----
  const script = [
    { atT:0.05, run:()=> showThought?.(0, 'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!', getBubbleDur(), 125, -10) },
    { atT:0.35, run:()=> showThought?.(2, 'αυτόν ακριβώς τον m₁D₁ τον έχω ξαναδεί σε άλλη παράσταση αλλά με άλλον παραγωγό', getBubbleDur(), 130, 0) },
    { atT:0.55, run:()=> showThought?.(3, '…ναι και εκεί πάλι με την ίδια περίοδο κινήθηκε αλλά με μεγαλύτερο πλάτος A′', getBubbleDur(), 135, 10) },
    { atT:0.80, run:()=> showThought?.(1, 'Πρωταγωνιστής επομένως είναι ο κινούμενος και τα εργαλεία του μαζί!', getBubbleDur(), 125, -20) },
    { atT:1.05, run:()=> showThought?.(4, 'Τώρα καταλαβαίνω γιατί τον λένε m₁, D₁…', getBubbleDur(), 125, 20) },
    { atT:1.25, run:()=> showThought?.(0, '…το m₁ είναι η μάζα του, στο D₁ αναφέρεται το «ελαστικό» αίτιο-δύναμη', getBubbleDur(), 131, -30) },
    { atT:1.45, run:()=> showThought?.(2, '…m₁ και D₁ πάνε πακέτο!', getBubbleDur(), 125, 0) },
    { atT:1.65, run:()=> showThought?.(3, '…κάθε ταλαντωτής χαρακτηρίζεται από τη μάζα του και το ελαστικό αίτιο που ρυθμίζει την ταλάντωση', getBubbleDur(), 133, 10) },
    { atT:1.90, run:()=> showThought?.(1, '…γι’ αυτό σαν αριθμό μητρώου έχει τα mD!', getBubbleDur(), 125, -10) },
    { atT:2.15, run:()=> window.addLaw?.('ΣF = m·a (γενικά)') },
    { atT:2.35, run:()=> window.addLaw?.('ΣF(t) = −mω²A·ημ(ωt + φ₀)') },
    { atT:2.60, run:()=> window.addLaw?.('ΣF(t) = −mω²x(t)') },
    { atT:2.85, run:()=> showThought?.(4, 'Η ΣF=−mω²x περιέχει τον «σωματότυπο» (m) και την «εμμονή» (ω)', getBubbleDur(), 125, 18) },
    { atT:3.10, run:()=> showThought?.(0, 'Να κάνουμε τις δύο σταθερές μία: D = mω²', getBubbleDur(), 125, -18) },
    { atT:3.30, run:()=> showThought?.(2, '…χμμμ, γι’ αυτό τον λένε και (m, D)!', getBubbleDur(), 125, 0) },
    { atT:3.55, run:()=> window.addLaw?.('Θέτω D = mω²') },
    { atT:3.75, run:()=> window.addLaw?.('⇒ ΣF = −D·x') },
    { atT:4.20, run:()=> endAct2() }
  ];

  // ---- main runner: ίδιο gate με Act 1 (!isBubbleActive) + relative timing από t0Act2 ----
  function runAct2(){
    // άνοιγμα σκηνής, ελατήριο ορατό, τίτλος πράξης
    try{ stage?.classList.add('open'); }catch{}
    try{ if(springEl) springEl.style.display='block'; }catch{}
    try{
      const h1  = signboard?.querySelector('h1');
      const lA  = document.getElementById('sbLineA');
      const lB  = document.getElementById('sbLineB');
      const lC  = document.getElementById('sbLineC');
      if(h1) h1.textContent = 'Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!';
      if(typeof window.m==='number' && typeof window.D==='number' && typeof window.E_mech==='number'){
        if(lA) lA.textContent = `m₁ = ${window.m.toFixed(2)} kg , D₁ = ${window.D.toFixed(2)} N/m`;
        if(lB) lB.textContent = `Eμηχ = ${window.E_mech.toFixed(2)} J`;
      }
      if(lC) lC.textContent = '—';
    }catch{}

    if(lawsPane){
      Object.assign(lawsPane.style,{ display:'block', overflow:'visible', maxHeight:'none', position:'relative', left:'-18px' });
      if(lawsTitle) lawsTitle.textContent = 'Νόμοι Πράξης 2';
      baselineLawsH = lawsPane.getBoundingClientRect().height;
    }

    const t0Act2 = tObs(); // δικό μας “μηδέν” για τη 2η πράξη
    let i = 0;
    // προ-υπολογισμός thresholds σε sec αλλά με ΖΩΝΤΑΝΗ ανάγνωση sliders μέσω atT_to_sec στο loop
    const atTvals = script.map(s => s.atT);

    function loop(){
      // ίδιο tObs ρολόι με Πρ.1
      const rel = tObs() - t0Act2;

      // gate όπως Act 1
      const bubbleBusy = (typeof window.isBubbleActive === 'boolean') ? window.isBubbleActive : false;

      // fire ένα-ένα με ίδια σειρά (όπως Act 1 με nextThoughtIdx)
      if(!bubbleBusy && i < script.length){
        const fireAt = atT_to_sec(atTvals[i]); // ζωντανά: πιάνει τρέχον T/firstMul/timelineScale
        if(rel >= fireAt){
          try{ script[i].run(); }catch(e){ console.error('act2 run error', e); }
          i++;
        }
      }

      if(i < script.length) { requestAnimationFrame(loop); }
    }
    requestAnimationFrame(loop);
  }

  function endAct2(){
    // κλείσε αυλαία με την ίδια ρουτίνα της 1ης και μετέτρεψε το actBreak για φουαγιέ
    try{ if(markerEl){ markerEl.style.opacity='0'; markerEl.style.zIndex='0'; markerEl.style.display='none'; } }catch{}
    try{
      if(typeof window.closeCurtainsSequence === 'function'){
        window.closeCurtainsSequence();
        setTimeout(()=>{
          const t = document.getElementById('actBreakTitle');
          const m = document.getElementById('actBreakMsg');
          const b = document.getElementById('btnAct2');
          if(t) t.textContent = 'Διάλειμμα — Φουαγιέ';
          if(m) m.textContent = 'Προχωράμε στις αποδείξεις και στα συμπεράσματα.';
          if(b){
            b.textContent = 'Είσοδος στο Φουαγιέ';
            b.onclick = ()=>{ document.getElementById('actBreak').style.display='none'; document.dispatchEvent(new Event('act3-start')); };
          }
        }, 1550); // λίγο μετά το position/εμφάνιση του actBreak
      }
    }catch(e){ console.error(e); }
  }

  document.addEventListener('act2-start', runAct2);
})();
