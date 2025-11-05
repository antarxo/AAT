// act2.js — ΣΕΙΡΙΑΚΗ εκτέλεση βημάτων, ανεξάρτητη από t_obs.
// Περιμένει κάθε bubble να ολοκληρωθεί (typewriter + check/close + post-gap) και μετά συνεχίζει.

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

  // Ghost (πάνω από m1D1)
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

  // t_obs (μόνο για ghost animation)
  function getObsTime(){
    if(!clockEl) return 0;
    const m = /([-+]?\d+(?:\.\d+)?)\s*s/.exec(clockEl.textContent||'');
    return m ? parseFloat(m[1]) : 0;
  }

  // === Βοηθητικά για σειριακή ροή ===
  function waitBubblesIdle(){
    return new Promise(res=>{
      (function probe(){
        if(!window.isBubbleActive) res(); else setTimeout(probe, 40);
      })();
    });
  }
  async function bubble(viewer, text, lift=130, xShift=0){
    await waitBubblesIdle(); // ασφάλεια
    window.showThoughtForViewer && window.showThoughtForViewer(viewer, text, undefined, lift, xShift);
    await new Promise(res=>{
      (function probe(){
        if(!window.isBubbleActive) res(); else setTimeout(probe, 40);
      })();
    });
  }
  function law(txt){ window.addLaw && window.addLaw(txt); }

  // === Βήματα Πράξης 2 (αυτολεξεί + σημεία στίξης) ===
  const steps = [
    // 1) Άνοιγμα σκηνής + ελατήριο
    async ()=>{ stage.classList.add('open'); springEl.style.display='block'; },

    // 2) Τίτλοι/τιμές
    async ()=>{
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
    },

    // 3–7) Ghost block (3 σκέψεις με ghost on, 1 με ghost off)
    async ()=>{ await bubble(1,'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!'); },
    async ()=>{ ghostShow(); await bubble(3,'αυτόν ακριβώς τον m₁D₁ σίγουρα τον έχω ξαναδεί με το ίδιο μηχανισμό-ελατήριο σε άλλη παράσταση, αλλά με άλλον παραγωγό!'); },
    async ()=>{ await bubble(4,'…ναι, και εκεί πάλι με την ίδια περίοδο όμως εμμονικά κινήθηκε, αλλά με μεγαλύτερο πλάτος A!'); },
    async ()=>{ await bubble(2,'Χμμμ… Πρωταγωνιστής μάλλον είναι ο κινούμενος ηθοποιός και τα εργαλεία του μαζί!'); ghostHide(); },

    // 8–12)
    async ()=>{ await bubble(0,'Τώρα καταλαβαίνω μάλλον γιατί δεν τον λένε m₁ αλλά m₁,D₁…'); },
    async ()=>{ await bubble(1,'… το m₁ είναι η μάζα του ηθοποιού αλλά, ως ταλαντωτής, νοείται η σύμπραξη του ηθοποιού (m₁) και του «ελαστικού» αιτίου-δύναμης, στο οποίο αναφέρεται το D₁!'); },
    async ()=>{ await bubble(3,'…m₁ και D₁ δηλαδή πάνε παντού «πακέτο» — και τα δύο μαζί είναι ο ταλαντωτής, ο πρωταγωνιστής!'); },
    async ()=>{ await bubble(4,'…δηλαδή κάθε ταλαντωτής χαρακτηρίζεται 1) από τη μάζα του και 2) από το ελαστικό αίτιο-δύναμη που του ρυθμίζει χρονικά (Τ) την ταλάντωση!'); },
    async ()=>{ await bubble(2,'…αρχίζω να πείθομαι γιατί σαν χαρακτηριστικό όνομα έχει το mD — και όχι σκέτο m!'); },

    // 13–25) Νευτωνας → (5), (6), (6′), (7)
    async ()=>{ await bubble(0,'Ας δούμε πώς γράφεται ο 2ος Νόμος του Νεύτωνα για την περίπτωση του ταλαντωτή!'); },

    async ()=>{ await bubble(1,'ΣF = m·a γενικά, και επομένως εδώ, με τη βοήθεια της (3): ΣF = −mω²A·ημ(ωt+φ₀) (5)!'); law('ΣF(t) = −m ω² A·sin(ωt + φ₀)'); },
    async ()=>{ await bubble(3,'… και με βάση την (4) μπορεί να γραφτεί και ως: ΣF = −mω²x (6)!'); law('ΣF(x) = −m ω² x'); },

    async ()=>{ await bubble(4,'Όμως! Η (6) περιέχει δύο σταθερές του ηθοποιού: τον «σωματότυπο» m και την «εμμονή» ω!'); },
    async ()=>{ await bubble(2,'Να κάνουμε τις δύο σταθερές μία, την D = m·ω² (6′); βγάζει νόημα;'); },
    async ()=>{ await bubble(0,'Αν την αποδώσουμε στο ελαστικό αίτιο ως δική του σταθερά D, τότε, με σταθερά τα m και D, σταθερή θα είναι η ω του ηθοποιού!'); },
    async ()=>{ await bubble(1,'… χμμμ δικαιολογημένα λοιπόν τον πρωταγωνιστή-ταλαντωτή (=ηθοποιός + ελαστικό αίτιο) τον λένε m,D!'); },
    async ()=>{ await bubble(3,'…οπότε η (6) γίνεται: ΣF = −D x (7)!'); law('ΣF(x) = −D x'); },

    // Τέλος: κλείσιμο κουρτίνας + διάλειμμα/φουαγιέ
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

  let started=false;
  async function runAct2(){
    if(started) return; started=true;
    for (const step of steps){ try{ await step(); }catch(e){ console.error('Act2 step error:', e); } }
  }

  document.addEventListener('act2-start', runAct2);
})();
