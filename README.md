# Presentazione Progetto — Mappa Concettuale Circolare

Web app single-page interattiva ed elegante progettata specificamente per presentare progetti durante conferenze, keynote e riunioni tecniche.

---

## Caratteristiche Principali

- **Design Minimalista Dark Mode (`#0e0e11`)**: interfaccia pulita senza barre di navigazione, header, footer o menu superflui, ottimizzata per proiettori (16:9), schermi desktop, tablet e smartphone.
- **7 Nodi a Disposizione Circolare (Mappa Mentale)**:
  - Disposti uniformemente a ~51,4° lungo una circonferenza immaginaria.
  - Collegati da un anello sottile in SVG con riflessi e nodi di giunzione.
  - Immagini ritagliate in forma circolare con effetto lente.
- **Zoom & Pan dell'Anello**:
  - Ingrandimento e riduzione fluido con rotella del mouse o pinch su touch screen (da `0.5x` a `3.0x`).
  - Trascina (pan) liberamente quando l'anello è ingrandito.
  - Doppio clic sullo sfondo per ripristinare istantaneamente la vista centrata iniziale (1.0x).
- **Zoom sul Singolo Cerchio**:
  - All'hover o al focus da tastiera, il cerchio si ingrandisce con transizione fluida (`1.12x`) ed eleva il suo alone luminoso.
- **Lightbox Interattiva**:
  - Cliccando su un nodo si apre la visualizzazione a tutto schermo con sfondo oscurato e sfocato (`backdrop-filter: blur(16px)`).
  - Mostra l'infografica completa in alta definizione in formato 16:9 senza ritagli.
  - All'interno della lightbox: ulteriore zoom fino a `4.0x` con rotella/pinch e trascinamento dell'immagine ingrandita.
  - Chiusura con tasto `ESC`, pulsante **X** o clic sullo sfondo.
- **Menu Hamburger Social (in alto a destra)**:
  - Icona animata in stile glassmorphism con morphing in "X".
  - Collegamenti diretti a **WhatsApp** e **Instagram**.
- **Accessibilità Completa**:
  - Navigazione integrale da tastiera (`Tab`, `Invio`, `Spazio`, `ESC`).
  - Etichette ARIA descrittive per screen reader.

---

## Struttura del Progetto

```text
WAU/
├── index.html       # Markup semantico a schermo intero e lightbox modale
├── style.css        # Stili CSS vanilla, glassmorphism, responsive e animazioni 60fps
├── script.js        # Motore trigonometrico, gestione eventi mouse/touch/tastiera
├── README.md        # Documentazione del progetto
└── images/          # Le 7 infografiche/slide della presentazione
    ├── node 1.jpg   # 01. Client e Server
    ├── node 2.jpg   # 02. Database
    ├── node 3.jpg   # 03. Interfaccia
    ├── node 4.jpg   # 04. Login e Permessi
    ├── node 5.jpg   # 05. Cosa è un'App?
    ├── node 6.jpg   # 06. Machine Learning
    └── node 7.jpg   # 07. LLM (Large Language Model)
```

---

## Avvio Rapido

È sufficiente aprire `index.html` in qualsiasi browser moderno oppure avviare un server locale:

```bash
# Con Python
python -m http.server 8080

# Con Node.js
npx serve .
```
