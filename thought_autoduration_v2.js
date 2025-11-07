/* thought_autoduration_v2.js
   - Δεν πειράζει κείμενα.
   - Τυποποιεί διάρκεια ανά σκέψη με βάση μήκος κειμένου.
   - Τυλίγει την ΥΠΑΡΧΟΥΣΑ showThoughtForViewer, ώστε όπου δεν δίνεις ρητή διάρκεια,
     να μπαίνει σωστή αυτόματη.
   - Για τη 2η πράξη θα περάσουμε ρητά τη διάρκεια, οπότε είναι απολύτως συνεπές. */
(function(){
  'use strict';

  // Προεπιλογές ανάγνωσης (ρυθμίζονται από act2.js αν θες)
  function getNum(n, def){ return (typeof n==='number' && !isNaN(n)) ? n : def; }
  function cfg(){
    return {
      BASE:  getNum(window.TH_BASE, 1.2),        // σταθερό κατώφλι
      CPS:   getNum(window.TH_CHARS_PER_SEC, 8.5), // chars/sec → όσο μικρότερο, τόσο περισσότερη ώρα
      MIN:   getNum(window.TH_MIN, 3.8),         // απόλυτο ελάχιστο
      MAX:   getNum(window.TH_MAX, 14.0),        // απόλυτο μέγιστο
      FORCE: getNum(window.TH_FORCE_MIN, 0),     // “δαγκωτό” ελάχιστο (Act II)
      EXTRA: getNum(window.TH_EXTRA_HOLD, 0.6),  // επιπλέον κράτημα ασφαλείας
      SCALE: (function(){
        const DEFAULT = 3.0;
        const v = (typeof window.bubbleDurationSec==='number' && window.bubbleDurationSec>0)
          ? window.bubbleDurationSec/DEFAULT : 1.0;
        return v;
      })()
    };
  }

  function computeThoughtDuration(text){
    const c = cfg();
    const s = (text || '').toString();
    // Βασικό μοντέλο: χρόνος = base + len / cps
    let dur = c.BASE + (s.length / c.CPS);
    dur = Math.max(c.MIN, dur);
    dur = Math.max(dur, c.FORCE);
    dur = Math.min(c.MAX, dur);
    dur = dur * c.SCALE + c.EXTRA;
    return dur;
  }
  window.computeThoughtDuration = computeThoughtDuration;

  // Αν υπάρχει αρχική showThoughtForViewer, την “τυλίγουμε” για να επιβάλουμε αξιοπρεπή διάρκεια
  const orig = window.showThoughtForViewer;
  if (typeof orig === 'function') {
    window.showThoughtForViewer = function(vIdx, text, durationSecs, customLift, xShift){
      // Αν ΔΕΝ μας έδωσαν ρητή διάρκεια, υπολογίζουμε εμείς (Act I/γενική χρήση)
      const dur = (typeof durationSecs === 'number' && durationSecs > 0)
        ? durationSecs
        : computeThoughtDuration(text);
      return orig(vIdx, text, dur, customLift, xShift);
    };
  }
})();
