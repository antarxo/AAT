// act2.js — Πράξη 2 (δυναμική) με ghost και νέους Νόμους (5),(6),(7)
(function(){
  const stage = document.getElementById('stage');
  const signboard = document.querySelector('.signboard');
  const sbH1 = signboard.querySelector('h1');
  const sbA  = document.getElementById('sbLineA');
  const sbB  = document.getElementById('sbLineB');
  const sbC  = document.getElementById('sbLineC');
  const sbD  = document.getElementById('sbLineD');
  const springEl = document.getElementById('spring');
  const actor = document.getElementById('actor');

  // --- Ghost μπροστά από m₁D₁ ---
  let ghostEl=null, ghostRAF=null, ghostStartT=0;
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
    ghostEl.style.zIndex='200'; // > actor(110)
    ghostEl.style.opacity='0.65';
    ghostEl.style.display='none';
    stage.appendChild(ghostEl);
  }
  function ghostShow(){ ensureGhost(); ghostEl.style.display='block'; ghostStartT=performance.now(); loopGhost(); }
  function ghostHide(){ if(ghostEl) ghostEl.style.display='none'; if(ghostRAF) cancelAnimationFrame(ghostRAF); ghostRAF=null; }
  function loopGhost(){
    const now = performance.now();
    const t = (now-ghostStartT)/1000;
    const Aghost = (window.A_m||0)*1.35;
    const centerX = stage.clientWidth/2;
    const hookX = centerX + (Aghost*(window.pxPerMeter||50))*Math.sin((window.omega||0)*(t+(window.obsStartPlaybackOffset||0)));
    const w = ghostEl.getBoundingClientRect().width||144;
    ghostEl.style.left = (hookX - w/2) + 'px';
    ghostRAF = requestAnimationFrame(loopGhost);
  }

  // --- Σενάριο Πράξης 2 ---
  const lines = [
    // 1) Άνοιγμα κουρτίνας + ελατήριο
    {type:'action', at:0.2, fn: ()=>{ stage.classList.add('open'); springEl.style.display='block'; }},

    // 2) Τίτλοι: «Πράξη 2η…», m₁, D₁, Εμηχ
    {type:'action', at:0.6, fn: ()=>{
      const m = window.m || 70;
      const omega = window.omega || (2*Math.PI/(window.T||6));
      const D = window.D || Math.round(m*omega*omega);
      const A = window.A_m || 3.0;
      const E = 0.5*D*A*A;
      sbH1.textContent = 'Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!';
      sbA.textContent  = `m₁ = ${m.toFixed?m.toFixed(0):m} kg , D₁ = ${D.toFixed?D.toFixed(0):D} N/m`;
      sbB.textContent  = `Εμηχ = ${E.toFixed?E.toFixed(2):E} J`;
      sbC.textContent  = '—'; sbD.textContent='—';
    }},

    // 3–7) Σκέψεις + ghost (βγαίνει στις 4–7)
    {type:'bubble', at:1.0, viewer:1, text:'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!', lift:130, xShift:-10, dur:3},
    {type:'bubble', at:2.0, viewer:3, text:'αυτόν ακριβώς τον m₁D₁ σίγουρα τον έχω ξαναδεί με το ίδιο μηχανισμό-ελατήριο σε άλλη παράσταση, αλλά με άλλον παραγωγό!', lift:135, xShift:10, dur:3, ghost:'start'},
    {type:'bubble', at:3.2, viewer:4, text:'…ναι, και εκεί πάλι με την ίδια περίοδο εμμονικά κινήθηκε, αλλά με μεγαλύτερο πλάτος A!', lift:135, xShift:30, dur:3},
    {type:'bubble', at:4.4, viewer:2, text:'Χμμμ… Πρωταγωνιστής μάλλον είναι ο κινούμενος ηθοποιός και τα εργαλεία του μαζί!', lift:135, xShift:-30, dur:3, ghost:'stop'},

    // 8–12) Συνειδητοποιήσεις για m₁,D₁, ταλαντωτή
    {type:'bubble', at:5.6, viewer:0, text:'Τώρα καταλαβαίνω μάλλον γιατί δεν τον λένε m₁ αλλά m₁,D₁…', lift:130, xShift:-40, dur:3},
    {type:'bubble', at:6.6, viewer:1, text:'… το m₁ είναι η μάζα του ηθοποιού, αλλά ως ΤΑΛΑΝΤΩΤΗΣ νοείται η σύμπραξη m₁ και «ελαστικού» αιτίου-δύναμης, στο οποίο αναφέρεται το D₁!', lift:130, xShift:-10, dur:3},
    {type:'bubble', at:7.7, viewer:3, text:'…m₁ και D₁ πάνε πακέτο — μαζί είναι ο ΤΑΛΑΝΤΩΤΗΣ, ο πρωταγωνιστής!', lift:135, xShift:10, dur:3},
    {type:'bubble', at:8.8, viewer:4, text:'…δηλαδή κάθε ταλαντωτής χαρακτηρίζεται (1) από τη μάζα m και (2) από το ελαστικό αίτιο-δύναμη που του ρυθμίζει χρονικά (T) την ταλάντωση!', lift:135, xShift:30, dur:3},
    {type:'bubble', at:9.9, viewer:2, text:'… ναι, εύλογο γιατί σαν χαρακτηριστικό όνομα έχει mD — όχι σκέτο m!', lift:130, xShift:-30, dur:3},

    // 13) Πάμε 2ο Νόμο
    {type:'bubble', at:11.0, viewer:0, text:'Ας δούμε πώς γράφεται ο 2ος Νόμος του Νεύτωνα για τον ταλαντωτή!', lift:125, xShift:-40, dur:3},

    // 16–19) Νόμοι (5) & (6) — εμφανίζονται με μορφή "… (n)"
    {type:'bubble', at:12.2, viewer:1, text:'ΣF = m·a γενικά, και με a(t)=−ω²A·ημ(ωt+φ₀) ⇒ ΣF = −mω²A·ημ(ωt+φ₀) (5)!', lift:130, xShift:-10, dur:3},
    {type:'law',    at:12.6, formula:'ΣF(t) = −m ω² A·sin(ωt + φ₀)'}, // → (5)
    {type:'bubble', at:13.4, viewer:3, text:'… και με βάση x(t)=A·ημ(ωt+φ₀) ⇒ ΣF = −mω²x (6)!', lift:135, xShift:10, dur:3},
    {type:'law',    at:13.8, formula:'ΣF(x) = −m ω² x'}, // → (6)

    // 20–22) D = mω² → (7)
    {type:'bubble', at:14.8, viewer:4, text:'Όμως η (6) περιέχει δύο «σταθερές» του ηθοποιού: τον «σωματότυπο» m και την «εμμονή» ω!', lift:135, xShift:30, dur:3},
    {type:'bubble', at:15.8, viewer:2, text:'Να κάνουμε τις δύο μία: D = m·ω² (6\') ; Βγάζει νόημα;', lift:130, xShift:-30, dur:3},
    {type:'bubble', at:16.8, viewer:0, text:'Αν την αποδώσουμε στο ελαστικό αίτιο ως σταθερά D, τότε με σταθερά m και D, παραμένει σταθερή η ω του ηθοποιού!', lift:125, xShift:-40, dur:3},
    {type:'bubble', at:17.9, viewer:1, text:'… δικαιολογημένα λοιπόν ο ταλαντωτής (ηθοποιός + ελαστικό αίτιο) λέγεται m,D!', lift:130, xShift:-10, dur:3},
    {type:'bubble', at:18.9, viewer:3, text:'…και η (6) γίνεται ΣF = −D x (7)!', lift:135, xShift:10, dur:3},
    {type:'law',    at:19.2, formula:'ΣF(x) = −D x'}, // → (7)

    // Τέλος Πράξης 2: κλείσιμο κουρτίνας (μένει κλειστή) + πλαίσιο «Διάλειμμα — Φουαγιέ»
    {type:'action', at:20.2, fn: ()=>{
      ghostHide();
      if (typeof window.closeCurtainsSequence === 'function') window.closeCurtainsSequence();
      const ab = document.getElementById('actBreak');
      const ttl = document.getElementById('actBreakTitle');
      const msg = document.getElementById('actBreakMsg');
      const btn = document.getElementById('btnAct2');
      if (ttl) ttl.textContent = 'Διάλειμμα — Φουαγιέ';
      if (msg) msg.textContent = 'Προχωράμε στις απόψεις–αποδείξεις στο φουαγιέ.';
      if (btn) btn.textContent = 'Είσοδος στο Φουαγιέ';
    }}
  ];

  // --- Εκτέλεση χρονοσειράς ---
  function showThoughtForViewerSafe(v, txt, dur, lift, xshift){
    if (typeof window.showThoughtForViewer === 'function'){
      // κιμωλία και στις σκέψεις
      try {
        const el = document.querySelector('.thought-bubble .text');
        if (el) el.classList.add('chalk');
      } catch(_) {}
      window.showThoughtForViewer(v, txt, dur, lift, xshift);
    }
  }
  function addLawSafe(formula){ if (typeof window.addLaw === 'function') window.addLaw(formula); }

  let started=false, t0=0, rid=null, idx=0;
  function tick(){
    const t = (performance.now()-t0)/1000;
    while(idx<lines.length && t>=lines[idx].at){
      const step = lines[idx++];
      if(step.type==='action'){ try{ step.fn(); }catch(e){ console.error(e); } }
      else if(step.type==='law'){ addLawSafe(step.formula); }
      else if(step.type==='bubble'){
        if(step.ghost==='start') ghostShow();
        if(step.ghost==='stop')  ghostHide();
        showThoughtForViewerSafe(step.viewer, step.text, step.dur||3, step.lift||130, step.xShift||0);
      }
    }
    if(idx<lines.length){ rid=requestAnimationFrame(tick); }
  }
  function startAct2(){ if(started) return; started=true; t0=performance.now(); idx=0; tick(); }

  document.addEventListener('act2-start', startAct2);
})();
