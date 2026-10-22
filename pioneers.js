/**
 * PIONIERI DELLA TECNOLOGIA - STRUTTURA A SERPENTE CON 5 CARD GIREVOLI & SPOTLIGHT MODAL
 * Pure Vanilla JavaScript (ES6+)
 *
 * 1. Linea 2D a serpente sinuosa con 5 nodi equidistanti
 * 2. Card sopra ogni nodo:
 *    - Click sull'immagine della card: apre la foto in grande nello Spotlight Modal
 *    - Click sullo spiralo in basso a destra: gira la card (3D flip) per mostrare la biografia
 *    - Click sullo spiralo del retro (o link dedicato): rigira la card per tornare alla foto
 * 3. Spotlight Hero Modal:
 *    - Ritratto ad alta risoluzione incorniciato con alone
 *    - Nome, ruolo e biografia completa
 *    - Frecce di navigazione avanti/indietro (e tasti freccia tastiera)
 *    - Chiusura con ESC, pulsante ✕ o click sullo sfondo
 */
(function () {
  'use strict';

  // ==========================================================================
  // DATI DEI PERSONAGGI
  // ==========================================================================
  const PIONEERS = [
    {
      name: 'Lisa Gelobter',
      role: 'Animazione web e video online',
      img: 'images/personaggi/Lisa_Gelobter_(cropped).jpg',
      bio: 'Figura fondamentale nello sviluppo dell’animazione web e delle prime tecnologie video online, ha contribuito a rendere Internet più dinamico, interattivo e vicino all’esperienza multimediale che conosciamo oggi.'
    },
    {
      name: 'Mark E. Dean',
      role: 'Personal computer · IBM',
      img: 'images/personaggi/Mark%20E.%20Dean.jpg',
      bio: 'Ingegnere informatico afroamericano di IBM, ha dato un contributo decisivo allo sviluppo del personal computer moderno e detiene diversi brevetti tecnologici che hanno segnato l’evoluzione dell’informatica.'
    },
    {
      name: 'Alan Emtage',
      role: 'Creatore di Archie',
      img: 'images/personaggi/Alan%20Emtage.jpg',
      bio: 'Innovatore delle Bahamas e creatore di Archie, uno dei primi strumenti di ricerca su Internet, ha anticipato il modo in cui oggi esploriamo e organizziamo le informazioni online.'
    },
    {
      name: 'Marian Croak',
      role: 'Tecnologia VoIP · Google',
      img: 'images/personaggi/Marian%20Croak.jpg',
      bio: 'Ingegnera afroamericana di Google, ha avuto un ruolo fondamentale nello sviluppo della tecnologia VoIP, rendendo possibili molte forme di comunicazione digitale contemporanee.'
    },
    {
      name: 'Philip Emeagwali',
      role: 'Parallel computing',
      img: 'images/personaggi/Philip%20Emeagwali.jpg',
      bio: 'Informatico e matematico nigeriano, ha contribuito in modo rilevante allo sviluppo del parallel computing, con impatti importanti sulla ricerca scientifica e sul calcolo ad alte prestazioni.'
    }
  ];

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const HORIZONTAL_BREAKPOINT = 1100; // Sotto questa larghezza il serpente diventa verticale
  const STEM = 26;                    // Distanza tra il nodo e il bordo inferiore della card

  // ==========================================================================
  // ELEMENTI DOM SEZIONE
  // ==========================================================================
  const sectionEl = document.getElementById('pioneers-section');
  const trackEl = document.getElementById('snake-track');
  if (!sectionEl || !trackEl) return;

  const svgEl = document.getElementById('snake-svg');
  const pathEl = document.getElementById('snake-path');
  const glowEl = document.getElementById('snake-path-glow');
  const stemsEl = document.getElementById('snake-stems');
  const gradientEl = document.getElementById('snake-gradient');
  const nodesEl = document.getElementById('snake-nodes');
  const cardsEl = document.getElementById('snake-cards');

  // Elementi Spotlight Modal
  const modalEl = document.getElementById('pioneer-modal');
  const modalBackdropEl = document.getElementById('pioneer-modal-backdrop');
  const modalCloseEl = document.getElementById('pioneer-modal-close');
  const modalPrevEl = document.getElementById('pioneer-modal-prev');
  const modalNextEl = document.getElementById('pioneer-modal-next');
  const modalImgEl = document.getElementById('pioneer-modal-img');
  const modalCountEl = document.getElementById('pioneer-modal-count');
  const modalRoleEl = document.getElementById('pioneer-modal-role');
  const modalNameEl = document.getElementById('pioneer-modal-name');
  const modalBioEl = document.getElementById('pioneer-modal-bio');

  const nodeEls = [];
  const cardEls = [];
  let currentModalIndex = 0;
  let lastTriggerEl = null;

  // ==========================================================================
  // 1. CREAZIONE NODI E CARD INTERATTIVE
  // ==========================================================================
  function createElements() {
    PIONEERS.forEach((p, i) => {
      // 1. Nodo sulla linea a serpente
      const node = document.createElement('span');
      node.className = 'snake-node';
      node.style.setProperty('--i', i);
      nodesEl.appendChild(node);
      nodeEls.push(node);

      // 2. Card del pioniere
      const card = document.createElement('div');
      card.className = 'pioneer-card';
      card.id = `pioneer-card-${i}`;
      card.style.setProperty('--i', i);

      card.innerHTML = `
        <div class="pioneer-card-inner">
          <!-- FRONTE: Foto del personaggio + Tasto spiralo -->
          <div class="pioneer-face pioneer-front">
            <!-- Tasto per aprire la foto in formato grande -->
            <button type="button" class="pioneer-photo-btn" aria-label="Ingrandisci ritratto di ${p.name}">
              <img src="${p.img}" alt="Ritratto di ${p.name}" loading="lazy" draggable="false">
              <span class="pioneer-zoom-badge" aria-hidden="true" title="Ingrandisci ritratto">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="7"></circle>
                  <line x1="21" y1="21" x2="16.5" y2="16.5"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </span>
            </button>

            <!-- Tasto Spiralo in basso a destra per girare la card -->
            <button type="button" class="pioneer-flip-btn" aria-label="Gira card per leggere la biografia di ${p.name}" title="Gira card (Biografia)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"></path>
                <polyline points="21 3 21 8 16 8"></polyline>
              </svg>
            </button>
          </div>

          <!-- RETRO: Nome, ruolo, biografia e tasto per rigirare -->
          <div class="pioneer-face pioneer-back">
            <span class="pioneer-index">${String(i + 1).padStart(2, '0')}</span>
            <span class="pioneer-name">${p.name}</span>
            <span class="pioneer-role">${p.role}</span>
            <span class="pioneer-divider" aria-hidden="true"></span>
            <span class="pioneer-bio">${p.bio}</span>

            <!-- Tasto rapido per vedere la foto in grande anche dal retro -->
            <button type="button" class="pioneer-back-zoom-btn" aria-label="Apri foto di ${p.name} in grande">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>Vedi foto in grande</span>
            </button>

            <!-- Spiralo di ritorno in basso a destra -->
            <button type="button" class="pioneer-flip-btn pioneer-flip-back-btn" aria-label="Rigira card e torna alla foto di ${p.name}" title="Torna alla foto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 1 2.64 6.36L3 16"></path>
                <polyline points="3 21 3 16 8 16"></polyline>
              </svg>
            </button>
          </div>
        </div>`;

      // Gestione Click: Apertura Foto in Grande
      const photoBtn = card.querySelector('.pioneer-photo-btn');
      photoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        lastTriggerEl = photoBtn;
        openPioneerModal(i);
      });

      // Gestione Click: Bottone foto dal retro
      const backZoomBtn = card.querySelector('.pioneer-back-zoom-btn');
      backZoomBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        lastTriggerEl = backZoomBtn;
        openPioneerModal(i);
      });

      // Gestione Click: Spiralo Fronte -> Gira la card
      const flipBtn = card.querySelector('.pioneer-flip-btn:not(.pioneer-flip-back-btn)');
      flipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCardFlip(i, true);
      });

      // Gestione Click: Spiralo Retro -> Rigira la card al fronte
      const flipBackBtn = card.querySelector('.pioneer-flip-back-btn');
      flipBackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCardFlip(i, false);
      });

      cardsEl.appendChild(card);
      cardEls.push(card);
    });
  }

  /**
   * Esegue la rotazione 3D della card e sincronizza lo stato del nodo
   */
  function toggleCardFlip(index, forceFlipped) {
    const card = cardEls[index];
    const node = nodeEls[index];
    if (!card) return;

    // Eleva temporaneamente lo z-index durante la rotazione per rimanere sempre in primo piano
    card.style.zIndex = '35';

    const isFlipped = (typeof forceFlipped === 'boolean') 
      ? card.classList.toggle('is-flipped', forceFlipped) 
      : card.classList.toggle('is-flipped');

    if (node) {
      node.classList.toggle('is-active', isFlipped);
    }

    // Al termine della transizione (800ms) consolida lo z-index
    setTimeout(() => {
      if (card.classList.contains('is-flipped')) {
        card.style.zIndex = '25';
      } else {
        card.style.zIndex = '';
      }
    }, 820);
  }

  // ==========================================================================
  // 2. SPOTLIGHT HERO MODAL (VISUALIZZAZIONE INGRANDITA + PROFILO)
  // ==========================================================================
  function openPioneerModal(index) {
    if (!modalEl) return;
    currentModalIndex = (index + PIONEERS.length) % PIONEERS.length;
    updateModalContent(currentModalIndex);

    modalEl.classList.add('is-open');
    modalEl.setAttribute('aria-hidden', 'false');

    // Focus per accessibilità
    setTimeout(() => {
      if (modalCloseEl) modalCloseEl.focus();
    }, 60);
  }

  function closePioneerModal() {
    if (!modalEl || !modalEl.classList.contains('is-open')) return;

    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');

    // Ripristina focus sull'elemento che ha aperto il modal
    if (lastTriggerEl) {
      lastTriggerEl.focus();
    }
  }

  function updateModalContent(index) {
    const p = PIONEERS[index];
    if (!p) return;

    modalImgEl.src = p.img;
    modalImgEl.alt = `Ritratto ad alta risoluzione di ${p.name}`;
    modalCountEl.textContent = `${String(index + 1).padStart(2, '0')} / ${String(PIONEERS.length).padStart(2, '0')}`;
    modalRoleEl.textContent = p.role;
    modalNameEl.textContent = p.name;
    modalBioEl.textContent = p.bio;
  }

  function nextPioneer() {
    currentModalIndex = (currentModalIndex + 1) % PIONEERS.length;
    updateModalContent(currentModalIndex);
  }

  function prevPioneer() {
    currentModalIndex = (currentModalIndex - 1 + PIONEERS.length) % PIONEERS.length;
    updateModalContent(currentModalIndex);
  }

  function setupModalEvents() {
    if (!modalEl) return;

    if (modalCloseEl) modalCloseEl.addEventListener('click', closePioneerModal);
    if (modalBackdropEl) modalBackdropEl.addEventListener('click', closePioneerModal);
    if (modalNextEl) modalNextEl.addEventListener('click', nextPioneer);
    if (modalPrevEl) modalPrevEl.addEventListener('click', prevPioneer);

    // Navigazione da tastiera nel modal
    window.addEventListener('keydown', (e) => {
      if (!modalEl.classList.contains('is-open')) return;

      if (e.key === 'Escape') {
        closePioneerModal();
      } else if (e.key === 'ArrowRight') {
        nextPioneer();
      } else if (e.key === 'ArrowLeft') {
        prevPioneer();
      }
    });
  }

  // ==========================================================================
  // 3. CALCOLO LAYOUT (ORIZZONTALE SU DESKTOP, VERTICALE SU SCHERMI STRETTI)
  // ==========================================================================
  function computeLayout(width) {
    const count = PIONEERS.length;
    const points = [];

    if (window.innerWidth >= HORIZONTAL_BREAKPOINT) {
      // Serpente orizzontale: i nodi alternano alto/basso
      const gap = 28;
      const cardW = Math.min(220, Math.floor((width - gap * (count - 1)) / count));
      const cardH = Math.round(cardW * 1.5);
      const amp = 46;
      const dx = (width - cardW) / (count - 1);
      const baseY = 12 + cardH + STEM + amp;

      for (let i = 0; i < count; i++) {
        points.push({ x: cardW / 2 + i * dx, y: baseY + (i % 2 === 0 ? -amp : amp) });
      }
      return { horizontal: true, cardW, cardH, points, height: baseY + amp + 48 };
    }

    // Serpente verticale: i nodi alternano sinistra/destra
    const cardW = Math.min(280, Math.round(width * 0.74));
    const cardH = Math.round(cardW * 1.3);
    const amp = Math.max(0, Math.min(80, (width - cardW) / 2 - 4));
    const step = cardH + STEM + 64;
    const firstY = 12 + cardH + STEM;

    for (let i = 0; i < count; i++) {
      points.push({ x: width / 2 + (i % 2 === 0 ? -amp : amp), y: firstY + i * step });
    }
    return { horizontal: false, cardW, cardH, points, height: points[count - 1].y + 48 };
  }

  /**
   * Costruisce il path SVG: ogni tratto è una curva di Bézier con tangenti
   * parallele all'asse del serpente, quindi tutti i tratti hanno la stessa lunghezza.
   */
  function buildPath(points, horizontal) {
    const r = (n) => Math.round(n * 10) / 10;
    let d = `M ${r(points[0].x)} ${r(points[0].y)}`;

    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      if (horizontal) {
        const h = (b.x - a.x) / 2;
        d += ` C ${r(a.x + h)} ${r(a.y)}, ${r(b.x - h)} ${r(b.y)}, ${r(b.x)} ${r(b.y)}`;
      } else {
        const v = (b.y - a.y) / 2;
        d += ` C ${r(a.x)} ${r(a.y + v)}, ${r(b.x)} ${r(b.y - v)}, ${r(b.x)} ${r(b.y)}`;
      }
    }
    return d;
  }

  function layout() {
    const width = trackEl.clientWidth;
    if (!width) return;

    const L = computeLayout(width);
    trackEl.style.height = `${L.height}px`;
    trackEl.classList.toggle('is-vertical', !L.horizontal);

    // SVG a dimensione reale del contenitore
    svgEl.setAttribute('width', width);
    svgEl.setAttribute('height', L.height);
    svgEl.setAttribute('viewBox', `0 0 ${width} ${L.height}`);

    // Linea del serpente
    const d = buildPath(L.points, L.horizontal);
    pathEl.setAttribute('d', d);
    glowEl.setAttribute('d', d);
    trackEl.style.setProperty('--snake-len', Math.ceil(pathEl.getTotalLength()));

    // Gradiente orientato lungo la direzione del serpente
    gradientEl.setAttribute('x2', L.horizontal ? '1' : '0');
    gradientEl.setAttribute('y2', L.horizontal ? '0' : '1');

    // Nodi, card e connettori
    stemsEl.innerHTML = '';
    L.points.forEach((p, i) => {
      const node = nodeEls[i];
      node.style.left = `${p.x}px`;
      node.style.top = `${p.y}px`;

      const card = cardEls[i];
      card.style.left = `${p.x - L.cardW / 2}px`;
      card.style.top = `${p.y - STEM - L.cardH}px`;
      card.style.width = `${L.cardW}px`;
      card.style.height = `${L.cardH}px`;
      card.style.setProperty('--card-w', `${L.cardW}px`);

      const stem = document.createElementNS(SVG_NS, 'line');
      stem.setAttribute('class', 'snake-stem');
      stem.setAttribute('x1', p.x);
      stem.setAttribute('y1', p.y - 11);
      stem.setAttribute('x2', p.x);
      stem.setAttribute('y2', p.y - STEM);
      stemsEl.appendChild(stem);
    });
  }

  // ==========================================================================
  // 4. ANIMAZIONE DI INGRESSO ALLO SCROLL
  // ==========================================================================
  function setupReveal() {
    if (!('IntersectionObserver' in window)) {
      sectionEl.classList.add('is-visible');
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          sectionEl.classList.add('is-visible');
          observer.disconnect();
        }
      });
    }, { threshold: 0.15 });
    observer.observe(trackEl);
  }

  // ==========================================================================
  // AVVIO
  // ==========================================================================
  function init() {
    createElements();
    setupModalEvents();
    layout();
    setupReveal();

    // Ricalcolo quando cambia la larghezza del contenitore
    let rafId = null;
    const scheduleLayout = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(layout);
    };
    if ('ResizeObserver' in window) {
      new ResizeObserver(scheduleLayout).observe(trackEl);
    }
    window.addEventListener('resize', scheduleLayout);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
