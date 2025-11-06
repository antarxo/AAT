/* act2.js — Πράξη 2: sequencing, ghost, νόμοι, σωστό τέλος + ξεχωριστό overlay για Φουαγιέ */
(function(){
  'use strict';

  let ACT2_STARTED = false;
  let ACT2_DONE    = false;

  let stage, springEl, signboard, actor;

  function $(id){ return document.getElementById(id); }
  function ensureRefs(){
    if (!stage)     stage     = $('stage');
    if (!springEl)  springEl  = $('spring');
    if (!signboard) signboard = document.querySelector('.signboard');
    if (!actor)     actor     = $('actor');
    return !!stage;
  }

  function setSignboardAct2(){
    if (!signboard) signboard = document.querySelector('.signboard');
    if (!signboard) return;
    const h1 = signboard.querySelector('h1');
    const lA = $('sbLineA'), lB = $('sbLineB'), lC = $('sbLineC');
    if (h1) h1.textContent = 'Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!';
    if (lA) lA.textContent = 'm₁ = … Kg , D₁ = … N/m';
    if (lB) lB.textContent = 'Εμηχ = … J';
    if (lC) lC.textContent = 'Παραγωγή-Σκηνοθεσία: Εμηχ. Ενεργειούλης';
  }

  function showSpring(){
    if (!springEl) springEl = $('spring');
    if (springEl){ springEl.style.display='block'; springEl.style.opacity='1'; }
  }

  /* ---------- GHOST ---------- */
  let ghostEl=null, ghostRAF=0, ghostStopTime=0;
  function ensureGhost(){
    if (ghostEl) return ghostEl;
    if (!actor) actor = $('actor');
    const g = document.createElement('img');
    g.id='ghost';
    g.src = (actor && actor.querySelector('img')) ? actor.querySelector('img').src : 'skater.png';
    g.style.position='absolute';
    g.style.bottom   = getComputedStyle(actor||document.body).bottom || 'calc(32vh + 133px)';
    g.style.left     = '50%';
    g.style.transform= 'translate(-50%,0)';
    g.style.width    = (actor && actor.offsetWidth ? actor.offsetWidth : 144) + 'px';
    g.style.height   = 'auto';
    g.style.opacity  = '0.35';
    g.style.filter   = 'drop-shadow(0 4px 6px rgba(0,0,0,.6))';
    g.style.zIndex   = '120'; // μπροστά από τον ηθοποιό
    g.style.pointerEvents='none';
    (document.querySelector('.stage')||document.body).appendChild(g);
    ghostEl=g;
    return g;
  }
  function startGhost(durationMs){
    if (!ensureRefs()) return;
    ensureGhost();
    const t0 = performance.now();
    const T  = (window.T || 6.0);
    const ω  = 2*Math.PI/T;
    const Apx = (window.A_px || 150) * 1.25;
    const centerX = stage.clientWidth/2;
    const hookOffset = (actor && actor.getBoundingClientRect().width ? actor.getBoundingClientRect().width/2 : 72);

    function step(now){
      const t=(now - t0)/1000;
      const x=centerX + Apx*Math.sin(ω*t);
      ghostEl.style.left=(x - hookOffset)+'px';
      if(now < ghostStopTime){
        ghostRAF=requestAnimationFrame(step);
      }else{
        cancelAnimationFrame(ghostRAF); ghostRAF=0;
        try{ ghostEl.remove(); }catch(_){ ghostEl.style.display='none'; }
        ghostEl=null;
      }
    }
    ghostStopTime = performance.now() + durationMs;
    if(!ghostRAF) ghostRAF=requestAnimationFrame(step);
  }

  /* ---------- HELPERS ---------- */
  const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
  function showBubble(viewer, text){
    const perChar = window.TYPE_CHAR_MS || 45;
    const gap     = window.THINK_GAP_MS || 700;
    const resolved = (typeof text === 'function') ? text() : text;
    const durMs   = Math.max(1400, (String(resolved||'').length * perChar) + gap);
    if (typeof window.showThoughtForViewer === 'function') {
      window.showThoughtForViewer(viewer, resolved, 135, 0);
    }
    return sleep(durMs);
  }
  function addLawLine(txt, n){
    if (typeof window.addLaw === 'function'){ window.addLaw(txt, n); }
  }

  /* ---------- END + OVERLAY (Act2 → Foyer) ---------- */
  function ensureFoyerOverlay(){
    let ov = document.getElementById('actBreak2F');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'actBreak2F';
    ov.style.position='absolute';
    ov.style.inset='0';
    ov.style.display='none';
    ov.style.alignItems='center';
    ov.style.justifyContent='center';
    ov.style.textAlign='center';
    ov.style.zIndex='410';
    ov.style.background='rgba(0,0,0,.55)';

    const box = document.createElement('div');
    box.style.cssText='background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.25);border-radius:12px;padding:16px 20px;max-width:520px;color:#fff';
    box.innerHTML = `
      <h3 style="margin:0 0 8px 0">Διάλειμμα</h3>
      <p style="margin:0 0 12px 0">Περάστε στο Φουαγιέ για απόψεις & αποδείξεις.</p>
      <button id="btnFoyer" style="background:#700;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-size:16px;cursor:pointer">Είσοδος στο Φουαγιέ</button>
    `;
    ov.appendChild(box);
    (document.querySelector('.stage')||document.body).appendChild(ov);

    const btn = box.querySelector('#btnFoyer');
    btn.addEventListener('click', function(){
      ov.style.display='none';
      try{ document.dispatchEvent(new Event('act3-start')); }catch(_){}
    });

    return ov;
  }

  function endAct2(){
    if (ACT2_DONE) return;
    ACT2_DONE = true;

    if (ensureRefs()){
      // κλείσιμο αυλαίας — δεν ξανανοίγει
      stage.classList.remove('open');
    }

    // Μετά από ~1.5s εμφάνιση overlay για Φουαγιέ (ΔΕΝ αγγίζουμε το actBreak/btnAct2 της Πράξης 1)
    setTimeout(function(){
      const ov = ensureFoyerOverlay();
      ov.style.display='flex';
    }, 1500);
  }

  /* ---------- MAIN SEQUENCE ---------- */
  async function playAct2(){
    if (ACT2_DONE) return;
    if (!ensureRefs()){ console.error('act2.js: λείπει #stage'); return; }

    ACT2_STARTED = true;

    // Άνοιγμα σκηνής + τίτλοι + ελατήριο
    stage.classList.add('open');
    showSpring();
    setSignboardAct2();

    await showBubble(0, "ωπ! δεμένος σε ελατήριο είναι ο m1D1!");
    startGhost(10000); // καλύπτει τις 3 επόμενες σκέψεις

    await showBubble(2, "αυτόν ακριβώς τον m1D1 σίγουρα τον έχω ξαναδεί με το ίδιο μηχανισμό-ελατήριο σε άλλη παράσταση, αλλά με άλλον παραγωγό!");
    await showBubble(4, "...ναι και εκεί πάλι με την ίδια περίοδο όμως εμμονικά κινήθηκε, αλλά με μεγαλύτερο πλάτος Α!");
    await showBubble(1, "Χμμμ… Πρωταγωνιστής μάλλον είναι ο κινούμενος ηθοποιός και τα εργαλεία του μαζί!");
    await showBubble(3, "Τώρα καταλαβαίνω μάλλον γιατί δεν τον λένε m1 αλλά m1,D1…");
    await showBubble(0, "… το m1 είναι η μάζα του ηθοποιού αλλά ταλαντωτής προφανώς, νοείται η σύμπραξη του ηθοποιού(m1) και του «ελαστικού» αιτίου-δύναμη, στο οποίο αναφέρεται ως φαίνεται το D1!");
    await showBubble(2, "…m1 και D1 δηλαδή πάνε παντού ..πακέτο! και τα δυο μαζί είναι  ο ταλαντωτής- ο πρωταγωνιστής!");
    await showBubble(4, "… δηλαδή κάθε ταλαντωτής χαρακτηρίζεται 1. από τη μάζα του και 2. από το ελαστικό αίτιο-δύναμη που του ρυθμίζει χρονικά (Τ) την ταλάντωση!");
    await showBubble(1, "…αρχίζω να πείθομαι γιατί σαν χαρακτηριστικό όνομα έχει το mD! και όχι σκέτο m!...");
    await showBubble(3, "Επομένως η ιδιαιτερότητα του κάθε ταλαντωτή δηλαδή η «εμμονή» του να έχει χαρακτηριστική Περίοδο Τ (χαρακτηριστική επομένως f και ω) οφείλεται 1. στον «σωματότυπό του» m και 2. στο ελαστικό αίτιο (που πιθανά να εμπεριέχεται σ’ αυτό, το D του ονόματός του)!");
    await showBubble(0, "Πωωωω! ελάτε, αφήστε τα, πάμε παρακάτω….");

    await showBubble(2, "Ας δούμε πώς γράφεται ο 2ος Νόμος του Νεύτωνα για την περίπτωση του ταλαντωτή!");
    addLawLine("ΣF = m·a", 5);

    await showBubble(4, "… ΣF=ma γενικά και επομένως εδώ με τη βοήθεια της (3) ΣF = -m·ω²·A·ημ(ωt+φ₀) (5)!");
    addLawLine("ΣF = -m·ω²·A·ημ(ωt+φ₀)", 5);

    await showBubble(1, "… και με βάση την (4) μπορεί να γραφτεί και ως ΣF = -m·ω²·x (6)!");
    addLawLine("ΣF = -m·ω²·x", 6);

    await showBubble(3, "Όμως! Η (6) δείτε-περιέχει δύο σταθερές του ηθοποιού τον «σωματότυπο» (m) και την «εμμονή» του (ω)!");
    await showBubble(0, "Να κάνουμε λέτε εμείς τις δύο σταθερές μία και να την ονομάσουμε … D=m·ω² (6’); βγάζει νόημα;");
    await showBubble(2, "Αν την αποδώσουμε στο ελαστικό αίτιο, ως δική του σταθερά D, τότε όλα βγάζουν νόημα: Ο ηθοποιός έχει τη δική του σταθερή μάζα m1, το ελαστικό αίτιο τη δική του σταθερά D1. ‘Ετσι, εξηγείται το ότι ο ηθοποιός ανεξαρτήτως σκηνής και παραγωγού, «εμμονικά» διατηρεί την περίοδό του σταθερή! μας το δείχνει η παραπάνω σχέση (6’) D=m·ω² που λέει ότι με σταθερά τα m και D, σταθερή θα είναι η ω του ηθοποιού!");
    await showBubble(4, "… χμμμ δικαιολογημένα λοιπόν τον πρωταγωνιστή-ταλαντωτή (=ηθοποιός+ελαστικό αίτιο) τον λένε m,D!");
    await showBubble(1, "…αλλά και η (6)-μη ξεχνιόμαστε!, γίνεται ΣF = −D·x (7)!");
    addLawLine("ΣF = −D·x", 7);

    endAct2();
  }

  function startAct2Once(){
    if (ACT2_STARTED || ACT2_DONE) return;
    if (!ensureRefs()){ console.error('act2.js: δεν βρέθηκε #stage'); return; }
    ACT2_STARTED = true;
    setTimeout(playAct2, 300);
  }

  // ΜΟΝΟ αυτό: κουμπί μετά την 1η → 2η
  document.addEventListener('act2-start', startAct2Once);
  // Καμία ανάμιξη με act3 εδώ.

})();
