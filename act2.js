/* act2.js — Πράξη 2 (no helpers)
   • Ρυθμός σκέψεων σταθερός & αναγνώσιμος (από μήκος κειμένου).
   • Bubbles εμφανίζονται πλήρως και μένουν όσο πρέπει (χωρίς typewriter).
   • Ghost: ίδια στάθμη/anchor με κανονικό, Αghost=5 m, μπροστά, μόνο στα βήματα 4→6, και καθαρίζει πάντα.
   • Στο τέλος: κρύβει δείκτη, κλείνει κουρτίνα, εμφανίζει πλαίσιο «Φουαγιέ».
*/
(function () {
  'use strict';

  // ---------- DOM ----------
  const $  = (s, r=document)=>r.querySelector(s);
  const by = (id)=>document.getElementById(id);

  const stage        = by('stage');
  const curtainUpper = $('.curtain-upper');
  const spring       = by('spring');
  const actorEl      = by('actor');
  const marker       = by('marker');

  const signboard = $('.signboard');
  const sbH1 = signboard?.querySelector('h1') || null;
  const sbA  = by('sbLineA');
  const sbB  = by('sbLineB');

  // ---------- Παγκόσμιες από Πράξη 1 (ασφαλή defaults) ----------
  const pxPerMeter = (typeof window.pxPerMeter === 'number') ? window.pxPerMeter : 50;
  const A_m        = (typeof window.A_m        === 'number') ? window.A_m        : 3.0;
  const omega      = (typeof window.omega      === 'number') ? window.omega      : (2*Math.PI/6);
  const T          = (typeof window.T          === 'number') ? window.T          : 6.0;

  // ---------- Κατάσταση ----------
  let running=false, finished=false;

  // ---------- Χρονισμός σκέψεων ----------
  // Αν υπάρχει slider από Πράξη 1 (slDur), τον διαβάζουμε για να “κουμπώνει”.
  function getBaseDurSec(){
    const s = by('slDur');
    const v = s ? parseFloat(s.value) : NaN;
    return (isFinite(v) && v>0) ? v : 3.0;
  }
  const TIMING = {
    CHARS_PER_SEC_BASE: 6.0,    // ↓ πιο αργά
    MIN: 4.5,
    MAX: 16.0,
    EXTRA_GAP: 0.60
  };
  const sleep = (ms)=>new Promise(r=>setTimeout(r, ms));
  function computeThoughtDuration(text){
    const base = getBaseDurSec();                // από gear της Πράξης 1
    const k    = Math.max(0.6, 9.0/base);        // προσαρμογή στο slider
    const s    = String(text||'');
    let secs   = s.length / (TIMING.CHARS_PER_SEC_BASE * k);
    if(!isFinite(secs) || secs<=0) secs = TIMING.MIN;
    secs = Math.max(TIMING.MIN, Math.min(TIMING.MAX, secs));
    return secs;
  }

  // ---------- Βοηθητικά γεωμετρίας ----------
  function centerX(){ return stage.clientWidth/2; }
  function anchorX(){ return (typeof window.anchorX==='function') ? window.anchorX() : stage.clientWidth*0.18; }
  function getBottom(el){ return parseFloat(getComputedStyle(el).bottom||'0')||0; }

  // ---------- Bubbles (χρησιμοποιούμε την Πράξη 1) ----------
  async function say(viewerIdx, text, lift=130, xShift=0){
    // Κλείσε ό,τι τυχόν έμεινε από Πράξη 1
    if (typeof window.resumeFromBubble === 'function') { try{ window.resumeFromBubble('run'); }catch{} }
    const dur = computeThoughtDuration(text);
    if (typeof window.showThoughtForViewer === 'function') {
      window.showThoughtForViewer(viewerIdx, text, dur, lift, xShift);
      await sleep((dur + TIMING.EXTRA_GAP)*1000);
    } else {
      // Fallback: μόνο καθυστέρηση
      await sleep((dur + TIMING.EXTRA_GAP)*1000);
    }
  }

  // ---------- Νόμοι (μονή γραμμή, χωρίς extra κενά) ----------
  function addLawOneLine(txt){
    if (typeof window.addLaw === 'function') {
      window.addLaw(txt);
      return;
    }
    const pane = by('laws'), list = by('lawsList');
    if(pane && list){
      pane.style.display='block';
      pane.style.overflow='visible';
      pane.style.maxHeight='none';
      const li=document.createElement('li'); li.textContent=txt; li.style.marginBottom='0';
      list.appendChild(li);
    }
  }

  // ---------- Ghost ----------
  let ghost=null, ghostSpring=null, ghostRAF=0, ghostHookOffset=0, springBaseW=160;
  const Aghost_m = 5.0;   // ζητήθηκε 5 m
  function ensureGhost(){
    if(!ghost){
      ghost = document.createElement('div');
      ghost.id='actorGhost';
      Object.assign(ghost.style,{
        position:'absolute',
        transform:'translate(-50%,0)',
        zIndex:121,            // μπροστά από actor (110)
        pointerEvents:'none',
        opacity:0.85,
        filter:'grayscale(1) brightness(1.2)',
        display:'none'
      });
      const src = $('img', actorEl);
      const img = document.createElement('img');
      img.src = src ? src.src : '';
      img.style.width='100%'; img.style.height='auto'; img.style.opacity='0.9';
      ghost.appendChild(img);
      stage.appendChild(ghost);
    }
    if(!ghostSpring){
      ghostSpring = document.createElement('img');
      ghostSpring.id='springGhost';
      ghostSpring.src = spring ? spring.src : '';
      Object.assign(ghostSpring.style,{
        position:'absolute',
        left:anchorX()+'px',
        transformOrigin:'left center',
        zIndex:120,
        pointerEvents:'none',
        opacity:0.9,
        filter:'grayscale(1) brightness(1.15)',
        display:'none'
      });
      ghostSpring.addEventListener('load', ()=>{
        const r = ghostSpring.getBoundingClientRect();
        springBaseW = Math.max(60, r.width || ghostSpring.naturalWidth || 160);
      });
      stage.appendChild(ghostSpring);
    }
    // Απόλυτη ευθυγράμμιση ύψους/μεγέθους με κανονικό
    const aRect = actorEl.getBoundingClientRect();
    ghost.style.bottom = getBottom(actorEl)+'px';
    ghost.style.width  = aRect.width+'px';
    ghost.style.height = aRect.height+'px';
    ghostHookOffset    = aRect.width/2;

    const sRect = spring.getBoundingClientRect();
    ghostSpring.style.bottom = getBottom(spring)+'px';
    ghostSpring.style.height = sRect.height+'px';
    ghostSpring.style.left   = anchorX()+'px';
  }
  function startGhost(){
    ensureGhost();
    ghost.style.display='block';
    ghostSpring.style.display='block';
    cancelAnimationFrame(ghostRAF);
    const loop=()=>{
      const cx = centerX();
      const ax = anchorX();
      const t  = (typeof window.playbackTime==='number') ? window.playbackTime : 0;

      const hookX = cx + (pxPerMeter*Aghost_m)*Math.sin(omega*t); // ΚΕΝΤΡΟ (ίδια φάση)
      ghost.style.left = (hookX - ghostHookOffset) + 'px';

      const dist = Math.max(1, hookX - ax);
      ghostSpring.style.transform = `scaleX(${dist/(springBaseW||160)})`;

      ghostRAF = requestAnimationFrame(loop);
    };
    ghostRAF = requestAnimationFrame(loop);
  }
  function stopGhost(){
    cancelAnimationFrame(ghostRAF); ghostRAF=0;
    if(ghost){ ghost.style.display='none'; ghost.style.left='-9999px'; }
    if(ghostSpring){ ghostSpring.style.display='none'; ghostSpring.style.transform='scaleX(1)'; }
  }

  // ---------- Τίτλος Πράξης 2 ----------
  function setTitleAct2(){
    if (sbH1) sbH1.textContent = 'Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!';
    const m  = (typeof window.m==='number') ? window.m.toFixed(1) : (window.m || '…');
    const D  = (typeof window.D==='number') ? window.D : '…';
    const Em = (typeof window.E_mech==='number') ? window.E_mech.toFixed(2) : (window.E_mech || '…');
    if (sbA) sbA.textContent = `m₁ = ${m} kg , D₁ = ${D} N/m`;
    if (sbB) sbB.textContent = `Eμηχ = ${Em} J`;
  }

  // ---------- Φουαγιέ ----------
  function ensureFoyerGate(){
    if (by('foyerGate')) return;
    const gate = document.createElement('div');
    gate.id='foyerGate';
    Object.assign(gate.style,{
      position:'absolute', display:'none',
      alignItems:'center', justifyContent:'center', textAlign:'center',
      zIndex:410, background:'rgba(0,0,0,.55)'
    });
    const box=document.createElement('div');
    Object.assign(box.style,{
      background:'rgba(0,0,0,.7)', border:'1px solid rgba(255,255,255,.25)',
      borderRadius:'12px', padding:'16px 20px', maxWidth:'520px', color:'#fff'
    });
    const h=document.createElement('h3'); h.textContent='Διάλειμμα — Φουαγιέ';
    const p=document.createElement('p');  p.textContent='Οι κουρτίνες παραμένουν κλειστές. Προχωράμε στις αποδείξεις;';
    const btn=document.createElement('button'); btn.textContent='Μετάβαση στο Φουαγιέ';
    Object.assign(btn.style,{background:'#700',color:'#fff',border:'none',borderRadius:'8px',padding:'10px 16px',fontSize:'16px',cursor:'pointer'});
    btn.addEventListener('click',()=>{ gate.style.display='none'; document.dispatchEvent(new Event('act3-start')); });
    box.append(h,p,btn); gate.appendChild(box); document.body.appendChild(gate);
  }
  function showFoyerGate(){
    ensureFoyerGate();
    const gate=by('foyerGate'); if(!gate) return;
    const sRect=stage.getBoundingClientRect();
    const cuRect=curtainUpper.getBoundingClientRect();
    gate.style.left   = (sRect.left + stage.clientWidth*0.18)+'px';
    gate.style.top    = cuRect.top+'px';
    gate.style.width  = (stage.clientWidth*0.64)+'px';
    gate.style.height = cuRect.height+'px';
    gate.style.display='flex';
  }

  // ---------- Ροή Πράξης 2 ----------
  async function playAct2(){
    if(running || finished) return;
    running=true;
    try{
      // Άνοιγμα, τίτλος, ελατήριο on
      stage.classList.add('open');
      spring.style.display='block';
      setTitleAct2();

      // Σειρά σκέψεων (αυτολεξεί)
      const seq = [
        {v:0, t:'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!', y:135, x:-20},

        // GHOST ON (3 βήματα)
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

      for(const it of seq){
        if(it.gStart) startGhost();
        await say(it.v, it.t, it.y, it.x);
        if(it.gStop)  stopGhost();
      }

      // Νόμοι (5)…(7)
      addLawOneLine('ΣF = −m·ω²·A·ημ(ωt+φ₀) (5)');
      await sleep(300);
      addLawOneLine('ΣF = −m·ω²·x (6)');
      await sleep(300);
      addLawOneLine('D = m·ω² (6′)');
      await sleep(350);
      addLawOneLine('ΣF = −D·x (7)');
      await sleep(500);

      // Τέλος: κρύψε δείκτη, κλείσε κουρτίνα, εμφάνισε φουαγιέ
      if(marker) marker.style.opacity='0';
      curtainUpper.classList.add('slow-close');
      stage.classList.remove('open');
      await sleep(1600);
      curtainUpper.classList.remove('slow-close');
      showFoyerGate();

      finished=true;
    } catch(e){
      console.error('Act2 error:', e);
    } finally {
      stopGhost();        // να μην μείνει ΠΟΤΕ πάνω
      running=false;
    }
  }

  // Mount
  ensureFoyerGate();
  document.addEventListener('act2-start', playAct2, { once:true });

  const btnAct2 = by('btnAct2');
  if(btnAct2 && !btnAct2.__act2Bound){
    btnAct2.__act2Bound=true;
    btnAct2.addEventListener('click', playAct2);
  }

  // Console helper
  window.__forceAct2Start = playAct2;
})();
