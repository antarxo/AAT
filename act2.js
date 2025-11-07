/* act2.js — Act II: hide marker on close + ghost με ίδιο ύψος & ορατό ελατήριο */
(function () {
  'use strict';

  // --- refs ---
  const $ = (id) => document.getElementById(id);
  let stage, signboard, springEl, actor, marker;

  function ensureRefs() {
    stage     = stage     || $('stage');
    signboard = signboard || document.querySelector('.signboard');
    springEl  = springEl  || $('spring');
    actor     = actor     || $('actor');
    marker    = marker    || $('marker');
    return !!stage && !!signboard && !!springEl && !!actor && !!marker;
  }

  // --- Manual start μόνο: καθαρίζει τυχόν παλιοί listeners του κουμπιού ---
  function hardenManualStartButton() {
    const box = $('actBreak');
    if (!box) return;
    const oldBtn = box.querySelector('#btnAct2');
    if (!oldBtn) return;
    const clone = oldBtn.cloneNode(true);
    oldBtn.replaceWith(clone);
    clone.addEventListener('click', () => {
      box.style.display = 'none';
      try { document.dispatchEvent(new CustomEvent('act2-start-manual')); } catch (_) {}
    }, { once: true });
  }

  // --- Signboard για Πράξη 2 ---
  function setSignboardAct2() {
    const h1 = signboard.querySelector('h1');
    const lA = $('sbLineA'), lB = $('sbLineB'), lC = $('sbLineC');
    if (h1) h1.textContent = 'Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!';
    if (lA) lA.textContent = 'm₁ = … Kg , D₁ = … N/m';
    if (lB) lB.textContent = 'Εμηχ = … J';
    if (lC) lC.textContent = 'Παραγωγή-Σκηνοθεσία: Εμηχ. Ενεργειούλης';
  }
  function showSpring() { springEl.style.display = 'block'; springEl.style.opacity = '1'; }
  function showMarker() { marker.style.opacity   = '1'; }

  // --- Ghost: ίδιο bottom με actor & spring, ορατό ελατήριο, μπροστά από τον m1D1 ---
  let ghostEl = null, ghostSpring = null, ghostRAF = 0, ghostStopAt = 0;

  function ensureGhostElems() {
    const stageEl = document.querySelector('.stage') || document.body;

    // ίδιο bottom με τον actor
    const csActor  = getComputedStyle(actor);
    const bottomPx = parseFloat(csActor.bottom) || 0;
    const aRect    = actor.getBoundingClientRect();
    const aW       = aRect.width || 144;

    if (!ghostEl) {
      const g = document.createElement('img');
      g.id = 'ghost';
      g.src = actor.querySelector('img') ? actor.querySelector('img').src : 'skater.png';
      Object.assign(g.style, {
        position:'absolute',
        left:'50%',
        bottom: bottomPx + 'px',         // ίδιο ύψος με actor
        transform:'translate(-50%,0)',
        width: aW + 'px',
        height:'auto',
        opacity:'0.35',
        filter:'drop-shadow(0 4px 6px rgba(0,0,0,.6))',
        zIndex:'120',                    // μπροστά από actor (actor έχει z-index ~110)
        pointerEvents:'none'
      });
      stageEl.appendChild(g);
      ghostEl = g;
    }

    // ίδιο bottom με το κανονικό ελατήριο + ορατό
    if (!ghostSpring) {
      const csSp   = getComputedStyle(springEl);
      const spRect = springEl.getBoundingClientRect();
      const gs = document.createElement('img');
      gs.id = 'ghostSpring';
      gs.src = springEl.src;
      Object.assign(gs.style, {
        position:'absolute',
        left: (typeof window.anchorX === 'function' ? window.anchorX() : stage.clientWidth * 0.18) + 'px',
        bottom: csSp.bottom,             // ίδιο ύψος με κανονικό spring
        height: (spRect.height || 96) + 'px',
        width:  (spRect.width  || 160) + 'px',
        opacity:'0.35',
        filter:'drop-shadow(0 4px 6px rgba(0,0,0,.55))',
        zIndex:'119',                    // ελατήριο ghost ορατό, λίγο πίσω από τον ghost-actor
        pointerEvents:'none'
      });
      stageEl.appendChild(gs);
      ghostSpring = gs;
    }
  }

  function stopAndDestroyGhost() {
    if (ghostRAF) { cancelAnimationFrame(ghostRAF); ghostRAF = 0; }
    try { if (ghostEl) ghostEl.remove(); } catch (_) {}
    try { if (ghostSpring) ghostSpring.remove(); } catch (_) {}
    ghostEl = null; ghostSpring = null;
  }

  function startGhostSync(ms) {
    ensureGhostElems();
    const T  = window.T || 6.0;
    const ω  = window.omega || (2 * Math.PI / T);
    const px = window.pxPerMeter || 50;
    const Apx = 5 * px;                       // ghost πλάτος 5 m
    const cx  = stage.clientWidth / 2;
    const aW  = (actor.getBoundingClientRect().width || 144);
    const hook = aW / 2;
    const ax  = (typeof window.anchorX === 'function' ? window.anchorX() : (stage.clientWidth * 0.18));
    const L0  = Math.max(1, springEl.getBoundingClientRect().width || 160);

    function step() {
      const t = (typeof window.playbackTime === 'number') ? window.playbackTime : (performance.now()/1000);
      const xHook = cx + Apx * Math.sin(ω * t);

      // ghost-actor
      if (ghostEl) ghostEl.style.left = (xHook - hook) + 'px';

      // ghost-spring ίδια γεωμετρία με κανονικό
      if (ghostSpring) {
        const dist  = xHook - ax;
        const scale = Math.max(0.12, dist / L0);
        ghostSpring.style.left  = ax + 'px';
        ghostSpring.style.width = (L0 * scale) + 'px';
      }

      if (performance.now() < ghostStopAt) {
        ghostRAF = requestAnimationFrame(step);
      } else {
        stopAndDestroyGhost();
      }
    }

    ghostStopAt = performance.now() + ms;
    if (!ghostRAF) ghostRAF = requestAnimationFrame(step);
  }

  // --- Bubbles (ίδια “ανύψωση” με Πράξη 1) + αναμονή να κλείσουν ---
  function liftFor(viewer) {
    const map = { 0:120, 1:125, 2:135, 3:130, 4:130 };
    return map.hasOwnProperty(viewer) ? map[viewer] : 130;
  }
  function waitBubbleClosed() {
    return new Promise((resolve) => {
      const b = document.getElementById('bubble0');
      if (!b) return resolve();
      const hidden = (!b.classList.contains('active') && (b.style.display === 'none' || !b.offsetParent));
      if (hidden) return resolve();
      const obs = new MutationObserver(() => {
        const h = (!b.classList.contains('active') && (b.style.display === 'none' || !b.offsetParent));
        if (h) { obs.disconnect(); setTimeout(resolve, 40); }
      });
      obs.observe(b, { attributes:true, attributeFilter:['class','style'] });
    });
  }
  async function showBubble(viewer, text, xShift = 0) {
    if (typeof window.showThoughtForViewer === 'function') {
      window.showThoughtForViewer(viewer, text, undefined, liftFor(viewer), xShift);
    }
    await waitBubbleClosed();
  }
  function addLawLine(txt, n) {
    try { if (typeof window.addLaw === 'function') window.addLaw(txt, n); } catch(_) {}
  }

  // --- Foyer overlay ---
  function ensureFoyerOverlay() {
    let ov = document.getElementById('actBreak2F');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'actBreak2F';
    ov.style.cssText = 'position:absolute;inset:0;display:none;align-items:center;justify-content:center;text-align:center;z-index:410;background:rgba(0,0,0,.55)';
    const box = document.createElement('div');
    box.style.cssText = 'background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.25);border-radius:12px;padding:16px 20px;max-width:520px;color:#fff';
    box.innerHTML = `
      <h3 style="margin:0 0 8px 0">Διάλειμμα</h3>
      <p style="margin:0 0 12px 0">Περάστε στο Φουαγιέ για απόψεις & αποδείξεις.</p>
      <button id="btnFoyer" style="background:#700;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-size:16px;cursor:pointer">Είσοδος στο Φουαγιέ</button>
    `;
    ov.appendChild(box);
    (document.querySelector('.stage') || document.body).appendChild(ov);
    box.querySelector('#btnFoyer').addEventListener('click', () => {
      ov.style.display = 'none';
      try { document.dispatchEvent(new Event('act3-start')); } catch(_) {}
    });
    return ov;
  }

  // --- Close Act II: κρύβει marker, σταματά ghost, κλείνει αυλαία ---
  function closeAct2AndShowFoyer() {
    // 1) κρύψε ΑΜΕΣΑ το κίτρινο βέλος
    try { marker.style.opacity = '0'; } catch(_) {}

    // 2) σταμάτα & εξαφάνισε ghost
    stopAndDestroyGhost();

    // 3) κλείσε αυλαία και εμφάνισε το πλαίσιο φουαγιέ
    stage.classList.remove('open');
    setTimeout(() => { ensureFoyerOverlay().style.display = 'flex'; }, 1200);
  }

  // --- ροή Πράξης 2 (αφήνω την υπάρχουσα σειρά bubbles/νόμων) ---
  let STARTED = false, FINISHED = false;
  async function playAct2() {
    if (!ensureRefs()) return;
    STARTED = true;

    stage.classList.add('open');
    showSpring();
    showMarker();
    setSignboardAct2();

    // ghost σε διάρκεια ~10s ενώ τρέχουν οι πρώτοι διάλογοι
    await showBubble(0, 'ωπ! δεμένος σε ελατήριο είναι ο m1D1!');
    startGhostSync(10000);

    await showBubble(2, 'αυτόν ακριβώς τον m1D1 σίγουρα τον έχω ξαναδεί με το ίδιο μηχανισμό-ελατήριο σε άλλη παράσταση, αλλά με άλλον παραγωγό!');
    await showBubble(4, '...ναι και εκεί πάλι με την ίδια περίοδο όμως εμμονικά κινήθηκε, αλλά με μεγαλύτερο πλάτος Α!');
    await showBubble(1, 'Χμμμ… Πρωταγωνιστής μάλλον είναι ο κινούμενος ηθοποιός και τα εργαλεία του μαζί!');
    await showBubble(3, 'Τώρα καταλαβαίνω μάλλον γιατί δεν τον λένε m1 αλλά m1,D1…');
    await showBubble(0, '… το m1 είναι η μάζα του ηθοποιού αλλά ταλαντωτής προφανώς, νοείται η σύμπραξη του ηθοποιού(m1) και του «ελαστικού» αιτίου-δύναμη, στο οποίο αναφέρεται ως φαίνεται το D1!');
    await showBubble(2, '…m1 και D1 δηλαδή πάνε παντού ..πακέτο! και τα δυο μαζί είναι  ο ταλαντωτής- ο πρωταγωνιστής!');
    await showBubble(4, '… δηλαδή κάθε ταλαντωτής χαρακτηρίζεται 1. από τη μάζα του και 2. από το ελαστικό αίτιο-δύναμη που του ρυθμίζει χρονικά (Τ) την ταλάντωση!');
    await showBubble(1, '…αρχίζω να πείθομαι γιατί σαν χαρακτηριστικό όνομα έχει το mD! και όχι σκέτο m!...');
    await showBubble(3, 'Επομένως η ιδιαιτερότητα του κάθε ταλαντωτή δηλαδή η «εμμονή» του να έχει χαρακτηριστική Περίοδο Τ (χαρακτηριστική επομένως f και ω) οφείλεται 1. στον «σωματότυπό του» m και 2. στο ελαστικό αίτιο (που πιθανά να εμπεριέχεται σ’ αυτό, το D του ονόματός του)!');
    await showBubble(0, 'Πωωωω! ελάτε, αφήστε τα, πάμε παρακάτω….');

    await showBubble(2, 'Ας δούμε πώς γράφεται ο 2ος Νόμος του Νεύτωνα για την περίπτωση του ταλαντωτή!');
    addLawLine('ΣF = m·a', 5);

    await showBubble(4, '… ΣF=ma γενικά και επομένως εδώ με τη βοήθεια της (3) ΣF = -m·ω²·A·ημ(ωt+φ₀) (5)!');
    addLawLine('ΣF = -m·ω²·A·ημ(ωt+φ₀)', 5);

    await showBubble(1, '… και με βάση την (4) μπορεί να γραφτεί και ως ΣF = -m·ω²·x (6)!');
    addLawLine('ΣF = -m·ω²·x', 6);

    await showBubble(3, 'Όμως! Η (6) δείτε-περιέχει δύο σταθερές του ηθοποιού τον «σωματότυπο» (m) και την «εμμονή» του (ω)!');
    await showBubble(0, 'Να κάνουμε λέτε εμείς τις δύο σταθερές μία και να την ονομάσουμε … D=m·ω² (6’); βγάζει νόημα;');
    await showBubble(2, 'Αν την αποδώσουμε στο ελαστικό αίτιο, ως δική του σταθερά D, τότε όλα βγάζουν νόημα: Ο ηθοποιός έχει τη δική του σταθερή μάζα m1, το ελαστικό αίτιο τη δική του σταθερά D1. ‘Ετσι, εξηγείται το ότι ο ηθοποιός ανεξαρτήτως σκηνής και παραγωγού, «εμμονικά» διατηρεί την περίοδό του σταθερή! μας το δείχνει η παραπάνω σχέση (6’) D=m·ω² που λέει ότι με σταθερά τα m και D, σταθερή θα είναι η ω του ηθοποιού!');
    await showBubble(4, '… χμμμ δικαιολογημένα λοιπόν τον πρωταγωνιστή-ταλαντωτή (=ηθοποιός+ελαστικό αίτιο) τον λένε m,D!');
    await showBubble(1, '…αλλά και η (6)-μη ξεχνιόμαστε!, γίνεται ΣF = −D·x (7)!');
    addLawLine('ΣF = −D·x', 7);

    // --- ΚΛΕΙΣΙΜΟ ΠΡΑΞΗΣ 2: κρύψε marker, σταμάτα ghost, κλείσε αυλαία + φουαγιέ ---
    closeAct2AndShowFoyer();
    FINISHED = true;
  }

  function startAct2Once() {
    if (STARTED || FINISHED) return;
    if (!ensureRefs()) { console.error('act2.js: λείπουν στοιχεία σκηνής'); return; }
    STARTED = true;
    setTimeout(playAct2, 200);
  }

  document.addEventListener('DOMContentLoaded', () => {
    hardenManualStartButton();
  });

  // ΜΟΝΟ manual σήμα
  document.addEventListener('act2-start-manual', startAct2Once);
})();
