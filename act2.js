/* act2.js — Act II χωρίς εξαρτήσεις από έξτρα αρχεία.
   - Σταθερός, αναγνώσιμος χρονισμός σκέψεων (internal duration).
   - Ghost μόνο σε 3 σκέψεις, στο ίδιο ύψος με τον κανονικό, Aghost=5 m, συγχρονισμένος.
   - Νόμοι (5)…(7) ως μονές γραμμές στο αριστερό πλαίσιο.
   - Κλείσιμο: κουρτίνα κλείνει, κίτρινο βέλος κρύβεται, gate για φουαγιέ κεντραρισμένο.
*/

(function () {
  'use strict';

  // ===== DOM =====
  const $  = (sel, root=document) => root.querySelector(sel);
  const by = (id) => document.getElementById(id);

  const stage        = by('stage');
  const curtainUpper = $('.curtain-upper');
  const spring       = by('spring');
  const actorEl      = by('actor');
  const marker       = by('marker');

  const signboard = $('.signboard');
  const sbH1  = signboard ? signboard.querySelector('h1') : null;
  const sbA   = by('sbLineA');
  const sbB   = by('sbLineB');

  // ===== Από Πράξη 1 (globals) με default αν λείπουν =====
  const pxPerMeter = (typeof window.pxPerMeter === 'number') ? window.pxPerMeter : 50;
  const A_m        = (typeof window.A_m        === 'number') ? window.A_m        : 3.0;
  const omega      = (typeof window.omega      === 'number') ? window.omega      : (2*Math.PI/6);
  const T          = (typeof window.T          === 'number') ? window.T          : 6.0;

  // ===== Κατάσταση =====
  let running = false;
  let finished = false;

  // ===== Χρονισμός σκέψεων (εσωτερικός) =====
  const TIMING = {
    CHARS_PER_SEC: 7.0,   // μικρότερο => πιο αργά
    MIN: 4.5,             // ελάχιστο display per bubble
    MAX: 18.0,            // μέγιστο
    EXTRA_GAP: 0.35       // κενό μετά το «κλείσιμο» για ανάσα
  };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  function computeThoughtDuration(text) {
    const s = (text || '').toString();
    let secs = s.length / TIMING.CHARS_PER_SEC;
    secs = Math.max(TIMING.MIN, Math.min(TIMING.MAX, secs));
    return secs;
  }

  // ===== Βοήθειες θέσης =====
  function centerX(){ return stage.clientWidth / 2; }
  function anchorX(){
    // ίδια με Act I αν υπάρχει — αλλιώς 18% πλάτος
    return (typeof window.anchorX === 'function') ? window.anchorX() : (stage.clientWidth * 0.18);
  }

  // ===== Σκέψεις (χρησιμοποιούμε το showThoughtForViewer της Πράξης 1) =====
  async function say(viewerIdx, text, customLift = 130, xShift = 0){
    const dur = computeThoughtDuration(text);

    // Αν υπάρχει η υλοποίηση της Πράξης 1, τη χρησιμοποιούμε.
    if (typeof window.showThoughtForViewer === 'function') {
      window.showThoughtForViewer(viewerIdx, text, dur, customLift, xShift);
      await sleep((dur + TIMING.EXTRA_GAP) * 1000);
      return;
    }

    // Fallback (σπάνια): αν λείπει, δεν μπλοκάρουμε τη ροή.
    console.warn('showThoughtForViewer missing — fallback duration only');
    await sleep((dur + TIMING.EXTRA_GAP) * 1000);
  }

  // ===== Νόμοι (μία γραμμή) =====
  function addLawOneLine(txt){
    if (typeof window.addLaw === 'function') window.addLaw(txt);
  }

  // ===== Ghost (ίδιο ύψος/anchor, Aghost=5 m, συγχρονισμός με playbackTime) =====
  let ghost = null, ghostSpring = null, ghostRAF = 0, ghostBaseW = 0;
  const Aghost_m = 5;

  function ensureGhost(){
    if (!ghost) {
      ghost = document.createElement('div');
      ghost.id = 'actorGhost';
      const actorCS = getComputedStyle(actorEl);
      Object.assign(ghost.style, {
        position:'absolute',
        bottom: actorCS.bottom,            // ίδιο ύψος
        width:  actorCS.width,
        height: actorCS.height,
        transform: 'translate(-50%,0)',
        zIndex: 121,                       // μπροστά από κανονικό (110)
        pointerEvents:'none',
        opacity: 0.85,
        filter:'grayscale(1) brightness(1.2)',
        display:'none'
      });
      const img = document.createElement('img');
      const srcImg = $('img', actorEl);
      img.src = srcImg ? srcImg.src : '';
      img.style.width = '100%';
      img.style.height= 'auto';
      img.style.opacity = '0.85';
      ghost.appendChild(img);
      stage.appendChild(ghost);
    }
    if (!ghostSpring) {
      ghostSpring = document.createElement('img');
      ghostSpring.id = 'springGhost';
      ghostSpring.src = spring ? spring.src : '';
      const springCS = getComputedStyle(spring || document.body);
      Object.assign(ghostSpring.style, {
        position:'absolute',
        bottom: springCS.bottom || 'calc(32vh + 82px)',
        left: anchorX()+'px',
        height: springCS.height || '96px',
        width: 'auto',
        transformOrigin:'left center',
        zIndex: 91,
        pointerEvents:'none',
        opacity:0.9,
        filter:'grayscale(1) brightness(1.15)',
        display:'none'
      });
      ghostSpring.addEventListener('load', ()=>{
        try {
          ghostBaseW = ghostSpring.naturalWidth || ghostSpring.getBoundingClientRect().width || 160;
        } catch(e){}
      });
      stage.appendChild(ghostSpring);
    }
  }

  function startGhost(){
    ensureGhost();
    ghost.style.display = 'block';
    ghostSpring.style.display = 'block';

    cancelAnimationFrame(ghostRAF);
    const loop = ()=>{
      const cx = centerX();
      const ax = anchorX();
      const t  = (typeof window.playbackTime === 'number') ? window.playbackTime : 0;

      const X = cx + (pxPerMeter * Aghost_m) * Math.sin(omega * t);

      // Actor ghost στο ίδιο ύψος, κεντραρισμένος όπως ο κανονικός
      ghost.style.left = X + 'px';

      // Spring ghost: scaleX με την απόσταση από anchor
      const dist = Math.max(1, X - ax);
      const base = ghostBaseW || 160;
      ghostSpring.style.left = ax + 'px';
      ghostSpring.style.transform = `scaleX(${dist/base})`;

      ghostRAF = requestAnimationFrame(loop);
    };
    ghostRAF = requestAnimationFrame(loop);
  }

  function stopGhost(){
    cancelAnimationFrame(ghostRAF);
    ghostRAF = 0;
    if (ghost)      ghost.style.display = 'none';
    if (ghostSpring)ghostSpring.style.display = 'none';
  }

  // ===== Τίτλος Πράξης 2 =====
  function setTitleAct2(){
    if (sbH1) sbH1.textContent = 'Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!';
    const m  = (typeof window.m==='number') ? window.m.toFixed(1) : (window.m || '…');
    const D  = (typeof window.D==='number') ? window.D : '…';
    const Em = (typeof window.E_mech==='number') ? window.E_mech.toFixed(2) : (window.E_mech || '…');
    if (sbA) sbA.textContent = `m₁ = ${m} kg , D₁ = ${D} N/m`;
    if (sbB) sbB.textContent = `Eμηχ = ${Em} J`;
  }

  // ===== Gate για Φουαγιέ =====
  function ensureFoyerGate(){
    if (by('foyerGate')) return;
    const gate = document.createElement('div');
    gate.id = 'foyerGate';
    Object.assign(gate.style, {
      position:'absolute', display:'none',
      alignItems:'center', justifyContent:'center', textAlign:'center',
      zIndex:410, background:'rgba(0,0,0,.55)'
    });
    const box = document.createElement('div');
    Object.assign(box.style, {
      background:'rgba(0,0,0,.7)', border:'1px solid rgba(255,255,255,.25)',
      borderRadius:'12px', padding:'16px 20px', maxWidth:'520px', color:'#fff'
    });
    const h = document.createElement('h3'); h.textContent = 'Διάλειμμα — Φουαγιέ';
    const p = document.createElement('p');  p.textContent = 'Οι κουρτίνες παραμένουν κλειστές. Προχωράμε στις αποδείξεις;';
    const btn = document.createElement('button'); btn.textContent = 'Μετάβαση στο Φουαγιέ';
    Object.assign(btn.style, {background:'#700', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 16px', fontSize:'16px', cursor:'pointer'});
    btn.addEventListener('click', ()=>{ gate.style.display='none'; document.dispatchEvent(new Event('act3-start')); });
    box.appendChild(h); box.appendChild(p); box.appendChild(btn);
    gate.appendChild(box);
    document.body.appendChild(gate);
  }
  function showFoyerGate(){
    ensureFoyerGate();
    const gate = by('foyerGate'); if (!gate) return;
    const sRect = stage.getBoundingClientRect();
    const cuRect = curtainUpper.getBoundingClientRect();
    gate.style.left   = (sRect.left + stage.clientWidth*0.18) + 'px';
    gate.style.top    = cuRect.top + 'px';
    gate.style.width  = (stage.clientWidth*0.64) + 'px';
    gate.style.height = cuRect.height + 'px';
    gate.style.display= 'flex';
  }

  // ===== Κύρια ροή Πράξης 2 =====
  async function playAct2(){
    if (running || finished) return;
    running = true;

    // Άνοιγμα κουρτίνας + τίτλος + ελατήριο
    if (stage) stage.classList.add('open');
    if (spring) spring.style.display = 'block';
    setTitleAct2();

    // Σειρά σκέψεων — αυτολεξεί, στις ίδιες περίπου θέσεις με Πράξη 1
    const seq = [
      {v:0, t:'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!', y:135, x:-20},

      // ghost ON (3 σκέψεις)
      {v:1, t:'αυτόν ακριβώς τον m₁D₁ σίγουρα τον έχω ξαναδεί με το ίδιο μηχανισμό-ελατήριο σε άλλη παράσταση, αλλά με άλλον παραγωγό!', y:135, x:-10, gStart:true},
      {v:3, t:'…ναι και εκεί πάλι με την ίδια περίοδο όμως εμμονικά κινήθηκε, αλλά με μεγαλύτερο πλάτος A!', y:135, x:10},
      {v:2, t:'(θυμήσου…) — ο m₁D₁ σε άλλη σκηνή με διαφορετικό πλάτος/ενέργεια (ίδιο μέγεθος εικόνας)', y:130, x:-10, gStop:true},

      {v:4, t:'Χμμμ… Πρωταγωνιστής μάλλον είναι ο κινούμενος ηθοποιός και τα εργαλεία του μαζί!', y:130, x:20},

      {v:0, t:'Τώρα καταλαβαίνω μάλλον γιατί δεν τον λένε m₁ αλλά m₁,D₁…', y:130, x:-20},
      {v:1, t:'… το m₁ είναι η μάζα του ηθοποιού αλλά ταλαντωτής προφανώς, νοείται η σύμπραξη του ηθοποιού (m₁) και του «ελαστικού» αιτίου-δύναμη, στο οποίο αναφέρεται το D₁!', y:130, x:-10},
      {v:3, t:'…m₁ και D₁ δηλαδή πάνε παντού πακέτο! και τα δυο μαζί είναι ο ταλαντωτής — ο πρωταγωνιστής!', y:130, x:10},
      {v:2, t:'… δηλαδή κάθε ταλαντωτής χαρακτηρίζεται 1) από τη μάζα του και 2) από το ελαστικό αίτιο-δύναμη που του ρυθμίζει χρονικά (T) την ταλάντωση!', y:130, x:0},
      {v:4, t:'…αρχίζω να πείθομαι γιατί σαν χαρακτηριστικό όνομα έχει το mD! και όχι σκέτο m!...', y:130, x:20},
      {v:0, t:'Επομένως η «εμμονή» του κάθε ταλαντωτή (η χαρακτηριστική T → f, ω) οφείλεται στο m και στο ελαστικό αίτιο (D)!', y:130, x:-20},
      {v:1, t:'Πωωωω! ελάτε, αφήστε τα, πάμε παρακάτω…', y:125, x:-10},
      {v:3, t:'Ας δούμε πώς γράφεται ο 2ος Νόμος του Νεύτωνα για την περίπτωση του ταλαντωτή!', y:130, x:10}
    ];

    for (const it of seq) {
      if (it.gStart) startGhost();
      await say(it.v, it.t, it.y, it.x);
      if (it.gStop)  stopGhost();
    }

    // Νόμοι (5)…(7)
    addLawOneLine('ΣF = −m·ω²·A·ημ(ωt+φ₀) (5)'); await sleep(280);
    addLawOneLine('ΣF = −m·ω²·x (6)');           await sleep(280);
    addLawOneLine('D = m·ω² (6′)');              await sleep(280);
    addLawOneLine('ΣF = −D·x (7)');              await sleep(420);

    // Τέλος: stop ghost, κρύψε δείκτη, κλείσε κουρτίνα, δείξε Φουαγιέ
    stopGhost();
    if (marker) marker.style.opacity = '0';

    if (curtainUpper && stage) {
      curtainUpper.classList.add('slow-close');
      stage.classList.remove('open');
      await sleep(1600);
      curtainUpper.classList.remove('slow-close');
    } else {
      if (stage) stage.classList.remove('open');
      await sleep(600);
    }

    showFoyerGate();
    finished = true;
    running  = false;
  }

  // ===== Mount =====
  ensureFoyerGate();
  document.addEventListener('act2-start', playAct2, { once:true });

})();
