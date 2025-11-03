// act2.js - Πράξη 2 (ES module) — πλήρης απομόνωση ονομάτων/DOM/CSS
(() => {
  const A2 = {
    _mounted: false,
    _running: false,
    _mode: 'run',        // 'run' | 'slow' | 'stop'
    _slowFactor: 1,
    _t0: 0,
    _last: 0,
    _raf: null,
    _cfg: null,
    _els: {},
    _series: { t: [], x: [], v: [], a: [], axX: [], axA: [] },
    _bubbleTimers: [],
    _ghostTimer: null,
    _curtain: { y: 0, targetY: 0, opening: false, closing: false },

    log(...args) { console.log('[Act2]', ...args); },

    async loadConfig() {
      try {
        const r = await fetch('act2.json', { cache: 'no-cache' });
        if (!r.ok) throw new Error('HTTP '+r.status);
        const cfg = await r.json();
        return cfg;
      } catch (e) {
        this.log('Config load failed; using safe defaults.', e);
        // Safe defaults
        return {
          devFallbackButton: true,
          lang: "el",
          physics: { m: 70, T: 6, A_m: 3, phi0: 0.3, pxPerMeter: 50 },
          spring: { image: "spring.png", heightPx: 40 },
          skater: { image: "skater.png", scale: 0.85 },
          ghost: { enabled: false, A_m: 4.5, Eghost: 700, duration: 6000 },
          layout: { stageLeftPct: 18, stageRightPct: 82, axisYvh: 32, raiseAllByPx: 0 },
          slowMotion: { factor: 0.6, bubbleWindowMs: 2500 },
          title: {
            line1: "Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!",
            line2: "m₁ = {m} kg, D₁ = {D} N/m",
            line3: "Eμηχ = {E} J"
          },
          timeline: [
            { t: 0, type: 'openCurtain' },
            { t: 1500, type: 'bubble', text: 'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!' },
            { t: 3500, type: 'law', text: 'ΣF = −D·x' },
            { t: 7000, type: 'closeCurtain' },
          ],
          charts: { showXT: true, showVT: true, showAT: true, showAX: true, mountAtMs: 12000 }
        };
      }
    },

    injectStyles() {
      const css = `
#act2-root{position:fixed;inset:0;z-index:120;pointer-events:none;}
#act2-root *{box-sizing:border-box;font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif;}
#act2-root .a2-wrap{position:absolute;inset:0;}

:root{
  --a2-stage-left: 18vw;
  --a2-stage-right: 82vw;
  --a2-axis-y: 32vh;
}
#act2-root .a2-stage{
  position:absolute;inset:0;pointer-events:none;
}
#act2-root .a2-title{
  position:absolute;top:4px;left:50%;transform:translateX(-50%);
  text-align:center;line-height:1.15;pointer-events:none;z-index:140;
}
#act2-root .a2-title .t1{font-weight:700;font-size:22px;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.6);}
#act2-root .a2-title .t2, #act2-root .a2-title .t3{
  font-weight:500;font-size:14px;color:#ffd27a;text-shadow:0 1px 3px rgba(0,0,0,.5);
}

#act2-root .a2-params{
  position:absolute;top:56px;right:calc(100vw - var(--a2-stage-right));
  transform:translateX(-6px);padding:8px 10px;background:rgba(0,0,0,.55);
  color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:10px;
  backdrop-filter: blur(2px);pointer-events:none;z-index:130;min-width:180px;
}
#act2-root .a2-params .p{font-size:14px;line-height:1.25;}
#act2-root .a2-params .val{font-weight:700;}

#act2-root .a2-floor{
  position:absolute;left:var(--a2-stage-left);right:calc(100vw - var(--a2-stage-right));
  height:2px;background:#999;bottom:calc(var(--a2-axis-y) - 8px);
  box-shadow:0 0 0 1px rgba(0,0,0,.15); z-index:121; pointer-events:none;
}

#act2-root .a2-spring{
  position:absolute;top:calc(var(--a2-axis-y) - 28px);height:40px;
  left:var(--a2-stage-left);transform-origin:left center;z-index:119;pointer-events:none;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,.5));
}
#act2-root .a2-skater{
  position:absolute;bottom:calc(100vh - var(--a2-axis-y) + 28px); /* ώστε κάτω μέρος ≈ στη floor */
  transform:translate(-50%,0);z-index:120;pointer-events:none;filter:drop-shadow(0 4px 6px rgba(0,0,0,.6));
}

#act2-root .a2-ghost{
  position:absolute;bottom:calc(100vh - var(--a2-axis-y) + 28px);
  transform:translate(-50%,0);z-index:118;opacity:.55;pointer-events:none;
  filter:drop-shadow(0 2px 4px rgba(0,0,0,.4)) saturate(1.1);
}
#act2-root .a2-ghost-badge{
  position:absolute;top:-28px;left:50%;transform:translateX(-50%);
  padding:3px 6px;background:rgba(255,255,255,.85);border:1px dashed #333;border-radius:6px;
  font-size:12px;color:#222;pointer-events:none;
}

#act2-root .a2-laws{
  position:absolute;left:8px;top:64px;width:calc(var(--a2-stage-left) - 16px);
  max-height:70vh;overflow:auto;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.2);
  border-radius:12px;padding:8px;color:#fff;z-index:125;pointer-events:auto;
}
#act2-root .a2-laws h3{margin:6px 6px 8px 6px;font-size:14px;}
#act2-root .a2-laws ul{list-style:none;margin:0;padding:0;font-size:13px;}
#act2-root .a2-laws li{padding:6px 8px;margin:4px 6px;border-left:3px solid #ffd27a;background:rgba(255,255,255,.06);border-radius:6px;}

#act2-root .a2-charts{
  position:absolute;left:8px;bottom:8px;width:calc(var(--a2-stage-left) - 16px);
  display:flex;flex-direction:column;gap:8px;z-index:125;pointer-events:auto;
}
#act2-root .a2-chart{
  background:rgba(255,255,255,.9);border:1px solid #ddd;border-radius:8px;padding:6px;
}
#act2-root .a2-chart canvas{width:100%;height:120px;display:block;}

#act2-root .a2-bubbles{position:absolute;left:0;right:0;bottom:0;top:0;pointer-events:none;z-index:135;}
#act2-root .a2-bubble{
  position:absolute;max-width:360px;padding:10px 12px;background:rgba(255,255,255,.9);
  border:2px dotted #333;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.25);
  font-size:14px;line-height:1.25;opacity:0;transform:translate(-50%,10px);
  transition:opacity .35s ease, transform .35s ease;
}
#act2-root .a2-bubble.show{opacity:1;transform:translate(-50%,0);}
#act2-root .a2-bubble .tick{position:absolute;right:6px;bottom:4px;font-size:12px;color:#0b8457;opacity:.0;}
#act2-root .a2-bubble.done .tick{opacity:1;}

#act2-root .a2-curtain{
  position:absolute;left:var(--a2-stage-left);right:calc(100vw - var(--a2-stage-right));
  top:0;height:38vh;background:linear-gradient(to bottom,#6b0000,#300000);
  box-shadow:0 6px 20px rgba(0,0,0,.7);z-index:138;transform:translateY(0);
  transition:transform 1200ms cubic-bezier(.2,.9,.2,1);
  border-bottom:2px solid rgba(0,0,0,.4);
}
#act2-root .a2-curtain.open{transform:translateY(-30vh);} /* ανεβαίνει, μένει ~10px χαμηλότερα από full */

#act2-root .a2-dev{
  position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:150;
  pointer-events:auto;display:flex;gap:8px;
}
#act2-root .a2-btn{
  appearance:none;border:0;border-radius:8px;padding:8px 12px;font-weight:600;cursor:pointer;
  background:#700;color:#fff;box-shadow:0 0 10px #300;
}
      `;
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    },

    formatTitleLines() {
      const { m, T, A_m, phi0, pxPerMeter } = this._cfg.physics;
      const omega = (2 * Math.PI) / T;
      const D = Math.round(this._cfg.physics.m * omega * omega);
      const E = Math.round(0.5 * D * A_m * A_m);
      const t = this._cfg.title;
      const line2 = t.line2.replace('{m}', m).replace('{D}', D);
      const line3 = t.line3.replace('{E}', E);
      return { line1: t.line1, line2, line3, D, E, omega };
    },

    buildDOM(root) {
      root.innerHTML = `
        <div class="a2-wrap">
          <div class="a2-stage"></div>

          <div class="a2-title">
            <div class="t1"></div>
            <div class="t2"></div>
            <div class="t3"></div>
          </div>

          <div class="a2-params">
            <div class="p">A: <span class="val" data-a></span> m</div>
            <div class="p">ω: <span class="val" data-w></span> rad/s</div>
            <div class="p">φ₀: <span class="val" data-ph></span> rad</div>
          </div>

          <div class="a2-floor"></div>

          <img class="a2-spring" alt="spring"/>
          <img class="a2-skater" alt="skater"/>
          <img class="a2-ghost" alt="ghost skater" hidden/>
          <div class="a2-ghost-badge" hidden></div>

          <div class="a2-laws">
            <h3>Νόμοι (Δυναμική)</h3>
            <ul></ul>
          </div>

          <div class="a2-charts" hidden>
            <div class="a2-chart"><canvas data-chart="xt"></canvas></div>
            <div class="a2-chart"><canvas data-chart="vt"></canvas></div>
            <div class="a2-chart"><canvas data-chart="at"></canvas></div>
            <div class="a2-chart"><canvas data-chart="ax"></canvas></div>
          </div>

          <div class="a2-bubbles"></div>

          <div class="a2-curtain"></div>

          <div class="a2-dev" hidden>
            <button class="a2-btn" data-act2-start>Έναρξη Πράξης 2</button>
            <button class="a2-btn" data-act2-reset>Reset Πράξης 2</button>
          </div>
        </div>
      `;

      const q = (sel) => root.querySelector(sel);
      this._els = {
        title1: q('.a2-title .t1'),
        title2: q('.a2-title .t2'),
        title3: q('.a2-title .t3'),
        params: q('.a2-params'),
        valA: q('[data-a]'),
        valW: q('[data-w]'),
        valPH: q('[data-ph]'),
        floor: q('.a2-floor'),
        spring: q('.a2-spring'),
        skater: q('.a2-skater'),
        ghost: q('.a2-ghost'),
        ghostBadge: q('.a2-ghost-badge'),
        lawsBox: q('.a2-laws ul'),
        chartsWrap: q('.a2-charts'),
        chartXT: q('canvas[data-chart="xt"]'),
        chartVT: q('canvas[data-chart="vt"]'),
        chartAT: q('canvas[data-chart="at"]'),
        chartAX: q('canvas[data-chart="ax"]'),
        bubbles: q('.a2-bubbles'),
        curtain: q('.a2-curtain'),
        dev: q('.a2-dev'),
        btnStart: q('[data-act2-start]'),
        btnReset: q('[data-act2-reset]'),
        root
      };

      // dev controls visibility
      if (this._cfg.devFallbackButton) this._els.dev.hidden = false;

      // hook buttons
      this._els.btnStart?.addEventListener('click', () => this.start());
      this._els.btnReset?.addEventListener('click', () => this.reset());
    },

    applyCSSVars() {
      const { stageLeftPct, stageRightPct, axisYvh } = this._cfg.layout;
      const r = this._els.root;
      r.style.setProperty('--a2-stage-left', stageLeftPct + 'vw');
      r.style.setProperty('--a2-stage-right', stageRightPct + 'vw');
      r.style.setProperty('--a2-axis-y', axisYvh + 'vh');
    },

    setTitleAndParams() {
      const { A_m, T, phi0 } = this._cfg.physics;
      const { line1, line2, line3, omega } = this.formatTitleLines();
      this._els.title1.textContent = line1;
      this._els.title2.textContent = line2;
      this._els.title3.textContent = line3;
      this._els.valA.textContent = A_m.toFixed(2);
      this._els.valW.textContent = omega.toFixed(3);
      this._els.valPH.textContent = this._cfg.physics.phi0.toFixed(2);
    },

    loadImages() {
      this._els.spring.src = this._cfg.spring.image;
      this._els.skater.src = this._cfg.skater.image;
      this._els.ghost.src  = this._cfg.skater.image;
    },

    mountChartsLater() {
      const { charts } = this._cfg;
      if (!charts) return;
      setTimeout(() => {
        this._els.chartsWrap.hidden = false;
        // draw initial axes (empty)
        ['xt','vt','at','ax'].forEach((k) => {
          const c = this._els['chart'+k.toUpperCase()];
          if (c) this.drawChart(c, [], [], k);
        });
      }, this._cfg.charts.mountAtMs || 12000);
    },

    drawChart(canvas, xs, ys, kind) {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (w === 0 || h === 0) return;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,w,h);

      // axes
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, h-20); ctx.lineTo(w-10, h-20); // t axis
      ctx.moveTo(30, 10);   ctx.lineTo(30, h-20);   // y axis
      ctx.stroke();

      // labels
      ctx.fillStyle = '#000'; ctx.font = (12 * dpr) + 'px system-ui';
      if (kind === 'xt') { ctx.fillText('x (m)', 6, 14); ctx.fillText('t (s)', w-34, h-6); }
      if (kind === 'vt') { ctx.fillText('v (m/s)', 2, 14); ctx.fillText('t (s)', w-34, h-6); }
      if (kind === 'at') { ctx.fillText('a (m/s²)', 2, 14); ctx.fillText('t (s)', w-34, h-6); }
      if (kind === 'ax') { ctx.fillText('a (m/s²)', 2, 14); ctx.fillText('x (m)', w-40, h-6); }

      if (!xs || xs.length === 0 || !ys || ys.length !== xs.length) return;

      // scaling
      const innerW = w - 40, innerH = h - 30;
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const sx = (x) => 30 + ((x - minX) / (maxX - minX || 1)) * innerW;
      const sy = (y) => (h-20) - ((y - minY) / (maxY - minY || 1)) * innerH;

      ctx.strokeStyle = '#0066cc';
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      for (let i=0;i<xs.length;i++){
        const X = sx(xs[i]), Y = sy(ys[i]);
        if (i===0) ctx.moveTo(X,Y); else ctx.lineTo(X,Y);
      }
      ctx.stroke();
    },

    addLaw(text) {
      const li = document.createElement('li');
      li.textContent = text;
      this._els.lawsBox.appendChild(li);
    },

    showBubble(text, xCenterPct, yOffsetPx=0) {
      // Stage horizontal bounds
      const left = this._cfg.layout.stageLeftPct;
      const right = this._cfg.layout.stageRightPct;
      const mid = (left + right) / 2;

      // Διασπορά: εναλλάξ αριστερότερα/δεξιότερα από τη μέση
      const pref = (this._bubbleIndexToggle = !this._bubbleIndexToggle) ? (mid - 10) : (mid + 10);
      const xPct = (typeof xCenterPct === 'number') ? xCenterPct : pref;

      const b = document.createElement('div');
      b.className = 'a2-bubble';
      b.innerHTML = `${text}<span class="tick">✔</span>`;
      this._els.bubbles.appendChild(b);

      // θέση (σχετικά με σκηνή)
      const x = (xPct/100) * window.innerWidth;
      const yBase = (this._cfg.layout.axisYvh/100) * window.innerHeight - 140; // επάνω από σκηνή
      b.style.left = x + 'px';
      b.style.top  = (yBase + (this._bubbleIndexToggle? 0 : 24) + yOffsetPx) + 'px';

      requestAnimationFrame(()=> b.classList.add('show'));

      // slow-motion window
      const dur = this._cfg.slowMotion.bubbleWindowMs || 2500;
      const prev = this._mode;
      this._mode = 'slow';
      this._slowFactor = this._cfg.slowMotion.factor || 0.6;

      // ολοκλήρωση + fade
      setTimeout(()=>{
        b.classList.add('done');
        this._mode = prev;
        setTimeout(()=> {
          b.style.opacity = '0';
          b.style.transform = 'translate(-50%,-6px)';
          setTimeout(()=> b.remove(), 350);
        }, 900);
      }, dur);
    },

    scheduleTimeline() {
      // καθαρισμός παλιών
      this._bubbleTimers.forEach(clearTimeout);
      this._bubbleTimers = [];

      const base = this._t0;
      for (const ev of this._cfg.timeline) {
        const id = setTimeout(() => this.handleEvent(ev), ev.t);
        this._bubbleTimers.push(id);
      }
    },

    handleEvent(ev) {
      switch (ev.type) {
        case 'openCurtain':
          this._els.curtain.classList.add('open');
          break;
        case 'closeCurtain':
          this._els.curtain.classList.remove('open');
          break;
        case 'bubble':
          this.showBubble(ev.text, ev.xPct, ev.yOffset || 0);
          break;
        case 'law':
          this.addLaw(ev.text);
          break;
        case 'ghostFlashback':
          this.runGhost();
          break;
        default:
          break;
      }
    },

    runGhost() {
      if (!this._cfg.ghost?.enabled) return;
      const g = this._els.ghost, badge = this._els.ghostBadge;
      g.hidden = false; badge.hidden = false;

      // badge text
      badge.textContent = `Eμηχ≈${this._cfg.ghost.Eghost} J`;

      // χρονικά
      setTimeout(() => {
        // fade out
        g.style.transition = 'opacity .6s ease';
        badge.style.transition = 'opacity .6s ease';
        g.style.opacity = '0';
        badge.style.opacity = '0';
        setTimeout(()=> { g.hidden = true; badge.hidden = true; g.style.opacity=''; badge.style.opacity=''; }, 700);
      }, this._cfg.ghost.duration || 6000);
    },

    computeKinematics(t) {
      const { T, A_m, phi0 } = this._cfg.physics;
      const w = (2 * Math.PI) / T;
      const x = A_m * Math.sin(w * t + phi0);
      const v = A_m * w * Math.cos(w * t + phi0);
      const a = -A_m * w * w * Math.sin(w * t + phi0);
      return { x, v, a, w };
    },

    animate(now) {
      if (!this._running) return;
      if (!this._last) this._last = now;
      const dt = (now - this._last)/1000; this._last = now;

      const speed = (this._mode === 'slow') ? (this._slowFactor || 0.6) : 1;
      const t = ((now - this._t0)/1000) * speed;

      const { x, v, a, w } = this.computeKinematics(t);
      const px = x * this._cfg.physics.pxPerMeter;
      const stageLeftPx = (this._cfg.layout.stageLeftPct / 100) * window.innerWidth;
      const stageRightPx = (this._cfg.layout.stageRightPct / 100) * window.innerWidth;
      const midX = (stageLeftPx + stageRightPx) / 2;

      // Skater position (κέντρο)
      const X = midX + px;

      // spring width = από αριστερό άκρο σκηνής μέχρι X
      const springW = Math.max(20, X - stageLeftPx);

      // τοποθετήσεις
      this._els.spring.style.width = springW + 'px';
      this._els.spring.style.left  = this._cfg.layout.stageLeftPct + 'vw';
      this._els.skater.style.left  = X + 'px';

      // ghost (διαφορετικό πλάτος)
      if (this._cfg.ghost?.enabled) {
        const gx = this._cfg.ghost.A_m * Math.sin(w * t + this._cfg.physics.phi0);
        const GX = midX + gx * this._cfg.physics.pxPerMeter;
        this._els.ghost.style.left = GX + 'px';
        // Badge follow
        const rect = this._els.ghost.getBoundingClientRect();
        this._els.ghostBadge.style.left = rect.left + rect.width/2 + 'px';
        this._els.ghostBadge.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
      }

      // Samples για γραφήματα
      const tt = (this._series.t.length>0) ? this._series.t[this._series.t.length-1] + dt : 0;
      this._series.t.push(tt);
      this._series.x.push(x);
      this._series.v.push(v);
      this._series.a.push(a);
      this._series.axX.push(x);
      this._series.axA.push(a);

      // Ζωγράφισε απλά διαγράμματα όταν υπάρχουν καμβάδες
      const charts = this._cfg.charts || {};
      if (!this._els.chartsWrap.hidden) {
        if (charts.showXT) this.drawChart(this._els.chartXT, this._series.t.slice(-300), this._series.x.slice(-300), 'xt');
        if (charts.showVT) this.drawChart(this._els.chartVT, this._series.t.slice(-300), this._series.v.slice(-300), 'vt');
        if (charts.showAT) this.drawChart(this._els.chartAT, this._series.t.slice(-300), this._series.a.slice(-300), 'at');
        if (charts.showAX) this.drawChart(this._els.chartAX, this._series.axX.slice(-300), this._series.axA.slice(-300), 'ax');
      }

      this._raf = requestAnimationFrame(this.animate.bind(this));
    },

    reset() {
      // σταμάτα animation / καθάρισε χρονομετρητές
      this._running = false;
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = null;
      this._bubbleTimers.forEach(clearTimeout);
      this._bubbleTimers = [];
      if (this._ghostTimer) { clearTimeout(this._ghostTimer); this._ghostTimer = null; }
      // καθάρισε σειρές
      this._series = { t: [], x: [], v: [], a: [], axX: [], axA: [] };
      // άδειασε νόμους + bubbles
      this._els.lawsBox.innerHTML = '';
      this._els.bubbles.innerHTML = '';
      // κουρτίνα κάτω
      this._els.curtain.classList.remove('open');
      // μηδένισε clock
      this._t0 = performance.now();
      this._last = 0;
      // κρύψε charts
      this._els.chartsWrap.hidden = true;
      // ξαναπρογραμμάτισε
      this.scheduleTimeline();
      this.mountChartsLater();
      // έτοιμο για νέα εκκίνηση
    },

    start() {
      if (this._running) return;
      this._running = true;
      this._mode = 'run';
      this._slowFactor = 1;
      this._t0 = performance.now();
      this._last = 0;
      this.scheduleTimeline();
      this.mountChartsLater();
      this._raf = requestAnimationFrame(this.animate.bind(this));
    },

    async mount(root) {
      if (this._mounted) return;
      this._mounted = true;

      this.injectStyles();
      this._cfg = await this.loadConfig();
      this.buildDOM(root);
      this.applyCSSVars();
      this.setTitleAndParams();
      this.loadImages();

      // dev start αν δεν λάβουμε event
      if (this._cfg.devFallbackButton) {
        setTimeout(()=> {
          if (!this._running) this._els.dev.hidden = false;
        }, 1200);
      }
    }
  };

  // Δημόσιο API
  window.Theatre = window.Theatre || {};
  window.Theatre.Act2 = {
    mount: (root) => A2.mount(root),
    start: () => A2.start(),
    reset: () => A2.reset()
  };

  // Αυτόματο mount όταν τελειώσει η Πράξη 1
  document.addEventListener('act1:ended', async () => {
    const root = document.getElementById('act2-root');
    if (!root) return;
    root.hidden = false;
    await A2.mount(root);
    A2.start();
  });

  // Fallback: αν κάποιος θέλει να ξεκινήσει από κονσόλα
  // window.Theatre.Act2.start()
})();
