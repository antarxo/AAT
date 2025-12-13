const BOOK_STORAGE_KEY = 'aatBookData';

let VIEWERS = [];
let ACT1 = [];
let ACT2 = [];
let FOYER = [];

let BOOK_CFG = null;

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

const diagramJobs = [];

// --- helpers ---

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

// δυναμικά placeholders
function expandDynTemplate(tpl){
  if(!tpl) return '';
  const s = String(tpl);
  return s
    .replaceAll('{A}', gA.toFixed(2))
    .replaceAll('{T}', gT.toFixed(2))
    .replaceAll('{omega}', gOmega.toFixed(3))
    .replaceAll('{x0}', gX0.toFixed(2))
    .replaceAll('{phi0}', gPhi0Deg.toFixed(1))
    .replaceAll('{phi0Deg}', gPhi0Deg.toFixed(1))
    .replaceAll('{vSignSymbol}', gVSignSymbol)
    .replaceAll('{vSignWord}', gVSignWord);
}

// meta από book-*.json
function applyMetaFromBookCfg(){
  if(!BOOK_CFG || !BOOK_CFG.meta) return;
  const m = BOOK_CFG.meta;

  if(m.title){
    const h1 = document.querySelector('header h1');
    if(h1) h1.innerHTML = m.title;
  }
  if(m.subtitle){
    const sub = document.querySelector('header .subtitle');
    if(sub) sub.innerHTML = m.subtitle;
  }
  if(m.sections){
    if(m.sections.paramsIntro){
      const el = document.getElementById('paramsIntro');
      if(el) el.innerHTML = m.sections.paramsIntro;
    }
    if(m.sections.act1Intro){
      const el = document.getElementById('act1Intro');
      if(el) el.innerHTML = m.sections.act1Intro;
    }
    if(m.sections.foyerIntro){
      const el = document.getElementById('foyerIntro');
      if(el) el.innerHTML = m.sections.foyerIntro;
    }
    if(m.sections.footerNote){
      const el = document.getElementById('footerNote');
      if(el) el.innerHTML = m.sections.footerNote;
    }
  }
}

// --- πίνακας t–x ---

function renderTxTable(samples){
  const tbody = document.getElementById('txTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';

  if(!samples || !samples.length){
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

// --- viewers ---

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

// --- dialog rows (από dialogs-*.json) ---

function buildDialogRow(ev, contextLabel, idx){
  const row = document.createElement('div');
  row.className = 'dialog-row';

  const leftCell  = document.createElement('div');
  const rightCell = document.createElement('div');
  leftCell.className  = 'dialog-cell left';
  rightCell.className = 'dialog-cell right';

  const hasLeftRaw  = ev.left  && String(ev.left).trim()  !== '';
  const hasRightRaw = ev.right && String(ev.right).trim() !== '';

  const leftText  = hasLeftRaw  ? expandDynTemplate(ev.left)  : '';
  const rightText = hasRightRaw ? expandDynTemplate(ev.right) : '';

  const hasLeft  = leftText.trim()  !== '';
  const hasRight = rightText.trim() !== '';

  if(hasLeft){
    const sp = document.createElement('div');
    sp.className = 'speaker';

    const badge = document.createElement('div');
    badge.className = 'speaker-badge';

    const avatar = document.createElement('div');
    avatar.className = 'speaker-avatar';

    if(ev.viewer != null){
      const vColor = viewerColor(ev.viewer);
      const vImg   = viewerImg(ev.viewer);
      avatar.style.backgroundColor = vColor;
      if(vImg){
        avatar.style.backgroundImage = 'url("'+vImg+'")';
      }else{
        avatar.textContent = viewerInitial(ev.viewer);
      }
    }else{
      avatar.style.backgroundColor = '#6b7280';
      avatar.textContent = (lang === 'en') ? 'N' : 'Α';
    }

    const nameSpan = document.createElement('span');
    nameSpan.className = 'speaker-name';
    if(ev.viewer != null){
      nameSpan.textContent = viewerName(ev.viewer);
    }else{
      nameSpan.textContent = (lang === 'en') ? 'Narration' : 'Αφήγηση';
    }

    badge.appendChild(avatar);
    badge.appendChild(nameSpan);
    sp.appendChild(badge);

    const speech = document.createElement('div');
    speech.className = 'speech';
    speech.innerHTML = leftText.replaceAll('\n','<br>');

    leftCell.appendChild(sp);
    leftCell.appendChild(speech);
  }else{
    leftCell.innerHTML = '&nbsp;';
  }

  let anythingRight = false;

  if(hasRight){
    const txt = localizeTrig(rightText).replaceAll('\n','<br>');
    const lawDiv = document.createElement('div');
    lawDiv.innerHTML = txt;
    rightCell.appendChild(lawDiv);
    anythingRight = true;
  }

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

  if(ev.graph === 'xt' || hasXtMark){
    addDiagram(
      'xt',
      (lang === 'en') ? 'x–t diagram' : 'Διάγραμμα x–t',
      {
        xtZeroMark: !!ev.xtZeroMark,
        xtMarkTail: !!ev.xtMarkTail
      }
    );
  }

  if(ev.plot === 'xsin'){
    addDiagram('xsin', (lang === 'en') ? 'x–sin(ωt) diagram' : 'Διάγραμμα x–ημ(ωt)');
  }
  if(ev.plot === 'v'){
    addDiagram('v', (lang === 'en') ? 'v–t diagram' : 'Διάγραμμα υ–t');
  }
  if(ev.plot === 'a'){
    addDiagram('a', (lang === 'en') ? 'a–t diagram' : 'Διάγραμμα a–t');
  }
  if(ev.plot === 'ax'){
    addDiagram('ax', (lang === 'en') ? 'a–x diagram' : 'Διάγραμμα a–x');
  }

  if(!anythingRight){
    rightCell.innerHTML = '&nbsp;';
  }

  row.appendChild(leftCell);
  row.appendChild(rightCell);
  return row;
}

// --- blocks από book-*.json ---

function buildBookBlockRow(block, contextLabel){
  if(!block || typeof block !== 'object') return null;

  const type = block.type;
  const col  = block.column || 'full';

  const row = document.createElement('div');
  row.className = 'dialog-row';

  const leftCell  = document.createElement('div');
  const rightCell = document.createElement('div');
  leftCell.className  = 'dialog-cell left';
  rightCell.className = 'dialog-cell right';

  function placeContent(node){
    if(col === 'left'){
      leftCell.appendChild(node);
      rightCell.innerHTML = '&nbsp;';
      row.appendChild(leftCell);
      row.appendChild(rightCell);
    }else if(col === 'right'){
      leftCell.innerHTML = '&nbsp;';
      rightCell.appendChild(node);
      row.appendChild(leftCell);
      row.appendChild(rightCell);
    }else{ // full
      leftCell.appendChild(node);
      leftCell.style.gridColumn = '1 / span 2';
      row.appendChild(leftCell);
    }
  }

  if(type === 'note' || type === 'html'){
    const html = expandDynTemplate(block.html || block.text || '');
    const box = document.createElement('div');
    box.className = (type === 'note') ? 'note-box' : 'speech';
    box.innerHTML = html;
    placeContent(box);
    return row;
  }

  if(type === 'image'){
    const wrapper = document.createElement('div');
    const img = document.createElement('img');
    img.src = block.src || '';
    img.alt = block.alt || '';
    img.style.maxWidth = '100%';
    img.style.display = 'block';
    img.style.borderRadius = '6px';
    img.style.border = '1px solid #e5e7eb';
    wrapper.appendChild(img);
    if(block.caption){
      const cap = document.createElement('div');
      cap.className = 'diagram-caption';
      cap.textContent = block.caption;
      wrapper.appendChild(cap);
    }
    placeContent(wrapper);
    return row;
  }

  if(type === 'diagram'){
    const wrapper = document.createElement('div');
    wrapper.className = 'diagram-inline';

    if(block.title){
      const t = document.createElement('div');
      t.style.fontWeight = '600';
      t.style.marginBottom = '2px';
      t.textContent = block.title;
      wrapper.appendChild(t);
    }

    const canvas = document.createElement('canvas');
    const id = block.id || `${contextLabel}-extra-${(block.kind || 'd')}-${Math.random().toString(16).slice(2)}`;
    canvas.id = id;
    wrapper.appendChild(canvas);

    if(block.caption){
      const cap = document.createElement('div');
      cap.className = 'diagram-caption';
      cap.textContent = block.caption;
      wrapper.appendChild(cap);
    }

    diagramJobs.push({
      id,
      kind: block.kind || 'xt'
    });

    placeContent(wrapper);
    return row;
  }

  return null;
}

// --- render πράξης με schema act1/act2/foyer ---

function renderAct(actKey, events, container, contextLabel){
  const actCfg = BOOK_CFG && BOOK_CFG[actKey];

  const table = document.createElement('div');
  table.className = 'dialog-table';

  if(!actCfg){
    if(Array.isArray(events) && events.length){
      events.forEach((ev, idx)=>{
        const r = buildDialogRow(ev, contextLabel, idx);
        table.appendChild(r);
      });
    }
    container.appendChild(table);
    return;
  }

  const beforeAll = Array.isArray(actCfg.beforeAll) ? actCfg.beforeAll : [];
  const rows = Array.isArray(actCfg.rows) ? actCfg.rows : [];
  const afterAll = Array.isArray(actCfg.afterAll) ? actCfg.afterAll : [];

  beforeAll.forEach(b=>{
    const row = buildBookBlockRow(b, contextLabel);
    if(row) table.appendChild(row);
  });

  const maxLen = Math.max(rows.length, events.length);

  for(let i=0; i<maxLen; i++){
    const rowCfg = rows[i] || {};
    const beforeArr = Array.isArray(rowCfg.before) ? rowCfg.before : [];
    const inlineArr = Array.isArray(rowCfg.inline) ? rowCfg.inline : [];
    const afterArr  = Array.isArray(rowCfg.after)  ? rowCfg.after  : [];

    beforeArr.forEach(b=>{
      const row = buildBookBlockRow(b, contextLabel);
      if(row) table.appendChild(row);
    });

    if(events[i]){
      const dlgRow = buildDialogRow(events[i], contextLabel, i);
      table.appendChild(dlgRow);
    }

    inlineArr.forEach(b=>{
      const row = buildBookBlockRow(b, contextLabel);
      if(row) table.appendChild(row);
    });
    afterArr.forEach(b=>{
      const row = buildBookBlockRow(b, contextLabel);
      if(row) table.appendChild(row);
    });
  }

  afterAll.forEach(b=>{
    const row = buildBookBlockRow(b, contextLabel);
    if(row) table.appendChild(row);
  });

  container.appendChild(table);
}

// --- διαγράμματα ---

function drawXTChart(canvas, opts){
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width  = 260;
  const h = canvas.height = 140;

  const margin = 22;
  const x0 = margin;
  const x1 = w - margin;
  const yTop = margin;
  const yBot = h - margin;

  const tMin = 0;
  const tMax = 2*gT;
  const A = gA;
  const omega = gOmega;
  const phi0 = gPhi0Rad;

  function tToX(t){
    return x0 + (t - tMin)/(tMax - tMin) * (x1 - x0);
  }
  function xToY(x){
    const mid = (yTop + yBot)/2;
    const amp = (yBot - yTop)/2;
    const xMaxAbs = A*1.1;
    return mid - (x/xMaxAbs)*amp;
  }

  ctx.clearRect(0,0,w,h);

  ctx.save();
  ctx.strokeStyle = 'rgba(148,163,184,0.45)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3,3]);

  const steps = 8;
  for(let i=0;i<=steps;i++){
    const tt = tMin + (tMax - tMin)*i/steps;
    const xx = tToX(tt);
    ctx.beginPath();
    ctx.moveTo(xx,yTop);
    ctx.lineTo(xx,yBot);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.strokeStyle = 'rgba(31,41,55,1)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x0,yBot);
  ctx.lineTo(x1,yBot);
  ctx.stroke();

  ctx.beginPath();
  const yMid = (yTop+yBot)/2;
  ctx.moveTo(x0,yMid);
  ctx.lineTo(x1,yMid);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(37,99,235,0.9)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const N = 240;
  for(let i=0;i<=N;i++){
    const t = tMin + (tMax - tMin)*i/N;
    const x = A*Math.sin(omega*t + phi0);
    const X = tToX(t);
    const Y = xToY(x);
    if(i===0) ctx.moveTo(X,Y);
    else ctx.lineTo(X,Y);
  }
  ctx.stroke();

  const x0val = gX0;
  const yx0 = xToY(x0val);
  ctx.strokeStyle = 'rgba(37,99,235,0.8)';
  ctx.setLineDash([4,2]);
  ctx.beginPath();
  ctx.moveTo(x0,yx0);
  ctx.lineTo(x1,yx0);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(30,64,175,1)';
  ctx.font = '10px system-ui';
  ctx.fillText('x₀ ≈ '+x0val.toFixed(2)+' m', x0+4, yx0-4);

  const showMark = opts && opts.xtZeroMark;
  const showTail = opts && opts.xtMarkTail;

  if(showMark){
    let off = (gPhi0Rad / gOmega) % gT;
    if(off < 0) off += gT;
    let tZero = (Math.abs(off) < 1e-9) ? 0 : (gT - off);

    if(tZero < tMin) tZero = tMin;
    if(tZero > tMax) tZero = tZero % gT;

    const px0 = tToX(tZero);
    const py0 = xToY(0);

    const tEnd = Math.min(tZero + gT, tMax);
    ctx.save();
    ctx.strokeStyle = 'rgba(220,38,38,0.95)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    const N2 = 200;
    ctx.beginPath();
    for(let i=0;i<=N2;i++){
      const t = tZero + (tEnd - tZero)*(i/N2);
      const x = A*Math.sin(omega*(t - tZero));
      const X = tToX(t);
      const Y = xToY(x);
      if(i===0) ctx.moveTo(X,Y);
      else ctx.lineTo(X,Y);
    }
    ctx.stroke();

    if(showTail){
      ctx.strokeStyle = 'rgba(220,38,38,0.8)';
      ctx.setLineDash([4,2]);
      ctx.beginPath();
      ctx.moveTo(x0,py0);
      ctx.lineTo(px0,py0);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle='rgba(220,38,38,0.95)';
    ctx.beginPath();
    ctx.arc(px0,py0,3,0,Math.PI*2);
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

    const pillHalfW = textWidth/2 + padX;
    if(labelX < x0 + pillHalfW + 4) labelX = x0 + pillHalfW + 4;
    if(labelX > x1 - pillHalfW - 4) labelX = x1 - pillHalfW - 4;

    const pillLeft = labelX - pillHalfW;
    const pillTop  = labelY - (8 + padY);
    const pillW    = pillHalfW*2;
    const pillH    = 16 + 2*padY;
    const r=8;

    ctx.beginPath();
    let X=pillLeft, Y=pillTop,
        W2=pillW, H2=pillH;
    ctx.moveTo(X+r,Y);
    ctx.lineTo(X+W2-r,Y);
    ctx.quadraticCurveTo(X+W2,Y,X+W2,Y+r);
    ctx.lineTo(X+W2,Y+H2-r);
    ctx.quadraticCurveTo(X+W2,Y+H2,X+W2-r,Y+H2);
    ctx.lineTo(X+r,Y+H2);
    ctx.quadraticCurveTo(X,Y+H2,X,Y+H2-r);
    ctx.lineTo(X,Y+r);
    ctx.quadraticCurveTo(X,Y,X+r,Y);
    ctx.closePath();
    ctx.fillStyle='rgba(127,29,29,0.9)';
    ctx.strokeStyle='rgba(248,113,113,0.95)';
    ctx.lineWidth=1.2;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle='rgba(254,242,242,0.98)';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(labelText,labelX,labelY);

    const arrowStartX = labelX;
    const arrowStartY = pillTop + pillH;
    const arrowEndX   = px0;
    const arrowEndY   = py0 - 5;

    ctx.beginPath();
    ctx.moveTo(arrowStartX,arrowStartY);
    ctx.lineTo(arrowEndX,arrowEndY);
    ctx.strokeStyle='rgba(248,113,113,0.95)';
    ctx.lineWidth=1;
    ctx.stroke();

    const angle = Math.atan2(arrowEndY-arrowStartY, arrowEndX-arrowStartX);
    const headLen = 6;
    ctx.beginPath();
    ctx.moveTo(arrowEndX,arrowEndY);
    ctx.lineTo(
      arrowEndX - headLen*Math.cos(angle-Math.PI/6),
      arrowEndY - headLen*Math.sin(angle-Math.PI/6)
    );
    ctx.lineTo(
      arrowEndX - headLen*Math.cos(angle+Math.PI/6),
      arrowEndY - headLen*Math.sin(angle+Math.PI/6)
    );
    ctx.closePath();
    ctx.fillStyle='rgba(248,113,113,0.95)';
    ctx.fill();

    ctx.restore();
  }
}

function drawXSinChart(canvas){
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width  = 260;
  const h = canvas.height = 140;

  const margin = 24;
  const x0 = margin;
  const x1 = w - margin;
  const yTop = margin;
  const yBot = h - margin;

  const Smin = -1.1;
  const Smax =  1.1;

  function SToX(S){
    return x0 + (S - Smin)/(Smax - Smin)*(x1-x0);
  }
  function xToY(x){
    const mid = (yTop+yBot)/2;
    const amp = (yBot-yTop)/2;
    return mid - (x/(gA*1.1))*amp;
  }

  ctx.clearRect(0,0,w,h);

  ctx.save();
  ctx.strokeStyle='rgba(148,163,184,0.45)';
  ctx.lineWidth=1;
  ctx.setLineDash([3,3]);
  for(let k=-1;k<=1;k++){
    const xx = SToX(k);
    ctx.beginPath();
    ctx.moveTo(xx,yTop);
    ctx.lineTo(xx,yBot);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.strokeStyle='rgba(31,41,55,1)';
  ctx.lineWidth=1.2;
  ctx.beginPath();
  ctx.moveTo(x0,yBot);
  ctx.lineTo(x1,yBot);
  ctx.stroke();

  const yMid = (yTop+yBot)/2;
  ctx.beginPath();
  ctx.moveTo(x0,yMid);
  ctx.lineTo(x1,yMid);
  ctx.stroke();

  ctx.strokeStyle='rgba(37,99,235,0.9)';
  ctx.lineWidth=1.4;
  ctx.beginPath();

  const N=120;
  for(let i=0;i<=N;i++){
    const S = Smin + (Smax-Smin)*i/N;
    const x = gA*S;
    const X = SToX(S);
    const Y = xToY(x);
    if(i===0) ctx.moveTo(X,Y);
    else ctx.lineTo(X,Y);
  }
  ctx.stroke();

  ctx.fillStyle='#111827';
  ctx.font='10px system-ui';
  ctx.fillText('ημ(ωt)', x0 + (x1-x0)/2 - 18, yBot+12);
  ctx.save();
  ctx.translate(x0-12, yMid+20);
  ctx.rotate(-Math.PI/2);
  ctx.fillText('x (m)', 0, 0);
  ctx.restore();

  ctx.restore();
}

function drawVChart(canvas){
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width  = 260;
  const h = canvas.height = 140;

  const margin=22;
  const x0=margin;
  const x1=w-margin;
  const yTop=margin;
  const yBot=h-margin;

  const tMin=0;
  const tMax=2*gT;
  const A=gA;
  const omega=gOmega;
  const phi0=gPhi0Rad;

  function tToX(t){
    return x0 + (t-tMin)/(tMax-tMin)*(x1-x0);
  }
  function vToY(v){
    const vmax = A*omega*1.1;
    const mid = (yTop+yBot)/2;
    const amp = (yBot-yTop)/2;
    return mid - (v/vmax)*amp;
  }

  ctx.clearRect(0,0,w,h);
  ctx.save();

  ctx.strokeStyle='rgba(148,163,184,0.45)';
  ctx.lineWidth=1;
  ctx.setLineDash([3,3]);
  const steps=8;
  for(let i=0;i<=steps;i++){
    const tt=tMin+(tMax-tMin)*i/steps;
    const xx=tToX(tt);
    ctx.beginPath();
    ctx.moveTo(xx,yTop);
    ctx.lineTo(xx,yBot);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.strokeStyle='rgba(31,41,55,1)';
  ctx.lineWidth=1.2;
  ctx.beginPath();
  ctx.moveTo(x0,yBot);
  ctx.lineTo(x1,yBot);
  ctx.stroke();

  const yMid=(yTop+yBot)/2;
  ctx.beginPath();
  ctx.moveTo(x0,yMid);
  ctx.lineTo(x1,yMid);
  ctx.stroke();

  ctx.strokeStyle='rgba(22,163,74,0.9)';
  ctx.lineWidth=1.4;
  ctx.beginPath();
  const N=240;
  for(let i=0;i<=N;i++){
    const t=tMin+(tMax-tMin)*i/N;
    const v=A*omega*Math.cos(omega*t+phi0);
    const X=tToX(t);
    const Y=vToY(v);
    if(i===0) ctx.moveTo(X,Y);
    else ctx.lineTo(X,Y);
  }
  ctx.stroke();

  ctx.restore();
}

function drawAChart(canvas){
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width  = 260;
  const h = canvas.height = 140;

  const margin=22;
  const x0=margin;
  const x1=w-margin;
  const yTop=margin;
  const yBot=h-margin;

  const tMin=0;
  const tMax=2*gT;
  const A=gA;
  const omega=gOmega;
  const phi0=gPhi0Rad;

  function tToX(t){
    return x0 + (t-tMin)/(tMax-tMin)*(x1-x0);
  }
  function aToY(a){
    const amax=A*omega*omega*1.1;
    const mid=(yTop+yBot)/2;
    const amp=(yBot-yTop)/2;
    return mid - (a/amax)*amp;
  }

  ctx.clearRect(0,0,w,h);
  ctx.save();

  ctx.strokeStyle='rgba(148,163,184,0.45)';
  ctx.lineWidth=1;
  ctx.setLineDash([3,3]);
  const steps=8;
  for(let i=0;i<=steps;i++){
    const tt=tMin+(tMax-tMin)*i/steps;
    const xx=tToX(tt);
    ctx.beginPath();
    ctx.moveTo(xx,yTop);
    ctx.lineTo(xx,yBot);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.strokeStyle='rgba(31,41,55,1)';
  ctx.lineWidth=1.2;
  ctx.beginPath();
  ctx.moveTo(x0,yBot);
  ctx.lineTo(x1,yBot);
  ctx.stroke();

  const yMid=(yTop+yBot)/2;
  ctx.beginPath();
  ctx.moveTo(x0,yMid);
  ctx.lineTo(x1,yMid);
  ctx.stroke();

  ctx.strokeStyle='rgba(220,38,38,0.9)';
  ctx.lineWidth=1.4;
  ctx.beginPath();
  const N=240;
  for(let i=0;i<=N;i++){
    const t=tMin+(tMax-tMin)*i/N;
    const a=-A*omega*omega*Math.sin(omega*t+phi0);
    const X=tToX(t);
    const Y=aToY(a);
    if(i===0) ctx.moveTo(X,Y);
    else ctx.lineTo(X,Y);
  }
  ctx.stroke();

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

  const xmin = -gA*1.1;
  const xmax = +gA*1.1;
  const amax = gA*gOmega*gOmega*1.1;

  function xToXcoord(x){
    return x0 + (x - xmin)/(xmax - xmin)*(x1-x0);
  }
  function aToY(a){
    const mid=(yTop+yBot)/2;
    const amp=(yBot-yTop)/2;
    return mid - (a/amax)*amp;
  }

  ctx.clearRect(0,0,w,h);
  ctx.save();

  ctx.strokeStyle='rgba(148,163,184,0.45)';
  ctx.lineWidth=1;
  ctx.setLineDash([3,3]);
  const steps=4;
  for(let i=0;i<=steps;i++){
    const xx=xmin+(xmax-xmin)*i/steps;
    const X=xToXcoord(xx);
    ctx.beginPath();
    ctx.moveTo(X,yTop);
    ctx.lineTo(X,yBot);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.strokeStyle='rgba(31,41,55,1)';
  ctx.lineWidth=1.2;
  ctx.beginPath();
  const xZero = xToXcoord(0);
  ctx.moveTo(xZero,yTop);
  ctx.lineTo(xZero,yBot);
  ctx.stroke();

  const yMid=(yTop+yBot)/2;
  ctx.beginPath();
  ctx.moveTo(x0,yMid);
  ctx.lineTo(x1,yMid);
  ctx.stroke();

  ctx.strokeStyle='rgba(220,38,38,0.9)';
  ctx.lineWidth=1.4;
  ctx.beginPath();

  const Xmin = xToXcoord(xmin);
  const Xmax = xToXcoord(xmax);
  const Amin = aToY(+amax);
  const Amax = aToY(-amax);

  ctx.moveTo(Xmin, Amin);
  ctx.lineTo(Xmax, Amax);
  ctx.stroke();

  ctx.restore();
}

function renderDiagramJobs(){
  diagramJobs.forEach(job=>{
    const canvas = document.getElementById(job.id);
    if(!canvas) return;
    switch(job.kind){
      case 'xt':   drawXTChart(canvas, job);   break;
      case 'xsin': drawXSinChart(canvas);      break;
      case 'v':    drawVChart(canvas);         break;
      case 'a':    drawAChart(canvas);         break;
      case 'ax':   drawAXChart(canvas);        break;
    }
  });
}

// --- main ---

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

  if(!bookData){
    const note = document.getElementById('paramNote');
    if(note){
      note.textContent = (lang === 'en')
        ? 'No stage data were found. Using indicative values (A=3.00 m, T=6.00 s, etc.).'
        : 'Δεν βρέθηκαν δεδομένα από τη σκηνή. Χρησιμοποιούνται ενδεικτικές τιμές (A=3.00 m, T=6.00 s κ.λπ.).';
    }
  }

  if(bookData && Array.isArray(bookData.samples)){
    renderTxTable(bookData.samples);
  }else{
    renderTxTable([]);
  }

  try{
    const resp = await fetch(file,{cache:'no-store'});
    if(!resp.ok){
      console.error('Δεν βρέθηκε', file);
      return;
    }
    const data = await resp.json();
    VIEWERS = data.viewers || [];
    ACT1    = data.act1    || [];
    ACT2    = data.act2    || [];
    FOYER   = data.foyer   || [];

    const act1Cont  = document.getElementById('act1Transcript');
    const act2Cont  = document.getElementById('act2Transcript');
    const foyerCont = document.getElementById('foyerTranscript');

    act1Cont.innerHTML  = '';
    act2Cont.innerHTML  = '';
    foyerCont.innerHTML = '';

    // book-*.json (πρόσθετα + meta)
    BOOK_CFG = null;
    const bookFile = (lang === 'en') ? 'book-en.json' : 'book-gr.json';
    try{
      let br = await fetch(bookFile,{cache:'no-store'});
      if(!br.ok){
        br = await fetch('book.json',{cache:'no-store'});
      }
      if(br.ok){
        BOOK_CFG = await br.json();
      }
    }catch(e2){
      console.warn('book*.json όχι διαθέσιμο ή μη έγκυρο', e2);
      BOOK_CFG = null;
    }

    // meta (τίτλοι, εισαγωγές, footer)
    applyMetaFromBookCfg();

    // περιεχόμενο acts
    renderAct('act1',  ACT1,  act1Cont,  'act1');
    renderAct('act2',  ACT2,  act2Cont,  'act2');
    renderAct('foyer', FOYER, foyerCont, 'foyer');

  }catch(err){
    console.error(err);
  }

  renderDiagramJobs();
}

loadDialogsAndBuild();
