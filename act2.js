/* act2.js — Πράξη 2 χωρίς helpers. Σταθερός χρονισμός σκέψεων & σωστός ghost.
   - Ghost: εμφανίζεται σε 3 σκέψεις (4→6), Aghost=5 m, μπροστά (zIndex), ίδιο ύψος/anchor με τα κανονικά.
   - Σκέψεις: εμφανίζονται σε bubble και μένουν όσο χρειάζεται (βάσει πλήθους χαρακτήρων).
   - Νόμοι (5)…(7): μονές γραμμές στο αριστερό πλαίσιο.
   - Τέλος: κρύβει δείκτη, κλείνει κουρτίνα, εμφανίζει «Φουαγιέ».
*/
(function () {
  'use strict';

  // ====== DOM ======
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

  // ====== Globals από Πράξη 1 (με defaults για ασφάλεια) ======
  const pxPerMeter = (typeof window.pxPerMeter === 'number') ? window.pxPerMeter : 50;
  const A_m        = (typeof window.A_m        === 'number') ? window.A_m        : 3.0;
  const omega      = (typeof window.omega      === 'number') ? window.omega      : (2*Math.PI/6);
  const T          = (typeof window.T          === 'number') ? window.T          : 6.0;

  // ====== Κατάσταση ======
  let running  = false;
  let finished = false;

  // ====== Χρονισμός σκέψεων (αργό & αναγνώσιμο) ======
  const TIMING = {
    CHARS_PER_SEC: 6.0,  // μικρότερο => πιο αργά
    MIN: 4.75,            // ελάχιστο χρόνο ανά bubble
    MAX: 16.0,           // μέγιστο
    EXTRA_GAP: 0.60      // ανάσα μετά το κλείσιμο bubble
  };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  function computeThoughtDuration(text) {
    const s = (text || '').toString();
    let secs = s.length / TIMING.CHARS_PER_SEC;
    if (!isFinite(secs) || secs <= 0) secs = TIMING.MIN;
    secs = Math.max(TIMING.MIN, Math.min(TIMING.MAX, secs));
    return secs;
  }

  // ====== Βοήθειες γεωμετρίας ======
  function centerX(){ return stage.clientWidth / 2; }
  function anchorX(){
    return (typeof window.anchorX === 'function') ? window.anchorX() : (stage.clientWidth * 0.18);
  }
  function getComputedBottomPx(el){
    const cs = getComputedStyle(el);
    const px = parseFloat(cs.bottom || '0');
    return isFinite(px) ? px : 0;
  }

  // ====== Σκέψεις (χρησιμοποιούμε την showThoughtForViewer της Πράξης 1) ======
  async function say(viewerIdx, text, lift = 130, xShift = 0){
    const dur = computeThoughtDuration(text);
    if (typeof window.showThoughtForViewer === 'function') {
      window.showThoughtForViewer(viewerIdx, text, dur, lift, xShift);
      await sleep((dur + TIMING.EXTRA_GAP) * 1000);
    } else {
      console.warn('showThoughtForViewer missing — fallback μόνο καθυστέρηση');
      await sleep((dur + TIMING.EXTRA_GAP) * 1000);
    }
  }

  // ====== Νόμοι (μονές γραμμές, χωρίς scroll/τίτλους) ======
  function addLawOneLine(txt){
    if (typeof window.addLaw === 'function') {
      window.addLaw(txt);
      return;
    }
    // Fallback εάν δεν υπάρχει addLaw
    const pane = by('laws'), list = by('lawsList');
    if (pane && list) {
      pane.style.display = 'block';
      pane.style.overflow = 'visible';
      pane.style.maxHeight = 'none';
      const li = document.createElement('li');
      li.textContent = txt;
      li.style.marginBottom = '0'; // χωρίς κενές γραμμές
      list.appendChild(li);
    }
  }

  // ====== Ghost — ίδιο ύψος με κανονικό, Aghost=5 m, μπροστά ======
  let ghost = null, ghostSpring = null, ghostRAF = 0, ghostBaseW = 160;
  const Aghost_m = 5;

  function ensureGhost(){
    if (!ghost) {
      ghost = document.createElement('div');
      ghost.id = 'actorGhost';
      Object.assign(ghost.style, {
        position:'absolute',
        transform:'translate(-50%,0)',
        zIndex: 121, // μπροστά από actor (110)
        pointerEvents:'none',
        opacity:0.85,
        filter:'grayscale(1) brightness(1.2)',
        display:'none'
      });
      const srcImg = actorEl ? $('img', actorEl) : null;
      const img = document.createElement('img');
      img.src = srcImg ? srcImg.src : '';
      img.style.width = '100%';
      img.style.height= 'auto';
      img.style.opacity = '0.9';
      ghost.appendChild(img);
      stage.appendChild(ghost);
    }
    if (!ghostSpring) {
      ghostSpring = document.createElement('img');
      ghostSpring.id = 'springGhost';
      ghostSpring.src = spring ? spring.src : '';
      Object.assign(ghostSpring.style, {
        position:'absolute',
        left: anchorX()+'px',
        transformOrigin:'left center',
        zIndex: 120,       // μπροστά από πραγματικό ελατήριο, κάτω από ghost-actor
        pointerEvents:'none',
        opacity:0.9,
        filter:'grayscale(1) brightness(1.15)',
        display:'none'
      });
      ghostSpring.addEventListener('load', ()=>{
        const r = ghostSpring.getBoundingClientRect();
        ghostBaseW = Math.max(60, r.width || ghostSpring.naturalWidth || 160);
      });
      stage.appendChild(ghostSpring);
    }

    // Απόλυτη ευθυγράμμιση ύψους με computed bottom των κανονικών
    const actorBottom  = getComputedBottomPx(actorEl);
    const springBottom = getComputedBottomPx(spring);
    ghost.style.bottom       = actorBottom + 'px';
    ghost.style.width        = actorEl.getBoundingClientRect().width + 'px';
    ghost.style.height       = actorEl.getBoundingClientRect().height + 'px';
    ghostSpring.style.bottom = springBottom + 'px';
    ghostSpring.style.height = spring.getBoundingClientRect().height + 'px';
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

      ghost.style.left = X + 'px';

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
    if (ghost) {
      ghost.style.display = 'none';
      ghost.style.left = '-9999px';
    }
    if (ghostSpring){
      ghostSpring.style.display = 'none';
      ghostSpring.style.transform = 'scaleX(1)';
    }
  }

  // ====== Τίτλος Πράξης 2 (τρεις γραμμές) ======
  function setTitleAct2(){
    if (sbH1) sbH1.textContent = 'Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!';
    const m  = (typeof window.m==='number') ? window.m.toFixed(1) : (window.m || '…');
    const D  = (typeof window.D==='number') ? window.D : '…';
    const Em = (typeof window.E_mech==='number') ? window.E_mech.toFixed(2) : (window.E_mech || '…');
    if (sbA) sbA.textContent = `m₁ = ${m} kg , D₁ = ${D} N/m`;
    if (sbB) sbB.textContent = `Eμηχ = ${Em} J`;
  }

  // ====== Φουαγιέ (πύλη) ======
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
    const gate  = by('foyerGate'); if (!gate) return;
    const sRect = stage.getBoundingClientRect();
    const cuRect= curtainUpper.getBoundingClientRect();
    gate.style.left   = (sRect.left + stage.clientWidth*0.18) + 'px';
    gate.style.top    = cuRect.top + 'px';
    gate.style.width  = (stage.clientWidth*0.64) + 'px';
    gate.style.height = cuRect.height + 'px';
    gate.style.display= 'flex';
  }

  // ====== Ροή Πράξης 2 ======
  async function playAct2(){
    if (running || finished) return;
    running = true;

    try {
      // Άνοιγμα σκηνής + τίτλος + ελατήριο ορατό
      stage.classList.add('open');
      spring.style.display = 'block';
      setTitleAct2();

      // Σειρά σκέψεων — αυτολεξεί, με ghost 3 βήματα (4→6)
      const seq = [
        {v:0, t:'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!', y:135, x:-20},

        // GHOST ON
        {v:1, t:'αυτόν ακριβώς τον m₁D₁ σίγουρα τον έχω ξαναδεί με το ίδιο μηχανισμό-ελατήριο σε άλλη παράσταση, αλλά με άλλον παραγωγό!', y:135, x:-10, gStart:true},
        {v:3, t:'…ναι και εκεί πάλι με την ίδια περίοδο όμως εμμονικά κινήθηκε, αλλά με μεγαλύτερο πλάτος A!', y:135, x:10},
        {v:2, t:'(θυμήσου…) — ο m₁D₁ σε άλλη σκηνή με διαφορετικό πλάτος-διαφορετική ενέργεια αλλά εικόνα ίδιου μεγέθους', y:130, x:-10, gStop:true},

        {v:4, t:'Χμμμ… Πρωταγωνιστής μάλλον είναι ο κινούμενος ηθοποιός και τα εργαλεία του μαζί!', y:130, x:20},
        {v:0, t:'Τώρα καταλαβαίνω μάλλον γιατί δεν τον λένε m₁ αλλά m₁,D₁…', y:130, x:-20},
        {v:1, t:'… το m₁ είναι η μάζα του ηθοποιού αλλά ταλαντωτής προφανώς, νοείται η σύμπραξη του ηθοποιού (m₁) και του «ελαστικού» αιτίου-δύναμη, στο οποίο αναφέρεται ως φαίνεται το D₁!', y:130, x:-10},
        {v:3, t:'…m₁ και D₁ δηλαδή πάνε παντού πακέτο! και τα δυο μαζί είναι ο ταλαντωτής — ο πρωταγωνιστής!', y:130, x:10},
        {v:2, t:'… δηλαδή κάθε ταλαντωτής χαρακτηρίζεται 1) από τη μάζα του και 2) από το ελαστικό αίτιο-δύναμη που του ρυθμίζει χρονικά (T) την ταλάντωση!', y:130, x:0},
        {v:4, t:'…αρχίζω να πείθομαι γιατί σαν χαρακτηριστικό όνομα έχει το mD! και όχι σκέτο m!...', y:130, x:20},
        {v:0, t:'Επομένως η ιδιαιτερότητα του κάθε ταλαντωτή δηλαδή η «εμμονή» του να έχει χαρακτηριστική Περίοδο T (χαρακτηριστική επομένως f και ω) οφείλεται 1) στο m και 2) στο ελαστικό αίτιο (D)!', y:130, x:-20},
        {v:1, t:'Πωωωω! ελάτε, αφήστε τα, πάμε παρακάτω….', y:125, x:-10},
        {v:3, t:'Ας δούμε πώς γράφεται ο 2ος Νόμος του Νεύτωνα για την περίπτωση του ταλαντωτή!', y:130, x:10}
      ];

      for (const it of seq) {
        if (it.gStart) startGhost();
        await say(it.v, it.t, it.y, it.x);
        if (it.gStop)  stopGhost();
      }

      // Νόμοι (μονές γραμμές, χωρίς κενές)
      addLawOneLine('ΣF = −m·ω²·A·ημ(ωt+φ₀) (5)');
      await sleep(280);
      addLawOneLine('ΣF = −m·ω²·x (6)');
      await sleep(280);
      addLawOneLine('D = m·ω² (6′)');
      await sleep(320);
      addLawOneLine('ΣF = −D·x (7)');
      await sleep(480);

      // Τέλος: κρύψε δείκτη, κλείσε κουρτίνα, πύλη φουαγιέ
      if (marker) marker.style.opacity = '0';

      curtainUpper.classList.add('slow-close');
      stage.classList.remove('open');
      await sleep(1600);
      curtainUpper.classList.remove('slow-close');

      showFoyerGate();
      finished = true;
    }
    catch (err) {
      console.error('Act2 fatal:', err);
    }
    finally {
      // ό,τι κι αν γίνει, ghost να ΜΗ μείνει
      stopGhost();
      running = false;
    }
  }

  // ====== Mount ======
  ensureFoyerGate();

  // Πρωτεύον trigger (από Act I κουμπί): ασφαλές αν πατηθεί αργότερα
  document.addEventListener('act2-start', playAct2, { once:true });

  // Εφεδρικό trigger: αν υπάρχει #btnAct2 στο DOM, δένουμε εδώ (δεν διπλο-τρέχει λόγω running/finished)
  const btnAct2 = by('btnAct2');
  if (btnAct2 && !btnAct2.__act2Bound) {
    btnAct2.__act2Bound = true;
    btnAct2.addEventListener('click', playAct2);
  }

  // Προαιρετικό manual hook σε console:
  window.__forceAct2Start = playAct2;
})();
