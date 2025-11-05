// ui_fonts_math.js
// Καθαρή serif για σύμβολα/εκθέτες/δείκτες: Cambria → Times → Georgia → serif
(function(){
  const css = `
    :root{ --math-serif: Cambria, "Times New Roman", Times, Georgia, serif; }
    .thought-bubble .text,
    #laws, #lawsList, #lawsList > *,
    .actbreak .box, .params-box, .signboard {
      font-family: var(--math-serif) !important;
      letter-spacing: 0.15px;
    }
    /* Ελαφρώς μεγαλύτερα σύμβολα στους Νόμους */
    #lawsList > * { font-size:16.5px; line-height:1.48; }
  `;
  const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s);
})();
