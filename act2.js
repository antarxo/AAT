/* act2.js — Act II με συνεπή χρονισμό
   - Περνά ρητά διάρκειες σε κάθε σκέψη (με computeThoughtDuration)
   - Ghost: ίδιο ύψος/ελατήριο, A=5, μόνο στο segment #4→#7
   - Κλείσιμο: κρύβει marker, κλείνει κουρτίνα, εμφανίζει κεντραρισμένο “Φουαγιέ”
*/
(function(){
  'use strict';
  const $id=(x)=>document.getElementById(x);
  const stage=$id('stage');
  const spring=$id('spring');
  const marker=$id('marker');
  const signboard=document.querySelector('.signboard');
  const h1=signboard?signboard.querySelector('h1'):null;
  const sbA=$id('sbLineA'), sbB=$id('sbLineB');

  let running=false, done=false;
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));

  // -------- Timing “προφίλ” για Act II --------
  function applyAct2TimingProfile(){
    // Λίγο πιο αργή ανάγνωση & σίγουρο minimum
    window.TH_CHARS_PER_SEC = 8.0;  // πιο αργά από default
    window.TH_MIN           = 4.2;  // απόλυτο ελάχιστο ανά σκέψη
    window.TH_FORCE_MIN     = 4.2;  // δαγκωτό min για να ΜΗΝ πέφτει κάτω από εδώ
    window.TH_MAX           = 16.0; // upper clamp
    window.TH_EXTRA_HOLD    = 0.7;  // κρατά λίγο παραπάνω για ανάσα
    // SCALE: παραμένει ό,τι έχει ο χρήστης από το γρανάζι (bubbleDurationSec)
  }
  function clearAct2TimingProfile(){
    delete window.TH_CHARS_PER_SEC;
    delete window.TH_MIN;
    delete window.TH_FORCE_MIN;
    delete window.TH_MAX;
    delete window.TH_EXTRA_HOLD;
  }

  function setTitleAct2(){
    if(h1) h1.textContent='Πράξη 2η: Η Δυναμική στα ... Αλγεβρικά!';
    const m = (typeof window.m==='number') ? window.m.toFixed(1) : (window.m||'…');
    const D = (typeof window.D==='number') ? window.D : '…';
    const E = (typeof window.E_mech==='number') ? window.E_mech.toFixed(2) : (window.E_mech||'…');
    if(sbA) sbA.textContent=`m₁ = ${m} kg , D₁ = ${D} N/m`;
    if(sbB) sbB.textContent=`Eμηχ = ${E} J`;
  }

  function ensureFoyerGate(){
    if(document.getElementById('foyerGate')) return;
    const gate=document.createElement('div');
    gate.id='foyerGate';
    Object.assign(gate.style,{
      position:'absolute',display:'none',alignItems:'center',justifyContent:'center',
      textAlign:'center',zIndex:410,background:'rgba(0,0,0,.55)'
    });
    const box=document.createElement('div');
    Object.assign(box.style,{
      background:'rgba(0,0,0,.7)',border:'1px solid rgba(255,255,255,.25)',
      borderRadius:'12px',padding:'16px 20px',maxWidth:'520px',color:'#fff'
    });
    const h=document.createElement('h3'); h.textContent='Διάλειμμα — Φουαγιέ';
    const p=document.createElement('p');  p.textContent='Οι κουρτίνες παραμένουν κλειστές. Προχωράμε στις αποδείξεις;';
    const btn=document.createElement('button'); btn.textContent='Μετάβαση στο Φουαγιέ';
    Object.assign(btn.style,{background:'#700',color:'#fff',border:'none',borderRadius:'8px',
                             padding:'10px 16px',fontSize:'16px',cursor:'pointer'});
    btn.addEventListener('click',()=>{ gate.style.display='none'; document.dispatchEvent(new Event('act3-start')); });
    box.appendChild(h); box.appendChild(p); box.appendChild(btn); gate.appendChild(box);
    document.body.appendChild(gate);
  }
  function showFoyerGate(){
    ensureFoyerGate();
    const gate=$id('foyerGate'); if(!gate || !stage) return;
    const sRect=stage.getBoundingClientRect();
    const cu=document.querySelector('.curtain-upper'); const cuRect=cu.getBoundingClientRect();
    gate.style.left=(sRect.left + stage.clientWidth*0.18)+'px';
    gate.style.top = cuRect.top+'px';
    gate.style.width=(stage.clientWidth*0.64)+'px';
    gate.style.height=cuRect.height+'px';
    gate.style.display='flex';
  }

  function addLaw(txt){ if(typeof window.addLaw==='function') window.addLaw(txt); }
  function dur(text){
    return (typeof window.computeThoughtDuration==='function')
      ? window.computeThoughtDuration(text) : 5.0; // ασφαλές default
  }
  async function say(viewer, text, y=130, x=0){
    const d = dur(text);
    if (typeof window.showThoughtForViewer === 'function') {
      // ΠΕΡΝΑΜΕ ΡΗΤΑ τη διάρκεια -> δεν αφήνουμε τον browser να “βιαστεί”
      window.showThoughtForViewer(viewer, text, d, y, x);
    }
    // Περιμένουμε λίγο παραπάνω ώστε να κλείσει άνετα
    await sleep((d + 0.25) * 1000);
  }

  async function playAct2(){
    if(running||done) return;
    running=true;
    applyAct2TimingProfile();

    // Άνοιγμα κουρτίνας + ελατήριο ορατό
    if(stage) stage.classList.add('open');
    if(spring) spring.style.display='block';
    setTitleAct2();

    // -------- ΣΚΕΨΕΙΣ + ghost window (#4→#7) --------
    const seq = [
      {v:0, t:'ωπ! δεμένος σε ελατήριο είναι ο m₁D₁!', y:135, x:-20},
      {v:1, t:'αυτόν ακριβώς τον m₁D₁ σίγουρα τον έχω ξαναδεί με το ίδιο μηχανισμό-ελατήριο σε άλλη παράσταση, αλλά με άλλον παραγωγό!', y:135, x:-10, gStart:true}, // #4
      {v:3, t:'…ναι και εκεί πάλι με την ίδια περίοδο όμως εμμονικά κινήθηκε, αλλά με μεγαλύτερο πλάτος A!', y:135, x:10},
      {v:2, t:'(θυμήσου…) — ο m₁D₁ σε άλλη σκηνή με διαφορετικό πλάτος/ενέργεια', y:130, x:-10},
      {v:4, t:'Χμμμ… Πρωταγωνιστής μάλλον είναι ο κινούμενος ηθοποιός και τα εργαλεία του μαζί!', y:130, x:20, gStop:true}, // #7
      {v:0, t:'Τώρα καταλαβαίνω μάλλον γιατί δεν τον λένε m₁ αλλά m₁,D₁…', y:130, x:-20},
      {v:1, t:'… το m₁ είναι η μάζα του ηθοποιού αλλά ταλαντωτής προφανώς, νοείται η σύμπραξη του ηθοποιού (m₁) και του «ελαστικού» αιτίου-δύναμη, στο οποίο αναφέρεται το D₁!', y:130, x:-10},
      {v:3, t:'…m₁ και D₁ δηλαδή πάνε παντού πακέτο! και τα δυο μαζί είναι ο ταλαντωτής — ο πρωταγωνιστής!', y:130, x:10},
      {v:2, t:'… δηλαδή κάθε ταλαντωτής χαρακτηρίζεται 1) από τη μάζα του και 2) από το ελαστικό αίτιο-δύναμη που του ρυθμίζει χρονικά (T) την ταλάντωση!', y:130, x:0},
      {v:4, t:'…αρχίζω να πείθομαι γιατί σαν χαρακτηριστικό όνομα έχει το mD! και όχι σκέτο m!...', y:130, x:20},
      {v:0, t:'Επομένως η «εμμονή» του κάθε ταλαντωτή (η χαρακτηριστική T → f, ω) οφείλεται στο m και στο ελαστικό αίτιο (D)!', y:130, x:-20},
      {v:1, t:'Πωωωω! ελάτε, αφήστε τα, πάμε παρακάτω…', y:125, x:-10},
      {v:3, t:'Ας δούμε πώς γράφεται ο 2ος Νόμος του Νεύτωνα για την περίπτωση του ταλαντωτή!', y:130, x:10}
    ];

    for (const it of seq) {
      if (it.gStart && typeof window.setGhostAmplitude==='function' && typeof window.startGhostSync==='function') {
        window.setGhostAmplitude(5);   // Aghost = 5 (m)
        window.startGhostSync(12000);  // ~3 σκέψεις παράθυρο
      }
      await say(it.v, it.t, it.y, it.x);
      if (it.gStop && typeof window.stopGhostSync==='function') {
        window.stopGhostSync();
      }
    }

    // -------- ΝΟΜΟΙ (5),(6),(6′),(7) --------
    addLaw('ΣF = −m·ω²·A·ημ(ωt+φ₀) (5)'); await sleep(350);
    addLaw('ΣF = −m·ω²·x (6)');           await sleep(350);
    addLaw('D = m·ω² (6′)');              await sleep(350);
    addLaw('ΣF = −D·x (7)');              await sleep(650);

    // -------- ΚΛΕΙΣΙΜΟ ΠΡΑΞΗΣ 2 --------
    if (typeof window.stopGhostSync==='function') window.stopGhostSync();
    if (marker) marker.style.opacity='0';           // κρύψε δείκτη θέσης όπως ζητήθηκε

    const cu=document.querySelector('.curtain-upper');
    if (cu && stage) {
      cu.classList.add('slow-close'); stage.classList.remove('open');
      await sleep(1600);
      cu.classList.remove('slow-close');
    } else {
      if (stage) stage.classList.remove('open');
      await sleep(600);
    }
    showFoyerGate();
    clearAct2TimingProfile();
    done=true; running=false;
  }

  document.addEventListener('act2-start', playAct2, {once:true});
})();
