(function () {
  'use strict';

  // ---- Ρυθμίσεις "παράστασης" για τα δυναμικά placeholders ----
  // Εδώ ορίζουμε τις "τυπικές" τιμές Α, Τ, ω, x0, φ0 που θες να
  // εμφανίζονται στο βιβλίο. Μπορείς να τις αλλάξεις όποτε θέλεις.

  const A_M = 3.0;     // m
  const T_S = 6.0;     // s
  const OMEGA = 2 * Math.PI / T_S; // rad/s
  const PHI0_DEG = 37.0;           //°
  const PHI0_RAD = PHI0_DEG * Math.PI / 180;
  const X0_M = A_M * Math.sin(PHI0_RAD); // m

  const PARAMS = {
    A: A_M,
    T: T_S,
    omega: OMEGA,
    x0: X0_M,
    phi0: PHI0_DEG
  };

  function expandDynTemplate(text) {
    if (!text) return '';
    let s = String(text);
    s = s.replaceAll('{A}', PARAMS.A.toFixed(2));
    s = s.replaceAll('{T}', PARAMS.T.toFixed(2));
    s = s.replaceAll('{omega}', PARAMS.omega.toFixed(3));
    s = s.replaceAll('{x0}', PARAMS.x0.toFixed(2));
    s = s.replaceAll('{phi0}', PARAMS.phi0.toFixed(1));
    return s;
  }

  // ---- Labels για GR/EN UI (ΔΕΝ πειράζουμε τα περιεχόμενα των JSON) ----

  const LABELS = {
    gr: {
      title: 'Βιβλίο Παράστασης',
      subtitle: 'Α.Α.Τ. · (m₁, D₁)',
      meta: 'Ανασύνθεση διαλόγων, νόμων και σκηνών από την παράσταση.',
      act1: 'Πράξη 1 — Κινηματική',
      act2: 'Πράξη 2 — Δυναμική',
      foyer: 'Φουαγιέ — Συζήτηση',
      actTagline: 'Διάλογοι θεατών, νόμοι Α.Α.Τ. και σκηνικά γεγονότα.',
      foyerTagline: 'Συζήτηση στο φουαγιέ, επεξηγήσεις και προεκτάσεις.',
      lawsCol: 'Νόμοι / Τύποι',
      viewerFallback: n => 'Θεατής ' + n,
      viewerRole: 'θεαποιοός',
      tagGraph_xt: 'Διάγραμμα x–t στη σκηνή',
      tagGraph_v: 'Διάγραμμα v–t στη σκηνή',
      tagGraph_a: 'Διάγραμμα a–t στη σκηνή',
      tagGraph_ax: 'Διάγραμμα a–x στη σκηνή',
      tagGraph_xsin: 'Διάγραμμα x–ημ(ωt+φ₀) στη σκηνή',
      tagMark: 'Μεταφορά αρχής χρόνου στο πρώτο πέρασμα από x=0 με υ>0',
      langLabel: 'Γλώσσα:',
      langGR: 'Ελληνικά',
      langEN: 'English'
    },
    en: {
      title: 'Performance Booklet',
      subtitle: 'S.H.M. · (m₁, D₁)',
      meta: 'Reconstruction of dialogues, laws and stage moments.',
      act1: 'Act I — Kinematics',
      act2: 'Act II — Dynamics',
      foyer: 'Foyer — Discussion',
      actTagline: 'Spectators’ dialogues, SHM laws and stage events.',
      foyerTagline: 'Foyer discussion, explanations and extensions.',
      lawsCol: 'Laws / Formulae',
      viewerFallback: n => 'Viewer ' + n,
      viewerRole: 'spectator–actor',
      tagGraph_xt: 'x–t diagram on stage',
      tagGraph_v: 'v–t diagram on stage',
      tagGraph_a: 'a–t diagram on stage',
      tagGraph_ax: 'a–x diagram on stage',
      tagGraph_xsin: 'x–sin(ωt+φ₀) diagram on stage',
      tagMark: 'Time origin moved to first crossing at x=0 with v>0',
      langLabel: 'Language:',
      langGR: 'Ελληνικά',
      langEN: 'English'
    }
  };

  function getLangFromQuery() {
    const qs = new URLSearchParams(window.location.search);
    const raw = (qs.get('lang') || '').toLowerCase();
    return (raw === 'en') ? 'en' : 'gr';
  }

  function viewerName(viewers, idx1, lang) {
    if (!idx1) return '';
    const v = viewers && viewers[idx1 - 1];
    const L = LABELS[lang];
    if (!v) return L.viewerFallback(idx1);
    const name = (lang === 'en' ? (v.name_en || v.name_gr) : (v.name_gr || v.name_en));
    return name || L.viewerFallback(idx1);
  }

  function viewerColor(viewers, idx1) {
    if (!idx1) return null;
    const v = viewers && viewers[idx1 - 1];
    return v && v.color ? v.color : null;
  }

  function viewerImg(viewers, idx1) {
    if (!idx1) return null;
    const v = viewers && viewers[idx1 - 1];
    return v && v.img ? v.img : null;
  }

  function initialsFromName(name) {
    if (!name) return '';
    const parts = String(name).trim().split(/\s+/);
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function tint(color, alpha) {
    if (!color) return 'rgba(200,200,200,' + alpha + ')';
    const c = color.replace('#', '');
    const r = parseInt(c.slice(0, 2), 16) || 200;
    const g = parseInt(c.slice(2, 4), 16) || 200;
    const b = parseInt(c.slice(4, 6), 16) || 200;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function stageTagsForEvent(ev, L) {
    const tags = [];
    if (ev.graph === 'xt') tags.push(L.tagGraph_xt);
    if (ev.plot === 'v') tags.push(L.tagGraph_v);
    if (ev.plot === 'a') tags.push(L.tagGraph_a);
    if (ev.plot === 'ax') tags.push(L.tagGraph_ax);
    if (ev.plot === 'xsin') tags.push(L.tagGraph_xsin);
    if (ev.xtMark || ev.xtMarkTail || ev.xtZeroMark) {
      tags.push(L.tagMark);
    }
    return tags;
  }

  function renderSection(root, title, tagline, events, viewers, lang, L) {
    if (!events || !events.length) return;

    const section = document.createElement('section');
    section.className = 'act-section';

    const h2 = document.createElement('h2');
    h2.className = 'act-title';
    h2.textContent = title;
    section.appendChild(h2);

    if (tagline) {
      const p = document.createElement('p');
      p.className = 'act-tagline';
      p.textContent = tagline;
      section.appendChild(p);
    }

    events.forEach((ev) => {
      const hasLeft = ev.left && String(ev.left).trim().length > 0;
      const hasRight = ev.right && String(ev.right).trim().length > 0;

      // Παραλείπουμε τελείως κενά/τεχνικά events (π.χ. "close": true μόνο)
      if (!hasLeft && !hasRight) return;

      const row = document.createElement('div');
      row.className = 'dialog-row';

      const mainCol = document.createElement('div');
      mainCol.className = 'dialog-main';

      const sideCol = document.createElement('div');
      sideCol.className = 'dialog-side';

      // ---- main: avatar + όνομα + κείμενο ----
      const mainInner = document.createElement('div');
      mainInner.className = 'dialog-main-inner';

      const vIdx = ev.viewer || null;
      const name = viewerName(viewers, vIdx, lang);
      const color = viewerColor(viewers, vIdx);
      const img = viewerImg(viewers, vIdx);

      const avatar = document.createElement('div');
      avatar.className = 'speaker-avatar';

      if (img) {
        avatar.style.backgroundImage = 'url("' + img + '")';
        if (color) {
          avatar.style.borderColor = tint(color, 0.9);
        }
      } else {
        avatar.classList.add('initials');
        avatar.textContent = initialsFromName(name);
        if (color) {
          avatar.style.backgroundColor = tint(color, 0.9);
        }
      }

      const meta = document.createElement('div');
      meta.className = 'speaker-meta';

      if (name) {
        const nameEl = document.createElement('div');
        nameEl.className = 'speaker-name';
        nameEl.textContent = name;
        meta.appendChild(nameEl);

        const roleEl = document.createElement('div');
        roleEl.className = 'speaker-role';
        roleEl.textContent = L.viewerRole;
        meta.appendChild(roleEl);
      }

      const textEl = document.createElement('div');
      textEl.className = 'dialog-text';
      if (hasLeft) {
        textEl.innerHTML = expandDynTemplate(ev.left);
      }

      meta.appendChild(textEl);

      mainInner.appendChild(avatar);
      mainInner.appendChild(meta);
      mainCol.appendChild(mainInner);

      // ---- side: νόμοι / τύποι + tags σκηνής ----
      if (hasRight || stageTagsForEvent(ev, L).length > 0) {
        const wrap = document.createElement('div');
        wrap.className = 'law-wrapper';

        if (hasRight) {
          const lbl = document.createElement('div');
          lbl.className = 'law-label';
          lbl.textContent = L.lawsCol;
          wrap.appendChild(lbl);

          const law = document.createElement('div');
          law.className = 'law-block';
          law.innerHTML = ev.right;
          wrap.appendChild(law);
        }

        const tags = stageTagsForEvent(ev, L);
        if (tags.length > 0) {
          const tagsWrap = document.createElement('div');
          tagsWrap.className = 'stage-tags';
          tags.forEach(t => {
            const chip = document.createElement('span');
            chip.className = 'stage-chip';
            chip.textContent = t;
            tagsWrap.appendChild(chip);
          });
          wrap.appendChild(tagsWrap);
        }

        sideCol.appendChild(wrap);
      }

      row.appendChild(mainCol);
      row.appendChild(sideCol);
      section.appendChild(row);
    });

    root.appendChild(section);
  }

  async function loadDialogs(lang) {
    const url = (lang === 'en') ? 'dialogs-en.json' : 'dialogs-gr.json';
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) {
      throw new Error('Δεν βρέθηκε ' + url);
    }
    return resp.json();
  }

  function applyHeaderUI(lang) {
    const L = LABELS[lang];
    const titleEl = document.getElementById('bookTitle');
    const subEl = document.getElementById('bookSubtitle');
    const metaEl = document.getElementById('bookMeta');
    const langLabel = document.getElementById('langLabel');
    const langGR = document.getElementById('langGR');
    const langEN = document.getElementById('langEN');

    if (titleEl) titleEl.textContent = L.title;
    if (subEl) subEl.textContent = L.subtitle;
    if (metaEl) metaEl.textContent = L.meta;
    if (langLabel) langLabel.textContent = L.langLabel;

    if (langGR) {
      langGR.textContent = L.langGR;
      langGR.classList.toggle('active', lang === 'gr');
    }
    if (langEN) {
      langEN.textContent = L.langEN;
      langEN.classList.toggle('active', lang === 'en');
    }

    document.documentElement.lang = (lang === 'en' ? 'en' : 'el');
  }

  async function init() {
    const lang = getLangFromQuery();
    const L = LABELS[lang];
    applyHeaderUI(lang);

    const root = document.getElementById('bookRoot');
    if (!root) return;

    try {
      const data = await loadDialogs(lang);
      const viewers = data.viewers || [];
      const act1 = data.act1 || [];
      const act2 = data.act2 || [];
      const foyer = data.foyer || [];

      // Πράξη 1
      renderSection(root, L.act1, L.actTagline, act1, viewers, lang, L);
      // Πράξη 2
      renderSection(root, L.act2, L.actTagline, act2, viewers, lang, L);
      // Φουαγιέ
      renderSection(root, L.foyer, L.foyerTagline, foyer, viewers, lang, L);

    } catch (err) {
      console.error(err);
      if (root) {
        root.innerHTML = '<p class="muted">Σφάλμα φόρτωσης διαλόγων.</p>';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
