/* thought_typewriter_patch_v6.js — typewriter για bubbles με προ-μέτρηση διαστάσεων */
(function(){
  'use strict';

  // Ρυθμοί (μπορείς να τους αλλάξεις global αν θες)
  function getCharMs(){ return (typeof window.TYPE_CHAR_MS === 'number' ? window.TYPE_CHAR_MS : 45); }
  function getGapMs(){  return (typeof window.THINK_GAP_MS === 'number' ? window.THINK_GAP_MS  : 800); }

  // Καθαρό κείμενο (χωρίς «κινέζικα»)
  function fixText(s){
    try{ return (typeof window.fixThoughtText==='function') ? window.fixThoughtText(s) : String(s ?? ''); }
    catch(_){ return String(s ?? ''); }
  }

  // Σκληρό override γραμματοσειράς – για να μη «χαλάει» τίποτα στα ελληνικά
  (function injectCSS(){
    const css = `
      .thought-bubble,.thought-bubble .text,.laws { font-family: Inter, system-ui, -apple-system, "Segoe UI", Arial, sans-serif !important; }
      .thought-bubble .text{ white-space: pre-wrap; word-break: normal; hyphens: manual; }
    `;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  })();

  function refs(){
    return {
      stage:  document.getElementById('stage'),
      bubble: document.getElementById('bubble0')
    };
  }

  // Προ-μέτρηση ώστε το bubble να ΜΗΝ «φουσκώνει» όσο γράφει
  function measureBubbleSize(stage, bubble, text, maxW){
    const clone = bubble.cloneNode(true);
    clone.style.visibility = 'hidden';
    clone.style.display    = 'block';
    clone.style.opacity    = '0';
    clone.style.left = '-9999px';
    clone.style.top  = '0';
    clone.querySelector('.text').textContent = text;
    stage.appendChild(clone);
    const bw = Math.min(clone.offsetWidth || 420, maxW);
    const bh = clone.offsetHeight || 120;
    clone.remove();
    return {bw, bh};
  }

  function placeBubble(vIdx, customLift, xShift, fixedW){
    const {stage, bubble} = refs(); if(!stage || !bubble) return;
    const viewer = document.querySelector(`.viewer[data-idx="${vIdx}"]`); if(!viewer) return;

    const pad=12, leftCurtR=stage.clientWidth*0.18, rightCurtL=stage.clientWidth*0.82;

    bubble.style.display='block'; bubble.style.opacity='0';
    bubble.style.width  = (fixedW|0) ? (fixedW|0)+'px' : '';     // κλείδωμα πλάτους
    bubble.style.height = '';                                     // ύψος auto (χωρίς expand σε πλάτος)

    const bw = bubble.offsetWidth || (fixedW|0) || 360;

    const vRect = viewer.getBoundingClientRect();
    const sRect = stage.getBoundingClientRect();
    const viewerCx = (vRect.left + vRect.width/2) - sRect.left;

    let leftPx = viewerCx - bw/2 + (xShift||0);
    const minLeft = leftCurtR + pad;
    const maxLeft = rightCurtL - pad - bw;
    if (leftPx < minLeft) leftPx = minLeft;
    if (leftPx > maxLeft) leftPx = maxLeft;

    const baseLift = (typeof customLift==='number' ? customLift : 96);
    const topPx = Math.max(10, (vRect.top - sRect.top - baseLift));

    bubble.style.left = leftPx + 'px';
    bubble.style.top  = topPx  + 'px';
    bubble.style.opacity='1';
    bubble.classList.add('active');
  }

  function typeText(el, fullText, done){
    const txt = fixText(fullText);
    el.textContent = '';
    const ms = Math.max(5, getCharMs());
    let i = 0;
    (function tick(){
      if(i < txt.length){
        el.textContent += txt[i++];
        setTimeout(tick, ms);
      }else{
        if(typeof done === 'function') done();
      }
    })();
  }

  function safeResume(nextMode){
    try{ if (typeof window.resumeFromBubble === 'function') window.resumeFromBubble(nextMode||'run'); }catch(_){}
  }
  function safeSetMode(mode){
    try{ if (typeof window.setMode === 'function') window.setMode(mode); }catch(_){}
  }

  // OVERRIDE συμβατό με παλιά υπογραφή:
  // showThoughtForViewer(vIdx, text, durationSecs, customLift, xShift)
  window.showThoughtForViewer = function(vIdx, text, a3, a4, a5){
    const {stage, bubble} = refs(); if(!bubble || !stage) return;
    const customLift = (typeof a5 !== 'undefined') ? a4 : a3;
    const xShift     = (typeof a5 !== 'undefined') ? a5 : a4;

    const resolvedText = (typeof text === 'function') ? text() : text;
    const cleanText    = fixText(resolvedText);

    // Προ-μέτρηση με μέγιστο W=420px
    const {bw} = measureBubbleSize(stage, bubble, cleanText, 420);

    // Στήσιμο bubble με κλειδωμένο πλάτος
    bubble.querySelector('.text').textContent = '';
    placeBubble(vIdx, customLift, xShift, bw);

    // Τypewriter
    const textBox = bubble.querySelector('.text');
    const charMs  = Math.max(5,  getCharMs());
    const gapMs   = Math.max(0,  getGapMs());
    const estMs   = Math.max(1000, String(cleanText||'').length * charMs);

    safeSetMode('slow');
    if (typeof window.isBubbleActive === 'boolean') window.isBubbleActive = true;

    typeText(textBox, cleanText, function(){
      bubble.classList.add('checked');
      setTimeout(function(){ safeResume('run'); }, gapMs);
    });

    // δεν κλείνουμε εμείς το bubble — το κάνει το resumeFromBubble του core
    setTimeout(function(){/* guard */}, estMs + gapMs + 120);
  };
})();
