const BOOK_STORAGE_KEY = 'aatBookData';

let VIEWERS = [];
let ACT1 = [];
let ACT2 = [];
let FOYER = [];

let BOOK_CFG = null;

let gA = 3.0;
let gT = 6.0;
let gOmega = 2 * Math.PI / 6.0;
let gX0 = 0.0;
let gPhi0Deg = 0.0;
let gPhi0Rad = 0.0;
let gV0 = 0.0;
let gVSignSymbol = 'υ=0';
let gVSignWord = 'μηδενική';

const urlParams = new URLSearchParams(window.location.search);
const lang = (urlParams.get('lang') === 'en') ? 'en' : 'gr';
document.documentElement.lang = (lang === 'en') ? 'en' : 'el';

const diagramJobs = [];

function localizeTrig(text) {
  if (!text) return '';
  let out = String(text);
  if (lang === 'gr') {
    out = out.replace(/sin/g, 'ημ').replace(/cos/g, 'συν');
  }
  return out;
}

function loadBookData() {
  try {
    const raw = localStorage.getItem(BOOK_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data || null;
  } catch (e) {
    console.error('loadBookData error', e);
    return null;
  }
}

function setParam(name, valueStr) {
  document.querySelectorAll('[data-param="' + name + '"]').forEach(el => {
    el.textContent = valueStr;
  });
}

function expandDynTemplate(tpl) {
  if (!tpl) return '';
  const s = String(tpl);
  return s
    .replaceAll('{A}', gA.toFixed(2))
    .replaceAll('{T}', gT.toFixed(2))
    .replaceAll('{omega}', gOmega.toFixed(3))
    .replaceAll('{x0}', gX0.toFixed(2))
    .replaceAll('{phi0}', gPhi0Deg.toFixed(1))
    .replaceAll('{vSignSymbol}', gVSignSymbol)
    .replaceAll('{vSignWord}', gVSignWord);
}

function renderTxTable(samples) {
  const tbody = document.getElementById('txTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!Array.isArray(samples) || !samples.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 2;
    td.textContent = (lang === 'en')
      ? 'No t–x samples available. Play the scene at least once with the Book button.'
      : 'Δεν υπάρχουν δείγματα t–x. Παίξε τουλάχιστον μία φορά τη σκηνή με το κουμπί Βιβλίο.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  samples.forEach(pair => {
    const tr = document.createElement('tr');
    const tdT = document.createElement('td');
    const tdX = document.createElement('td');

    tdT.textContent = (pair.t != null) ? pair.t.toFixed(2) : '';
    tdX.textContent = (pair.x != null) ? pair.x.toFixed(2) : '';

    tr.appendChild(tdT);
    tr.appendChild(tdX);
    tbody.appendChild(tr);
  });
}

function viewerName(viewerIdx1) {
  const idx0 = (viewerIdx1 || 1) - 1;
  if (idx0 < 0 || idx0 >= VIEWERS.length) return '';
  const v = VIEWERS[idx0];
  if (!v) return '';
  if (lang === 'en') {
    return v.name_en || v.name_gr || ('Viewer ' + viewerIdx1);
  } else {
    return v.name_gr || ('Θεατής ' + viewerIdx1);
  }
}

function viewerInitial(viewerIdx1) {
  const name = viewerName(viewerIdx1);
  return name ? (name.trim()[0] || '?') : '?';
}

function viewerColor(viewerIdx1) {
  const idx0 = (viewerIdx1 || 1) - 1;
  const v = VIEWERS[idx0];
  return (v && v.color) ? v.color : '#4b5563';
}

function viewerImg(viewerIdx1) {
  const idx0 = (viewerIdx1 || 1) - 1;
  const v = VIEWERS[idx0];
  return (v && v.img) ? v.img : null;
}

function buildDialogTable(events, contextLabel) {
  const wrapper = document.createElement('div');
  wrapper.className = 'dialog-table';

  if (!events || !events.length) {
    const emptyRow = document.createElement('div');
    emptyRow.className = 'dialog-row';
    const c1 = document.createElement('div');
    const c2 = document.createElement('div');
    c1.className = 'dialog-cell left';
    c2.className = 'dialog-cell right';
    c1.textContent = (lang === 'en')
      ? 'No content found in JSON.'
      : 'Δεν βρέθηκε περιεχόμενο στο JSON.';
    emptyRow.appendChild(c1);
    emptyRow.appendChild(c2);
    wrapper.appendChild(emptyRow);
    return wrapper;
  }

  events.forEach((ev, idx) => {
    if (ev.close) return;

    const row = document.createElement('div');
    row.className = 'dialog-row';

    const leftCell = document.createElement('div');
    const rightCell = document.createElement('div');
    leftCell.className = 'dialog-cell left';
    rightCell.className = 'dialog-cell right';

    const leftRaw =
      (lang === 'en'
        ? (ev.left_en || ev.leftEN || ev.left)
        : (ev.left_gr || ev.leftGR || ev.left)) || '';
    const rightRaw =
      (lang === 'en'
        ? (ev.right_en || ev.rightEN || ev.right)
        : (ev.right_gr || ev.rightGR || ev.right)) || '';

    const leftText = expandDynTemplate(leftRaw);
    const rightText = expandDynTemplate(rightRaw);

    const hasLeft = leftText.trim() !== '';
    const hasRight = rightText.trim() !== '';

    if (hasLeft) {
      const sp = document.createElement('div');
      sp.className = 'speaker';

      const badge = document.createElement('div');
      badge.className = 'speaker-badge';

      const avatar = document.createElement('div');
      avatar.className = 'speaker-avatar';

      if (ev.viewer != null) {
        const vColor = viewerColor(ev.viewer);
        const vImg = viewerImg(ev.viewer);
        avatar.style.backgroundColor = vColor;
        if (vImg) {
          avatar.style.backgroundImage = 'url("' + vImg + '")';
        } else {
          avatar.textContent = viewerInitial(ev.viewer);
        }
      } else {
        avatar.style.backgroundColor = '#6b7280';
        avatar.textContent = (lang === 'en') ? 'N' : 'Α';
      }

      const nameSpan = document.createElement('span');
      nameSpan.className = 'speaker-name';
      if (ev.viewer != null) {
        nameSpan.textContent = viewerName(ev.viewer);
      } else {
        nameSpan.textContent = (lang === 'en') ? 'Narration' : 'Αφήγηση';
      }

      badge.appendChild(avatar);
      badge.appendChild(nameSpan);
      sp.appendChild(badge);

      const speech = document.createElement('div');
      speech.className = 'speech';
      speech.innerHTML = leftText.replaceAll('\n', '<br>');

      leftCell.appendChild(sp);
      leftCell.appendChild(speech);
    } else {
      leftCell.innerHTML = '&nbsp;';
    }

    let anythingRight = false;

    if (hasRight) {
      const txt = localizeTrig(rightText).replaceAll('\n', '<br>');
      const lawDiv = document.createElement('div');
      lawDiv.innerHTML = txt;
      rightCell.appendChild(lawDiv);
      anythingRight = true;
    }

    function addDiagram(kind, caption, extraOpts) {
      const box = document.createElement('div');
      box.className = 'diagram-inline';
      const canv = document.createElement('canvas');
      const id = `${contextLabel}-${kind}-${idx}`;
      canv.id = id;
      box.appendChild(canv);
      if (caption) {
        const cap = document.createElement('div');
        cap.className = 'diagram-caption';
        cap.textContent = caption;
        box.appendChild(cap);
      }
      rightCell.appendChild(box);
      diagramJobs.push(Object.assign({ id, kind }, (extraOpts || {})));
      anythingRight = true;
    }

    const hasXtMark = !!ev.xtZeroMark || !!ev.xtMarkTail;

    if (ev.graph === 'xt' || hasXtMark) {
      addDiagram(
        'xt',
        'Διάγραμμα x–t',
        {
          xtZeroMark: !!ev.xtZeroMark,
          xtMarkTail: !!ev.xtMarkTail
        }
      );
    }

    if (ev.plot === 'xsin') {
      addDiagram('xsin', 'Διάγραμμα x–ημ(ωt)');
    }
    if (ev.plot === 'v') {
      addDiagram('v', 'Διάγραμμα υ–t');
    }
    if (ev.plot === 'a') {
      addDiagram('a', 'Διάγραμμα a–t');
    }
    if (ev.plot === 'ax') {
      addDiagram('ax', 'Διάγραμμα a–x');
    }

    if (!anythingRight) {
      rightCell.innerHTML = '&nbsp;';
    }

    row.appendChild(leftCell);
    row.appendChild(rightCell);
    wrapper.appendChild(row);
  });

  return wrapper;
}

function applyColumnAlignment(div, column) {
  if (column === 'left') {
    div.style.maxWidth = '60%';
  } else if (column === 'right') {
    div.style.maxWidth = '40%';
    div.style.marginLeft = 'auto';
  }
}

function renderSection(sectionId, events, container, contextLabel) {
  const cfg = BOOK_CFG;
  const sec = cfg && Array.isArray(cfg.sections)
    ? cfg.sections.find(s => s.id === sectionId)
    : null;

  if (!sec || !Array.isArray(sec.blocks) || !sec.blocks.length) {
    container.appendChild(buildDialogTable(events, contextLabel));
    return;
  }

  sec.blocks.forEach(block => {
    if (block.type === 'dialogs') {
      const from = (typeof block.from === 'number' && block.from >= 0) ? block.from : 0;
      const to = (typeof block.to === 'number' && block.to >= 0) ? block.to : (events.length - 1);
      const slice = events.slice(from, to + 1);
      if (slice.length) {
        container.appendChild(buildDialogTable(slice, contextLabel));
      }
      return;
    }

    if (block.type === 'note' || block.type === 'html') {
      const div = document.createElement('div');
      div.className = 'card';
      applyColumnAlignment(div, block.column);
      div.innerHTML = expandDynTemplate(block.html || '');
      container.appendChild(div);
      return;
    }

    if (block.type === 'image') {
      const wrapper = document.createElement('div');
      wrapper.className = 'card';
      applyColumnAlignment(wrapper, block.column);

      const img = document.createElement('img');
      img.src = block.src || '';
      img.alt = block.alt || '';
      img.style.maxWidth = '100%';
      img.style.display = 'block';
      img.style.borderRadius = '6px';
      wrapper.appendChild(img);

      if (block.caption) {
        const cap = document.createElement('div');
        cap.className = 'diagram-caption';
        cap.textContent = block.caption;
        wrapper.appendChild(cap);
      }

      container.appendChild(wrapper);
      return;
    }

    if (block.type === 'diagram') {
      const wrapper = document.createElement('div');
      wrapper.className = 'card';
      applyColumnAlignment(wrapper, block.column || 'right');

      const label = document.createElement('div');
      label.className = 'diagram-caption';
      label.textContent = expandDynTemplate(block.title || block.label || '');
      wrapper.appendChild(label);

      const inner = document.createElement('div');
      inner.className = 'diagram-inline';

      const canvas = document.createElement('canvas');
      const id = block.id || `${sectionId}-${block.kind || 'xt'}`;
      canvas.id = id;
      inner.appendChild(canvas);

      if (block.caption) {
        const cap = document.createElement('div');
        cap.className = 'diagram-caption';
        cap.textContent = expandDynTemplate(block.caption);
        inner.appendChild(cap);
      }

      wrapper.appendChild(inner);
      container.appendChild(wrapper);

      diagramJobs.push({
        id,
        kind: block.kind || 'xt',
        xtZeroMark: !!block.xtZeroMark,
        xtMarkTail: !!block.xtMarkTail
      });

      return;
    }
  });
}

function drawXTChart(canvas, opts) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = 260;
  const h = canvas.height = 140;

  const margin = 22;
  const x0 = margin;
  const x1 = w - margin;
  const yTop = margin;
  const yBot = h - margin;

  const tMin = 0;
  const tMax = 2 * gT;
  const A = gA;
  const omega = gOmega;
  const phi0 = gPhi0Rad;

  function tToX(t) {
    return x0 + (t - tMin) / (tMax - tMin) * (x1 - x0);
  }
  function xToY(x) {
    const mid = (yTop + yBot) / 2;
    const amp = (yBot - yTop) / 2;
    const xMaxAbs = A * 1.1;
    return mid - (x / xMaxAbs) * amp;
  }

  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = 'rgba(148,163,184,0.45)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  const tTicks = [0, gT, 2 * gT];
  tTicks.forEach(t => {
    const xf = tToX(t);
    ctx.beginPath();
    ctx.moveTo(xf, yTop);
    ctx.lineTo(xf, yBot);
    ctx.stroke();
  });

  const xTicks = [-A, 0, A];
  xTicks.forEach(x => {
    const yf = xToY(x);
    ctx.beginPath();
    ctx.moveTo(x0, yf);
    ctx.lineTo(x1, yf);
    ctx.stroke();
  });

  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;

  const y0line = xToY(0);
  ctx.beginPath();
  ctx.moveTo(x0, y0line);
  ctx.lineTo(x1, y0line);
  ctx.stroke();

  const xAxis0 = tToX(0);
  ctx.beginPath();
  ctx.moveTo(xAxis0, yTop);
  ctx.lineTo(xAxis0, yBot);
  ctx.stroke();

  ctx.beginPath();
  ctx.rect(x0, yTop, x1 - x0, yBot - yTop);
  ctx.stroke();

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  const N = 240;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const t = tMin + (tMax - tMin) * (i / N);
    const x = A * Math.sin(omega * t + phi0);
    const px = tToX(t);
    const py = xToY(x);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  const x0val = gX0;
  const yx0 = xToY(x0val);
  ctx.strokeStyle = 'rgba(37,99,235,0.8)';
  ctx.setLineDash([4, 2]);
  ctx.beginPath();
  ctx.moveTo(x0, yx0);
  ctx.lineTo(x1, yx0);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(30,64,175,1)';
  ctx.font = '10px system-ui';
  ctx.fillText('x₀ ≈ ' + x0val.toFixed(2) + ' m', x0 + 4, yx0 - 4);

  const showMark = opts && opts.xtZeroMark;
  const showTail = opts && opts.xtMarkTail;

  if (showMark) {
    let off = (gPhi0Rad / gOmega) % gT;
    if (off < 0) off += gT;
    let tZero = (Math.abs(off) < 1e-9) ? 0 : (gT - off);

    if (tZero < tMin) tZero = tMin;
    if (tZero > tMax) tZero = tZero % gT;

    const px0 = tToX(tZero);
    const py0 = xToY(0);

    const tEnd = Math.min(tZero + gT, tMax);
    ctx.save();
    ctx.strokeStyle = 'rgba(220,38,38,0.95)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    const N2 = 200;
    ctx.beginPath();
    for (let i = 0; i <= N2; i++) {
      const t = tZero + (tEnd - tZero) * (i / N2);
      const tPrime = t - tZero;
      const x = gA * Math.sin(gOmega * tPrime);
      const px = tToX(t);
      const py = xToY(x);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    if (showTail) {
      ctx.save();
      ctx.strokeStyle = 'rgba(220,38,38,0.75)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(px0, yBot);
      ctx.lineTo(px0, py0);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = 'rgba(220,38,38,0.95)';
    ctx.beginPath();
    ctx.arc(px0, py0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const labelText = (lang === 'en') ? 'new t = 0' : 'νέο t = 0';
    ctx.save();
    ctx.font = '10px system-ui';
    const textWidth = ctx.measureText(labelText).width;
    const padX = 6;
    const padY = 3;
    let labelX = px0;
    let labelY = yTop + 10;

    const pillHalfW = textWidth / 2 + padX;
    if (labelX < x0 + pillHalfW + 4) labelX = x0 + pillHalfW + 4;
    if (labelX > x1 - pillHalfW - 4) labelX = x1 - pillHalfW - 4;

    const pillLeft = labelX - pillHalfW;
    const pillTop = labelY - (8 + padY);
    const pillW = pillHalfW * 2;
    const pillH = 16 + 2 * padY;
    const r = 8;

    ctx.beginPath();
    let X = pillLeft, Y = pillTop,
      W2 = pillW, H2 = pillH;
    ctx.moveTo(X + r, Y);
    ctx.lineTo(X + W2 - r, Y);
    ctx.quadraticCurveTo(X + W2, Y, X + W2, Y + r);
    ctx.lineTo(X + W2, Y + H2 - r);
    ctx.quadraticCurveTo(X + W2, Y + H2, X + W2 - r, Y + H2);
    ctx.lineTo(X + r, Y + H2);
    ctx.quadraticCurveTo(X, Y + H2, X, Y + H2 - r);
    ctx.lineTo(X, Y + r);
    ctx.quadraticCurveTo(X, Y, X + r, Y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(127,29,29,0.9)';
    ctx.strokeStyle = 'rgba(248,113,113,0.95)';
    ctx.lineWidth = 1.2;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(254,242,242,0.98)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, labelX, labelY);

    const arrowStartX = labelX;
    const arrowStartY = pillTop + pillH;
    const arrowEndX = px0;
    const arrowEndY = py0 - 6;

    ctx.strokeStyle = 'rgba(248,113,113,0.95)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(arrowStartX, arrowStartY);
    ctx.lineTo(arrowEndX, arrowEndY);
    ctx.stroke();

    const angle = Math.atan2(arrowEndY - arrowStartY, arrowEndX - arrowStartX);
    const headLen = 8;
    ctx.beginPath();
    ctx.moveTo(arrowEndX, arrowEndY);
    ctx.lineTo(
      arrowEndX - headLen * Math.cos(angle - Math.PI / 6),
      arrowEndY - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      arrowEndX - headLen * Math.cos(angle + Math.PI / 6),
      arrowEndY - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = 'rgba(248,113,113,0.95)';
    ctx.fill();

    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('x (m)', x0 + 4, yTop - 6);
  ctx.textAlign = 'right';
  ctx.fillText('t (s)', x1, yBot + 12);

  ctx.textAlign = 'center';
  ctx.fillText('0', tToX(0), yBot + 12);
  ctx.fillText(gT.toFixed(1), tToX(gT), yBot + 12);
  ctx.fillText((2 * gT).toFixed(1), tToX(2 * gT), yBot + 12);

  ctx.textAlign = 'left';
  ctx.fillText('-A', x0 + 4, xToY(-A) + 4);
  ctx.fillText('0', x0 + 4, xToY(0) + 4);
  ctx.fillText('+A', x0 + 4, xToY(+A) + 4);

  ctx.font = '11px system-ui';
  ctx.fillText('x(t)', x0 + 4, yTop + 10);
  ctx.restore();
}

function drawXSinChart(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = 260;
  const h = canvas.height = 140;

  const margin = 22;
  const x0 = margin;
  const x1 = w - margin;
  const yTop = margin;
  const yBot = h - margin;

  const sMin = -1;
  const sMax = 1;
  const A = gA || 1;
  const xMaxAbs = Math.max(1, Math.abs(A)) * 1.1;

  const midY = (yTop + yBot) / 2;
  const halfH = (yBot - yTop) / 2;
  function sToXpx(s) {
    return x0 + (s - sMin) / (sMax - sMin) * (x1 - x0);
  }
  function xToYpx(x) {
    return midY - (x / xMaxAbs) * halfH;
  }

  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = 'rgba(148,163,184,0.45)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  [-1, 0, 1].forEach(s => {
    const px = sToXpx(s);
    ctx.beginPath();
    ctx.moveTo(px, yTop);
    ctx.lineTo(px, yBot);
    ctx.stroke();
  });

  [-A, 0, A].forEach(x => {
    const py = xToYpx(x);
    ctx.beginPath();
    ctx.moveTo(x0, py);
    ctx.lineTo(x1, py);
    ctx.stroke();
  });

  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;

  const px0 = sToXpx(0);
  ctx.beginPath();
  ctx.moveTo(px0, yTop);
  ctx.lineTo(px0, yBot);
  ctx.stroke();

  const py0 = xToYpx(0);
  ctx.beginPath();
  ctx.moveTo(x0, py0);
  ctx.lineTo(x1, py0);
  ctx.stroke();

  ctx.beginPath();
  ctx.rect(x0, yTop, x1 - x0, yBot - yTop);
  ctx.stroke();

  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const s = sMin + (sMax - sMin) * (i / N);
    const x = A * s;
    const px = sToXpx(s);
    const py = xToYpx(x);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = '10px system-ui';

  ctx.textAlign = 'center';
  ctx.fillText('-1', sToXpx(-1), yBot + 12);
  ctx.fillText('0', sToXpx(0), yBot + 12);
  ctx.fillText('+1', sToXpx(+1), yBot + 12);
  ctx.fillText('ημ(ωt+φ₀)', (x0 + x1) / 2, yBot + 24);

  ctx.textAlign = 'left';
  ctx.fillText('-A', x0 + 4, xToYpx(-A) + 4);
  ctx.fillText('0', x0 + 4, xToYpx(0) + 4);
  ctx.fillText('+A', x0 + 4, xToYpx(+A) + 4);
  ctx.fillText('x (m)', x0 + 4, yTop - 6);

  ctx.restore();
}

function drawVChart(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = 260;
  const h = canvas.height = 140;

  const margin = 22;
  const x0 = margin;
  const x1 = w - margin;
  const yTop = margin;
  const yBot = h - margin;

  const tMin = 0;
  const tMax = 2 * gT;

  const vmax = gOmega * gA;
  function tToX(t) {
    return x0 + (t - tMin) / (tMax - tMin) * (x1 - x0);
  }
  function vToY(v) {
    const mid = (yTop + yBot) / 2;
    const amp = (yBot - yTop) / 2;
    const vMaxAbs = vmax * 1.1;
    return mid - (v / vMaxAbs) * amp;
  }

  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = 'rgba(148,163,184,0.45)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  const tTicks = [0, gT, 2 * gT];
  tTicks.forEach(t => {
    const xf = tToX(t);
    ctx.beginPath();
    ctx.moveTo(xf, yTop);
    ctx.lineTo(xf, yBot);
    ctx.stroke();
  });

  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;

  const y0line = vToY(0);
  ctx.beginPath();
  ctx.moveTo(x0, y0line);
  ctx.lineTo(x1, y0line);
  ctx.stroke();

  ctx.beginPath();
  ctx.rect(x0, yTop, x1 - x0, yBot - yTop);
  ctx.stroke();

  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  const N = 240;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const t = tMin + (tMax - tMin) * (i / N);
    const v = vmax * Math.cos(gOmega * t + gPhi0Rad);
    const px = tToX(t);
    const py = vToY(v);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('υ (m/s)', x0 + 4, yTop - 6);
  ctx.textAlign = 'right';
  ctx.fillText('t (s)', x1, yBot + 12);

  ctx.textAlign = 'center';
  ctx.fillText('0', tToX(0), yBot + 12);
  ctx.fillText(gT.toFixed(1), tToX(gT), yBot + 12);
  ctx.fillText((2 * gT).toFixed(1), tToX(2 * gT), yBot + 12);
  ctx.restore();
}

function drawAChart(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = 260;
  const h = canvas.height = 140;

  const margin = 22;
  const x0 = margin;
  const x1 = w - margin;
  const yTop = margin;
  const yBot = h - margin;

  const tMin = 0;
  const tMax = 2 * gT;

  const aMax = gOmega * gOmega * gA;
  function tToX(t) {
    return x0 + (t - tMin) / (tMax - tMin) * (x1 - x0);
  }
  function aToY(a) {
    const mid = (yTop + yBot) / 2;
    const amp = (yBot - yTop) / 2;
    const aMaxAbs = aMax * 1.1;
    return mid - (a / aMaxAbs) * amp;
  }

  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = 'rgba(148,163,184,0.45)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  const tTicks = [0, gT, 2 * gT];
  tTicks.forEach(t => {
    const xf = tToX(t);
    ctx.beginPath();
    ctx.moveTo(xf, yTop);
    ctx.lineTo(xf, yBot);
    ctx.stroke();
  });

  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;

  const y0line = aToY(0);
  ctx.beginPath();
  ctx.moveTo(x0, y0line);
  ctx.lineTo(x1, y0line);
  ctx.stroke();

  ctx.beginPath();
  ctx.rect(x0, yTop, x1 - x0, yBot - yTop);
  ctx.stroke();

  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  const N = 240;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const t = tMin + (tMax - tMin) * (i / N);
    const a = -gOmega * gOmega * gA * Math.sin(gOmega * t + gPhi0Rad);
    const px = tToX(t);
    const py = aToY(a);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('a (m/s²)', x0 + 4, yTop - 6);
  ctx.textAlign = 'right';
  ctx.fillText('t (s)', x1, yBot + 12);

  ctx.textAlign = 'center';
  ctx.fillText('0', tToX(0), yBot + 12);
  ctx.fillText(gT.toFixed(1), tToX(gT), yBot + 12);
  ctx.fillText((2 * gT).toFixed(1), tToX(2 * gT), yBot + 12);
  ctx.restore();
}

function drawAXChart(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = 260;
  const h = canvas.height = 140;

  const margin = 26;
  const x0 = margin;
  const x1 = w - margin;
  const yTop = margin;
  const yBot = h - margin;

  const A = gA;
  const aMax = gOmega * gOmega * gA;

  function xToXpx(x) {
    return x0 + (x + A) / (2 * A) * (x1 - x0);
  }
  function aToY(a) {
    const mid = (yTop + yBot) / 2;
    const amp = (yBot - yTop) / 2;
    const aMaxAbs = aMax * 1.1;
    return mid - (a / aMaxAbs) * amp;
  }

  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = 'rgba(148,163,184,0.45)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  const xTicks = [-A, 0, A];
  xTicks.forEach(x => {
    const xf = xToXpx(x);
    ctx.beginPath();
    ctx.moveTo(xf, yTop);
    ctx.lineTo(xf, yBot);
    ctx.stroke();
  });

  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;

  const y0line = aToY(0);
  ctx.beginPath();
  ctx.moveTo(x0, y0line);
  ctx.lineTo(x1, y0line);
  ctx.stroke();

  ctx.beginPath();
  ctx.rect(x0, yTop, x1 - x0, yBot - yTop);
  ctx.stroke();

  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const N = 50;
  for (let i = 0; i <= N; i++) {
    const x = -A + (2 * A) * (i / N);
    const a = -gOmega * gOmega * x;
    const px = xToXpx(x);
    const py = aToY(a);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('-A', xToXpx(-A), yBot + 12);
  ctx.fillText('0', xToXpx(0), yBot + 12);
  ctx.fillText('+A', xToXpx(+A), yBot + 12);

  ctx.textAlign = 'left';
  ctx.fillText('x (m)', x0 + 4, yBot + 12);
  ctx.fillText('a (m/s²)', x0 + 4, yTop - 6);
  ctx.restore();
}

function renderDiagramJobs() {
  diagramJobs.forEach(job => {
    const canvas = document.getElementById(job.id);
    if (!canvas) return;
    switch (job.kind) {
      case 'xt':   drawXTChart(canvas, job); break;
      case 'xsin': drawXSinChart(canvas);    break;
      case 'v':    drawVChart(canvas);       break;
      case 'a':    drawAChart(canvas);       break;
      case 'ax':   drawAXChart(canvas);      break;
    }
  });
}

async function loadDialogsAndBuild() {
  const file = (lang === 'en') ? 'dialogs-en.json' : 'dialogs-gr.json';
  diagramJobs.length = 0;

  const bookData = loadBookData();
  const DEFAULT_A = 3.0;
  const DEFAULT_T = 6.0;

  gA = (bookData && typeof bookData.A === 'number') ? bookData.A : DEFAULT_A;
  gT = (bookData && typeof bookData.T === 'number') ? bookData.T : DEFAULT_T;
  gOmega = (bookData && typeof bookData.omega === 'number') ? bookData.omega : (2 * Math.PI / gT);
  gX0 = (bookData && typeof bookData.x0 === 'number') ? bookData.x0 : 1.80;
  gPhi0Deg = (bookData && typeof bookData.phi0Deg === 'number') ? bookData.phi0Deg : 35.0;
  gPhi0Rad = gPhi0Deg * Math.PI / 180;

  gV0 = gOmega * gA * Math.cos(gPhi0Rad);
  const eps = 1e-6;
  if (gV0 > eps) {
    gVSignSymbol = 'υ>0';
    gVSignWord = (lang === 'en') ? 'positive' : 'θετική';
  } else if (gV0 < -eps) {
    gVSignSymbol = 'υ<0';
    gVSignWord = (lang === 'en') ? 'negative' : 'αρνητική';
  } else {
    gVSignSymbol = 'υ=0';
    gVSignWord = (lang === 'en') ? 'zero' : 'μηδενική';
  }

  setParam('A', gA.toFixed(2));
  setParam('T', gT.toFixed(2));
  setParam('omega', gOmega.toFixed(3));
  setParam('x0', gX0.toFixed(2));
  setParam('phi0', gPhi0Deg.toFixed(1));
  setParam('v0', gV0.toFixed(2));
  setParam('vSignSymbol', gVSignSymbol);
  setParam('vSignWord', gVSignWord);

  if (!bookData) {
    const note = document.getElementById('paramNote');
    if (note) {
      note.textContent = (lang === 'en')
        ? 'No data were found from the stage. Using indicative values (A=3.00 m, T=6.00 s, etc.).'
        : 'Δεν βρέθηκαν δεδομένα από τη σκηνή. Χρησιμοποιούνται ενδεικτικές τιμές (A=3.00 m, T=6.00 s κ.λπ.).';
    }
  }

  if (bookData && Array.isArray(bookData.samples)) {
    renderTxTable(bookData.samples);
  } else {
    renderTxTable([]);
  }

  try {
    const resp = await fetch(file, { cache: 'no-store' });
    if (!resp.ok) {
      console.error('Δεν βρέθηκε', file);
      return;
    }
    const data = await resp.json();
    VIEWERS = data.viewers || [];
    ACT1 = data.act1 || [];
    ACT2 = data.act2 || [];
    FOYER = data.foyer || [];

    const act1Cont = document.getElementById('act1Transcript');
    const act2Cont = document.getElementById('act2Transcript');
    const foyerCont = document.getElementById('foyerTranscript');

    act1Cont.innerHTML = '';
    act2Cont.innerHTML = '';
    foyerCont.innerHTML = '';

    BOOK_CFG = null;
    try {
      const br = await fetch('book.json', { cache: 'no-store' });
      if (br.ok) {
        BOOK_CFG = await br.json();
      }
    } catch (e2) {
      console.warn('book.json όχι διαθέσιμο ή μη έγκυρο', e2);
      BOOK_CFG = null;
    }

    renderSection('act1', ACT1, act1Cont, 'act1');
    renderSection('act2', ACT2, act2Cont, 'act2');
    renderSection('foyer', FOYER, foyerCont, 'foyer');

  } catch (err) {
    console.error(err);
  }

  renderDiagramJobs();
}

loadDialogsAndBuild();
