/* thought_typewriter_patch_v7.js — Grapheme-safe typewriter + stable bubble sizing */
(function(){
  'use strict';

  function getCharMs(){ return (typeof window.TYPE_CHAR_MS === 'number' ? window.TYPE_CHAR_MS : 50); }
  function getGapMs(){  return (typeof window.THINK_GAP_MS === 'number' ? window.THINK_GAP_MS  : 900); }

  function fixText(s){
    try{ return (typeof window.fixThoughtText==='function') ? window.fixThoughtText(s) : String(s ?? ''); }
    catch(_){ return String(s ?? ''); }
  }

  (function injectCSS(){
    const css = `
      .thought-bubble,.thought-bubble .text,.laws {
        font-family: "Noto Sans", system-ui, -apple-system, "Segoe UI", Arial, Helvetica, sans-serif !important;
      }
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

  function measureBubbleWidth(stage, bubble, text, maxW){
    const ghost = bubble.cloneNode(true);
    ghost.style.visibility = 'hidden';
    ghost.style.display    = 'block';
    ghost.style.opacity    = '0';
    ghost.style.left = '-9999px';
    ghost.style.top  = '0';
    ghost.querySelector('.text').textContent = text;
    stage.appendChild(ghost);
    const bw = Math.min(ghost.offsetWidth || 420, maxW);
    ghost.remove();
    return bw;
  }

  function placeBubble(vIdx, customLift, xShift, fixedW){
    const {stage, bubble} = refs(); if(!stage || !bubble) return;
    const viewer = document.querySelector(`.viewer[data-idx="${vIdx}"]`); if(!viewer) return;

    const pad=12, leftCurtR=stage.clientWidth*0.18, rightCurtL=stage.clientWidth*0.82;

    bubble.style.display='block'; bubble.style.opacity='0';
    bubble.style.width  = (fixedW|0) ? (fixedW|0)+'px' : '';
    bubble.style.height = '';

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

  function graphemes(str){
    try{
      const seg = new Intl.Segmenter('el', {granularity:'grapheme'});
      return Array.from(seg.segment(str), s => s.segment);
    }catch(_){
      // Fallback – better than charCode split
      return Array.from(str);
    }
  }

  function typeText(el, fullText, done){
    const txt = fixText(fullText);
    const glyphs = graphemes(txt);
    el.textContent = '';
    const ms = Math.max(5, getCharMs());
    let i = 0;
    (function tick(){
      if(i < glyphs.length){
        el.textContent += glyphs[i++];
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

  window.showThoughtForViewer = function(vIdx, text, a3, a4, a5){
    const {stage, bubble} = refs(); if(!bubble || !stage) return;
    const customLift = (typeof a5 !== 'undefined') ? a4 : a3;
    const xShift     = (typeof a5 !== 'undefined') ? a5 : a4;

    const resolvedText = (typeof text === 'function') ? text() : text;
    const cleanText    = fixText(resolvedText);
    const bw = measureBubbleWidth(stage, bubble, cleanText, 420);

    bubble.querySelector('.text').textContent = '';
    placeBubble(vIdx, customLift, xShift, bw);

    const textBox = bubble.querySelector('.text');
    const gapMs   = (typeof window.THINK_GAP_MS === 'number') ? window.THINK_GAP_MS : 900;

    safeSetMode('slow');
    if (typeof window.isBubbleActive === 'boolean') window.isBubbleActive = true;

    typeText(textBox, cleanText, function(){
      bubble.classList.add('checked');
      setTimeout(function(){ safeResume('run'); }, gapMs);
    });
  };
})();
