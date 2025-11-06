/* thought_typewriter_patch_v4.js — typewriter για bubbles (Act I & II), ασφαλές για functions */
(function(){
  'use strict';

  function getCharMs(){ return (typeof window.TYPE_CHAR_MS === 'number' ? window.TYPE_CHAR_MS : 45); }
  function getGapMs(){  return (typeof window.THINK_GAP_MS === 'number' ? window.THINK_GAP_MS  : 700); }

  function fixText(s){
    try{
      if (typeof window.fixThoughtText === 'function') return window.fixThoughtText(s);
      return String(s ?? '');
    }catch(_){ return String(s ?? ''); }
  }

  function refs(){
    return {
      stage:  document.getElementById('stage'),
      bubble: document.getElementById('bubble0')
    };
  }

  function placeBubble(vIdx, customLift, xShift){
    const {stage, bubble} = refs(); if(!stage || !bubble) return;
    const viewer = document.querySelector(`.viewer[data-idx="${vIdx}"]`); if(!viewer) return;

    const pad=12, leftCurtR=stage.clientWidth*0.18, rightCurtL=stage.clientWidth*0.82;
    bubble.style.display='block'; bubble.style.opacity='0';
    bubble.querySelector('.text').textContent = '';
    const bw = bubble.offsetWidth || 260;

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

  // override που δέχεται και function ως 'text'
  function install(){
    window.showThoughtForViewer = function(vIdx, text, /*durationSecs*/ customLift, xShift){
      const {bubble} = refs(); if(!bubble) return;
      const resolved = (typeof text === 'function') ? text() : text;

      placeBubble(vIdx, customLift, xShift);
      safeSetMode('slow');
      if (typeof window.isBubbleActive === 'boolean') window.isBubbleActive = true;

      const textBox = bubble.querySelector('.text');
      const afterGap = Math.max(0, getGapMs());

      typeText(textBox, resolved, function(){
        bubble.classList.add('checked');
        setTimeout(function(){ safeResume('run'); }, afterGap);
      });
    };
  }

  if (document.readyState !== 'loading') install();
  else document.addEventListener('DOMContentLoaded', install);
})();
