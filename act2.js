// act2.js — Πράξη 2 πάνω στο ίδιο σκηνικό της Πράξης 1
(() => {
  // Χρησιμοποιούμε τις Πράξης 1 global: m, T, omega, D, E_mech, A_m
  const stage        = document.getElementById('stage');
  const curtainUpper = document.querySelector('.curtain-upper');
  const springEl     = document.getElementById('spring');
  const markerEl     = document.getElementById('marker');
  const lawsPane     = document.getElementById('laws');
  const lawsTitle    = document.getElementById('lawsTitle');
  const lawsList     = document.getElementById('lawsList');
  const bubbleEl     = document.getElementById('bubble0');
  const signboard    = document.querySelector('.signboard');

  // Helper από Πρ.1
  const showThoughtForViewer = window.showThoughtForViewer;
  const addLaw = window.addLaw;

  function setSignboardAct2(){
    if(!signboard) return;
    const h1  = signboard.querySelector('h1');
    const lA  = document.getElementById('sbLineA');
    const lB  = document.getElementById('sbLineB');
    const lC  = document.getElementById('sbLineC');
    if(h1) h1.textContent = 'Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!';
    if(lA) lA.textContent = `m₁ = ${m.toFixed(2)} kg , D₁ = ${D.toFixed(2)} N/m`;
    if(lB) lB.textContent = `Eμηχ = ${E_mech.toFixed(2)} J`;
    if(lC) lC.textContent = '—';
  }

  function ensureSpringVisible(){
    if(springEl) springEl.style.display = 'block';
  }

  // Τέλος πράξης 2 — ενιαία λογική με actBreak (χωρίς νέα DOM)
  function endAct2WithBreak(){
    const actBreak   = document.getElementById('actBreak');
    const actBrTitle = document.getElementById('actBreakTitle');
    const actBrMsg   = document.getElementById('actBreakMsg');
    const btnAct2    = document.getElementById('btnAct2'); // ξαναχρησιμοποιείται ως CTA για Πρ.3
    if(actBreak && actBrTitle && actBrMsg && btnAct2){
      actBrTitle.textContent = 'Τέλος Πράξης 2';
      actBrMsg.textContent   = 'Οι θεαποιοί μεταφέρονται στο Φουαγιέ. Προχωράμε στην Πράξη 3;';
      btnAct2.textContent    = 'Έναρξη Πράξης 3';
      btnAct2.onclick = () => {
        actBreak.style.display='none';
        document.dispatchEvent(new Event('act3-start'));
      };
      actBreak.style.display='block';
    }
  }

  // Χρονοπρογραμματιστής με μονάδα k·T
  function scheduleK(mul, fn){
    const t = Math.max(0, mul * T * 1000);
    setTimeout(fn, t);
  }

  function runAct2(){
    setSignboardAct2();
    ensureSpringVisible();
    if(stage) stage.classList.add('open');
    if(markerEl) markerEl.style.opacity = '1';
    if(lawsPane){ lawsPane.style.display='block'; lawsTitle.textContent = 'Νόμοι Πράξης 2'; }

    // Χρονοσειρά Πρ.2 (βασισμένη στο σενάριο που έδωσες)
    const Y0 = 125; // βασική ανύψωση για bubble
    scheduleK(0.05, ()=> showThoughtForViewer(0, 'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!', 2.2, Y0, -10));
    scheduleK(0.35, ()=> showThoughtForViewer(2, 'αυτόν ακριβώς τον m₁D₁ τον έχω ξαναδεί σε άλλη παράσταση αλλά με άλλον παραγωγό', 2.4, Y0+5, 0));
    scheduleK(0.55, ()=> showThoughtForViewer(3, '…ναι και εκεί πάλι με την ίδια περίοδο κινήθηκε αλλά με μεγαλύτερο πλάτος A′', 2.6, Y0+10, 10));
    scheduleK(0.80, ()=> showThoughtForViewer(1, 'Πρωταγωνιστής επομένως είναι ο κινούμενος και τα εργαλεία του μαζί!', 2.2, Y0, -20));
    scheduleK(1.05, ()=> showThoughtForViewer(4, 'Τώρα καταλαβαίνω γιατί τον λένε m₁, D₁…', 2.0, Y0, 20));
    scheduleK(1.25, ()=> showThoughtForViewer(0, '…το m₁ είναι η μάζα του, στο D₁ αναφέρεται το «ελαστικό» αίτιο-δύναμη', 2.4, Y0+6, -30));
    scheduleK(1.45, ()=> showThoughtForViewer(2, '…m₁ και D₁ πάνε πακέτο!', 2.0, Y0, 0));
    scheduleK(1.65, ()=> showThoughtForViewer(3, '…κάθε ταλαντωτής χαρακτηρίζεται από τη μάζα του και το ελαστικό αίτιο που ρυθμίζει την ταλάντωση', 2.6, Y0+8, 10));
    scheduleK(1.90, ()=> showThoughtForViewer(1, '…γι’ αυτό σαν αριθμό μητρώου έχει τα mD!', 2.2, Y0, -10));

    // Νόμοι στον πίνακα αριστερά (χωρίς extra γραφήματα)
    scheduleK(2.15, ()=> addLaw('ΣF = m·a (γενικά)'));
    scheduleK(2.35, ()=> addLaw('ΣF(t) = −mω²A·ημ(ωt + φ₀)'));
    scheduleK(2.60, ()=> addLaw('ΣF(t) = −mω²x(t)'));
    scheduleK(2.85, ()=> showThoughtForViewer(4, 'Η ΣF=−mω²x περιέχει τον «σωματότυπο» (m) και την «εμμονή» (ω)', 2.6, Y0, 18));
    scheduleK(3.10, ()=> showThoughtForViewer(0, 'Να κάνουμε τις δύο σταθερές μία: D = mω²', 2.2, Y0, -18));
    scheduleK(3.30, ()=> showThoughtForViewer(2, '…χμμμ, γι’ αυτό τον λένε και (m, D)!', 2.0, Y0, 0));
    scheduleK(3.55, ()=> addLaw('Θέτω D = mω²'));
    scheduleK(3.75, ()=> addLaw('⇒ ΣF = −D·x'));
    // Αυλαία / break προς Πρ.3
    scheduleK(4.20, ()=> {
      if(curtainUpper && stage){
        curtainUpper.classList.add('slow-close');
        stage.classList.remove('open');
        setTimeout(()=>{ curtainUpper.classList.remove('slow-close'); endAct2WithBreak(); }, 1500);
      }else{
        endAct2WithBreak();
      }
    });
  }

  document.addEventListener('act2-start', runAct2);
})();
