/* act2.js — ΠΡΑΞΗ 2 (σταθερό timing, σωστός GHOST, HTML σε bubbles)
   - Ghost: Aghost=5 m, ίδια φάση/περίοδος με τον κανονικό.
   - Το ghost κεντράρεται σωστά (left = hookX_ghost, υπάρχει translate(-50%,0)).
   - Το ghost-spring τεντώνει μέχρι ΚΕΝΤΡΟ ghost.
   - Bubbles: επιτρέπουμε ασφαλές HTML (b/strong, i/em, sub/sup, br) + auto-διάρκεια με βάση μήκος.
   - Νόμοι: μονοσειρά, χωρίς κενά ανάμεσα.
   - Τέλος: κρύβει δείκτη, κλείνει κουρτίνα (μένει κλειστή), εμφανίζει πύλη Φουαγιέ.
*/
(function(){
  'use strict';

  const $  = (s,r=document)=>r.querySelector(s);
  const by = id=>document.getElementById(id);

  // ===== DOM refs
  const stage        = by('stage');
  const curtainUpper = $('.curtain-upper');
  const springReal   = by('spring');
  const actorEl      = by('actor');
  const marker       = by('marker');

  const signboard = $('.signboard');
  const sbH1 = signboard?.querySelector('h1')||null;
  const sbA  = by('sbLineA');
  const sbB  = by('sbLineB');

  // ===== Φυσικά από Πράξη 1 (fallbacks)
  const pxPerMeter = (typeof window.pxPerMeter==='number')?window.pxPerMeter:50;
  const A_m        = (typeof window.A_m==='number')?window.A_m:3.0;
  const omega      = (typeof window.omega==='number')?window.omega:(2*Math.PI/6);
  const T          = (typeof window.T==='number')?window.T:6.0;

  let running=false, finished=false;

  // ===== helpers
  const sleep = ms=>new Promise(r=>setTimeout(r,ms));
  const getBottom = el => parseFloat(getComputedStyle(el).bottom||'0')||0;
  const centerX   = () => stage.clientWidth/2;
  const anchorX   = () => (typeof window.anchorX==='function') ? window.anchorX() : stage.clientWidth*0.18;
  function curtainsX(){ const W=stage.clientWidth; return [W*0.18, W*0.82]; }

  // ===== Ασφαλής HTML μέσα στα bubbles
  const __ALLOWED = new Set(['b','strong','i','em','sub','sup','br']);
  function sanitizeThought(html) {
    const wrap = document.createElement('div');
    wrap.innerHTML = html || '';
    wrap.querySelectorAll('*').forEach(el => {
      const tag = el.tagName.toLowerCase();
      if (!__ALLOWED.has(tag)) {
        el.replaceWith(document.createTextNode(el.textContent));
      } else {
        [...el.attributes].forEach(a => el.removeAttribute(a.name));
      }
    });
    return wrap.innerHTML;
  }

  // ===== Σκέψεις (χωρίς typewriter, auto-duration)
  function baseDur(){ const s=by('slDur'); const v=s?parseFloat(s.value):NaN; return (isFinite(v)&&v>0)?v:3; }
  const AUTO = { cps:6, min:4, max:18, gap:0.7 };

  let a2Bubble=null;
  function ensureA2Bubble(){
    if(a2Bubble) return a2Bubble;
    a2Bubble = document.createElement('div');
    a2Bubble.id='a2bubble';
    Object.assign(a2Bubble.style,{
      position:'absolute', maxWidth:'420px',
      background:'rgba(255,255,255,.9)', color:'#000',
      fontSize:'16px', lineHeight:'1.5',
      padding:'10px 12px 12px',
      border:'2px solid transparent', borderRadius:'10px',
      borderImage:'repeating-linear-gradient(90deg, rgba(0,0,0,.6) 0 6px, transparent 6px 10px, rgba(0,0,0,.6) 10px 12px, transparent 12px 16px) 1',
      boxShadow:'0 6px 12px rgba(0,0,0,.4)', zIndex:340,
      pointerEvents:'none', opacity:'0', display:'none',
      transition:'opacity .2s ease, transform .2s ease'
    });
    const text = document.createElement('div'); text.className='a2text';
    const tail = document.createElement('div');
    Object.assign(tail.style,{
      position:'absolute', left:'50%', bottom:'-10px', transform:'translateX(-50%)',
      width:0, height:0, borderLeft:'8px solid transparent',
      borderRight:'8px solid transparent', borderTop:'10px solid rgba(255,255,255,.9)',
      filter:'drop-shadow(0 2px 2px rgba(0,0,0,.4))'
    });
    a2Bubble.append(text, tail);
    stage.appendChild(a2Bubble);
    return a2Bubble;
  }
  function viewersRect(idx){
    const v = $(`.viewer[data-idx="${idx}"]`); if(!v) return null;
    const sRect = stage.getBoundingClientRect();
    const r = v.getBoundingClientRect();
    return { left:r.left - sRect.left, top:r.top - sRect.top, w:r.width, h:r.height };
  }
  function durFor(text){
    const b = baseDur();
    const k = Math.max(0.6, 9.0/b);
    let secs = String(text||'').length / (AUTO.cps*k);
    if(!isFinite(secs) || secs<=0) secs = AUTO.min;
    return Math.max(AUTO.min, Math.min(AUTO.max, secs));
  }
  async function say(viewerIdx, text, lift=130, xShift=0){
    const b = ensureA2Bubble();
    const v = viewersRect(viewerIdx);
    const [xL,xR] = curtainsX();
    const pad=12;

    b.querySelector('.a2text').innerHTML = sanitizeThought(text||'');
    b.style.display='block';
    b.style.opacity='0'; b.style.left='0px'; b.style.top='0px';

    const bw = b.offsetWidth || 260;
    const vCenter = v ? (v.left + v.w/2) : (stage.clientWidth/2);
    let leftPx = vCenter + (xShift||0) - bw/2;
    leftPx = Math.max(xL + pad, Math.min(leftPx, xR - pad - bw));
    const topPx = Math.max(10, (v ? v.top : (stage.clientHeight*0.68)) - (typeof lift==='number'?lift:130));
    b.style.left = leftPx+'px';
    b.style.top  = topPx +'px';

    void b.offsetWidth;
    b.style.opacity='1'; b.style.transform='translateY(-2px)';
    await sleep(durFor(text)*1000);
    b.style.opacity='0'; b.style.transform='translateY(0)';
    await sleep(200);
    b.style.display='none';
    await sleep(AUTO.gap*1000);
  }

  // ===== Νόμοι (μονοσειρές, χωρίς κενά)
  function addLawOneLine(txt){
    const pane = by('laws'), list = by('lawsList');
    if(!pane || !list) return;
    pane.style.display='block';
    pane.style.overflow='visible';
    pane.style.maxHeight='none';
    const li = document.createElement('li');
    li.textContent = txt;
    li.style.marginBottom='0';
    list.appendChild(li);
    if(typeof window.positionLawCharts==='function'){
      try{ window.positionLawCharts(); }catch{}
    }
  }

  // ===== GHOST (ίδιο hook με κανονικό)
  let ghost=null, ghostSpring=null, ghostRAF=0, L0_ghost=0;
  const Aghost_m = 5.0;
  const HOOK_NUDGE_PX = 0; // αν θέλεις 1–2px οπτική μικροδιόρθωση

  function ensureGhost(){
    if(!ghost){
      ghost = document.createElement('div');
      ghost.id='actorGhost';
      Object.assign(ghost.style,{
        position:'absolute',
        transform:'translate(-50%,0)',   // ΚΕΝΤΡΟ στο left
        zIndex:121, pointerEvents:'none', opacity:0.85,
        filter:'grayscale(1) brightness(1.2)', display:'none'
      });
      const src = actorEl.querySelector('img');
      const img = document.createElement('img');
      img.src = src ? src.src : '';
      img.style.width='100%'; img.style.height='auto'; img.style.opacity='0.9';
      ghost.appendChild(img);
      stage.appendChild(ghost);
    }
    if(!ghostSpring){
      ghostSpring = document.createElement('img');
      ghostSpring.id='springGhost';
      ghostSpring.src = springReal ? springReal.src : '';
      Object.assign(ghostSpring.style,{
        position:'absolute',
        transformOrigin:'left center',
        zIndex:120, pointerEvents:'none', opacity:0.9,
        filter:'grayscale(1) brightness(1.15)', display:'none'
      });
      stage.appendChild(ghostSpring);
    }

    // ίδιο ύψος/στοίχιση με κανονικό
    const sRect = springReal.getBoundingClientRect();
    ghostSpring.style.bottom = getBottom(springReal)+'px';
    ghostSpring.style.height = sRect.height+'px';
    ghostSpring.style.left   = anchorX()+'px';
    ghostSpring.style.transform = 'scaleX(1)'; // για σωστή μέτρηση L0_ghost

    const aRect = actorEl.getBoundingClientRect();
    ghost.style.bottom = getBottom(actorEl)+'px';
    ghost.style.width  = aRect.width+'px';
    ghost.style.height = aRect.height+'px';

    // L0_ghost: πλάτος εικόνας ελατηρίου όταν scaleX=1
    const w = ghostSpring.getBoundingClientRect().width;
    if(w>0) L0_ghost = w;
  }

  function startGhost(){
    ensureGhost();
    ghost.style.display='block';
    ghostSpring.style.display='block';
    cancelAnimationFrame(ghostRAF);

    const A_real_px  = pxPerMeter * A_m;
    const A_ghost_px = pxPerMeter * Aghost_m;

    const loop=()=>{
      const sRect = stage.getBoundingClientRect();
      const aRect = actorEl.getBoundingClientRect();
      const cx    = centerX();
      const ax    = anchorX();

      // hook πραγματικού (κέντρο actor)
      const hookX_real = (aRect.left - sRect.left) + aRect.width/2;

      // ίδια φάση από κανονικό
      const sinθ = Math.max(-1, Math.min(1, (hookX_real - cx) / Math.max(1, A_real_px)));

      // ghost hook
      let hookX_ghost = cx + A_ghost_px * sinθ + HOOK_NUDGE_PX;

      // Κέντρο ghost ακριβώς στο hookX_ghost
      // (υπάρχει translate(-50%,0), άρα left = ΚΕΝΤΡΟ)
      ghost.style.left = hookX_ghost + 'px';

      // τέντωμα ghost-spring: από anchor έως ΚΕΝΤΡΟ ghost
      if(L0_ghost<=0){
        const w = ghostSpring.getBoundingClientRect().width;
        if(w>0) L0_ghost = w;
      }
      const dist  = Math.max(0, hookX_ghost - ax);
      const baseW = Math.max(1, L0_ghost);
      const scale = dist / baseW;
      ghostSpring.style.left = ax + 'px';
      ghostSpring.style.transform = `scaleX(${scale})`;

      ghostRAF = requestAnimationFrame(loop);
    };
    ghostRAF = requestAnimationFrame(loop);
  }

  function stopGhost(){
    cancelAnimationFrame(ghostRAF); ghostRAF=0;
    if(ghost){ ghost.style.display='none'; }
    if(ghostSpring){ ghostSpring.style.display='none'; ghostSpring.style.transform='scaleX(1)'; }
  }

  // ===== Τίτλος Πράξης 2
  function setTitleAct2(){
    if (sbH1) sbH1.textContent = 'Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!';
    const m  = (typeof window.m==='number') ? window.m.toFixed(1) : (window.m || '…');
    const D  = (typeof window.D==='number') ? window.D : '…';
    const Em = (typeof window.E_mech==='number') ? window.E_mech.toFixed(2) : (window.E_mech || '…');
    if (sbA) sbA.textContent = `m₁ = ${m} kg , D₁ = ${D} N/m`;
    if (sbB) sbB.textContent = `Eμηχ = ${Em} J`;
  }

  // ===== Φουαγιέ
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
    const cuRect=curtainUpper?.getBoundingClientRect?.() || {top:0,height:stage.clientHeight*0.4};
    gate.style.left   = (sRect.left + stage.clientWidth*0.18)+'px';
    gate.style.top    = cuRect.top+'px';
    gate.style.width  = (stage.clientWidth*0.64)+'px';
    gate.style.height = cuRect.height+'px';
    gate.style.display='flex';
  }

  // ===== Ροή Πράξης 2 (αυτολεξεί κείμενα)
  async function playAct2(){
    if(running || finished) return;
    running=true;
    try{
      stage.classList.add('open');
      springReal.style.display='block';
      setTitleAct2();

   const seq = [
  // 3
  {v:0, t:'ωπ! δεμένος σε ελατήριο είναι ο m1D1!', y:135, x:-20},

  // 4–6 (ghost on…off)
  {v:1, t:'αυτόν ακριβώς τον m<sub>1</sub>D1 σίγουρα τον έχω ξαναδεί με το ίδιο μηχανισμό-ελατήριο σε άλλη παράσταση, αλλά με άλλον παραγωγό!', y:135, x:-10, gStart:true},
  {v:3, t:'...ναι και εκεί πάλι με την ίδια περίοδο όμως εμμονικά κινήθηκε, αλλά με μεγαλύτερο πλάτος Α!', y:135, x:10},
  {v:2, t:'Εμφανίζεται η θύμισή τους (ο m1D1 σε άλλη σκηνή με διαφορετικό πλάτος-διαφορετική ενέργεια αλλά εικόνα ίδιου μεγέθους)', y:130, x:-10, gStop:true},

  // 7–15
  {v:4, t:'Χμμμ… Πρωταγωνιστής μάλλον είναι ο κινούμενος ηθοποιός και τα εργαλεία του μαζί!', y:130, x:20},
  {v:0, t:'Τώρα καταλαβαίνω μάλλον γιατί δεν τον λένε m1 αλλά m1,D1…', y:130, x:-20},
  {v:1, t:'… το m1 είναι η μάζα του ηθοποιού αλλά ταλαντωτής προφανώς, νοείται η σύμπραξη του ηθοποιού(m1) και του «ελαστικού» αιτίου-δύναμη, στο οποίο αναφέρεται ως φαίνεται το D1!', y:130, x:-10},
  {v:3, t:'…m1 και D1 δηλαδή πάνε παντού ..πακέτο! και τα δυο μαζί είναι  ο ταλαντωτής- ο πρωταγωνιστής!', y:130, x:10},
  {v:2, t:'… δηλαδή κάθε ταλαντωτής χαρακτηρίζεται 1. από τη μάζα του και 2. από το ελαστικό αίτιο-δύναμη που του ρυθμίζει χρονικά (Τ) την ταλάντωση!', y:130, x:0},
  {v:4, t:'…αρχίζω να πείθομαι γιατί σαν χαρακτηριστικό όνομα έχει το mD! και όχι σκέτο m!...', y:130, x:20},
  {v:0, t:'Επομένως η ιδιαιτερότητα του κάθε ταλαντωτή δηλαδή η «εμμονή» του να έχει χαρακτηριστική Περίοδο Τ (χαρακτηριστική επομένως f και ω) οφείλεται 1. στον «σωματότυπό του» m και 2. στο ελαστικό αίτιο (που πιθανά να εμπεριέχεται σ αυτό, το D του ονόματός του)!', y:130, x:-20},
  {v:1, t:'Πωωωω! ελάτε, αφήστε τα, πάμε παρακάτω….', y:125, x:-10},
  {v:3, t:'Ας δούμε πώς γράφεται ο 2ος Νόμος του Νεύτωνα για την περίπτωση του ταλαντωτή!', y:130, x:10},

  // 16–19 (νόμοι)
  {v:2, t:'… ΣF=ma γενικά και επομένως εδώ με τη βοήθεια της (3) ΣF=-mω2Αημ(ωt+φο) (5)!', y:130, x:0},
  {law:'ΣF = −m·ω²·A·ημ(ωt+φ₀) (5)'},
  {v:4, t:'… και με βάση την (4) μπορεί να γραφτεί και ως ΣF=-mω2x (6)!', y:130, x:20},
  {law:'ΣF = −m·ω²·x (6)'},

  // 20–25 (νόμοι + συμπέρασμα)
  {v:0, t:'Όμως! Η (6) για δείτε-περιέχει δύο σταθερές του ηθοποιού τον «σωματότυπο» (m) και την «εμμονή» του (ω)!', y:130, x:-20},
  {v:1, t:'Να κάνουμε λέτε εμείς τις δύο σταθερές μία και να την ονομάσουμε … D=mω2 (6’); βγάζει νόημα;', y:130, x:-10},
  {law:'D = m·ω² (6′)'},
  {v:3, t:'Λοιπόν, αν την αποδώσουμε στο ελαστικό αίτιο, ως δική του σταθερά D, τότε όλα βγάζουν νόημα: Ο ηθοποιός έχει τη δική του σταθερή μάζα m1, το ελαστικό αίτιο τη δική του σταθερά D1. ‘Ετσι, εξηγείται το ότι ο ηθοποιός ανεξαρτήτως σκηνής και παραγωγού, «εμμονικά» διατηρεί την περίοδό του σταθερή! μας το δείχνει η παραπάνω σχέση (6’) D=mω2 που λέει ότι με σταθερά τα m και D, σταθερή θα είναι η ω του ηθοποιού!', y:130, x:10},
  {v:2, t:'… χμμμ δικαιολογημένα λοιπόν τον πρωταγωνιστή-ταλαντωτή (=ηθοποιός+ελαστικό αίτιο) τον λένε m,D!', y:130, x:0},
  {v:4, t:'…αλλά και η (6)-μη ξεχνιόμαστε!, γίνεται ΣF = −Dx (7)!', y:130, x:20},
  {law:'ΣF = −D·x (7)'}
];


      for(const step of seq){
        if(step.law){ addLawOneLine(step.law); await sleep(300); continue; }
        if(step.gStart) startGhost();
        await say(step.v, step.t, step.y, step.x);
        if(step.gStop)  stopGhost();
      }

      // Κλείσιμο πράξης
      if(marker) marker.style.opacity='0';
      if(curtainUpper){
        curtainUpper.classList.add('slow-close');
        stage.classList.remove('open');
        await sleep(1600);
        curtainUpper.classList.remove('slow-close');
      }else{
        stage.classList.remove('open');
      }
      showFoyerGate();
      finished=true;
    }catch(e){
      console.error('Act2 error:', e);
    }finally{
      stopGhost();
      running=false;
    }
  }

  // Mount
  document.addEventListener('act2-start', playAct2, { once:true });
  const btnAct2 = by('btnAct2');
  if(btnAct2 && !btnAct2.__a2){
    btnAct2.__a2=true;
    btnAct2.addEventListener('click', playAct2);
  }
  window.__forceAct2Start = playAct2; // debug
})();

