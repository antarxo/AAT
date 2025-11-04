// act2.js — Πρ.2: ίδιο tempo με Πρ.1 (T, firstThoughtMul, timelineScale, slowFactor), χωρίς ρητή διάρκεια στα bubbles
// - Δεν βασίζεται σε playbackTime/obsStarted (δικό του ρολόι από την έναρξη της Πρ.2)
// - Laws χωρίς scroll, charts κατεβαίνουν και σβήνουν όταν φύγουν κάτω
// - Στο τέλος: κλείνει αυλαία και βγαίνει centered πάνελ "Διάλειμμα — Φουαγιέ"

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

  // hooks από Act 1
  const showThoughtForViewer = window.showThoughtForViewer;
  const addLawOriginal       = window.addLaw;

  // ---------- Act1 sliders/hooks ----------
  const DEFAULT_FIRST_MUL = 1.1;
  const getT             = () => (typeof window.T === 'number' ? window.T : 6.0);
  const getFirstMul      = () => (typeof window.firstThoughtMul === 'number' ? window.firstThoughtMul : DEFAULT_FIRST_MUL);
  const getTimelineScale = () => (typeof window.timelineScale === 'number' ? window.timelineScale : 1);
  const getSlowFactor    = () => (typeof window.slowFactor === 'number' ? window.slowFactor : 1);

  // atT (πολλαπλάσιο T) -> seconds με ΖΩΝΤΑΝΗ ανάγνωση sliders (κάθε frame)
  const atMulToSeconds = (atT) => {
    const shiftMul = (getFirstMul() - DEFAULT_FIRST_MUL);
    const baseMul  = atT + shiftMul;
    return baseMul * getT() * getTimelineScale() * getSlowFactor();
  };

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

  // Hook για addLaw ώστε να κατεβαίνουν τα charts κάθε φορά
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
    // Fallback (αν λείπει transitions.js)
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

  // ---------- Ασφαλές fallback bubble αν λείπει showThoughtForViewer ----------
  function fallbackBubble(text){
    const b = document.createElement('div');
    b.textContent = text;
    Object.assign(b.style,{
      position:'fixed', left:'50%', top:'18%', transform:'translateX(-50%)',
      background:'rgba(0,0,0,.7)', color:'#fff', padding:'8px 12px', borderRadius:'12px',
      border:'1px solid rgba(255,255,255,.25)', zIndex:'4000', font:'14px/1.4 system-ui,sans-serif'
    });
    document.body.appendChild(b);
    setTimeout(()=>{ b.style.opacity='0'; b.style.transition='opacity .35s'; }, Math.max(800, (window.bubbleDurationSec||2)*1000));
    setTimeout(()=>{ b.remove(); }, Math.max(1200, (window.bubbleDurationSec||2)*1000 + 400));
  }

  // ---------- Σενάριο Πρ.2 (atT = πολλαπλάσιο T, ΧΩΡΙΣ ρητή διάρκεια bubble) ----------
  const script = [
    { atT:0.05, fn:()=> (showThoughtForViewer ? showThoughtForViewer(0, 'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!', undefined, 125, -10) : fallbackBubble('ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!')) },
    { atT:0.35, fn:()=> (showThoughtForViewer ? showThoughtForViewer(2, 'αυτόν ακριβώς τον m₁D₁ τον έχω ξαναδεί σε άλλη παράσταση αλλά με άλλον παραγωγό', undefined, 130, 0) : fallbackBubble('αυτόν ακριβώς τον m₁D₁ τον έχω ξαναδεί σε άλλη παράσταση αλλά με άλλον παραγωγό')) },
    { atT:0.55, fn:()=> (showThoughtForViewer ? showThoughtForViewer(3, '…ναι και εκεί πάλι με την ίδια περίοδο κινήθηκε αλλά με μεγαλύτερο πλάτος A′', undefined, 135, 10) : fallbackBubble('…ναι και εκεί πάλι με την ίδια περίοδο κινήθηκε αλλά με μεγαλύτερο πλάτος A′')) },
    { atT:0.80, fn:()=> (showThoughtForViewer ? showThoughtForViewer(1, 'Πρωταγωνιστής επομένως είναι ο κινούμενος και τα εργαλεία του μαζί!', undefined, 125, -20) : fallbackBubble('Πρωταγωνιστής επομένως είναι ο κινούμενος και τα εργαλεία του μαζί!')) },
    { atT:1.05, fn:()=> (showThoughtForViewer ? showThoughtForViewer(4, 'Τώρα καταλαβαίνω γιατί τον λένε m₁, D₁…', undefined, 125, 20) : fallbackBubble('Τώρα καταλαβαίνω γιατί τον λένε m₁, D₁…')) },
    { atT:1.25, fn:()=> (showThoughtForViewer ? showThoughtForViewer(0, '…το m₁ είναι η μάζα του, στο D₁ αναφέρεται το «ελαστικό» αίτιο-δύναμη', undefined, 131, -30) : fallbackBubble('…το m₁ είναι η μάζα του, στο D₁ αναφέρεται το «ελαστικό» αίτιο-δύναμη')) },
    { atT:1.45, fn:()=> (showThoughtForViewer ? showThoughtForViewer(2, '…m₁ και D₁ πάνε πακέτο!', undefined, 125, 0) : fallbackBubble('…m₁ και D₁ πάνε πακέτο!')) },
    { atT:1.65, fn:()=> (showThoughtForViewer ? showThoughtForViewer(3, '…κάθε ταλαντωτής χαρακτηρίζεται από τη μάζα του και το ελαστικό αίτιο που ρυθμίζει την ταλάντωση', undefined, 133, 10) : fallbackBubble('…κάθε ταλαντωτής χαρακτηρίζεται από τη μάζα του και το ελαστικό αίτιο που ρυθμίζει την ταλάντωση')) },
    { atT:1.90, fn:()=> (showThoughtForViewer ? showThoughtForViewer(1, '…γι’ αυτό σαν αριθμό μητρώου έχει τα mD!', undefined, 125, -10) : fallbackBubble('…γι’ αυτό σαν αριθμό μητρώου έχει τα mD!')) },
    { atT:2.15, fn:()=> window.addLaw?.('ΣF = m·a (γενικά)') },
    { atT:2.35, fn:()=> window.addLaw?.('ΣF(t) = −mω²A·ημ(ωt + φ₀)') },
    { atT:2.60, fn:()=> window.addLaw?.('ΣF(t) = −mω²x(t)') },
    { atT:2.85, fn:()=> (showThoughtForViewer ? showThoughtForViewer(4, 'Η ΣF=−mω²x περιέχει τον «σωματότυπο» (m) και την «εμμονή» (ω)', undefined, 125, 18) : fallbackBubble('Η ΣF=−mω²x περιέχει τον «σωματότυπο» (m) και την «εμμονή» (ω)')) },
    { atT:3.10, fn:()=> (showThoughtForViewer ? showThoughtForViewer(0, 'Να κάνουμε τις δύο σταθερές μία: D = mω²', undefined, 125, -18) : fallbackBubble('Να κάνουμε τις δύο σταθερές μία: D = mω²')) },
    { atT:3.30, fn:()=> (showThoughtForViewer ? showThoughtForViewer(2, '…χμμμ, γι’ αυτό τον λένε και (m, D)!', undefined, 125, 0) : fallbackBubble('…χμμμ, γι’ αυτό τον λένε και (m, D)!')) },
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
    // ΜΗΝ ξανακλείνεις αυλαία στην έναρξη — ανοίγουμε σκηνή για Πρ.2
    try{ if(stage) stage.classList.add('open'); }catch{}

    setSignboardAct2();
    ensureSpringVisible();
    if(markerEl) markerEl.style.opacity = '1';
    if(lawsPane){
      Object.assign(lawsPane.style, { display:'block', overflow:'visible', maxHeight:'none', position:'relative', left:'-18px' });
      if(lawsTitle) lawsTitle.textContent = 'Νόμοι Πράξης 2';
    }
    baselineLawsH = lawsPane ? lawsPane.getBoundingClientRect().height : null;

    const t0 = performance.now(); // δικό μας ρολόι από εδώ και πέρα

    const step = () => {
      const elapsedSec = (performance.now() - t0) / 1000.0;

      for(const e of script){
        if(!e.fired && elapsedSec >= atMulToSeconds(e.atT)){
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
