// act1-config.js
(function(){
  // Μικρά helpers – δεν «λερώνουν» globals
  const $ = (sel, root=document) => root.querySelector(sel);
  const css = (el, obj) => el && Object.assign(el.style, obj || {});
  const safeNum = (v, d) => (Number.isFinite(+v) ? +v : d);

  const DEFAULTS = {
    title: {
      h1: "Πράξη 1η: Η Κινηματική στα ... Αλγεβρικά",
      h2Format: "m₁ = {m} kg, D₁ = {D} N/m",
      h3Format: "Eμηχ = {E} J"
    },
    physics: { m:70, T:6.0, A_m:3.0, phi0:0.3, pxPerMeter:50 },
    ui: {
      curtains:{ topHeightPct:28, upperTopPct:28, upperHeightPct:40, lowerHeightPct:32, sideWidthPct:18, openOffsetPx:10, topOffsetAdjustPx:7 },
      zIndex:{ curtainTop:40, curtainUpper:16, curtainSide:14, signboard:41, chrono:41, floor:120, audience:150, actor:110, spring:100, bubbles:70, laws:41, startBtn:100 },
      floor:{ bottomCalc:"calc(32vh - 8px)", heightPx:2, color:"#9aa0a6" },
      audience:{ src:"koino.png", heightPx:63, bottomVh:8 },
      actor:{ src:"skater.png", widthPx:180, offsetLeftPx:-20, raisePx:3 },
      startButtonText:"Έναρξη"
    },
    ruler:{ enabled:true, min:-7, max:7, tick:1, showBeforeStart:true, baselineBottomVH:32, arrowOffsetPx:0 },
    measurement:{ enabled:true, rowEveryMs:200, tableMaxRows:1000, heightVH:50, columns:["#","t (s)","x (m)"], stickyHeader:true, scrollToLast:true },
    chartXT:{ enabled:true, showAtT:6.0, heightPx:240, widthPct:100, labels:{x:"t (s)", y:"x (m)"}, showAandTOnAxes:true, showX0:true },
    bubbles: [],
    i18n:{ lang:"el", sinLabel:"ημ", cosLabel:"συν", en:{ sinLabel:"sin", cosLabel:"cos" } },
    labels:{ countdownTop:"Η παράσταση αρχίζει...", countdownSub:"Ώρα για χαρτί & μολύβι!", pause:"Παύση", resume:"Συνέχεια", slow:"Αργή κίνηση", reset:"Reset" }
  };

  async function loadJSON(url){
    try{
      const res = await fetch(url, { cache: 'no-store' });
      if(!res.ok) throw new Error(res.statusText);
      return await res.json();
    }catch(e){
      return JSON.parse(JSON.stringify(DEFAULTS)); // βαθύ αντίγραφο
    }
  }

  function computeDerived(cfg){
    const m = safeNum(cfg.physics.m, 70);
    const T = safeNum(cfg.physics.T, 6);
    const A_m = safeNum(cfg.physics.A_m, 3);
    const omega = (2*Math.PI) / T;
    const D = Math.round(m * omega * omega);
    const E = Math.round(0.5 * D * A_m * A_m);
    cfg.__derived = { omega, D, E, Apx: (cfg.physics.pxPerMeter||50)*A_m };
  }

  function format(line, map){
    return String(line||'').replace(/\{(\w+)\}/g, (_,k)=> (k in map ? map[k] : `{${k}}`));
  }

  function applyTitles(cfg){
    const h1 = $('#tH1') || $('.signboard h1');
    const h2 = $('#tH2') || $('.signboard h2');
    const h3 = $('#tH3') || $('.signboard h3');
    if(h1) h1.textContent = cfg.title.h1;
    if(h2) h2.textContent = format(cfg.title.h2Format, { m:cfg.physics.m, D:cfg.__derived.D });
    if(h3) h3.textContent = format(cfg.title.h3Format, { E:cfg.__derived.E });
  }

  function applyCurtains(cfg){
    const top = $('.curtain-top');
    const upper = $('.curtain-upper');
    const lower = $('.curtain-lower');
    const left = $('.curtain-side.left');
    const right = $('.curtain-side.right');

    const u = cfg.ui.curtains;
    if(top)   css(top,   { height: u.topHeightPct + '%' });
    if(upper) { css(upper,{ top: u.upperTopPct + '%', height: u.upperHeightPct + '%' }); }
    if(lower) css(lower, { height: u.lowerHeightPct + '%' });
    [left,right].forEach(el=> css(el, { width: u.sideWidthPct + '%' }));

    // ζ-index
    const z = cfg.ui.zIndex;
    if(top)   top.style.zIndex   = z.curtainTop;
    if(upper) upper.style.zIndex = z.curtainUpper;
    [left,right].forEach(el=> el && (el.style.zIndex = z.curtainSide));

    // open offset (αν χρησιμοποιείς CSS var)
    const root = document.documentElement;
    root.style.setProperty('--open-offset', (u.openOffsetPx||10) + 'px');
  }

  function applyFloor(cfg){
    const floor = $('.floor-line');
    if(!floor) return;
    const f = cfg.ui.floor;
    css(floor, {
      bottom: f.bottomCalc,
      height: (f.heightPx||2) + 'px',
      background: f.color || '#9aa0a6',
      zIndex: cfg.ui.zIndex.floor
    });
  }

  function applyAudience(cfg){
    const img = $('#audience');
    if(!img) return;
    const a = cfg.ui.audience;
    if(a.src) img.src = a.src;
    css(img, {
      height: (a.heightPx||63) + 'px',
      bottom: (a.bottomVh||8) + 'vh',
      zIndex: cfg.ui.zIndex.audience
    });
  }

  function applyActor(cfg){
    const act = $('#actor');
    const img = $('#actor img, #actorImg') || $('#actorImg');
    if(act){
      // αν έχεις bottom/left υπολογισμούς μην τους αλλάζεις εδώ
      act.style.zIndex = cfg.ui.zIndex.actor;
    }
    if(img && cfg.ui.actor && cfg.ui.actor.src){
      img.src = cfg.ui.actor.src;
      if(cfg.ui.actor.widthPx) img.style.width = cfg.ui.actor.widthPx + 'px';
    }
  }

  function applyStartBtn(cfg){
    const btn = $('#startBtn');
    if(btn){
      btn.style.zIndex = cfg.ui.zIndex.startBtn;
      if(cfg.ui.startButtonText) btn.textContent = cfg.ui.startButtonText;
    }
  }

  function applyRuler(cfg){
    const ruler = $('#ruler'); // αν υπάρχει
    const arrow = $('#posArrow'); // αν υπάρχει
    if(ruler){
      ruler.dataset.min = cfg.ruler.min;
      ruler.dataset.max = cfg.ruler.max;
      ruler.dataset.tick = cfg.ruler.tick;
      ruler.dataset.showBeforeStart = !!cfg.ruler.showBeforeStart;
    }
    if(arrow){
      arrow.dataset.offsetPx = cfg.ruler.arrowOffsetPx||0;
    }
  }

  function applyMeasurement(cfg){
    const box = $('#measureBox'); // αν υπάρχει
    if(!box) return;
    box.dataset.enabled = !!cfg.measurement.enabled;
    box.dataset.rowEveryMs = cfg.measurement.rowEveryMs;
    box.dataset.maxRows = cfg.measurement.tableMaxRows;
    box.dataset.heightVH = cfg.measurement.heightVH;
    if(cfg.measurement.stickyHeader){ box.classList.add('sticky-header'); }
  }

  function applyChartXT(cfg){
    const cont = $('#xtChart'); // container αν υπάρχει
    if(!cont) return;
    cont.dataset.enabled = !!cfg.chartXT.enabled;
    cont.dataset.showAtT = cfg.chartXT.showAtT;
    cont.style.height = (cfg.chartXT.heightPx||240) + 'px';
  }

  function applyBubbles(cfg){
    // Αποθήκευση για χρήση από το δικό σου scheduler
    // (μην αλλάξεις το δικό σου — απλά διάβασέ το από window.ACT1_CFG.bubbles)
  }

  function applyI18n(cfg){
    // Αν ο δικός σου κώδικας δείχνει "ημ/συν" ή "sin/cos", μπορείς να ελέγχεις από εδώ:
    // window.ACT1_CFG.i18n.sinLabel / cosLabel
  }

  function calcPhysicsToDOM(cfg){
    // Αν ο δικός σου κώδικας χρειάζεται D/E πριν ξεκινήσει, είναι ήδη διαθέσιμα:
    // window.ACT1_CFG.__derived.{omega, D, E, Apx}
  }

  function applyAll(cfg){
    computeDerived(cfg);
    applyTitles(cfg);
    applyCurtains(cfg);
    applyFloor(cfg);
    applyAudience(cfg);
    applyActor(cfg);
    applyStartBtn(cfg);
    applyRuler(cfg);
    applyMeasurement(cfg);
    applyChartXT(cfg);
    applyBubbles(cfg);
    applyI18n(cfg);
    calcPhysicsToDOM(cfg);
  }

  async function boot(){
    const cfg = await loadJSON('act1-data.json');
    // Κρατάμε ΜΙΑ και μόνο ΜΙΑ αναφορά σε global για να μην υπάρχουν διπλοδηλώσεις.
    window.ACT1_CFG = cfg;
    applyAll(cfg);

    // Ειδοποίησε τον υπάρχοντα κώδικα σου ότι τα δεδομένα είναι έτοιμα
    document.dispatchEvent(new CustomEvent('ACT1_CONFIG_READY', { detail: cfg }));
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, { once:true });
  }else{
    boot();
  }
})();
