const BOOK_STORAGE_KEY = 'aatBookData';

let VIEWERS = [];
let ACT1 = [];
let ACT2 = [];
let FOYER = [];

// επιπλέον config από book.json (πρόσθετα)
let BOOK_CFG = null;

// παγκόσμιες παράμετροι για διαγράμματα / templates
let gA = 3.0;
let gT = 6.0;
let gOmega = 2*Math.PI/6.0;
let gX0 = 0.0;
let gPhi0Deg = 0.0;
let gPhi0Rad = 0.0;
let gV0 = 0.0;
let gVSignSymbol = 'υ=0';
let gVSignWord = 'μηδενική';

const urlParams = new URLSearchParams(window.location.search);
const lang = (urlParams.get('lang') === 'en') ? 'en' : 'gr';
document.documentElement.lang = (lang === 'en') ? 'en' : 'el';

// λίστα διαγραμμάτων που θα σχεδιαστούν μετά το χτίσιμο του DOM
const diagramJobs = [];

function localizeTrig(text){
  if(!text) return '';
  let out = String(text);
  if(lang === 'gr'){
    out = out.replace(/sin/g,'ημ').replace(/cos/g,'συν');
  }
  return out;
}

function loadBookData(){
  try{
    const raw = localStorage.getItem(BOOK_STORAGE_KEY);
    if(!raw) return null;
    const data = JSON.parse(raw);
    return data || null;
  }catch(e){
    console.error('loadBookData error', e);
    return null;
  }
}

function setParam(name, valueStr){
  document.querySelectorAll('[data-param="'+name+'"]').forEach(el=>{
    el.textContent = valueStr;
  });
}

// expand {A},{T},{omega},{x0},{phi0},{vSignSymbol},{vSignWord}
function expandDynTemplate(tpl){
  if(!tpl) return '';
  const s = String(tpl);
  return s
    .replaceAll('{A}', String(gA.toFixed(2)))
    .replaceAll('{T}', String(gT.toFixed(2)))
    .replaceAll('{omega}', String(gOmega.toFixed(2)))
    .replaceAll('{x0}', String(gX0.toFixed(2)))
    .replaceAll('{phi0}', String(gPhi0Deg.toFixed(1)))
    .replaceAll('{vSignSymbol}', gVSignSymbol)
    .replaceAll('{vSignWord}', gVSignWord);
}

// Χτίσιμο πίνακα t–x από τα δείγματα
function buildTXTable(samples){
  const tbody = document.getElementById('txTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';

  if(!Array.isArray(samples) || !samples.length){
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

  samples.forEach(pair=>{
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

// Δημιουργία badge ομιλητή
function viewerName(viewerIdx1){
  const idx0 = (viewerIdx1 || 1) - 1;
  if(idx0 < 0 || idx0 >= VIEWERS.length) return '';
  const v = VIEWERS[idx0];
  if(!v) return '';
  if(lang === 'en'){
    return v.name_en || v.name_gr || ('Viewer ' + viewerIdx1);
  }else{
    return v.name_gr || ('Θεατής ' + viewerIdx1);
  }
}

function viewerInitial(viewerIdx1){
  const name = viewerName(viewerIdx1);
  return name ? (name.trim()[0] || '?') : '?';
}

function viewerColor(viewerIdx1){
  const idx0 = (viewerIdx1 || 1) - 1;
  const v = VIEWERS[idx0];
  return (v && v.color) ? v.color : '#4b5563';
}

function viewerImg(viewerIdx1){
  const idx0 = (viewerIdx1 || 1) - 1;
  const v = VIEWERS[idx0];
  return (v && v.img) ? v.img : null;
}

function createAvatarElement(viewerIdx1){
  const imgUrl = viewerImg(viewerIdx1);
  if(imgUrl){
    const img = document.createElement('img');
    img.className = 'speaker-avatar-img';
    img.src = imgUrl;
    img.alt = viewerName(viewerIdx1);
    return img;
  }
  const span = document.createElement('span');
  span.className = 'speaker-avatar-circle';
  span.style.background = viewerColor(viewerIdx1);
  span.textContent = viewerInitial(viewerIdx1);
  return span;
}

// Χτίσιμο μίας γραμμής διαλόγου
function buildDialogRow(ev, contextLabel){
  const row = document.createElement('div');
  row.className = 'dialog-row';

  const leftCell = document.createElement('div');
  leftCell.className = 'dialog-cell dialog-cell-left';

  const rightCell = document.createElement('div');
  rightCell.className = 'dialog-cell dialog-cell-right';

  // Αριστερά: θεατής + λόγια
  if(ev.viewer && ev.textLeft){
    const sp = document.createElement('div');
    sp.className = 'speaker-line';

    const badge = document.createElement('div');
    badge.className = 'speaker-badge';

    const avatar = createAvatarElement(ev.viewer);
    const nameSpan = document.createElement('span');
    nameSpan.className = 'speaker-name';

    const nm = viewerName(ev.viewer);
    if(nm){
      nameSpan.textContent = nm;
    }else{
      nameSpan.textContent = (lang === 'en') ? 'Narration' : 'Αφήγηση';
    }

    badge.appendChild(avatar);
    badge.appendChild(nameSpan);
    sp.appendChild(badge);

    const speech = document.createElement('div');
    speech.className = 'speech';
    speech.innerHTML = (ev.textLeft || '').replaceAll('\n','<br>');

    leftCell.appendChild(sp);
    leftCell.appendChild(speech);
  }else if(ev.textLeft){
    const p = document.createElement('div');
    p.className = 'speech';
    p.innerHTML = (ev.textLeft || '').replaceAll('\n','<br>');
    leftCell.appendChild(p);
  }

  // Δεξιά: νόμοι / διαγράμματα / πρόσθετα
  let anythingRight = false;

  // περιγραφή / κείμενο δεξιά (textRight)
  if(ev.textRight){
    const p = document.createElement('div');
    p.className = 'speech';
    p.innerHTML = (ev.textRight || '').replaceAll('\n','<br>');
    rightCell.appendChild(p);
    anythingRight = true;
  }

  // νόμοι (laws array)
  if(ev.laws && Array.isArray(ev.laws) && ev.laws.length){
    const lawTitle = document.createElement('div');
    lawTitle.className = 'block-title';
    lawTitle.textContent = (lang === 'en')
      ? 'Relations used at this step'
      : 'Σχέσεις που χρησιμοποιούνται σε αυτό το βήμα';
    rightCell.appendChild(lawTitle);

    const pre = document.createElement('div');
    pre.className = 'law-text';
    pre.textContent = localizeTrig(ev.laws.join('\n'));
    rightCell.appendChild(pre);
    anythingRight = true;
  }

  // απλό label για κατάσταση
  if(ev.tag){
    const tag = document.createElement('span');
    tag.className = 'inline-tag';
    const dot = document.createElement('span');
    dot.className = 'inline-dot';
    const lbl = document.createElement('span');
    lbl.textContent = ev.tag;
    tag.appendChild(dot);
    tag.appendChild(lbl);
    rightCell.appendChild(tag);
    anythingRight = true;
  }

  // διαγράμματα από πεδία ev.graph / ev.plot (όπως στη σκηνή)
  function addDiagram(kind, caption, extraOpts){
    const box = document.createElement('div');
    box.className = 'diagram-inline';
    const canv = document.createElement('canvas');
    const id = `${contextLabel}-${kind}-${idx}`;
    canv.id = id;
    box.appendChild(canv);
    if(caption){
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

  // x–t: είτε γραμμή graph:"xt" είτε απλά xtZeroMark/xtMarkTail (όπως στη σκηνή)
  if(ev.graph === 'xt' || hasXtMark){
    addDiagram(
      'xt',
      (lang === 'en') ? 'x–t diagram' : 'Διάγραμμα x–t',
      {
        tZeroMark: ev.xtZeroMark,
        tZeroHasTail: ev.xtMarkTail
      }
    );
  }

  // v–t
  if(ev.graph === 'v'){
    addDiagram(
      'v',
      (lang === 'en') ? 'v–t diagram' : 'Διάγραμμα υ–t'
    );
  }

  // a–t
  if(ev.graph === 'a'){
    addDiagram(
      'a',
      (lang === 'en') ? 'a–t diagram' : 'Διάγραμμα α–t'
    );
  }

  // a–x
  if(ev.graph === 'ax'){
    addDiagram(
      'ax',
      (lang === 'en') ? 'a–x diagram' : 'Διάγραμμα α–x'
    );
  }

  if(!anythingRight){
    rightCell.classList.add('dialog-cell-right-empty');
  }

  row.appendChild(leftCell);
  row.appendChild(rightCell);
  return row;
}

// Χτίσιμο plain πίνακα διαλόγων (fallback χωρίς book.json)
function buildDialogTable(events, contextLabel){
  const container = document.createElement('div');
  container.className = 'dialog-block';

  if(!Array.isArray(events) || !events.length){
    const p = document.createElement('p');
    p.className = 'small-note';
    p.textContent = (lang === 'en')
      ? 'No dialogue available for this part.'
      : 'Δεν υπάρχουν διάλογοι για αυτό το μέρος.';
    container.appendChild(p);
    return container;
  }

  events.forEach((ev, idx)=>{
    const row = buildDialogRow(ev, contextLabel, idx);
    container.appendChild(row);
  });

  return container;
}

// Απόδοση section με βάση book.json (αν υπάρχει), αλλιώς full διάλογος
function renderSection(sectionId, events, container, contextLabel){
  const cfg = BOOK_CFG;
  const sec = cfg && Array.isArray(cfg.sections)
    ? cfg.sections.find(s => s.id === sectionId)
    : null;

  if(!sec || !Array.isArray(sec.blocks) || !sec.blocks.length){
    container.appendChild( buildDialogTable(events, contextLabel) );
    return;
  }

  sec.blocks.forEach(block=>{
    if(block.type === 'dialogs'){
      const from = (typeof block.from === 'number' && block.from >= 0) ? block.from : 0;
      const to = (typeof block.to === 'number' && block.to >= 0) ? block.to : (events.length - 1);
      const subset = events.slice(from, to+1);
      const dlg = buildDialogTable(subset, contextLabel);
      container.appendChild(dlg);
      return;
    }

    if(block.type === 'note' || block.type === 'html'){
      const card = document.createElement('div');
      card.className = 'dialog-block';
      const inner = document.createElement('div');
      inner.className = 'dialog-cell dialog-cell-right';
      const content = document.createElement('div');
      content.className = 'speech';
      content.innerHTML = expandDynTemplate(block.html || block.text || '');
      inner.appendChild(content);
      card.appendChild(inner);
      container.appendChild(card);
      return;
    }

    if(block.type === 'diagram'){
      const card = document.createElement('div');
      card.className = 'dialog-block';

      const inner = document.createElement('div');
      inner.className = 'dialog-cell dialog-cell-right';

      const diagWrap = document.createElement('div');
      diagWrap.className = 'diagram-wrapper';

      const label = document.createElement('div');
      label.className = 'diagram-label';
      label.textContent = expandDynTemplate(block.label || '');
      diagWrap.appendChild(label);

      const cwrap = document.createElement('div');
      cwrap.className = 'diagram-inline';
      const canvas = document.createElement('canvas');
      const id = block.id || `${sectionId}-${block.kind || 'custom'}`;
      canvas.id = id;
      cwrap.appendChild(canvas);
      diagWrap.appendChild(cwrap);

      diagramJobs.push({
        id,
        kind: block.kind || 'xt',
        tZeroMark: block.tZeroMark,
        tZeroHasTail: block.tZeroHasTail
      });

      inner.appendChild(diagWrap);
      card.appendChild(inner);
      container.appendChild(card);
      return;
    }

    if(block.type === 'image'){
      const card = document.createElement('div');
      card.className = 'dialog-block';

      const inner = document.createElement('div');
      inner.className = 'dialog-cell dialog-cell-right';

      const img = document.createElement('img');
      img.className = 'block-image';
      img.src = block.src || '';
      if(block.alt){
        img.alt = block.alt;
      }

      inner.appendChild(img);
      card.appendChild(inner);
      container.appendChild(card);
      return;
    }

    // unsupported: quietly ignore
  });
}

// ----- Σχεδίαση διαγραμμάτων (χρησιμοποιούν gA, gT, gOmega, gPhi0Rad, gX0) -----

function drawXTChart(canvas, opts){
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width  = 260;
  const h = canvas.height = 140;

  const margin = 24;
  const x0 = margin;
  const x1 = w - margin;
  const yTop = margin;
  const yBot = h - margin;

  const tZero = (opts && typeof opts.tZeroMark === 'number') ? opts.tZeroMark : 0;
  const hasTail = !!(opts && opts.tZeroHasTail);

  const tStart = tZero - gT*0.4;
  const tEnd   = tZero + gT*1.6;
  const A = gA;
  const omega = gOmega;

  function tToX(t){
    return x0 + (t - tStart)/(tEnd - tStart) * (x1 - x0);
  }
  function xToY(x){
    const maxAbs = A;
    const norm = (x + maxAbs)/(2*maxAbs);
    return yBot - norm*(yBot-yTop);
  }

  ctx.clearRect(0,0,w,h);
  ctx.save();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,w,h);

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;

  const yMid = xToY(0);
  ctx.beginPath();
  ctx.moveTo(x0,yMid);
  ctx.lineTo(x1,yMid);
  ctx.stroke();

  [tStart, tZero, tEnd].forEach(t=>{
    const xf=tToX(t);
    ctx.beginPath();
    ctx.moveTo(xf,yTop);
    ctx.lineTo(xf,yBot);
    ctx.stroke();
  });

  const px0 = tToX(tZero);
  const x0val = A*Math.sin(gOmega*(tZero - tZero) + gPhi0Rad);
  const py0 = xToY(x0val);

  ctx.save();
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const N = 260;
  for(let i=0;i<=N;i++){
    const t = tStart + (tEnd - tStart)*(i/N);
    const x = A*Math.sin(gOmega*(t - tZero) + gPhi0Rad);
    const px = tToX(t);
    const py = xToY(x);
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.stroke();
  ctx.restore();

  // κόκκινη «νέα» x–t με t'=0 στο tZero
  ctx.save();
  ctx.strokeStyle = 'rgba(220,38,38,0.95)';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  const N2 = 200;
  ctx.beginPath();
  for(let i=0;i<=N2;i++){
    const t = tZero + (tEnd - tZero)*(i/N2);
    const tPrime = t - tZero;
    const x = gA*Math.sin(gOmega*tPrime);
    const px = tToX(t);
    const py = xToY(x);
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.stroke();
  ctx.restore();

  // κάθετη ουρά, αν ζητηθεί
  if(showTail){
    ctx.save();
    ctx.strokeStyle='rgba(220,38,38,0.75)';
    ctx.setLineDash([3,3]);
    ctx.lineWidth=1.3;
    ctx.beginPath();
    ctx.moveTo(px0,yBot);
    ctx.lineTo(px0,py0);
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle='#111827';
  ctx.font='11px system-ui, sans-serif';
  ctx.textAlign='right';
  ctx.fillText('x–t', x1, yTop+10);

  ctx.restore();
}

function drawVChart(canvas){
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width  = 260;
  const h = canvas.height = 140;

  const margin = 24;
  const x0 = margin;
  const x1 = w - margin;
  const yTop = margin;
  const yBot = h - margin;

  const tMin = 0;
  const tMax = 2*gT;
  const A = gA;
  const omega = gOmega;
  const phi0 = gPhi0Rad;

  function tToXcoord(t){
    return x0 + (t - tMin)/(tMax - tMin) * (x1 - x0);
  }
  function vToY(v){
    const vmax = A*omega;
    const norm = (v + vmax)/(2*vmax);
    return yBot - norm*(yBot-yTop);
  }

  ctx.clearRect(0,0,w,h);
  ctx.save();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,w,h);

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;

  const yMid = vToY(0);
  ctx.beginPath();
  ctx.moveTo(x0,yMid);
  ctx.lineTo(x1,yMid);
  ctx.stroke();

  const tTicks=[0,gT,2*gT];
  tTicks.forEach(t=>{
    const xf=tToXcoord(t);
    ctx.beginPath();
    ctx.moveTo(xf,yTop);
    ctx.lineTo(xf,yBot);
    ctx.stroke();
  });

  const vTicks=[-A*omega,0,A*omega];
  vTicks.forEach(v=>{
    const yf=vToY(v);
    ctx.beginPath();
    ctx.moveTo(x0,yf);
    ctx.lineTo(x1,yf);
    ctx.stroke();
  });

  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const steps = 200;
  for(let i=0;i<=steps;i++){
    const t = tMin + (tMax-tMin)*i/steps;
    const v = A*omega*Math.cos(omega*t + phi0);
    const X = tToXcoord(t);
    const Y = vToY(v);
    if(i===0){
      ctx.moveTo(X,Y);
    }else{
      ctx.lineTo(X,Y);
    }
  }
  ctx.stroke();

  ctx.fillStyle='#111827';
  ctx.font='11px system-ui, sans-serif';
  ctx.textAlign='right';
  ctx.fillText('υ–t', x1, yTop+10);

  ctx.restore();
}

function drawAChart(canvas){
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width  = 260;
  const h = canvas.height = 140;

  const margin = 24;
  const x0 = margin;
  const x1 = w - margin;
  const yTop = margin;
  const yBot = h - margin;

  const tMin = 0;
  const tMax = 2*gT;
  const A = gA;
  const omega = gOmega;
  const phi0 = gPhi0Rad;

  function tToXcoord(t){
    return x0 + (t - tMin)/(tMax - tMin) * (x1 - x0);
  }
  function aToY(a){
    const amax = A*omega*omega;
    const norm = (a + amax)/(2*amax);
    return yBot - norm*(yBot-yTop);
  }

  ctx.clearRect(0,0,w,h);
  ctx.save();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,w,h);

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;

  const yMid = aToY(0);
  ctx.beginPath();
  ctx.moveTo(x0,yMid);
  ctx.lineTo(x1,yMid);
  ctx.stroke();

  const tTicks=[0,gT,2*gT];
  tTicks.forEach(t=>{
    const xf=tToXcoord(t);
    ctx.beginPath();
    ctx.moveTo(xf,yTop);
    ctx.lineTo(xf,yBot);
    ctx.stroke();
  });

  const aMax = A*omega*omega;
  const aTicks=[-aMax,0,aMax];
  aTicks.forEach(a=>{
    const yf=aToY(a);
    ctx.beginPath();
    ctx.moveTo(x0,yf);
    ctx.lineTo(x1,yf);
    ctx.stroke();
  });

  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const steps = 200;
  for(let i=0;i<=steps;i++){
    const t = tMin + (tMax-tMin)*i/steps;
    const a = -A*omega*omega*Math.sin(omega*t + phi0);
    const X = tToXcoord(t);
    const Y = aToY(a);
    if(i===0){
      ctx.moveTo(X,Y);
    }else{
      ctx.lineTo(X,Y);
    }
  }
  ctx.stroke();

  ctx.fillStyle='#111827';
  ctx.font='11px system-ui, sans-serif';
  ctx.textAlign='right';
  ctx.fillText('α–t', x1, yTop+10);

  ctx.restore();
}

function drawAXChart(canvas){
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width  = 260;
  const h = canvas.height = 140;

  const margin = 24;
  const x0 = margin;
  const x1 = w - margin;
  const yTop = margin;
  const yBot = h - margin;

  const A = gA;
  const omega = gOmega;

  function xToXcoord(x){
    const minX = -A;
    const maxX = A;
    return x0 + (x - minX)/(maxX - minX) * (x1 - x0);
  }
  function aToY(a){
    const maxAbs = A*omega*omega;
    const norm = (a + maxAbs)/(2*maxAbs);
    return yBot - norm*(yBot-yTop);
  }

  ctx.clearRect(0,0,w,h);
  ctx.save();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,w,h);

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;

  const yMid = aToY(0);
  ctx.beginPath();
  ctx.moveTo(x0,yMid);
  ctx.lineTo(x1,yMid);
  ctx.stroke();

  for(let i=0;i<=4;i++){
    const xTick = -A + i*(2*A/4);
    const xf=xToXcoord(xTick);
    ctx.beginPath();
    ctx.moveTo(xf,yTop);
    ctx.lineTo(xf,yBot);
    ctx.stroke();
  }

  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const steps = 200;
  for(let i=0;i<=steps;i++){
    const x = -A + (2*A)*i/steps;
    const a = -omega*omega*x;
    const X = xToXcoord(x);
    const Y = aToY(a);
    if(i===0){
      ctx.moveTo(X,Y);
    }else{
      ctx.lineTo(X,Y);
    }
  }
  ctx.stroke();

  ctx.fillStyle='#111827';
  ctx.font='11px system-ui, sans-serif';
  ctx.textAlign='right';
  ctx.fillText('α(x)', x1, yTop+10);

  ctx.restore();
}

// Εκτέλεση όλων των αναμονών για διαγράμματα
function renderDiagramJobs(){
  diagramJobs.forEach(job=>{
    const canvas = document.getElementById(job.id);
    if(!canvas) return;
    switch(job.kind){
      case 'xt':   drawXTChart(canvas, job); break;
      case 'v':    drawVChart(canvas);       break;
      case 'a':    drawAChart(canvas);       break;
      case 'ax':   drawAXChart(canvas);      break;
    }
  });
}

async function loadDialogsAndBuild(){
  const file = (lang === 'en') ? 'dialogs-en.json' : 'dialogs-gr.json';
  diagramJobs.length = 0;

  const bookData = loadBookData();
  const DEFAULT_A = 3.0;
  const DEFAULT_T = 6.0;

  gA = (bookData && typeof bookData.A === 'number') ? bookData.A : DEFAULT_A;
  gT = (bookData && typeof bookData.T === 'number') ? bookData.T : DEFAULT_T;
  gOmega = (bookData && typeof bookData.omega === 'number') ? bookData.omega : (2*Math.PI/gT);
  gX0 = (bookData && typeof bookData.x0 === 'number') ? bookData.x0 : 1.80;
  gPhi0Deg = (bookData && typeof bookData.phi0Deg === 'number') ? bookData.phi0Deg : 35.0;
  gPhi0Rad = gPhi0Deg * Math.PI / 180;

  // v0 και σημάδι
  gV0 = gOmega * gA * Math.cos(gPhi0Rad);
  const eps = 1e-6;
  if(gV0 > eps){
    gVSignSymbol = 'υ>0';
    gVSignWord = (lang === 'en') ? 'positive' : 'θετική';
  }else if(gV0 < -eps){
    gVSignSymbol = 'υ<0';
    gVSignWord = (lang === 'en') ? 'negative' : 'αρνητική';
  }else{
    gVSignSymbol = 'υ=0';
    gVSignWord = (lang === 'en') ? 'zero' : 'μηδενική';
  }

  setParam('A', gA.toFixed(2));
  setParam('T', gT.toFixed(2));
  setParam('omega', gOmega.toFixed(2));
  setParam('x0', gX0.toFixed(2));
  setParam('phi0Deg', gPhi0Deg.toFixed(1));
  setParam('v0', gV0.toFixed(2));
  setParam('vSignSymbol', gVSignSymbol);
  setParam('vSignWord', gVSignWord);

  try{
    const resp = await fetch(file,{cache:'no-store'});
    if(!resp.ok){
      throw new Error('Dialogs file not found');
    }
    const data = await resp.json();
    VIEWERS = data.viewers || [];
    ACT1    = data.act1    || [];
    ACT2    = data.act2    || [];
    FOYER   = data.foyer   || [];

    const bookDataLocal = bookData || {};
    const samples = Array.isArray(bookDataLocal.samples) ? bookDataLocal.samples : [];
    buildTXTable(samples);

    const act1Cont  = document.getElementById('act1Transcript');
    const act2Cont  = document.getElementById('act2Transcript');
    const foyerCont = document.getElementById('foyerTranscript');

    act1Cont.innerHTML  = '';
    act2Cont.innerHTML  = '';
    foyerCont.innerHTML = '';

    BOOK_CFG = null;
    try{
      const br = await fetch('book.json',{cache:'no-store'});
      if(br.ok){
        BOOK_CFG = await br.json();
      }
    }catch(e2){
      console.warn('book.json όχι διαθέσιμο ή μη έγκυρο', e2);
      BOOK_CFG = null;
    }

    renderSection('act1',  ACT1,  act1Cont,  'act1');
    renderSection('act2',  ACT2,  act2Cont,  'act2');
    renderSection('foyer', FOYER, foyerCont, 'foyer');

  }catch(err){
    console.error(err);
  }

  renderDiagramJobs();
}

loadDialogsAndBuild();
