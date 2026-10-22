/**
 * BRAIN 3D - Motore neurale 3D interattivo con Three.js
 * 
 * Genera proceduralmente un cervello con:
 * - 2 emisferi cerebrali separati da fessura longitudinale
 * - Lobi frontali, temporali, occipitali, cervelletto e solchi/giri corticali
 * - Nube di neuroni e sinapsi con impulsi bioelettrici (potenziali d'azione)
 * - Mesh olografica corticale semi-trasparente
 * - 7 terminali assonici collegati ai 7 nodi della presentazione
 * - Parallasse mouse/touch, reazione all'hover dei nodi e shockwave al click
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Brain3D = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Configurazione principale
  const CONFIG = {
    neuronCount: 1500,
    maxAxonDist: 0.22,
    maxAxonsPerNeuron: 3,
    sparkCount: 26,
    baseRotationSpeed: 0.0035,
    cameraZ: 3.7,
    fov: 44
  };

  class BrainEngine {
    constructor() {
      this.canvas = null;
      this.wrapper = null;
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.brainGroup = null;

      // Componenti 3D
      this.pointsGeometry = null;
      this.pointsMaterial = null;
      this.pointsMesh = null;

      this.linesGeometry = null;
      this.linesMaterial = null;
      this.linesMesh = null;

      this.sparksMesh = null;
      this.sparksData = [];

      this.coreMesh = null;
      this.wireframeMesh = null;
      this.anchorNodes = [];

      // Dati geometrici originali
      this.originalPositions = null;
      this.pulsePhases = null;
      this.pulseSpeeds = null;
      this.neuronHemispheres = null;

      // Stato animazione & interazione
      this.width = 240;
      this.height = 240;
      this.isRunning = false;
      this.animId = null;
      this.clock = null;

      this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
      this.hoveredNodeIndex = -1;
      this.targetAngleOffset = 0;
      this.currentAngleOffset = 0;

      // Effetto shockwave
      this.shockwaveActive = false;
      this.shockwaveProgress = 0;

      this._onMouseMove = this._onMouseMove.bind(this);
    }

    /**
     * Inizializza il motore 3D sul canvas specificato
     */
    init(canvasEl, wrapperEl, initialSize = 240) {
      if (!canvasEl || typeof THREE === 'undefined') {
        console.warn('Brain3D: Three.js non trovato o canvas non valido');
        return false;
      }

      this.canvas = canvasEl;
      this.wrapper = wrapperEl;
      this.width = initialSize;
      this.height = initialSize;
      this.clock = new THREE.Clock();

      // 1. Renderer WebGL ad alte prestazioni con trasparenza
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.renderer.setPixelRatio(dpr);
      this.renderer.setSize(this.width, this.height, false);

      // 2. Scena e Gruppo Principale
      this.scene = new THREE.Scene();
      this.brainGroup = new THREE.Group();
      this.scene.add(this.brainGroup);

      // 3. Camera Prospettica
      this.camera = new THREE.PerspectiveCamera(CONFIG.fov, 1, 0.1, 100);
      this.camera.position.set(0, 0.15, CONFIG.cameraZ);
      this.camera.lookAt(0, 0, 0);

      // 4. Illuminazione interna ed esterna
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);

      const cyanLight = new THREE.PointLight(0x38bdf8, 2.0, 10);
      cyanLight.position.set(-2, 1.5, 2);
      this.scene.add(cyanLight);

      const purpleLight = new THREE.PointLight(0xc084fc, 2.0, 10);
      purpleLight.position.set(2, -1, 1.5);
      this.scene.add(purpleLight);

      // 5. Generazione dei componenti del cervello
      this._buildBrainProcedural();
      this._buildHologramWireframe();
      this._buildCoreNucleus();
      this._buildSparks();
      this._buildAnchorTerminals();

      // 6. Eventi per interazione mouse/tilt
      window.addEventListener('mousemove', this._onMouseMove, { passive: true });

      // 7. Avvio ciclo di render a 60fps
      this.start();
      return true;
    }

    /**
     * Texture circolare morbida per i punti neurone
     */
    _createNeuronTexture() {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      const center = size / 2;
      const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.25, 'rgba(180, 230, 255, 0.9)');
      grad.addColorStop(0.6, 'rgba(56, 189, 248, 0.4)');
      grad.addColorStop(1, 'rgba(14, 165, 233, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    }

    /**
     * Costruisce proceduralmente la geometria anatomica del cervello
     */
    _buildBrainProcedural() {
      const count = CONFIG.neuronCount;
      const positions = new Float32Array(count * 3);
      const originalPositions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const pulsePhases = new Float32Array(count);
      const pulseSpeeds = new Float32Array(count);
      const hemispheres = new Float32Array(count);

      const pointsArray = [];

      // Palette colori neuroni (gradiente da Ciano a Viola/Magenta con variazioni)
      const colorCyan = new THREE.Color(0x38bdf8);
      const colorDeepCyan = new THREE.Color(0x06b6d4);
      const colorPurple = new THREE.Color(0xc084fc);
      const colorPink = new THREE.Color(0xf472b6);
      const colorWhite = new THREE.Color(0xffffff);

      for (let i = 0; i < count; i++) {
        // Distribuzione uniforme a spirale sferica (Fibonacci lattice)
        const s = (i + 0.5) / count;
        const theta = Math.acos(1 - 2 * s);
        const phi = Math.PI * (1 + Math.sqrt(5)) * i;

        let nx = Math.sin(theta) * Math.cos(phi);
        let ny = Math.cos(theta);
        let nz = Math.sin(theta) * Math.sin(phi);

        const sign = nx >= 0 ? 1 : -1;
        hemispheres[i] = sign;
        let absX = Math.abs(nx);

        // 1. Fessura longitudinale centrale (solco interemisferico)
        const fissureIndent = Math.exp(-Math.pow(absX / 0.14, 2)) * Math.max(0, ny + 0.35);
        absX = absX * (1.0 - 0.38 * fissureIndent) + 0.055;

        // 2. Lobo temporale (rigonfiamento laterale inferiore)
        const temporal = Math.exp(-Math.pow((nz - 0.1) / 0.45, 2)) * Math.exp(-Math.pow((ny + 0.3) / 0.35, 2)) * 0.22;

        // 3. Cervelletto (due protuberanze rotonde alla base posteriore)
        const isCerebellum = (nz < -0.25 && ny < -0.15);
        const cerebellum = isCerebellum ? Math.exp(-Math.pow((nz + 0.65) / 0.35, 2)) * Math.exp(-Math.pow((ny + 0.45) / 0.3, 2)) * 0.32 : 0;

        // 4. Lobo frontale (profilo arrotondato anteriore)
        const frontal = (nz > 0.2) ? 0.08 * (1.0 - ny * ny) : 0;

        // 5. Solchi e giri corticali (convoluzioni della corteccia)
        const gyri = (
          Math.sin(nx * 10.0 + nz * 5.0) * Math.cos(ny * 9.0) +
          Math.sin(ny * 11.0 + nx * 7.0) * Math.cos(nz * 10.0) +
          Math.sin(nz * 12.0 + ny * 8.0) * Math.cos(nx * 9.0)
        ) * 0.06;

        const radialMod = 1.0 + temporal + cerebellum + frontal + gyri;

        // Distribuzione volumetrica: 80% sulla superficie corticale, 20% neuroni interni profondi
        const isSurface = i % 5 !== 0;
        const depth = isSurface ? (0.95 + 0.07 * (Math.random() - 0.5)) : (0.42 + 0.48 * Math.random());

        // Coordinate scalate secondo proporzioni biologiche umane
        const x = sign * absX * 0.96 * radialMod * depth;
        const y = (ny * 0.90 + 0.08) * radialMod * depth;
        const z = nz * 1.20 * radialMod * depth;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        originalPositions[i * 3] = x;
        originalPositions[i * 3 + 1] = y;
        originalPositions[i * 3 + 2] = z;

        pointsArray.push({ x, y, z, index: i });

        // Calcolo colore per neurone
        const tempColor = new THREE.Color();
        if (sign < 0) {
          // Emisfero sinistro: ciano/azzurro tecnologico
          tempColor.lerpColors(colorDeepCyan, colorCyan, (y + 1) * 0.5);
        } else {
          // Emisfero destro: viola/magenta creativo
          tempColor.lerpColors(colorPurple, colorPink, (y + 1) * 0.5);
        }

        // Se vicino alla fessura o polo frontale, tocco brillante di bianco/ciano
        if (absX < 0.15 || nz > 0.9) {
          tempColor.lerp(colorWhite, 0.35);
        }

        colors[i * 3] = tempColor.r;
        colors[i * 3 + 1] = tempColor.g;
        colors[i * 3 + 2] = tempColor.b;

        sizes[i] = isSurface ? (0.055 + Math.random() * 0.035) : (0.04 + Math.random() * 0.025);
        pulsePhases[i] = Math.random() * Math.PI * 2;
        pulseSpeeds[i] = 1.5 + Math.random() * 2.5;
      }

      this.originalPositions = originalPositions;
      this.pulsePhases = pulsePhases;
      this.pulseSpeeds = pulseSpeeds;
      this.neuronHemispheres = hemispheres;

      // Creazione BufferGeometry per la nuvola di punti neurale
      this.pointsGeometry = new THREE.BufferGeometry();
      this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      this.pointsMaterial = new THREE.PointsMaterial({
        size: 0.085,
        map: this._createNeuronTexture(),
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      this.pointsMesh = new THREE.Points(this.pointsGeometry, this.pointsMaterial);
      this.brainGroup.add(this.pointsMesh);

      // 6. Costruzione degli Assoni (connessioni tra neuroni vicini)
      this._buildAxons(pointsArray, colors);
    }

    /**
     * Collega i neuroni vicini tramite segmenti di linea (assoni sinaptici)
     */
    _buildAxons(pointsArray, neuronColors) {
      const count = pointsArray.length;
      const maxDist2 = CONFIG.maxAxonDist * CONFIG.maxAxonDist;
      const connectionsCount = new Uint8Array(count);
      const lineIndices = [];

      for (let i = 0; i < count; i++) {
        if (connectionsCount[i] >= CONFIG.maxAxonsPerNeuron) continue;
        const p1 = pointsArray[i];

        for (let j = i + 1; j < count; j++) {
          if (connectionsCount[j] >= CONFIG.maxAxonsPerNeuron) continue;
          const p2 = pointsArray[j];

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dz = p1.z - p2.z;
          const d2 = dx * dx + dy * dy + dz * dz;

          if (d2 < maxDist2) {
            lineIndices.push(i, j);
            connectionsCount[i]++;
            connectionsCount[j]++;
            if (connectionsCount[i] >= CONFIG.maxAxonsPerNeuron) break;
          }
        }
      }

      const lineCount = lineIndices.length;
      const linePositions = new Float32Array(lineCount * 3);
      const lineColors = new Float32Array(lineCount * 3);

      for (let k = 0; k < lineCount; k++) {
        const pointIdx = lineIndices[k];
        linePositions[k * 3] = this.originalPositions[pointIdx * 3];
        linePositions[k * 3 + 1] = this.originalPositions[pointIdx * 3 + 1];
        linePositions[k * 3 + 2] = this.originalPositions[pointIdx * 3 + 2];

        lineColors[k * 3] = neuronColors[pointIdx * 3] * 0.75;
        lineColors[k * 3 + 1] = neuronColors[pointIdx * 3 + 1] * 0.75;
        lineColors[k * 3 + 2] = neuronColors[pointIdx * 3 + 2] * 0.75;
      }

      this.linesGeometry = new THREE.BufferGeometry();
      this.linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      this.linesGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

      this.linesMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      this.linesMesh = new THREE.LineSegments(this.linesGeometry, this.linesMaterial);
      this.brainGroup.add(this.linesMesh);

      // Conserva gli indici delle coppie per gli impulsi elettrici (sparks)
      this.linePairs = lineIndices;
    }

    /**
     * Scaffolding olografico corticale (mesh wireframe sottile degli emisferi)
     */
    _buildHologramWireframe() {
      // Due sfere deformate per i due emisferi
      const hemisphereGeom = new THREE.IcosahedronGeometry(0.85, 2);
      const pos = hemisphereGeom.attributes.position;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        // Deforma secondo la sagoma del cervello
        x = x * 1.05;
        y = y * 0.95 + 0.05;
        z = z * 1.25;

        pos.setXYZ(i, x, y, z);
      }
      hemisphereGeom.computeVertexNormals();

      const wireMaterial = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending
      });

      this.wireframeMesh = new THREE.Mesh(hemisphereGeom, wireMaterial);
      this.wireframeMesh.scale.set(0.92, 0.92, 0.92);
      this.brainGroup.add(this.wireframeMesh);
    }

    /**
     * Nucleo talamico centrale pulsante di energia
     */
    _buildCoreNucleus() {
      const coreGeom = new THREE.SphereGeometry(0.32, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending
      });
      this.coreMesh = new THREE.Mesh(coreGeom, coreMat);
      this.brainGroup.add(this.coreMesh);
    }

    /**
     * Costruisce particelle che simulano i potenziali d'azione (scintille lungo gli assoni)
     */
    _buildSparks() {
      if (!this.linePairs || this.linePairs.length < 2) return;

      const sparkCount = CONFIG.sparkCount;
      const positions = new Float32Array(sparkCount * 3);
      const colors = new Float32Array(sparkCount * 3);

      this.sparksData = [];

      for (let s = 0; s < sparkCount; s++) {
        // Scegli una linea casuale tra quelle disponibili
        const pairIndex = Math.floor(Math.random() * (this.linePairs.length / 2)) * 2;
        const p1Idx = this.linePairs[pairIndex];
        const p2Idx = this.linePairs[pairIndex + 1];

        this.sparksData.push({
          p1Idx,
          p2Idx,
          t: Math.random(),
          speed: 0.7 + Math.random() * 1.5,
          colorType: Math.random() > 0.4 ? 'cyan' : 'magenta'
        });

        colors[s * 3] = 1.0;
        colors[s * 3 + 1] = 1.0;
        colors[s * 3 + 2] = 1.0;
      }

      const sparkGeom = new THREE.BufferGeometry();
      sparkGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      sparkGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const sparkMat = new THREE.PointsMaterial({
        size: 0.12,
        map: this._createNeuronTexture(),
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      this.sparksMesh = new THREE.Points(sparkGeom, sparkMat);
      this.brainGroup.add(this.sparksMesh);
    }

    /**
     * 7 Terminali Assonici posizionati sui punti di uscita verso i 7 nodi periferici
     */
    _buildAnchorTerminals() {
      this.anchorNodes = [];
      const nodeCount = 7;
      const startAngle = -Math.PI / 2;
      const angleStep = (2 * Math.PI) / nodeCount;

      for (let i = 0; i < nodeCount; i++) {
        const angle = startAngle + i * angleStep;
        // Posiziona il terminale alla superficie del cervello lungo l'angolo del nodo
        const x = Math.cos(angle) * 1.05;
        const y = Math.sin(angle) * 0.98;
        const z = 0.15 * Math.sin(angle * 2);

        const anchorGeom = new THREE.SphereGeometry(0.065, 8, 8);
        const anchorMat = new THREE.MeshBasicMaterial({
          color: (i % 2 === 0) ? 0x38bdf8 : 0xc084fc,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending
        });
        const mesh = new THREE.Mesh(anchorGeom, anchorMat);
        mesh.position.set(x, y, z);
        this.brainGroup.add(mesh);

        this.anchorNodes.push({
          mesh,
          angle,
          baseScale: 1.0
        });
      }
    }

    /**
     * Gestione movimento del cursore per effetto di inclinazione e parallasse
     */
    _onMouseMove(e) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      this.mouse.targetX = (e.clientX - cx) / cx;
      this.mouse.targetY = (e.clientY - cy) / cy;
    }

    /**
     * Evidenzia la connessione cerebrale verso il nodo specificato (0 - 6)
     */
    highlightConnection(nodeIndex, active = true) {
      this.hoveredNodeIndex = active ? nodeIndex : -1;

      if (active && nodeIndex >= 0 && nodeIndex < this.anchorNodes.length) {
        const anchor = this.anchorNodes[nodeIndex];
        this.targetAngleOffset = -anchor.angle - Math.PI / 2;
      } else {
        this.targetAngleOffset = 0;
      }
    }

    /**
     * Attiva una violenta scarica neurale sincronizzata verso tutti i 7 nodi (shockwave)
     */
    triggerShockwave() {
      this.shockwaveActive = true;
      this.shockwaveProgress = 0;

      // Flash temporaneo dei materiali
      if (this.linesMaterial) {
        this.linesMaterial.opacity = 0.85;
      }
      if (this.pointsMaterial) {
        this.pointsMaterial.size = 0.14;
      }

      setTimeout(() => {
        if (this.linesMaterial) this.linesMaterial.opacity = 0.32;
        if (this.pointsMaterial) this.pointsMaterial.size = 0.085;
        this.shockwaveActive = false;
      }, 550);
    }

    /**
     * Aggiorna dimensioni e proporzioni del canvas 3D
     */
    resize(newSize) {
      if (!this.renderer || !this.camera) return;
      this.width = newSize;
      this.height = newSize;

      this.renderer.setSize(this.width, this.height, false);
      this.camera.aspect = 1;
      this.camera.updateProjectionMatrix();
    }

    /**
     * Loop principale di animazione WebGL a 60fps
     */
    _animate() {
      if (!this.isRunning) return;
      this.animId = requestAnimationFrame(() => this._animate());

      const delta = this.clock.getDelta();
      const time = this.clock.getElapsedTime();

      // 1. Lerp per movimento cursore (inclinazione fluida)
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

      // 2. Rotazione continua del cervello nello spazio 3D
      this.brainGroup.rotation.y += CONFIG.baseRotationSpeed;
      this.brainGroup.rotation.x = this.mouse.y * 0.35 + Math.sin(time * 0.8) * 0.04;
      this.brainGroup.rotation.z = -this.mouse.x * 0.25;

      // Se un nodo è in hover, orienta leggermente il cervello verso quel nodo
      this.currentAngleOffset += (this.targetAngleOffset - this.currentAngleOffset) * 0.08;

      // 3. Pulsazione e respirazione neurale
      const breath = 1.0 + Math.sin(time * 2.2) * 0.025;
      this.coreMesh.scale.set(breath, breath, breath);

      // 4. Animazione singola dei neuroni (onde cerebrali + shockwave)
      if (this.pointsGeometry) {
        const posAttr = this.pointsGeometry.attributes.position;
        const posArray = posAttr.array;
        const count = CONFIG.neuronCount;

        let shockExpand = 1.0;
        if (this.shockwaveActive) {
          this.shockwaveProgress += delta * 3.5;
          shockExpand = 1.0 + Math.sin(Math.min(Math.PI, this.shockwaveProgress)) * 0.22;
        }

        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          const origX = this.originalPositions[idx];
          const origY = this.originalPositions[idx + 1];
          const origZ = this.originalPositions[idx + 2];

          // Piccola oscillazione organica individuale
          const phase = this.pulsePhases[i] + time * this.pulseSpeeds[i];
          const pulse = Math.sin(phase) * 0.012;

          posArray[idx] = origX * (shockExpand + pulse);
          posArray[idx + 1] = origY * (shockExpand + pulse);
          posArray[idx + 2] = origZ * (shockExpand + pulse);
        }
        posAttr.needsUpdate = true;
      }

      // 5. Animazione delle scintille sinaptiche (potenziali d'azione)
      if (this.sparksMesh && this.sparksData.length > 0) {
        const sparkPosAttr = this.sparksMesh.geometry.attributes.position;
        const sparkPosArr = sparkPosAttr.array;

        for (let s = 0; s < this.sparksData.length; s++) {
          const spark = this.sparksData[s];
          spark.t += delta * spark.speed;

          if (spark.t >= 1.0) {
            spark.t = 0;
            // Scegli una nuova linea casuale
            const newPairIdx = Math.floor(Math.random() * (this.linePairs.length / 2)) * 2;
            spark.p1Idx = this.linePairs[newPairIdx];
            spark.p2Idx = this.linePairs[newPairIdx + 1];
          }

          const x1 = this.originalPositions[spark.p1Idx * 3];
          const y1 = this.originalPositions[spark.p1Idx * 3 + 1];
          const z1 = this.originalPositions[spark.p1Idx * 3 + 2];

          const x2 = this.originalPositions[spark.p2Idx * 3];
          const y2 = this.originalPositions[spark.p2Idx * 3 + 1];
          const z2 = this.originalPositions[spark.p2Idx * 3 + 2];

          sparkPosArr[s * 3] = x1 + (x2 - x1) * spark.t;
          sparkPosArr[s * 3 + 1] = y1 + (y2 - y1) * spark.t;
          sparkPosArr[s * 3 + 2] = z1 + (z2 - z1) * spark.t;
        }
        sparkPosAttr.needsUpdate = true;
      }

      // 6. Animazione dei 7 Terminali Assonici
      for (let a = 0; a < this.anchorNodes.length; a++) {
        const anchor = this.anchorNodes[a];
        const isHovered = (a === this.hoveredNodeIndex);
        const targetScale = isHovered ? 1.6 : (1.0 + Math.sin(time * 3 + a) * 0.15);
        anchor.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
      }

      // 7. Render finale
      this.renderer.render(this.scene, this.camera);
    }

    /**
     * Avvia il ciclo di render
     */
    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.clock.start();
      this._animate();
    }

    /**
     * Mette in pausa il ciclo di render
     */
    stop() {
      this.isRunning = false;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    }

    /**
     * Pulizia delle risorse WebGL
     */
    destroy() {
      this.stop();
      window.removeEventListener('mousemove', this._onMouseMove);
      if (this.renderer) {
        this.renderer.dispose();
      }
    }
  }

  return new BrainEngine();
});
