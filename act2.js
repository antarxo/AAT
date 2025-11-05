// act2.js — Πράξη 2 ακριβές κείμενο, σωστός χρονισμός (block έως να κλείσει bubble), ghost μπροστά.

(function () {
  'use strict';

  const stage     = document.getElementById('stage');
  const springEl  = document.getElementById('spring');
  const actor     = document.getElementById('actor');
  const clockEl   = document.getElementById('clock');
  const bubbleEl  = document.getElementById('bubble0');

  const sbH1 = document.querySelector('.signboard h1');
  const sbA  = document.getElementById('sbLineA');
  const sbB  = document.getElementById('sbLineB');
  const sbC  = document.getElementById('sbLineC');
  const sbD  = document.getElementById('sbLineD');

  // === hook για event όταν κλείνει το bubble (για σωστό sequencing) ===
  (function hookBubbleCloseEvent(){
    const origResume = window.resumeFromBubble;
    if (typeof origResume === 'function' && !window.__bubbleCloseHooked) {
      window.__bubbleCloseHooked = true;
      window.resumeFromBubble = function(nextMode){
        try { document.dispatchEvent(new CustomEvent('bubble:willClose')); } catch(_) {}
        const r = origResume.apply(this, arguments);
        setTimeout(() => {
          try { document.dispatchEvent(new CustomEvent('bubble:closed')); } catch(_) {}
        }, 850);
        return r;
      };
    }
  })();

  function bubbleIsOpen(){
    if (!bubbleEl) return false;
    const visible = window.getComputedStyle(bubbleEl).display !== 'none';
    return visible && bubbleEl.classList.contains('active');
  }
  function waitBubblesIdle(){
    return new Promise(resolve => {
      if (!bubbleIsOpen()) return resolve();
      const done = () => resolve();
      const once = () => { document.removeEventListener('bubble:closed', once); done(); };
      document.addEventListener('bubble:closed', once, { once: true });
      let tries = 0;
      const id = setInterval(() => {
        if (!bubbleIsOpen() || tries++ > 600) {
          clearInterval(id);
          document.removeEventListener('bubble:closed', once);
          done();
        }
      }, 50);
    });
  }
  async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
  async function bubble(viewer, text, lift=130, xShift=0){
    await waitBubblesIdle();
    if (typeof window.showThoughtForViewer === 'function') {
      window.showThoughtForViewer(viewer, text, undefined, lift, xShift);
    }
    await waitBubblesIdle();
    await sleep(200); // μικρό αναπνευστικό κενό
  }
  function law(line){ if (typeof window.addLaw === 'function') window.addLaw(line); }

  // === ghost (ίδιο μέγεθος με actor, μπροστά, ταλαντώνεται) ===
  let ghostEl=null, ghostRAF=null;
  function ensureGhost(){
    if (ghostEl) return;
    ghostEl = document.createElement('img');
    ghostEl.id = 'ghost';
    ghostEl.src = 'skater.png';
    ghostEl.alt = 'ghost';
    ghostEl.style.position='absolute';
    ghostEl.style.bottom = getComputedStyle(actor).bottom || 'calc(32vh + 133px)';
    ghostEl.style.left   = '50%';
    ghostEl.style.width  = getComputedStyle(actor).width  || '144px';
    ghostEl.style.height = getComputedStyle(actor).height || '96px';
    ghostEl.style.transform='translate(-50%,0)';
    ghostEl.style.zIndex='200';   // > actor (110)
    ghostEl.style.opacity='0.65';
    ghostEl.style.display='none';
    stage.appendChild(ghostEl);
  }
  function getObsTime(){
    if(!clockEl) return 0;
    const m = /([-+]?\d+(?:\.\d+)?)\s*s/.exec(clockEl.textContent||'');
    return m ? parseFloat(m[1]) : 0;
  }
  function ghostShow(){ ensureGhost(); ghostEl.style.display='block'; if(!ghostRAF) ghostRAF=requestAnimationFrame(loopGhost); }
  function ghostHide(){ if(ghostEl) ghostEl.style.display='none'; if(ghostRAF){ cancelAnimationFrame(ghostRAF); ghostRAF=null; } }
  function loopGhost(){
    const tObs   = getObsTime();
    const Aghost = (window.A_m || 3.0) * 1.35; // μεγαλύτερο πλάτος (θύμηση)
    const omega  = (window.omega || 2*Math.PI/(window.T||6));
    const cx     = stage.clientWidth/2;
    const hookX  = cx + (Aghost*(window.pxPerMeter||50)) * Math.sin(omega*tObs);
    const w = ghostEl.getBoundingClientRect().width || 144;
    ghostEl.style.left = (hookX - w/2) + 'px';
    ghostRAF = requestAnimationFrame(loopGhost);
  }

  // === Βήματα Πράξης 2 (αυτολεξεί τα κείμενα) ===
  const steps = [
    // 1: ανοίγει κουρτίνα + φαίνεται ελατήριο
    async ()=>{ stage.classList.add('open'); springEl.style.display='block'; },

    // 2: τίτλος 3 γραμμών με πραγματικές τιμές (kg, N/m, J)
    async ()=>{
      const m = (window.m || 70);
      const ω = (window.omega || 2*Math.PI/(window.T||6));
      const D = (window.D || Math.round(m*ω*ω));
      const A = (window.A_m || 3.0);
      const E = 0.5*D*A*A;
      if (sbH1) sbH1.textContent = "Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!";
      if (sbA)  sbA.textContent  = `m₁ = ${m.toFixed ? m.toFixed(0) : m}Kg , D₁=${D.toFixed ? D.toFixed(0) : D}N/m`;
      if (sbB)  sbB.textContent  = `Εμηχ=${E.toFixed ? E.toFixed(2) : E}J`;
      if (sbC)  sbC.textContent  = "—";
      if (sbD)  sbD.textContent  = "—";
    },

    // 3
    async ()=>{ await bubble(1,"ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!"); },

    // 4–7: ghost on σε αυτά τα τρία bubbles (4,5,7) + εμφάνιση θύμησης (6)
    async ()=>{ ghostShow(); await bubble(3,"αυτόν ακριβώς τον m₁D₁ σίγουρα τον έχω ξαναδεί με το ίδιο μηχανισμό-ελατήριο σε άλλη παράσταση, αλλά με άλλον παραγωγό!"); },
    async ()=>{ await bubble(4,"...ναι και εκεί πάλι με την ίδια περίοδο όμως εμμονικά κινήθηκε, αλλά με μεγαλύτερο πλάτος Α!"); },
    // 6: «Εμφανίζεται η θύμισή τους … αλλά εικόνα ίδιου μεγέθους» -> το κάνει το ghost (ίδιο size με actor)
    async ()=>{ /* οπτική ενέργεια μόνο (ghost φαίνεται ήδη) */ await sleep(300); },
    async ()=>{ await bubble(2,"Χμμμ… Πρωταγωνιστής μάλλον είναι ο κινούμενος ηθοποιός και τα εργαλεία του μαζί!"); ghostHide(); },

    // 8–12
    async ()=>{ await bubble(0,"Τώρα καταλαβαίνω μάλλον γιατί δεν τον λένε m1 αλλά m1,D1…"); },
    async ()=>{ await bubble(1,"… το m1 είναι η μάζα του ηθοποιού αλλά ταλαντωτής προφανώς, νοείται η σύμπραξη του ηθοποιού(m1) και του «ελαστικού» αιτίου-δύναμη, στο οποίο αναφέρεται ως φαίνεται το D1!"); },
    async ()=>{ await bubble(3,"…m1 και D1 δηλαδή πάνε παντού ..πακέτο! και τα δυο μαζί είναι  ο ταλαντωτής- ο πρωταγωνιστής!"); },
    async ()=>{ await bubble(4,"… δηλαδή κάθε ταλαντωτής χαρακτηρίζεται 1. από τη μάζα του και 2. από το ελαστικό αίτιο-δύναμη που του ρυθμίζει χρονικά (Τ) την ταλάντωση!"); },
    async ()=>{ await bubble(2,"…αρχίζω να πείθομαι γιατί σαν χαρακτηριστικό όνομα έχει το mD! και όχι σκέτο m!..."); },

    // 13–14
    async ()=>{ await bubble(0,"Επομένως η ιδιαιτερότητα του κάθε ταλαντωτή δηλαδή η «εμμονή» του να έχει χαρακτηριστική Περίοδο Τ (χαρακτηριστική επομένως f και ω) οφείλεται 1. στον «σωματότυπό του» m και 2. στο ελαστικό αίτιο (που πιθανά να εμπεριέχεται σ αυτό, το D του ονόματός του)!"); },
    async ()=>{ await bubble(1,"Πωωωω! ελάτε, αφήστε τα, πάμε παρακάτω…."); },

    // 15–16 (νόμος 5)
    async ()=>{ await bubble(3,"Ας δούμε πώς γράφεται ο 2ος Νόμος του Νεύτωνα για την περίπτωση του ταλαντωτή!"); },
    async ()=>{ await bubble(4,"… ΣF=ma γενικά και επομένως εδώ με τη βοήθεια της (3) ΣF=-mω2Αημ(ωt+φο) (5)!"); law("ΣF(t) = -mω²Α·ημ(ωt+φ₀)"); },

    // 17 είναι σκηνοθετική οδηγία (προστίθεται ο νόμος)

    // 18 (νόμος 6)
    async ()=>{ await bubble(2,"… και με βάση την (4) μπορεί να γραφτεί και ως ΣF=-mω2x (6)!"); law("ΣF(x) = -mω²x"); },

    // 19 οδηγία (προστίθεται ο νόμος)

    // 20–23
    async ()=>{ await bubble(0,"Όμως! Η (6) δείτε-περιέχει δύο σταθερές του ηθοποιού τον «σωματότυπο» (m) και την «εμμονή» του (ω)!"); },
    async ()=>{ await bubble(1,"Να κάνουμε λέτε εμείς τις δύο σταθερές μία και να την ονομάσουμε … D=mω2 (6’); βγάζει νόημα;"); },
    async ()=>{ await bubble(3,"Αν την αποδώσουμε στο ελαστικό αίτιο, ως δική του σταθερά D, τότε όλα βγάζουν νόημα: Ο ηθοποιός έχει τη δική του σταθερή μάζα m1, το ελαστικό αίτιο τη δική του σταθερά D1. ‘Ετσι, εξηγείται το ότι ο ηθοποιός ανεξαρτήτως σκηνής και παραγωγού, «εμμονικά» διατηρεί την περίοδό του σταθερή! μας το δείχνει η παραπάνω σχέση (6’) D=mω2 που λέει ότι με σταθερά τα m και D, σταθερή θα είναι η ω του ηθοποιού!"); },
    async ()=>{ await bubble(4,"… χμμμ δικαιολογημένα λοιπόν τον πρωταγωνιστή-ταλαντωτή (=ηθοποιός+ελαστικό αίτιο) τον λένε m,D!"); },

    // 24 (νόμος 7)
    async ()=>{ await bubble(2,"…αλλά και η (6)-μη ξεχνιόμαστε!, γίνεται ΣF = −Dx (7)!"); law("ΣF(x) = -Dx"); },

    // 25 οδηγία (προστίθεται ο νόμος) — ήδη έγινε

    // Κλείσιμο αυλαίας, χωρίς επαν-άνοιγμα. Πλαίσιο για φουαγιέ.
    async ()=>{
      if (typeof window.closeCurtainsSequence === 'function') window.closeCurtainsSequence();
      const ttl = document.getElementById('actBreakTitle');
      const msg = document.getElementById('actBreakMsg');
      const btn = document.getElementById('btnAct2');
      if (ttl) ttl.textContent = 'Διάλειμμα — Φουαγιέ';
      if (msg) msg.textContent = 'Προχωράμε στις απόψεις–αποδείξεις στο φουαγιέ.';
      if (btn) btn.textContent = 'Είσοδος στο Φουαγιέ';
    }
  ];

  let started = false;
  async function runAct2(){
    if (started) return;
    started = true;
    for (const step of steps){
      try { await step(); } catch(e){ console.error('Act2 step error:', e); }
    }
  }

  document.addEventListener('act2-start', runAct2);
})();
