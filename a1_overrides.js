// a1_overrides.js — Ενοποίηση εμφάνισης & σεναρίου Πράξης 1 + φορμάρισμα Νόμων

(function(){
  // 1) Φόρτωση γραμματοσειράς τύπου «κιμωλίας» (Google Fonts)
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Gloria+Hallelujah&display=swap';
  document.head.appendChild(link);

  // 2) Εισαγωγή CSS για «κιμωλία» στις σκέψεις και στους νόμους
  const style = document.createElement('style');
  style.textContent = `
    .chalk { font-family: 'Gloria Hallelujah', cursive; letter-spacing: 0.2px; }
    .thought-bubble .text { font-family: 'Gloria Hallelujah', cursive; }
    #laws { /* ίδιο κουτί νόμων, αλλά χωρίς αριθμημένη λίστα */
      background: rgba(20,0,0,.6);
    }
    #lawsList { display:flex; flex-direction:column; gap:6px; }
    .law-formula { color:#fff; font-family: 'Gloria Hallelujah', cursive; font-size:16px; line-height:1.45; }
  `;
  document.head.appendChild(style);

  // 3) Βοηθητικά για δυναμικά μεγέθη (χρειαζόμαστε v0 sign)
  window.v0Val = function(){ return (window.omega||0)* (window.A_m||0) * Math.cos((window.omega||0)*(0+(window.obsStartPlaybackOffset||0))); };
  window.v0SignStr = function(){ try { return v0Val() >= 0 ? '>' : '<'; } catch(_) { return '>'; } };

  // 4) Αντικατάσταση κειμένων σκέψεων Πράξης 1 (με δείκτες/εκθέτες)
  if (window.i18n && i18n.gr && i18n.gr.thoughts){
    i18n.gr.thoughts = {
      t1:"Εππ! ο m₁D₁ ήταν ήδη σε κίνηση!",
      t2:"…χρονική στιγμή t₀=0 s με το άνοιγμα της κουρτίνας!",
      t3:"… και η κίνηση είναι ευθύγραμμη και παλινδρομική!",
      t4:"… και επαναλαμβανόμενη, περιοδική, άρα ταλάντωση!",
      t5:"Μήπως είναι Απλή Αρμονική Ταλάντωση;",
      t6:"… αν είναι Α.Α.Τ., τότε πρέπει να ισχύει χ = A·ημ(ωt + φ₀)!",
      t7:"… αν κάνουμε διάγραμμα x–t, αυτό μπορεί να το επιβεβαιώσει!",
      t7A:(A)=>`…με A=${A} m`,
      t8Tw:(Tval,om)=>`… και T=${Tval} s, επομένως ω=${om} rad/s!`,
      // χρησιμοποιούμε v0SignStr() από τα helpers
      t9phi:(x0,phi)=>`… όντως ΑΑΤ· αφού x₀=${x0} m και v₀ ${v0SignStr()} 0, υπάρχει φ₀=${phi}°. Χαχα, ένα το κρατούμενο!`,
      t11:"… άρα η ταχύτητα δίνεται από τον νόμο v(t) = ωA·συν(ωt + φ₀)!",
      t13:"…και η επιτάχυνση από τον τύπο a(t) = −ω²A·ημ(ωt + φ₀)!",
      t15:"Η χ = A·ημ(ωt + φ₀) ⇒ a = −ω²A·ημ(ωt + φ₀) = −ω²x!",
      t18:"Τέλεια! όλο το σετ νόμων της Α.Α.Τ!"
    };
  }

  // 5) Μετατρέπουμε τη λίστα νόμων σε απλό container (αν χρειάζεται)
  const lawsList = document.getElementById('lawsList');
  if (lawsList && lawsList.tagName === 'OL'){
    const newDiv = document.createElement('div');
    newDiv.id = 'lawsList';
    newDiv.className = '';
    lawsList.replaceWith(newDiv);
  }

  // 6) Αντικατάσταση addLaw: εμφανίζει τύπο με (n) στο τέλος, ΚΑΙ «κιμωλία»
  //    Δεν πειράζουμε lawCount — συνεχίζει από εκεί που είναι (1…4 στην Πράξη 1, 5… στην Πράξη 2).
  if (typeof window.addLaw === 'function'){
    const _origPositionLawCharts = window.positionLawCharts || function(){};
    window.addLaw = function(formulaText){
      try {
        // trig τοπικοποίηση (ημ/συν) αν υπάρχει
        if (typeof window.localizeTrig === 'function'){
          formulaText = localizeTrig(formulaText);
        }
        // υπολογισμός δείκτη νόμου
        const n = (typeof window.lawCount === 'number' ? window.lawCount + 1 : 1);
        // render
        const host = document.getElementById('lawsList');
        if (!host) return;
        const div = document.createElement('div');
        div.className = 'law-formula';
        div.textContent = `${formulaText} (${n})`;
        host.appendChild(div);
        // ενημέρωση counters
        if (typeof window.firstLawShown !== 'undefined'){
          if (!window.firstLawShown){
            window.firstLawShown = true;
            const title = document.getElementById('lawsTitle');
            if (title){
              title.textContent = (window.i18n && i18n[window.LANG||'gr'] ? i18n[LANG].lawsTitle : 'Νόμοι Α.Α.Τ.');
            }
            const pane = document.getElementById('laws');
            if (pane) pane.style.display = 'block';
          }
        }
        if (typeof window.lawCount === 'number'){ window.lawCount++; }
        _origPositionLawCharts();
      } catch(e){ console.error('addLaw override error', e); }
    };
  }

  // 7) Σιγουρεύουμε «κιμωλία» στις σκέψεις: απλά προσθέτουμε κλάση στο text holder
  const bubbleText = document.querySelector('.thought-bubble .text');
  if (bubbleText){ bubbleText.classList.add('chalk'); }

  // 8) Timeline Πράξης 1 — ευθυγραμμισμένο με τα βήματα σου
  //    Αντικαθιστούμε το περιεχόμενο του thoughtScript (όχι τη const thoughtScriptBase)
  if (Array.isArray(window.thoughtScript)){
    const NEW = [
      {kind:'bubble', atT:1.05, viewer:0, key:'t1',  yOffset:120, xShift:-40},
      {kind:'bubble', atT:1.15, viewer:1, key:'t2',  yOffset:125, xShift:-20},
      {kind:'bubble', atT:1.80, viewer:3, key:'t3',  yOffset:130, xShift: 10},
      {kind:'bubble', atT:2.30, viewer:4, key:'t4',  yOffset:130, xShift: 30},
      {kind:'bubble', atT:2.90, viewer:2, key:'t5',  yOffset:135, xShift:-30},
      {kind:'bubble', atT:3.40, viewer:1, key:'t6',  yOffset:135, xShift:-10},
      {kind:'bubble', atT:3.80, viewer:3, key:'t7',  yOffset:135, xShift: 10},
      {kind:'graph',  atT:3.95},
      {kind:'bubbleDyn', atT:4.60, viewer:0, what:'phi', yOffset:135, xShift:-20},
      {kind:'bubbleDyn', atT:5.20, viewer:2, what:'A',   yOffset:135, xShift:  0},
      {kind:'bubbleDyn', atT:5.70, viewer:4, what:'Tw',  yOffset:135, xShift: 20},
      {kind:'law',   atT:6.10, lawText:'x(t) = A·sin(ωt + φ₀)', alsoParams:true},
      {kind:'bubble',atT:6.60, viewer:1, key:'t11', yOffset:130, xShift:-20},
      {kind:'law',   atT:6.90, lawText:'v(t) = ωA·cos(ωt + φ₀)'},
      {kind:'lawPlot', atT:7.00, plot:'v'},
      {kind:'bubble',atT:7.60, viewer:3, key:'t13', yOffset:140, xShift:10},
      {kind:'law',   atT:7.85, lawText:'a(t) = −ω²A·sin(ωt + φ₀)'},
      {kind:'lawPlot', atT:7.95, plot:'a'},
      {kind:'bubble',atT:8.50, viewer:0, key:'t15', yOffset:125, xShift:-30},
      {kind:'law',   atT:8.80, lawText:'a(x) = −ω²·x'},
      {kind:'lawPlot', atT:9.10, plot:'ax'},
      {kind:'bubble',atT:9.60, viewer:2, key:'t18', yOffset:130, xShift: 0},
      {kind:'close', atT:10.20}
    ];
    window.thoughtScript.splice(0, window.thoughtScript.length, ...NEW);
  }

  // 9) Όταν εμφανίζεται ο νόμος (1), οι παράμετροι δεξιά παραμένουν ως έχουν (ήδη στο index)
  //    Τα mini-διαγράμματα (v, a, a–x) παραμένουν κάτω από το κουτί των νόμων (όπως πριν).
})();
