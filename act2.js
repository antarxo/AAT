// act2.js — Πράξη 2 με ακριβώς την ίδια λογική χρονισμού όπως η Πράξη 1
(function(){
  const stage    = document.getElementById('stage');
  const springEl = document.getElementById('spring');
  const actor    = document.getElementById('actor');
  const clockEl  = document.getElementById('clock');

  const sbH1 = document.querySelector('.signboard h1');
  const sbA  = document.getElementById('sbLineA');
  const sbB  = document.getElementById('sbLineB');
  const sbC  = document.getElementById('sbLineC');
  const sbD  = document.getElementById('sbLineD');

  // --- helper: t_obs όπως εμφανίζεται στο ρολόι της 1ης ---
  function getObsTime(){
    if(!clockEl) return 0;
    const m = /([-+]?\d+(?:\.\d+)?)\s*s/.exec(clockEl.textContent||'');
    return m ? parseFloat(m[1]) : 0;
  }
  // --- mapping atT -> sec (ίδιο με 1η) ---
  function eventAtSec(atT){
    const Tval = (window.T || 6.0);
    const DEF  = (window.DEFAULT_FIRST_MUL || 1.1);
    const first= (window.firstThoughtMul || DEF);
    const scale= (window.timelineScale || 1.0);
    const shift= (first - DEF);
    return ((atT||0) + shift) * Tval * scale;
  }

  // --- ghost μπροστά από m1D1 ---
  let ghostEl=null, ghostRAF=null;
  function ensureGhost(){
    if(ghostEl) return;
    ghostEl = document.createElement('img');
    ghostEl.id = 'ghost';
    ghostEl.src = 'skater.png';
    ghostEl.alt = 'ghost';
    ghostEl.style.position='absolute';
    ghostEl.style.bottom = getComputedStyle(actor).bottom || 'calc(32vh + 133px)';
    ghostEl.style.left   = '50%';
    ghostEl.style.width  = '144px';
    ghostEl.style.height = '96px';
    ghostEl.style.transform='translate(-50%,0)';
    ghostEl.style.zIndex='200';  // > actor(110)
    ghostEl.style.opacity='0.65';
    ghostEl.style.display='none';
    stage.appendChild(ghostEl);
  }
  function ghostShow(){ ensureGhost(); ghostEl.style.display='block'; if(!ghostRAF) ghostRAF=requestAnimationFrame(loopGhost); }
  function ghostHide(){ if(ghostEl) ghostEl.style.display='none'; if(ghostRAF){ cancelAnimationFrame(ghostRAF); ghostRAF=null; } }
  function loopGhost(){
    const tObs   = getObsTime();
    const Aghost = (window.A_m || 3.0)*1.35;
    const omega  = (window.omega || 2*Math.PI/(window.T||6));
    const cx     = stage.clientWidth/2;
    const hookX  = cx + (Aghost*(window.pxPerMeter||50))*Math.sin(omega*tObs);
    const w = ghostEl.getBoundingClientRect().width || 144;
    ghostEl.style.left = (hookX - w/2) + 'px';
    ghostRAF = requestAnimationFrame(loopGhost);
  }

  // --- γεγονότα Πράξης 2 (atT όπως δώσατε) ---
  const lines = [
    {kind:'action', atT:0.10, fn:()=>{ stage.classList.add('open'); springEl.style.display='block'; }},

    {kind:'action', atT:0.40, fn:()=>{
      const m = (window.m || 70);
      const omega = (window.omega || 2*Math.PI/(window.T||6));
      const D = (window.D || Math.round(m*omega*omega));
      const A = (window.A_m || 3.0);
      const E = 0.5*D*A*A;
      if (sbH1) sbH1.textContent = 'Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!';
      if (sbA)  sbA.textContent  = `m₁ = ${m.toFixed?m.toFixed(0):m} kg , D₁ = ${D.toFixed?D.toFixed(0):D} N/m`;
      if (sbB)  sbB.textContent  = `Εμηχ = ${E.toFixed?E.toFixed(2):E} J`;
      if (sbC)  sbC.textContent  = '—';
      if (sbD)  sbD.textContent  = '—';
    }},

    {kind:'bubble', atT:1.00, viewer:1, text:'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!'},
    {kind:'bubble', atT:1.80, viewer:3, text:'αυτόν ακριβώς τον m₁D₁ σίγουρα τον έχω ξαναδεί με το ίδιο μηχανισμό-ελατήριο σε άλλη παράσταση, αλλά με άλλον παραγωγό!', ghost:'start'},
    {kind:'bubble', atT:2.60, viewer:4, text:'…ναι, και εκεί πάλι με την ίδια περίοδο εμμονικά κινήθηκε, αλλά με μεγαλύτερο πλάτος A!'},
    {kind:'bubble', atT:3.40, viewer:2, text:'Χμμμ… Πρωταγωνιστής μάλλον είναι ο κινούμενος ηθοποιός και τα εργαλεία του μαζί!', ghost:'stop'},

    {kind:'bubble', atT:4.30, viewer:0, text:'Τώρα καταλαβαίνω μάλλον γιατί δεν τον λένε m₁ αλλά m₁,D₁…'},
    {kind:'bubble', atT:5.10, viewer:1, text:'… το m₁ είναι η μάζα του ηθοποιού, αλλά ως ΤΑΛΑΝΤΩΤΗΣ νοείται η σύμπραξη m₁ και «ελαστικού» αιτίου-δύναμης, στο οποίο αναφέρεται το D₁!'},
    {kind:'bubble', atT:5.90, viewer:3, text:'…m₁ και D₁ πάνε πακέτο — μαζί είναι ο ΤΑΛΑΝΤΩΤΗΣ, ο πρωταγωνιστής!'},
    {kind:'bubble', atT:6.70, viewer:4, text:'…δηλαδή κάθε ταλαντωτής χαρακτηρίζεται (1) από τη μάζα m και (2) από το ελαστικό αίτιο-δύναμη που του ρυθμίζει χρονικά (T) την ταλάντωση!'},
    {kind:'bubble', atT:7.50, viewer:2, text:'… ναι, εύλογο γιατί σαν χαρακτηριστικό όνομα έχει mD — όχι σκέτο m!'},

    {kind:'bubble', atT:8.30, viewer:0, text:'Ας δούμε πώς γράφεται ο 2ος Νόμος του Νεύτωνα για τον ταλαντωτή!'},

    {kind:'bubble', atT:9.10, viewer:1, text:'ΣF = m·a γενικά, και με a(t)=−ω²A·ημ(ωt+φ₀) ⇒ ΣF = −mω²A·ημ(ωt+φ₀) (5)!'},
    {kind:'law',    atT:9.30, formula:'ΣF(t) = −m ω² A·sin(ωt + φ₀)'},
    {kind:'bubble', atT:10.10, viewer:3, text:'… και με βάση x(t)=A·ημ(ωt+φ₀) ⇒ ΣF = −mω²x (6)!'},
    {kind:'law',    atT:10.30, formula:'ΣF(x) = −m ω² x'},

    {kind:'bubble', atT:11.10, viewer:4, text:'Όμως η (6) περιέχει δύο «σταθερές» του ηθοποιού: τον «σωματότυπο» m και την «εμμονή» ω!'},
    {kind:'bubble', atT:11.90, viewer:2, text:'Να κάνουμε τις δύο μία: D = m·ω² (6\') ; Βγάζει νόημα;'},
    {kind:'bubble', atT:12.70, viewer:0, text:'Αν την αποδώσουμε στο ελαστικό αίτιο ως σταθερά D, τότε με σταθερά m και D, παραμένει σταθερή η ω του ηθοποιού!'},
    {kind:'bubble', atT:13.50, viewer:1, text:'… δικαιολογημένα λοιπόν ο ταλαντωτής (ηθοποιός + ελαστικό αίτιο) λέγεται m,D!'},
    {kind:'bubble', atT:14.30, viewer:3, text:'…και η (6) γίνεται ΣF = −D x (7)!'},
    {kind:'law',    atT:14.50, formula:'ΣF(x) = −D x'},

    {kind:'action', atT:15.30, fn:()=>{
      ghostHide();
      if (typeof window.closeCurtainsSequence === 'function') window.closeCurtainsSequence();
      // κείμενα φουαγιέ
      const ttl = document.getElementById('actBreakTitle');
      const msg = document.getElementById('actBreakMsg');
      const btn = document.getElementById('btnAct2');
      if (ttl) ttl.textContent = 'Διάλειμμα — Φουαγιέ';
      if (msg) msg.textContent = 'Προχωράμε στις απόψεις–αποδείξεις στο φουαγιέ.';
      if (btn) btn.textContent = 'Είσοδος στο Φουαγιέ';
    }}
  ];

  // --- αναπαραγωγή: ΜΟΝΟ ΕΝΑ event κάθε φορά • ΟΧΙ while όταν bubble είναι ενεργό ---
  let started=false, idx=0, raf=null;

  function canFire(ev){
    // Αν υπάρχει ενεργό bubble, περίμενε (όπως στην 1η πράξη)
    if (window.isBubbleActive) return false;
    const tObs = getObsTime();
    return (tObs >= eventAtSec(ev.atT));
  }

  function handle(ev){
    if (ev.kind==='action'){ try{ ev.fn && ev.fn(); }catch(e){ console.error(e); } }
    else if (ev.kind==='bubble'){
      if (ev.ghost==='start') ghostShow();
      if (ev.ghost==='stop')  ghostHide();
      if (typeof window.showThoughtForViewer === 'function'){
        // ΧΩΡΙΣ custom dur → χρησιμοποιεί το slider/bubbleDurationSec όπως στην 1η
        window.showThoughtForViewer(ev.viewer, ev.text, undefined, ev.lift||130, ev.xShift||0);
      }
    }
    else if (ev.kind==='law'){
      if (typeof window.addLaw === 'function') window.addLaw(ev.formula);
    }
  }

  function tick(){
    if (idx < lines.length){
      const ev = lines[idx];
      if (canFire(ev)){
        idx++; handle(ev);
      }
    }
    if (idx < lines.length) raf = requestAnimationFrame(tick);
  }

  function startAct2(){ if(started) return; started=true; idx=0; tick(); }

  document.addEventListener('act2-start', startAct2);
})();
