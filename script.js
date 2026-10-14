/**
 * PRESENTAZIONE CONFERENZA - MAPPA MENTALE CIRCOLARE (7 NODI)
 * Pure Vanilla JavaScript (ES6+)
 * 
 * Configurazione, posizionamento trigonometrico, zoom/pan su stage,
 * interazione hover e lightbox con zoom avanzato.
 */

// ============================================================================
// CONFIGURAZIONE IMMAGINI (I 7 nodi della presentazione)
// ============================================================================
const NODES_DATA = [
  {
    id: 1,
    src: 'images/node 1.jpg',
    alt: '01 - Client e Server: Richiesta e Risposta',
    title: '01. Client e Server'
  },
  {
    id: 2,
    src: 'images/node 2.jpg',
    alt: '02 - Database: Tabelle ed Entità collegate',
    title: '02. Database'
  },
  {
    id: 3,
    src: 'images/node 3.jpg',
    alt: '03 - Interfaccia: Front-End e Back-End',
    title: '03. Interfaccia'
  },
  {
    id: 4,
    src: 'images/node 4.jpg',
    alt: '04 - Login e Permessi: Autenticazione e Autorizzazioni',
    title: '04. Login e Permessi'
  },
  {
    id: 5,
    src: 'images/node 5.jpg',
    alt: '05 - Cosa è un\'App?',
    title: '05. Cosa è un\'App?'
  },
  {
    id: 6,
    src: 'images/node 6.jpg',
    alt: '06 - Machine Learning: Regole vs Modelli di Pattern',
    title: '06. Machine Learning'
  },
  {
    id: 7,
    src: 'images/node 7.jpg',
    alt: '07 - LLM: Reti Neurali e Modelli Linguistici',
    title: '07. LLM (Large Language Model)'
  }
];

// ============================================================================
// STATO DELL'APPLICAZIONE (STAGE ZOOM & PAN)
// ============================================================================
const state = {
  // Parametri di trasformazione dello stage principale
  zoom: 1.0,
  minZoom: 0.5,
  maxZoom: 3.0,
  panX: 0,
  panY: 0,
  
  // Tracciamento del drag / pan
  isPointerDown: false,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  startPanX: 0,
  startPanY: 0,
  dragDistance: 0,

  // Tracciamento gesture multi-touch (pinch-to-zoom)
  activeTouches: new Map(),
  initialPinchDist: 0,
  initialPinchZoom: 1.0,

  // Ultimo elemento focalizzato per accessibilità
  lastActiveNode: null,

  // Stato zoom/pan interno al Lightbox
  lightbox: {
    isOpen: false,
    zoom: 1.0,
    minZoom: 1.0,
    maxZoom: 4.0,
    panX: 0,
    panY: 0,
    isPointerDown: false,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    startPanX: 0,
    startPanY: 0
  }
};

// ============================================================================
// ELEMENTI DOM
// ============================================================================
const viewportEl = document.getElementById('app-viewport');
const stageEl = document.getElementById('mindmap-stage');
const nodesContainerEl = document.getElementById('nodes-container');
const ringPolygonEl = document.getElementById('ring-polygon');
const jointsGroupEl = document.getElementById('joints-group');

const lightboxEl = document.getElementById('lightbox');
const lightboxBackdropEl = document.getElementById('lightbox-backdrop');
const lightboxCloseEl = document.getElementById('lightbox-close');
const lightboxImgEl = document.getElementById('lightbox-image');
const lightboxCaptionEl = document.getElementById('lightbox-caption');
const lightboxImgBoxEl = document.getElementById('lightbox-image-box');

// Elementi Menu Hamburger Social
const socialNavEl = document.getElementById('social-nav');
const hamburgerBtnEl = document.getElementById('hamburger-btn');
const socialMenuEl = document.getElementById('social-menu');

function toggleSocialMenu() {
  if (!socialNavEl) return;
  const isOpen = socialNavEl.classList.toggle('is-open');
  if (hamburgerBtnEl) {
    hamburgerBtnEl.setAttribute('aria-expanded', String(isOpen));
  }
}

function closeSocialMenu() {
  if (!socialNavEl) return;
  socialNavEl.classList.remove('is-open');
  if (hamburgerBtnEl) {
    hamburgerBtnEl.setAttribute('aria-expanded', 'false');
  }
}

// ============================================================================
// 1. INIZIALIZZAZIONE & CALCOLO TRIGONOMETRICO DEI NODI (7 CERCHI)
// ============================================================================

/**
 * Calcola le dimensioni e le coordinate (x, y) dei 7 cerchi
 * disposti uniformemente su una circonferenza immaginaria (~51.4° ciascuno).
 */
function layoutRing() {
  const count = NODES_DATA.length; // 7
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const minDim = Math.min(vw, vh);

  // Raggio responsive proporzionato alla finestra
  // ~35% della dimensione minima, bilanciato tra schermi piccoli e 4K
  const radius = Math.max(130, Math.min(380, minDim * 0.34));
  const nodeSize = Math.max(68, Math.min(130, minDim * 0.135));

  // Imposta la variabile CSS per il diametro dei cerchi
  document.documentElement.style.setProperty('--node-size', `${nodeSize}px`);

  // Angolo di partenza: -PI/2 (-90°) per posizionare il nodo 1 in alto al centro (12 o'clock)
  const startAngle = -Math.PI / 2;
  const angleStep = (2 * Math.PI) / count; // 360° / 7 ≈ 51.42857°

  const points = [];
  jointsGroupEl.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const angle = startAngle + i * angleStep;
    const x = Math.round(Math.cos(angle) * radius * 10) / 10;
    const y = Math.round(Math.sin(angle) * radius * 10) / 10;
    points.push({ x, y });

    // Aggiorna posizione elemento DOM del nodo
    const wrapper = document.getElementById(`node-wrap-${i}`);
    if (wrapper) {
      wrapper.style.transform = `translate(${x}px, ${y}px)`;
    }

    // Aggiungi piccolo punto di giunzione sull'SVG
    const jointCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    jointCircle.setAttribute('cx', x);
    jointCircle.setAttribute('cy', y);
    jointCircle.setAttribute('r', '3');
    jointCircle.setAttribute('class', 'joint-point');
    jointsGroupEl.appendChild(jointCircle);
  }

  // Genera punti del poligono SVG per l'anello chiuso
  const polygonPointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
  ringPolygonEl.setAttribute('points', polygonPointsStr);
}

/**
 * Crea gli elementi DOM dei 7 nodi al primo avvio
 */
function createNodeElements() {
  nodesContainerEl.innerHTML = '';

  NODES_DATA.forEach((data, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'node-wrapper';
    wrapper.id = `node-wrap-${index}`;

    // Tag <button> accessibile con tastiera e screen reader
    const button = document.createElement('button');
    button.className = 'node-btn';
    button.type = 'button';
    button.setAttribute('data-index', index);
    button.setAttribute('aria-label', `Apri dettaglio per ${data.title}`);
    button.setAttribute('tabindex', '0');

    // Immagine ritagliata a cerchio
    const img = document.createElement('img');
    img.src = data.src;
    img.alt = data.alt;
    img.loading = 'eager';

    // Badge numerico elegante
    const badge = document.createElement('span');
    badge.className = 'node-badge';
    badge.textContent = `${index + 1}`;

    button.appendChild(img);
    button.appendChild(badge);
    wrapper.appendChild(button);
    nodesContainerEl.appendChild(wrapper);

    // Evento click per apertura lightbox (controlla che non fosse un drag)
    button.addEventListener('click', (e) => {
      if (state.dragDistance > 6) {
        // Se l'utente stava trascinando lo stage, non aprire
        return;
      }
      openLightbox(index);
    });
  });
}

// ============================================================================
// 2. ZOOM & PAN SULL'INTERO ANELLO (STAGE)
// ============================================================================

/**
 * Applica la trasformazione allo stage con hardware acceleration
 */
function updateStageTransform(smooth = false) {
  if (smooth) {
    stageEl.style.transition = 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)';
    setTimeout(() => {
      stageEl.style.transition = 'none';
    }, 320);
  } else {
    stageEl.style.transition = 'none';
  }
  stageEl.style.transform = `translate3d(${state.panX}px, ${state.panY}px, 0) scale(${state.zoom})`;
}

/**
 * Zoom sull'anello centrato sul puntatore del mouse
 */
function handleViewportWheel(e) {
  if (state.lightbox.isOpen) return; // Se lightbox è aperta, non zoomare lo stage
  e.preventDefault();

  const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
  const newZoom = Math.min(state.maxZoom, Math.max(state.minZoom, state.zoom * zoomFactor));

  if (newZoom === state.zoom) return;

  // Coordinate del mouse relative al centro della finestra
  const mx = e.clientX - window.innerWidth / 2;
  const my = e.clientY - window.innerHeight / 2;

  // Aggiustamento pan per zoomare verso il cursore
  state.panX = mx - (mx - state.panX) * (newZoom / state.zoom);
  state.panY = my - (my - state.panY) * (newZoom / state.zoom);
  state.zoom = newZoom;

  updateStageTransform(false);
}

/**
 * Gestione Drag & Pan dello Stage con Mouse
 */
function handlePointerDown(e) {
  if (state.lightbox.isOpen) return;
  if (e.target.closest('#social-nav')) return;
  // Solo tasto primario del mouse
  if (e.button !== 0) return;

  state.isPointerDown = true;
  state.isDragging = false;
  state.dragDistance = 0;
  state.dragStartX = e.clientX;
  state.dragStartY = e.clientY;
  state.startPanX = state.panX;
  state.startPanY = state.panY;
}

function handlePointerMove(e) {
  if (!state.isPointerDown || state.lightbox.isOpen) return;

  const dx = e.clientX - state.dragStartX;
  const dy = e.clientY - state.dragStartY;
  state.dragDistance = Math.hypot(dx, dy);

  if (state.dragDistance > 4) {
    state.isDragging = true;
    viewportEl.classList.add('is-dragging');
  }

  if (state.isDragging) {
    state.panX = state.startPanX + dx;
    state.panY = state.startPanY + dy;
    updateStageTransform(false);
  }
}

function handlePointerUp() {
  if (state.isPointerDown) {
    state.isPointerDown = false;
    viewportEl.classList.remove('is-dragging');
  }
}

/**
 * Reset allo stato iniziale (Doppio Click sullo sfondo)
 */
function handleViewportDoubleClick(e) {
  if (state.lightbox.isOpen) return;
  // Se il doppio click è avvenuto direttamente su un cerchio, ignora
  if (e.target.closest('.node-btn')) return;

  state.zoom = 1.0;
  state.panX = 0;
  state.panY = 0;
  updateStageTransform(true);
}

// Gestione Touch / Pinch-to-zoom su Mobile/Tablet
function handleTouchStart(e) {
  if (state.lightbox.isOpen) return;
  if (e.target.closest('#social-nav')) return;

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    state.activeTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
  }

  if (state.activeTouches.size === 1) {
    const t = e.changedTouches[0];
    state.dragStartX = t.clientX;
    state.dragStartY = t.clientY;
    state.startPanX = state.panX;
    state.startPanY = state.panY;
    state.dragDistance = 0;
  } else if (state.activeTouches.size === 2) {
    const touches = Array.from(state.activeTouches.values());
    state.initialPinchDist = Math.hypot(touches[0].x - touches[1].x, touches[0].y - touches[1].y);
    state.initialPinchZoom = state.zoom;
  }
}

function handleTouchMove(e) {
  if (state.lightbox.isOpen) return;
  e.preventDefault();

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    state.activeTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
  }

  if (state.activeTouches.size === 1) {
    const t = e.changedTouches[0];
    const dx = t.clientX - state.dragStartX;
    const dy = t.clientY - state.dragStartY;
    state.dragDistance = Math.hypot(dx, dy);

    state.panX = state.startPanX + dx;
    state.panY = state.startPanY + dy;
    updateStageTransform(false);
  } else if (state.activeTouches.size === 2) {
    const touches = Array.from(state.activeTouches.values());
    const currentDist = Math.hypot(touches[0].x - touches[1].x, touches[0].y - touches[1].y);
    if (state.initialPinchDist > 0) {
      const scale = currentDist / state.initialPinchDist;
      state.zoom = Math.min(state.maxZoom, Math.max(state.minZoom, state.initialPinchZoom * scale));
      updateStageTransform(false);
    }
  }
}

function handleTouchEnd(e) {
  for (let i = 0; i < e.changedTouches.length; i++) {
    state.activeTouches.delete(e.changedTouches[i].identifier);
  }
}

// ============================================================================
// 3. LIGHTBOX CON SFONDO SCURITO, SFOCATO E ZOOM INTERNO
// ============================================================================

/**
 * Apre la lightbox sul nodo selezionato
 */
function openLightbox(index) {
  const data = NODES_DATA[index];
  if (!data) return;

  closeSocialMenu();
  state.lastActiveNode = document.querySelector(`.node-btn[data-index="${index}"]`);
  state.lightbox.isOpen = true;
  state.lightbox.zoom = 1.0;
  state.lightbox.panX = 0;
  state.lightbox.panY = 0;

  lightboxImgEl.src = data.src;
  lightboxImgEl.alt = data.alt;
  lightboxCaptionEl.textContent = data.title;
  updateLightboxImageTransform(false);

  lightboxEl.classList.add('is-open');
  lightboxEl.setAttribute('aria-hidden', 'false');

  // Focalizza il pulsante di chiusura per accessibilità
  setTimeout(() => {
    lightboxCloseEl.focus();
  }, 50);
}

/**
 * Chiude la lightbox e ripristina il focus
 */
function closeLightbox() {
  if (!state.lightbox.isOpen) return;

  state.lightbox.isOpen = false;
  lightboxEl.classList.remove('is-open');
  lightboxEl.setAttribute('aria-hidden', 'true');

  // Resetta zoom immagine
  state.lightbox.zoom = 1.0;
  state.lightbox.panX = 0;
  state.lightbox.panY = 0;
  updateLightboxImageTransform(false);

  // Ritorna il focus al nodo precedentemente attivo
  if (state.lastActiveNode) {
    state.lastActiveNode.focus();
  }
}

/**
 * Applica trasformazione zoom/pan all'immagine della lightbox
 */
function updateLightboxImageTransform(smooth = false) {
  if (smooth) {
    lightboxImgEl.style.transition = 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)';
    setTimeout(() => {
      lightboxImgEl.style.transition = 'none';
    }, 250);
  } else {
    lightboxImgEl.style.transition = 'none';
  }

  lightboxImgEl.style.transform = `translate3d(${state.lightbox.panX}px, ${state.lightbox.panY}px, 0) scale(${state.lightbox.zoom})`;

  if (state.lightbox.zoom > 1.02) {
    lightboxImgEl.classList.add('is-zoomed');
  } else {
    lightboxImgEl.classList.remove('is-zoomed');
  }
}

/**
 * Zoom all'interno della lightbox (rotella del mouse)
 */
function handleLightboxWheel(e) {
  if (!state.lightbox.isOpen) return;
  e.preventDefault();

  const factor = e.deltaY < 0 ? 1.15 : 0.87;
  const newZoom = Math.min(state.lightbox.maxZoom, Math.max(state.lightbox.minZoom, state.lightbox.zoom * factor));

  state.lightbox.zoom = newZoom;

  // Se torna a 1x, resetta il pan
  if (newZoom <= 1.01) {
    state.lightbox.panX = 0;
    state.lightbox.panY = 0;
  }

  updateLightboxImageTransform(false);
}

/**
 * Pan dell'immagine ingrandita nella Lightbox
 */
function handleLightboxImgPointerDown(e) {
  if (state.lightbox.zoom <= 1.02) return;
  if (e.button !== 0) return;

  state.lightbox.isPointerDown = true;
  state.lightbox.dragStartX = e.clientX;
  state.lightbox.dragStartY = e.clientY;
  state.lightbox.startPanX = state.lightbox.panX;
  state.lightbox.startPanY = state.lightbox.panY;
  e.stopPropagation();
}

function handleLightboxImgPointerMove(e) {
  if (!state.lightbox.isPointerDown) return;
  const dx = e.clientX - state.lightbox.dragStartX;
  const dy = e.clientY - state.lightbox.dragStartY;

  state.lightbox.panX = state.lightbox.startPanX + dx;
  state.lightbox.panY = state.lightbox.startPanY + dy;
  updateLightboxImageTransform(false);
  e.stopPropagation();
}

function handleLightboxImgPointerUp() {
  state.lightbox.isPointerDown = false;
}

function handleLightboxImgDoubleClick(e) {
  e.stopPropagation();
  if (state.lightbox.zoom > 1.05) {
    state.lightbox.zoom = 1.0;
    state.lightbox.panX = 0;
    state.lightbox.panY = 0;
  } else {
    state.lightbox.zoom = 2.0;
  }
  updateLightboxImageTransform(true);
}

// ============================================================================
// EVENT LISTENERS & INIZIALIZZAZIONE
// ============================================================================

function setupEventListeners() {
  // Resize finestra
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      layoutRing();
    }, 60);
  });

  // Zoom stage (rotella)
  viewportEl.addEventListener('wheel', handleViewportWheel, { passive: false });

  // Pan stage (mouse)
  viewportEl.addEventListener('mousedown', handlePointerDown);
  window.addEventListener('mousemove', handlePointerMove);
  window.addEventListener('mouseup', handlePointerUp);

  // Reset stage (doppio click sullo sfondo)
  viewportEl.addEventListener('dblclick', handleViewportDoubleClick);

  // Touch stage
  viewportEl.addEventListener('touchstart', handleTouchStart, { passive: true });
  viewportEl.addEventListener('touchmove', handleTouchMove, { passive: false });
  viewportEl.addEventListener('touchend', handleTouchEnd, { passive: true });
  viewportEl.addEventListener('touchcancel', handleTouchEnd, { passive: true });

  // Lightbox chiusura
  lightboxBackdropEl.addEventListener('click', closeLightbox);
  lightboxCloseEl.addEventListener('click', closeLightbox);

  // Chiusura con click esterno alla figura
  lightboxEl.addEventListener('click', (e) => {
    if (e.target === lightboxEl || e.target.classList.contains('lightbox-wrapper')) {
      closeLightbox();
    }
  });

  // Menu Hamburger Social
  if (hamburgerBtnEl) {
    hamburgerBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSocialMenu();
    });
  }

  // Chiusura menu social al click su un link
  if (socialMenuEl) {
    socialMenuEl.addEventListener('click', (e) => {
      if (e.target.closest('.social-item')) {
        closeSocialMenu();
      }
    });
  }

  // Chiusura menu social se si clicca all'esterno
  window.addEventListener('click', (e) => {
    if (socialNavEl && socialNavEl.classList.contains('is-open')) {
      if (!socialNavEl.contains(e.target)) {
        closeSocialMenu();
      }
    }
  });

  // Tasto ESC per chiusura menu social o lightbox
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (socialNavEl && socialNavEl.classList.contains('is-open')) {
        closeSocialMenu();
      }
      if (state.lightbox.isOpen) {
        closeLightbox();
      }
    }
  });

  // Lightbox Zoom & Pan su immagine
  lightboxEl.addEventListener('wheel', handleLightboxWheel, { passive: false });
  lightboxImgEl.addEventListener('mousedown', handleLightboxImgPointerDown);
  window.addEventListener('mousemove', handleLightboxImgPointerMove);
  window.addEventListener('mouseup', handleLightboxImgPointerUp);
  lightboxImgEl.addEventListener('dblclick', handleLightboxImgDoubleClick);
}

// Avvio applicazione
document.addEventListener('DOMContentLoaded', () => {
  createNodeElements();
  layoutRing();
  setupEventListeners();
  updateStageTransform(false);
});
