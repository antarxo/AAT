// intro_boot.js — εμφάνισε το intro πέπλο όσο πιο νωρίς γίνεται (fallback)
(function () {
  function ensureFallback() {
    if (document.getElementById('intro-root')) return;

    var root = document.createElement('div');
    root.id = 'intro-root';
    Object.assign(root.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '5000',
      display: 'grid',
      placeItems: 'center',
      background: 'rgba(0,0,0,.90)',
      backdropFilter: 'blur(1.5px)',
      WebkitBackdropFilter: 'blur(1.5px)',
      padding: '16px',
      boxSizing: 'border-box'
    });

    var box = document.createElement('div');
    Object.assign(box.style, {
      width: 'min(1040px, 94vw)',
      height: 'min(92vh, 860px)',
      borderRadius: '14px',
      overflow: 'hidden',
      boxShadow: '0 18px 70px rgba(0,0,0,.55)',
      border: '1px solid rgba(255,255,255,.16)',
      display: 'grid',
      gridTemplateRows: '1fr auto'
    });
    root.appendChild(box);

    var frame = document.createElement('iframe');
    frame.title = 'Πρόγραμμα παράστασης';
    frame.loading = 'eager';
    frame.referrerPolicy = 'no-referrer';
    frame.src = 'intro.html';
    Object.assign(frame.style, { width: '100%', height: '100%', border: '0', background: 'transparent' });
    box.appendChild(frame);

    var footer = document.createElement('div');
    Object.assign(footer.style, {
      display: 'flex',
      justifyContent: 'center',
      padding: '12px',
      background: 'rgba(0,0,0,.35)',
      borderTop: '1px solid rgba(255,255,255,.14)'
    });

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Συνέχεια';
    Object.assign(btn.style, {
      padding: '10px 16px',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,.22)',
      background: 'rgba(255,255,255,.10)',
      color: '#fff',
      cursor: 'pointer',
      fontWeight: '700',
      letterSpacing: '.2px'
    });

    btn.addEventListener('click', function () {
      root.style.transition = 'opacity 180ms ease';
      root.style.opacity = '0';
      setTimeout(function () { root.remove(); }, 190);
    });

    footer.appendChild(btn);
    box.appendChild(footer);

    document.body.appendChild(root);
  }

  function maybeShow() {
    // Αν το intro.js τρέξει κανονικά, θα αντικαταστήσει/χρησιμοποιήσει το ίδιο #intro-root.
    // Εδώ βάζουμε fallback μόνο αν δεν εμφανίστηκε τίποτα μέχρι τώρα.
    ensureFallback();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeShow, { once: true });
  } else {
    setTimeout(maybeShow, 0);
  }
})();
