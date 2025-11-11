/* act3_boot_min.js — μίνι μαυροπίνακας στο φουαγιέ (cover τίτλο+σκηνή, όχι πλαϊνές κουρτίνες) */
(function(){
  'use strict';
  function mountBoard(){
    const stage = document.getElementById('stage');
    if (!stage) return;

    // Container
    let board = document.getElementById('foyerBoard');
    if (!board){
      board = document.createElement('div');
      board.id = 'foyerBoard';
      board.style.position = 'absolute';
      board.style.left = '18%';          // χωρίς πλαϊνές κουρτίνες
      board.style.top  = '0';
      board.style.width  = '64%';
      board.style.height = 'calc(68% - 20px)'; // μέχρι λίγο πάνω από τον χάρακα
      board.style.background = 'rgba(10, 10, 10, 0.92)';
      board.style.border = '2px solid rgba(255,255,255,0.18)';
      board.style.boxShadow = '0 10px 24px rgba(0,0,0,0.55) inset';
      board.style.borderRadius = '8px';
      board.style.zIndex = '500'; // πάνω από σκηνικά, κάτω από modals
      board.style.color = '#cfe9cc';
      board.style.fontFamily = 'Georgia, serif';
      board.style.padding = '12px 16px';
      board.style.display = 'none';

      // Header
      const h = document.createElement('div');
      h.textContent = 'Φουαγιέ — Απόψεις & Αποδείξεις';
      h.style.textAlign = 'center';
      h.style.fontWeight = '700';
      h.style.marginBottom = '8px';
      h.style.color = '#fff';
      board.appendChild(h);

      // Γραφή τυπικού μηνύματος τέλους (placeholder, θα αντικατασταθεί με proofs json)
      const txt = document.createElement('div');
      txt.id = 'foyerText';
      txt.textContent = '— (Προσεχώς: αυτόματη ροή αποδείξεων από act3_proofs.json) —';
      txt.style.opacity = '0.85';
      txt.style.fontSize = '16px';
      board.appendChild(txt);

      stage.appendChild(board);
    }
    board.style.display = 'block';
  }

  document.addEventListener('act3-start', function(){
    mountBoard();
  });
})();
