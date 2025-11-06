/* act2.js — Πράξη 2 με σωστό sequencing, ghost απολύτως συνευθυγραμμισμένο & Aghost=5m */
(function(){
  'use strict';

  let ACT2_STARTED = false, ACT2_DONE = false;

  let stage, springEl, signboard, actor;
  const $ = (id)=>document.getElementById(id);

  function ensureRefs(){
    stage     = stage     || $('stage');
    springEl  = springEl  || $('spring');
    signboard = signboard || document.querySelector('.signboard');
    actor     = actor     || $('actor');
    return !!stage;
  }

  function setSignboardAct2(){
    if (!signboard) return;
    const h1 = signboard.querySelector('h1');
    const lA = $('sbLineA'), lB = $('sbLineB'), lC = $('sbLineC');
    if (h1) h1.textContent = 'Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!';
    if (lA) lA.textContent = 'm₁ = … Kg , D₁ = … N/m';
    if (lB) lB.textContent = 'Εμηχ = … J';
    if (lC) lC.textContent = 'Παραγωγή-Σκηνοθεσία: Εμηχ. Ενεργειούλης';
  }
  function showSpring(){ if(springEl){ springEl.style.display='block'; springEl.style.opacity='1'; } }

  /* ---------- GHOST ---------- */
  let ghostEl=null, ghostSpring=null, ghostRAF=0, ghostStopTime=0;

  function ensureGhostElems(){
    if (!actor || !springEl) return;
    const stageEl = document.querySelector('.stage') || document.body;

    if (!ghostEl){
      const g = document.createElement('img');
      g.id='ghost';
      g.src = actor.querySelector('img') ? actor.querySelector('img').src : 'skater.png';
      g.style.position='absolute';
      g.style.bottom = getComputedStyle(actor).bottom;
      g.style.left   = '50%';
      g.style.transform='translate(-50%,0)';
      g.style.width  = actor.offsetWidth ? (actor.offsetWidth+'px') : '144px';
      g.style.height = 'auto';
      g.style.opacity= '0.35';
      g.style.filter = 'drop-shadow(0 4px 6px rgba(0,0,0,.6))';
      g.style.zIndex = '120'; // μπροστά από actor (110)
      g.style.pointerEvents='none';
      stageEl.appendChild(g);
      ghostEl=g;
    }

    if (!ghostSpring){
      const gs = document.createElement('img');
      gs.id='ghostSpring';
      gs.src = springEl.src;
      gs.style.position='absolute';
      gs.style.bottom = getComputedStyle(springEl).bottom;
      gs.style.left   = (typeof window.anchorX==='function' ? window.anchorX() : (stage.clientWidth*0.18)) + 'px';
      gs.style.height = springEl.style.height || '96px';
      gs.style.width  = (springEl.getBoundingClientRect().width||160)+'px';
      gs.style.opacity= '0.35';
      gs.style.filter = 'drop-shadow(0 4px 6px rgba(0,0,0,.55))';
      gs.style.zIndex = '121';
      gs.style.pointerEvents='none';
      stageEl.appendChild(gs);
      ghostSpring=gs;
    }
  }

  function startGhostSync(durationMs){
    ensureGhostElems();
    const T  = (window.T || 6.0);
    const ω  = (window.omega || (2*Math.PI/T));
    const centerX   = stage.clientWidth/2;
    const pxPerM   = window.pxPerMeter || 50;
    const ApxGhost = 5 * pxPerM;   // ΠΛΑΤΟΣ 5 m
    const actorW   = (actor && actor.getBoundingClientRect().width) || 144;
    const hookOff  = actorW/2;
    const ax       = (typeof window.anchorX==='function' ? window.anchorX() : (stage.clientWidth*0.18));

    const L0 = (function(){
      const r = springEl.getBoundingClientRect();
      return r.width>0 ? r.width : 160;
    })();

    function step(){
      const tPlay = (typeof window.playbackTime==='number') ? window.playbackTime : (performance.now()/1000);
      const xHook = centerX + ApxGhost * Math.sin(ω * tPlay);

      ghostEl.style.left = (xHook - hookOff) + 'px';

      const dist = xHook - ax;
      const scale = Math.max(0.12, dist / L0);
      ghostSpring.style.left  = ax + 'px';
      ghostSpring.style.width = (L0 * scale) + 'px';

      if (performance.now() < ghostStopTime){
        ghostRAF = requestAnimationFrame(step);
      }else{
        cancelAnimationFrame(ghostRAF); ghostRAF=0;
        try{ ghostEl.remove(); }catch(_){}
        try{ ghostSpring.remove(); }catch(_){}
        ghostEl=null; ghostSpring=null;
      }
    }
    ghostStopTime = performance.now() + durationMs;
    if(!ghostRAF) ghostRAF=requestAnimationFrame(step);
  }

  /* ---------- Sequencing ---------- */
  const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
  function showBubble(viewer, text){
    window.TYPE_CHAR_MS  = 55;
    window.THINK_GAP_MS  = 950;

    const perChar = window.TYPE_CHAR_MS;
    const gap     = window.THINK_GAP_MS;
    const resolved = (typeof text === 'function') ? text() : text;
    const durMs   = Math.max(1500, (String(resolved||'').length * perChar) + gap);

    if (typeof window.showThoughtForViewer === 'function'){
      window.showThoughtForViewer(viewer, resolved, /*customLift*/135, /*xShift*/0);
    }
    return sleep(durMs);
  }
  function addLawLine(txt, n){
    try{
      if (typeof window.addLaw === 'function') window.addLaw(txt, n);
    }catch(_){}
  }

  function ensureFoyerOverlay(){
    let ov = document.getElementById('actBreak2F');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'actBreak2F';
    ov.style.cssText = 'position:absolute;inset:0;display:none;align-items:center;justify-content:center;text-align:center;z-index:410;background:rgba(0,0,0,.55)';
    const box = document.createElement('div');
    box.style.cssText='background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.25);border-radius:12px;padding:16px 20px;max-width:520px;color:#fff';
    box.innerHTML = `
      <h3 style="margin:0 0 8px 0">Διάλειμμα</h3>
      <p style="margin:0 0 12px 0">Περάστε στο Φουαγιέ για απόψεις & αποδείξεις.</p>
      <button id="btnFoyer" style="background:#700;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-size:16px;cursor:pointer">Είσοδος στο Φουαγιέ</button>
    `;
    ov.appendChild(box);
    (document.querySelector('.stage')||document.body).appendChild(ov);
    box.querySelector('#btnFoyer').addEventListener('click', ()=>{ ov.style.display='none'; try{ document.dispatchEvent(new Event('act3-start')); }catch(_){} });
    return ov;
  }

  async function playAct2(){
    if (!ensureRefs()) return;
    stage.classList.add('open');
    showSpring();
    setSignboardAct2();

    // Ghost εμφανίζεται από #3 έως #7 περίπου (10s)
    await showBubble(0, "ωπ! δεμένος σε ελατήριο είναι ο m1D1!");
    startGhostSync(10000);

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

    // Κλείσιμο αυλαίας, δεν ξανανοίγει — φουαγιέ
    stage.classList.remove('open');
    setTimeout(()=>{ ensureFoyerOverlay().style.display='flex'; ACT2_DONE = true; }, 1500);
  }

  function startAct2Once(){
    if (ACT2_STARTED || ACT2_DONE) return;
    if (!ensureRefs()){ console.error('act2.js: λείπει #stage'); return; }
    ACT2_STARTED = true;
    setTimeout(playAct2, 250);
  }

  document.addEventListener('act2-start', startAct2Once);
})();