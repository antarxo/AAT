/* thought_typewriter_patch_v5.js — typewriter για bubbles, backwards-compatible υπογραφή */
(function(){
  'use strict';

  // Ρυθμίσεις ρυθμού
  function getCharMs(){ return (typeof window.TYPE_CHAR_MS === 'number' ? window.TYPE_CHAR_MS : 45); }
  function getGapMs(){  return (typeof window.THINK_GAP_MS === 'number' ? window.THINK_GAP_MS  : 700); }

  // Ασφαλής διόρθωση κειμένου (υποδείκτες/μονάδες) χωρίς «κινέζικα»
  function fixText(s){
    try{
      if (typeof window.fixThoughtText === 'function') return window.fixThoughtText(s);
      return String(s ?? '');
    }catch(_){ return String(s ?? ''); }
  }

  // Ενισχύουμε το bubble να τυλίγει ωραία, χωρίς κοψίματα
  (function injectCSS(){
    const css = `.thought-bubble .text{white-space:pre-wrap;word-break:normal;hyphens:auto}`;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  })();

  function refs(){
    return {
      stage:  document.getElementById('stage'),
      bubble: document.getElementById('bubble0')
    };
  }

  function placeBubble(vIdx, customLift, xShift){
    const {stage, bubble} = refs(); if(!stage || !bubble) return;
    const viewer = document.querySelector(`.viewer[data-idx="${vIdx}"]`); if(!viewer) return;

    // Στήσιμο bubble ΠΡΙΝ το γράψιμο, όπως ζητήθηκε
    const pad=12, leftCurtR=stage.clientWidth*0.18, rightCurtL=stage.clientWidth*0.82;
    bubble.style.display='block'; bubble.style.opacity='0';
    bubble.querySelector('.text').textContent = '';
    const bw = bubble.offsetWidth || 320;

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

  // Συμβατότητα με παλιά υπογραφή:
  // showThoughtForViewer(vIdx, text, durationSecs, customLift, xShift)
  // και με νέα:                       (vIdx, text, customLift, xShift)
  window.showThoughtForViewer = function(vIdx, text, a3, a4, a5){
    const {bubble} = refs(); if(!bubble) return;

    const isLegacy = (typeof a5 !== 'undefined'); // 5 ορίσματα = παλιό pattern από Act 1
    const customLift = isLegacy ? a4 : a3;
    const xShift     = isLegacy ? a5 : a4;

    const resolvedText = (typeof text === 'function') ? text() : text;

    placeBubble(vIdx, customLift, xShift);
    safeSetMode('slow');

    if (typeof window.isBubbleActive === 'boolean') window.isBubbleActive = true;

    const textBox = bubble.querySelector('.text');
    const afterGap = Math.max(0, getGapMs());
    const charMs   = Math.max(5,  getCharMs());
    const estMs    = Math.max(1200, String(resolvedText||'').length * charMs);

    // Γράψιμο χαρακτήρα-χαρακτήρα. Μετά «τικάρουμε» και κρατάμε μικρό κενό.
    typeText(textBox, resolvedText, function(){
      bubble.classList.add('checked');
      setTimeout(function(){ safeResume('run'); }, afterGap);
    });

    // Προστασία ενάντια σε overlap (αν κάποιο άλλο κομμάτι κάνει schedule)
    // Δεν κλείνουμε εμείς το bubble — το κάνει το resumeFromBubble του core.
    // Απλώς μπλοκάρουμε επόμενα events όσο γράφει (isBubbleActive=true).
    setTimeout(function(){ /* no-op guard until text τελειώσει */ }, estMs + afterGap + 100);
  };
})();
