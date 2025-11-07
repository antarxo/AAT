/* act2.js — Πράξη 2: σταθερός χρονισμός χωρίς έξτρα αρχεία + σωστός ghost + σωστό κλείσιμο
   Δεν πειράζει Πράξη 1. Φορτώνεται ΜΕΤΑ τα index scripts σου & ui_laws_layout_v4.js.
*/
(function(){
  'use strict';

  // ===== DOM refs =====
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const byId = (id) => document.getElementById(id);

  const stage   = byId('stage');
  const spring  = byId('spring');           // κανονικό ελατήριο
  const actorEl = byId('actor');            // κανονικός ηθοποιός (wrapper div με <img>)
  const marker  = byId('marker');           // κίτρινο βέλος
  const curtainUpper = $('.curtain-upper');
  const signboard = $('.signboard');
  const sbH1  = signboard ? signboard.querySelector('h1') : null;
  const sbA   = byId('sbLineA');
  const sbB   = byId('sbLineB');

  // ===== Φυσικά μεγέθη από την Πράξη 1 (global) =====
  const pxPerMeter = (typeof window.pxPerMeter==='number') ? window.pxPerMeter : 50;
  const A_m   = (typeof window.A_m==='number')   ? window.A_m   : 3.0;
  const omega = (typeof window.omega==='number') ? window.omega : (2*Math.PI/6);
  const T     = (typeof window.T==='number')     ? window.T     : 6.0;

  // ===== Κατάσταση Πράξης 2 =====
  let running = false;
  let finished = false;

  // ===== Timing προφίλ Πράξης 2 (χωρίς έξτρα αρχείο) =====
  // Αυτόματη διάρκεια ανά σκέψη από μήκος κειμένου + “κράτημα”
  const TIMING = {
    CHARS_PER_SEC: 8.0,   // μικρότερο = πιο αργά
    MIN: 4.2,             // απόλυτο ελάχιστο
    MAX: 16.0,            // απόλυτο μέγιστο
    EXTRA_HOLD: 0.7       // μικρό κράτημα μετά το γράψιμο
  };
  function computeThoughtDuration(text) {
    const s = (text || '').toString();
    let secs = (s.length / TIMING.CHARS_PER_SEC);
    secs = Math.max(TIMING.MIN, Math.min(TIMING.MAX, secs));
    return secs + TIMING.EXTRA_HOLD;
  }

  // ===== Ασφαλές sleep =====
  const sleep = (ms) => new Promise(r=>setTimeout(r, ms));

  // ===== Βοηθήματα σκηνής =====
  function centerX(){ return stage.clientWidth/2; }
  function anchorX(){ 
    // ίδια συνάρτηση με Πράξη 1, αν υπάρχει, αλλιώς 18% της σκηνής
    return (typeof window.anchorX==='function') ? window.anchorX() : (stage.clientWidth*0.18);
  }

  // ===== Ελεγχόμενη εμφάνιση σκέψης (με “hold” εσωτερικά, χωρίς έξτρα αρχεία) =====
  async function say(viewerIdx, text, y=130, x=0) {
    const dur = computeThoughtDuration(text);

    // Προσωρινό “κλείδωμα” του resume μέχρι να περάσει ο χρόνος
    const origResume = window.resumeFromBubble;
    let holdUntil = performance.now() + dur*1000 - 15;

    // Τυλίγουμε προσωρινά το resumeFromBubble για να ΜΗΝ κλείσει νωρίτερα
    if (typeof origResume === 'function') {
      window.resumeFromBubble = function(nextMode){
        const now = performance.now();
        if (now < holdUntil) {
          const wait = Math.max(0, holdUntil - now) + 20;
          setTimeout(()=>window.resumeFromBubble(nextMode), wait);
          return;
        }
        // αποκατάσταση & κανονικό resume
        window.resumeFromBubble = origResume;
        return origResume(nextMode);
      };
    }

    if (typeof window.showThoughtForViewer === 'function') {
      window.showThoughtForViewer(viewerIdx, text, dur, y, x);
    }
    // Περιμένουμε λίγο παραπάνω για “κλείσιμο” animation
    await sleep((dur + 0.25)*1000);

    // Ασφάλεια: αν κάπως δεν επανήλθε το resume, επανέφερε τώρα
    if (window.resumeFromBubble !== origResume && typeof origResume === 'function') {
      window.resumeFromBubble = origResume;
    }
  }

  // ===== Νόμοι (χρησιμοποιεί το addLaw της 1ης) =====
  function addLawOneLine(txt){
    if (typeof window.addLaw === 'function') window.addLaw(txt);
  }

  // ===== Ghost (ίδιο ύψος/ελατήριο, Aghost=5m, μπροστά + συγχρονισμός) =====
  let ghost = null;
  let ghostSpring = null;
  let ghostRAF = 0;
  let ghostBaseW = 0;
  const Aghost_m = 5; // ζητήθηκε A=5 (m)

  function ensureGhost(){
    if (!ghost) {
      ghost = document.createElement('div');
      ghost.id = 'actorGhost';
      Object.assign(ghost.style, {
        position:'absolute',
        bottom: getComputedStyle(actorEl).bottom, // ίδιο ύψος με κανονικό
        width: getComputedStyle(actorEl).width,
        height: getComputedStyle(actorEl).height,
        transform: 'translate(-50%,0)',
        zIndex: 121,  // μπροστά από κανονικό (actor έχει 110)
        pointerEvents:'none',
        opacity: 0.85,
        filter:'grayscale(1) brightness(1.2)',
      });
      const img = document.createElement('img');
      img.src = $('img', actorEl).src;
      img.style.width = '100%';
      img.style.height= 'auto';
      img.style.opacity = '0.85';
      ghost.appendChild(img);
      stage.appendChild(ghost);
    }
    if (!ghostSpring) {
      ghostSpring = document.createElement('img');
      ghostSpring.id = 'springGhost';
      ghostSpring.src = spring.src;
      Object.assign(ghostSpring.style, {
        position:'absolute',
        bottom: getComputedStyle(spring).bottom, // ίδιο ύψος με κανονικό
        left: anchorX()+'px',
        height: getComputedStyle(spring).height,
        width: 'auto',
        transformOrigin:'left center',
        zIndex: 91, // λίγο πάνω από κανονικό spring (90)
        pointerEvents:'none',
        opacity:0.9,
        filter:'grayscale(1) brightness(1.15)'
      });
      ghostSpring.addEventListener('load', ()=>{
        try {
          // Βάση για scaleX
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
      const t  = (typeof window.playbackTime==='number') ? window.playbackTime : 0;

      const skaterHookX = cx + (pxPerMeter*Aghost_m)*Math.sin(omega*t);

      // ηθοποιός-ghost στο ίδιο ύψος με κανονικό, κεντραρισμένο
      ghost.style.left = skaterHookX + 'px';

      // ελατήριο-ghost: scaleX ανάλογα με απόσταση από άγκυρα
      const dist = Math.max(1, skaterHookX - ax);
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
    if (ghost) ghost.style.display = 'none';
    if (ghostSpring) ghostSpring.style.display = 'none';
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

  // ===== Φουαγιέ (πλαίσιο μετά το κλείσιμο) =====
  function ensureFoyerGate(){
    if (byId('foyerGate')) return;
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
    const gate = byId('foyerGate'); if (!gate) return;
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

    // Άνοιγμα κουρτίνας, τίτλος, ελατήριο ορατό
    if (stage) stage.classList.add('open');
    if (spring) spring.style.display = 'block';
    setTitleAct2();

    // Σετ σκέψεων — ΑΥΤΟΛΕΞΕΙ, όπως ζητήθηκαν (με δείκτες/μονάδες)
    const seq = [
      {v:0, t:'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!', y:135, x:-20},

      // Ghost window: από εδώ...
      {v:1, t:'αυτόν ακριβώς τον m₁D₁ σίγουρα τον έχω ξαναδεί με το ίδιο μηχανισμό-ελατήριο σε άλλη παράσταση, αλλά με άλλον παραγωγό!', y:135, x:-10, gStart:true},
      {v:3, t:'…ναι και εκεί πάλι με την ίδια περίοδο όμως εμμονικά κινήθηκε, αλλά με μεγαλύτερο πλάτος A!', y:135, x:10},
      {v:2, t:'(θυμήσου…) — ο m₁D₁ σε άλλη σκηνή με διαφορετικό πλάτος/ενέργεια (ίδιο μέγεθος εικόνας)', y:130, x:-10},
      {v:4, t:'Χμμμ… Πρωταγωνιστής μάλλον είναι ο κινούμενος ηθοποιός και τα εργαλεία του μαζί!', y:130, x:20, gStop:true},
      // ...μέχρι εδώ (3 σκέψεις με ghost ενεργό)

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
      if (it.gStop) stopGhost();
    }

    // Νόμοι (5)…(7)
    addLawOneLine('ΣF = −m·ω²·A·ημ(ωt+φ₀) (5)'); await sleep(300);
    addLawOneLine('ΣF = −m·ω²·x (6)');           await sleep(300);
    addLawOneLine('D = m·ω² (6′)');              await sleep(300);
    addLawOneLine('ΣF = −D·x (7)');              await sleep(600);

    // Τέλος Πράξης 2 — κλείσιμο κουρτίνας, κρύψε δείκτη, δείξε Φουαγιέ
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
    running = false;
  }

  // Ετοιμασία
  ensureFoyerGate();

  // Μόλις πατηθεί το κουμπί “Έναρξη Πράξης 2”
  document.addEventListener('act2-start', playAct2, { once:true });

})();
