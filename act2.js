// act2.js — Σειριακή ροή με σωστό timing: προχωράει ΜΟΝΟ όταν κλείσει το bubble.
// Δεν εξαρτάται από window.isBubbleActive. Ακούει "bubble:closed" ή παρατηρεί το bubble DOM.

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

  // ---------- Hook: εκπέμπουμε event όταν κλείνει το bubble ----------
  (function hookBubbleCloseEvent(){
    const origResume = window.resumeFromBubble;
    if (typeof origResume === 'function' && !window.__bubbleCloseHooked) {
      window.__bubbleCloseHooked = true;
      window.resumeFromBubble = function(nextMode){
        try { document.dispatchEvent(new CustomEvent('bubble:willClose')); } catch(_) {}
        const r = origResume.apply(this, arguments);
        // το bubble κλείνει ~800ms μετά το κάλεσμα του resumeFromBubble
        setTimeout(() => {
          try { document.dispatchEvent(new CustomEvent('bubble:closed')); } catch(_) {}
        }, 850);
        return r;
      };
    }
  })();

  // ---------- Helpers ----------
  function bubbleIsOpen(){
    if (!bubbleEl) return false;
    // εμφανές όταν display != 'none' και έχει 'active'
    const visible = window.getComputedStyle(bubbleEl).display !== 'none';
    return visible && bubbleEl.classList.contains('active');
  }

  function waitBubblesIdle(){
    return new Promise(resolve => {
      if (!bubbleIsOpen()) return resolve();
      const done = () => resolve();
      const once = () => { document.removeEventListener('bubble:closed', once); done(); };
      document.addEventListener('bubble:closed', once, { once: true });

      // Ασφάλεια: αν για κάποιο λόγο δεν έρθει event, κάνε fallback σε polling
      let tries = 0;
      const id = setInterval(() => {
        if (!bubbleIsOpen() || tries++ > 600) { // ~30s cap
          clearInterval(id);
          document.removeEventListener('bubble:closed', once);
          done();
        }
      }, 50);
    });
  }

  async function bubble(viewer, text, lift=130, xShift=0){
    await waitBubblesIdle(); // βεβαιώσου ότι δεν υπάρχει άλλο ανοιχτό
    if (typeof window.showThoughtForViewer === 'function') {
      window.showThoughtForViewer(viewer, text, undefined, lift, xShift);
    }
    await waitBubblesIdle(); // περίμενε να κλείσει αυτό
  }

  function law(line){ if (typeof window.addLaw === 'function') window.addLaw(line); }

  // ---------- Ghost (πάνω από m₁D₁, τρία bubbles διάρκειας) ----------
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
    ghostEl.style.width  = '144px';
    ghostEl.style.height = '96px';
    ghostEl.style.transform='translate(-50%,0)';
    ghostEl.style.zIndex='200';   // πάνω από τον m₁D₁ (actor z-index 110)
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
    const Aghost = (window.A_m || 3.0) * 1.35;
    const omega  = (window.omega || 2*Math.PI/(window.T||6));
    const cx     = stage.clientWidth/2;
    const hookX  = cx + (Aghost*(window.pxPerMeter||50)) * Math.sin(omega*tObs);
    const w = ghostEl.getBoundingClientRect().width || 144;
    ghostEl.style.left = (hookX - w/2) + 'px';
    ghostRAF = requestAnimationFrame(loopGhost);
  }

  // ---------- Βήματα Πράξης 2 (σειριακά, με σωστό blocking) ----------
  const steps = [
    async ()=>{ stage.classList.add('open'); springEl.style.display='block'; },

    async ()=>{
      const m = (window.m || 70);
      const ω = (window.omega || 2*Math.PI/(window.T||6));
      const D = (window.D || Math.round(m*ω*ω));
      const A = (window.A_m || 3.0);
      const E = 0.5*D*A*A;

      if (sbH1) sbH1.textContent = 'Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!';
      if (sbA)  sbA.textContent  = `m₁ = ${m.toFixed ? m.toFixed(0) : m} kg , D₁ = ${D.toFixed ? D.toFixed(0) : D} N/m`;
      if (sbB)  sbB.textContent  = `E_μηχ = ${E.toFixed ? E.toFixed(2) : E} J`;
      if (sbC)  sbC.textContent  = '—';
      if (sbD)  sbD.textContent  = '—';
    },

    // 3 bubbles με ghost on
    async ()=>{ await bubble(1,'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!'); },
    async ()=>{ ghostShow(); await bubble(3,'αυτόν ακριβώς τον m₁D₁ σίγουρα τον έχω ξαναδεί με το ίδιο μηχανισμό-ελατήριο σε άλλη παράσταση, αλλά με άλλον παραγωγό!'); },
    async ()=>{ await bubble(4,'…ναι, και εκεί πάλι με την ίδια περίοδο όμως εμμονικά κινήθηκε, αλλά με μεγαλύτερο πλάτος A!'); },
    async ()=>{ await bubble(2,'Χμμμ… Πρωταγωνιστής μάλλον είναι ο κινούμενος ηθοποιός και τα εργαλεία του μαζί!'); ghostHide(); },

    async ()=>{ await bubble(0,'Τώρα καταλαβαίνω μάλλον γιατί δεν τον λένε m₁ αλλά m₁,D₁…'); },
    async ()=>{ await bubble(1,'… το m₁ είναι η μάζα του ηθοποιού αλλά, ως ταλαντωτής, νοείται η σύμπραξη του ηθοποιού (m₁) και του «ελαστικού» αιτίου-δύναμης, στο οποίο αναφέρεται το D₁!'); },
    async ()=>{ await bubble(3,'…m₁ και D₁ δηλαδή πάνε παντού «πακέτο» — και τα δύο μαζί είναι ο ταλαντωτής, ο πρωταγωνιστής!'); },
    async ()=>{ await bubble(4,'…δηλαδή κάθε ταλαντωτής χαρακτηρίζεται 1) από τη μάζα του και 2) από το ελαστικό αίτιο-δύναμη που του ρυθμίζει χρονικά (T) την ταλάντωση!'); },
    async ()=>{ await bubble(2,'…αρχίζω να πείθομαι γιατί σαν χαρακτηριστικό όνομα έχει το mD — και όχι σκέτο m!'); },

    async ()=>{ await bubble(0,'Ας δούμε πώς γράφεται ο 2ος Νόμος του Νεύτωνα για την περίπτωση του ταλαντωτή!'); },

    async ()=>{ await bubble(1,'ΣF = m·a γενικά, και επομένως εδώ, με τη βοήθεια της (3): ΣF = −mω²A·ημ(ωt+φ₀) (5)!'); law('ΣF(t) = −m ω² A·sin(ωt + φ₀)'); },
    async ()=>{ await bubble(3,'… και με βάση την (4) μπορεί να γραφτεί και ως: ΣF = −mω²x (6)!');                law('ΣF(x) = −m ω² x');          },

    async ()=>{ await bubble(4,'Όμως! Η (6) περιέχει δύο σταθερές του ηθοποιού: τον «σωματότυπο» m και την «εμμονή» ω!'); },
    async ()=>{ await bubble(2,'Να κάνουμε τις δύο σταθερές μία, την D = m·ω² (6′); βγάζει νόημα;'); },
    async ()=>{ await bubble(0,'Αν την αποδώσουμε στο ελαστικό αίτιο ως δική του σταθερά D, τότε, με σταθερά τα m και D, σταθερή θα είναι η ω του ηθοποιού!'); },
    async ()=>{ await bubble(1,'… χμμμ δικαιολογημένα λοιπόν τον πρωταγωνιστή-ταλαντωτή (=ηθοποιός + ελαστικό αίτιο) τον λένε m,D!'); },
    async ()=>{ await bubble(3,'…οπότε η (6) γίνεται: ΣF = −D x (7)!'); law('ΣF(x) = −D x'); },

    // Κλείσιμο αυλαίας + πλαίσιο για φουαγιέ
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

  // Εκκίνηση από το κουμπί (όπως πριν)
  document.addEventListener('act2-start', runAct2);
})();
