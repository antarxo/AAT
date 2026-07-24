# HTML Desktop Factory — ΑΑΤ

Τύπος έκδοσης: **diagnostic-only / desktop-factory probe**

Ο φάκελος αυτός είναι πλέον παραμετρική Factory για εφαρμογές
HTML/CSS/JavaScript. Η ΑΑΤ είναι η πρώτη πραγματική διαμόρφωση και παραμένει
το execution path αναφοράς.

Η Factory δεν μεταφέρει την εκπαιδευτική μηχανή σε Rust, δεν προσθέτει DRM και
δεν ισχυρίζεται ότι ο ενσωματωμένος frontend κώδικας είναι μη ανακτήσιμος.

## Η μοναδική διαμόρφωση

Το `desktop-app.json` δηλώνει:

- πηγαίο directory και entrypoint,
- ακριβή λίστα ενεργών αρχείων και directories,
- βιβλιοθήκες που πρέπει να αντιγραφούν από `node_modules`,
- αντικαταστάσεις CDN με τοπικά paths,
- όνομα, έκδοση, identifier, παράθυρο και icon,
- απαιτούμενα/απαγορευμένα runtime αρχεία,
- offline policy και markers για exposure audit.

Τα `tauri.conf.json` και τα στοιχεία του `Cargo.toml` παράγονται από αυτή τη
διαμόρφωση. Για επόμενη παρόμοια εφαρμογή δεν χρειάζεται αλλαγή του Rust shell.

## Τι παράγει

- Portable Windows executable.
- NSIS `setup.exe`.
- MSI installer.
- `exposure-report.json` και `exposure-report.txt`.
- Snapshot του `desktop-app.json` μαζί με το build artifact.

## Τι ελέγχει

- Ότι υπάρχουν όλα τα δηλωμένα runtime αρχεία.
- Ότι legacy/editor αρχεία δεν μπήκαν κατά λάθος.
- Ότι οι δηλωμένες CDN αναφορές αντικαταστάθηκαν.
- Ότι το ενεργό runtime δεν περιέχει εξωτερικά URLs όταν η policy είναι
  `offline`.
- Ότι τα inline scripts της ΑΑΤ είναι συντακτικά έγκυρα.
- Ποιοι επιλεγμένοι source markers παραμένουν ορατοί ως απλό κείμενο μέσα στο
  portable executable.

Το exposure audit μετρά μόνο casual string exposure. Απουσία ενός marker δεν
αποδεικνύει ότι ο κώδικας δεν μπορεί να εξαχθεί με εξειδικευμένα εργαλεία.

## Τι δεν αλλάζει στην ΑΑΤ

- Ο αρχικός κώδικας στη ρίζα του repository.
- Η σκηνή, οι πράξεις, οι διάλογοι, το βιβλίο και τα assets.
- Ο τρόπος υπολογισμού και παρουσίασης.
- Η δυνατότητα ανάκτησης frontend πόρων από αποφασισμένο χρήστη.

Πριν από εμπορική έκδοση χρειάζεται πλήρης έλεγχος αδειών όλων των
εξαρτήσεων/assets και απόφαση για code signing. Αυτά δεν αποτελούν μέρος του
παρόντος probe.

## Τοπικές εντολές

```bash
npm install
npm run configure
npm run check
npm run dev
```

Για production-like πακέτο:

```bash
npm run build
```

Μετά από Windows build:

```bash
npm run audit:exposure -- src-tauri/target/release/aat-desktop-probe.exe
```

Το πλήρες Windows execution path τρέχει από το GitHub Actions workflow
`HTML Desktop Factory — AAT`, αυτόματα στο σχετικό pull request ή χειροκίνητα
με `workflow_dispatch`.
