// ui_laws_layout_v4.js — Μία γραμμή/νόμο, χωρίς «Νόμος (…)», χωρίς scroll.
// Τα mini-γραφήματα (#lawCharts) κατεβαίνουν όσο μεγαλώνει το πλαίσιο νόμων
// και κρύβονται όταν εξέλθουν από το ύψος της σκηνής.

(function () {
  'use strict';

  const stage     = document.getElementById('stage');
  const lawsPane  = document.getElementById('laws');
  const lawsList  = document.getElementById('lawsList');
  const lawsTitle = document.getElementById('lawsTitle');
  const lawCharts = document.getElementById('lawCharts');

  // Ασφαλιστικό CSS
  const css = `
    #laws{ overflow:visible!important; max-height:none!important; }
    #lawsList{ list-style:none!important; margin:0!important; padding:0!important; }
    #lawsList>li{ display:none!important; } /* καθάρισμα παλιών LI */
    .law-line{
      display:block; margin:6px 0 10px; padding:6px 8px;
      background:rgba(0,0,0,.25); border:1px solid rgba(255,255,255,.25);
      border-radius:8px; color:#fff; line-height:1.48; font-size:16px;
      white-space:normal;
    }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // Container
  let box = lawsList ? lawsList.querySelector('.law-box') : null;
  if (lawsList && !box) {
    box = document.createElement('div');
    box.className = 'law-box';
    lawsList.innerHTML = '';
    lawsList.appendChild(box);
  }

  function ensureShown() {
    if (!lawsPane) return;
    lawsPane.style.display = 'block';
    if (lawsTitle && !lawsTitle.textContent.trim()) {
      const lang = (window.LANG || 'gr');
      const title = (window.i18n && window.i18n[lang] && window.i18n[lang].lawsTitle) || 'Νόμοι Α.Α.Τ.';
      lawsTitle.textContent = title;
    }
  }

  function countLaws() {
    return box ? box.querySelectorAll('.law-line').length : 0;
  }

  function syncCharts() {
    if (!lawCharts || !lawsPane || !stage) return;
    const s = stage.getBoundingClientRect();
    const p = lawsPane.getBoundingClientRect();

    lawCharts.style.position = 'absolute';
    lawCharts.style.left = '2%';
    lawCharts.style.top  = (p.bottom - s.top + 8) + 'px';

    const out = (lawCharts.getBoundingClientRect().top - s.top) > (stage.clientHeight - 16);
    lawCharts.style.visibility = out ? 'hidden' : 'visible';
  }

  // Αντικατάσταση του addLaw: μία γραμμή, με (n) στο τέλος.
  const _origAdd = window.addLaw;
  window.addLaw = function (formulaText) {
    try {
      ensureShown();
      if (!box) return;

      const stripped = String(formulaText || '').replace(/\(\d+\)\s*$/,'').trim();
      const n = countLaws() + 1;

      const line = document.createElement('div');
      line.className = 'law-line';
      const loc = (typeof window.localizeTrig === 'function') ? window.localizeTrig(stripped) : stripped;
      line.textContent = loc + ` (${n})`;

      box.appendChild(line);
      syncCharts();
    } catch (e) {
      console.error('ui_laws_layout_v4 addLaw failed; fallback.', e);
      if (typeof _origAdd === 'function') _origAdd(formulaText);
      syncCharts();
    }
  };

  window.positionLawCharts = syncCharts;
  window.addEventListener('resize', syncCharts);
  setTimeout(syncCharts, 60);
})();
