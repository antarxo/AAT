# ΑΑΤ Desktop Probe

Τύπος έκδοσης: **diagnostic-only / desktop probe**

Αυτός ο φάκελος συσκευάζει την υπάρχουσα εφαρμογή ΑΑΤ ως Tauri desktop
εφαρμογή. Δεν μεταφέρει την εκπαιδευτική μηχανή σε Rust, δεν προσθέτει DRM και
δεν ισχυρίζεται ότι προστατεύει τον HTML/JavaScript κώδικα.

## Τι αλλάζει

- Το `index.html` ανοίγει σε αυτόνομο desktop παράθυρο.
- Τα αρχεία της εφαρμογής αντιγράφονται σε ελεγχόμενο build directory.
- Η μοναδική CDN εξάρτηση, uPlot 1.6.30, ενσωματώνεται τοπικά για offline χρήση.
- Η άδεια MIT του uPlot συνοδεύει το πακέτο.
- Τα Windows icons παράγονται κατά το build από το `app-icon.svg`.
- Το Windows workflow παράγει MSI και NSIS installer.

## Τι δεν αλλάζει

- Ο αρχικός κώδικας της ΑΑΤ στη ρίζα του repository.
- Η σκηνή, οι πράξεις, οι διάλογοι, το βιβλίο και τα assets.
- Ο τρόπος υπολογισμού και παρουσίασης της ΑΑΤ.
- Η δυνατότητα ανάκτησης των frontend αρχείων από αποφασισμένο χρήστη.

Πριν από εμπορική έκδοση χρειάζεται πλήρης έλεγχος αδειών όλων των
εξαρτήσεων και των assets. Η παρούσα έκδοση είναι μόνο τεχνικό probe.

## Τοπικές εντολές

```bash
npm install
npm run prepare
npm run check
npm run dev
```

Για production-like πακέτο:

```bash
npm run build
```

Το πλήρες Windows build εκτελείται από το GitHub Actions workflow
`AAT Windows Desktop Probe`: αυτόματα στο σχετικό pull request ή χειροκίνητα
με `workflow_dispatch`.
