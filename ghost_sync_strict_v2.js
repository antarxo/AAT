/* ghost_sync_strict_v2.js
   Στόχος: Ο ghost να έχει ΑΚΡΙΒΩΣ την ίδια θέση/ύψος με τον κανονικό ηθοποιό,
   ίδια συνάρτηση θέσης x(t)=x0 + A·sin(ωt), ίδια άγκυρα ελατηρίου, και μόνο διαφορετικό πλάτος Α.
   Επιπλέον, z-index μεγαλύτερο (μπροστά) και απόλυτος συγχρονισμός περιόδου.

   ➤ Φόρτωσέ το ΜΕΤΑ το βασικό script (που έχει το animate/ω/pxPerMeter/playbackTime/anchorX)
   και ΠΡΙΝ (ή αντί) για τυχόν παλιό ghost-code σε act2.js.
*/
(function(){
  'use strict';

  // ===== Βασικά refs από τη σκηνή
  const $ = (sel, root=document) => root.querySelector(sel);
  const byId = (id) => document.getElementById(id);

  let stage, actor, springEl;
  function ensureBaseRefs(){
    stage    = stage    || byId('stage');
    actor    = actor    || byId('actor');   // DIV κοντέινερ του skater
    springEl = springEl || byId('spring');  // IMG του ελατηρίου (κανονικού)
    return !!stage && !!actor && !!springEl;
  }

  // ===== Ghost elements (container ίδιο με actor + img, και ghost-spring)
  let ghostWrap = null;     // DIV (όπως το #actor)
  let ghostImg  = null;     // IMG μέσα στο wrap
  let gSpring   = null;     // IMG ghost ελατήριο

  // Κινηματικές σταθερές από το global
  function getOmega(){ return (typeof window.omega==='number' ? window.omega : (2*Math.PI/(window.T||6))); }
  function getPxPerMeter(){ return (typeof window.pxPerMeter==='number' ? window.pxPerMeter : 50); }
  function getPlaybackTime(){ return (typeof window.playbackTime==='number' ? window.playbackTime : performance.now()/1000); }
  function getAnchorX(){ return (typeof window.anchorX==='function' ? window.anchorX() : stage.clientWidth*0.18); }

  // Πλάτος ghost σε μέτρα (διαφορετικό Α)
  let Aghost_m = 5;                 // default ζητούμενο
  function setGhostAmplitude(m){ Aghost_m = Math.max(0, +m||0); }

  // L0 (μήκος αναφοράς του ελατηρίου σε px) για σωστό scaleX
  let L0_px = null;

  function makeGhostElems(){
    if(!ensureBaseRefs()) return false;

    // Bottom/διαστάσεις από τα πραγματικά
    const csActor  = getComputedStyle(actor);
    const csSpring = getComputedStyle(springEl);
    const aRect    = actor.getBoundingClientRect();
    const aW       = aRect.width || 144;

    // --- Ghost actor wrapper (ίδια γεωμετρία με #actor, ΧΩΡΙΣ translate(-50%))
    if(!ghostWrap){
      ghostWrap = document.createElement('div');
      ghostWrap.id = 'ghostActor';
      // δεν κληρονομούμε class=actor (έχει translate(-50%)); ορίζουμε ρητά ό,τι χρειαζόμαστε
      Object.assign(ghostWrap.style, {
        position:'absolute',
        left:'50%',
        bottom: csActor.bottom,     // ακριβώς ίδια κατακόρυφη στάθμη
        width: aW+'px',
        height: (aRect.height||96)+'px',
        transform:'none',           // ΟΧΙ translate(-50%), θα τοποθετηθεί με left xHook - hookOff
        zIndex:'120',               // μπροστά από τον κανονικό (που είναι ~110)
        pointerEvents:'none',
      });
      stage.appendChild(ghostWrap);
    }

    // --- Ghost IMG ίδια εικόνα
    if(!ghostImg){
      const realImg = actor.querySelector('img');
      ghostImg = document.createElement('img');
      ghostImg.src = realImg ? realImg.src : 'skater.png';
      Object.assign(ghostImg.style, {
        width:'100%',
        height:'auto',
        display:'block',
        opacity:'0.40',
        filter:'drop-shadow(0 4px 6px rgba(0,0,0,.6))'
      });
      ghostWrap.appendChild(ghostImg);
    }

    // --- Ghost spring (ίδιο bottom, ίδιο transform-origin: left center)
    if(!gSpring){
      gSpring = document.createElement('img');
      gSpring.id = 'ghostSpring';
      gSpring.src = springEl.src;
      Object.assign(gSpring.style, {
        position:'absolute',
        left: getAnchorX()+'px',
        bottom: csSpring.bottom,    // ίδια στάθμη ελατηρίου
        height: (springEl.getBoundingClientRect().height||96)+'px',
        width:  (springEl.getBoundingClientRect().width ||160)+'px',
        transformOrigin:'left center',
        transform:'scaleX(1)',
        opacity:'0.40',
        zIndex:'119',               // λίγο πίσω από τον ghost-actor, αλλά μπροστά από κανονικό
        pointerEvents:'none',
        filter:'drop-shadow(0 4px 6px rgba(0,0,0,.55))',
      });
      stage.appendChild(gSpring);
    }

    // --- Αρχικό L0_px από το πραγματικό ελατήριο (πλάτος χωρίς scale)
    if(!L0_px){
      // προσπαθούμε να εκτιμήσουμε L0 από το πραγματικό: width / τρέχουσα κλίμακα
      const realW = springEl.getBoundingClientRect().width;
      // αν υπάρχει τρέχον scaleX στο πραγματικό (δεν μας το δίνει εύκολα), παίρνουμε ένα ασφαλές min
      L0_px = Math.max(1, realW);
    }

    return true;
  }

  // ===== RAF κίνησης ghost (ίδια συνάρτηση με τον πραγματικό)
  let rafId = 0;
  let stopTs = 0;

  function step(){
    if(!ensureBaseRefs() || !ghostWrap || !gSpring){ rafId=0; return; }

    const ω  = getOmega();
    const px = getPxPerMeter();
    const Apx= Aghost_m * px;
    const t  = getPlaybackTime();

    // ίδια κεντρική αναφορά με το κανονικό
    const centerX = stage.clientWidth/2;

    // ίδιο hook-offset όπως το κανονικό
    const realRect = actor.getBoundingClientRect();
    const hookOff  = (realRect.width||ghostWrap.getBoundingClientRect().width||144)/2;

    // ίδιο x(t) με άλλο Α
    const xHook = centerX + Apx*Math.sin(ω*t);

    // Τοποθέτηση ghost-actor (ΧΩΡΙΣ translate)
    ghostWrap.style.left = (xHook - hookOff) + 'px';

    // Ghost-spring με ίδιο anchor και ίδιο scaleX υπολογισμό
    const ax    = getAnchorX();
    const dist  = xHook - ax;
    const scale = (L0_px>0) ? (dist / L0_px) : 1;
    gSpring.style.left     = ax+'px';
    gSpring.style.transform= `scaleX(${scale})`;

    // Συνέχεια ή στοπ
    if(performance.now() < stopTs){
      rafId = requestAnimationFrame(step);
    } else {
      stopGhostSync();
    }
  }

  function startGhostSync(ms=10000){
    if(!makeGhostElems()) return;
    // ανανέωσε bottoms σε resize για 100% στοίχιση
    syncBottomsToReal();

    stopTs = performance.now() + Math.max(0, ms|0);
    if(!rafId) rafId = requestAnimationFrame(step);
  }

  function stopGhostSync(){
    if(rafId){ cancelAnimationFrame(rafId); rafId=0; }
    try{ if(ghostWrap) ghostWrap.remove(); }catch(_){}
    try{ if(gSpring)   gSpring.remove(); }catch(_){}
    ghostWrap=null; ghostImg=null; gSpring=null;
  }

  // ===== Στοίχιση κατακόρυφου ύψους σε κάθε resize/rehydrate
  function syncBottomsToReal(){
    if(!ensureBaseRefs()) return;
    const csActor  = getComputedStyle(actor);
    const csSpring = getComputedStyle(springEl);
    if(ghostWrap) ghostWrap.style.bottom = csActor.bottom;
    if(gSpring)   gSpring.style.bottom   = csSpring.bottom;
  }
  window.addEventListener('resize', syncBottomsToReal);

  // ===== Public API (κρατάμε συμβατότητα με τα υπάρχοντα act2.js)
  window.setGhostAmplitude = setGhostAmplitude;
  window.startGhostSync    = startGhostSync;
  window.stopGhostSync     = stopGhostSync;

  // Επιπλέον namespace αν το θες ρητά
  window.GHOST = {
    start: startGhostSync,
    stop : stopGhostSync,
    setA : setGhostAmplitude
  };

})();
