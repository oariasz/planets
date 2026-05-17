// ============================================================
// Sistema Solar Interactivo · Estratek
// Entrada principal. Three.js + OrbitControls.
// ============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SOLAR_DATA, COMETS, ISS_INFO, TEX } from './data.js';
import {
  earthVertexShader,
  earthFragmentShader,
  atmosphereVertexShader,
  atmosphereFragmentShader,
} from './shaders.js';

// ---------- Estado global ----------
const state = {
  timeScale: 1,
  simulatedDays: 0,                         // días simulados desde epoch
  epoch: new Date('2026-01-01T00:00:00Z'),
  showOrbits: true,
  showLabels: true,
  showAsteroids: true,
  showMoons: true,
  showISS: true,
  showStars: true,
  bodies: [],                                // todos los objetos clickeables {mesh, info}
  planets: {},                               // por id
  pivots: {},                                // pivote orbital de cada planeta
  iss: null,
  asteroids: null,
  comets: [],
  satellites: [],
  earthShader: null,
  cloudsMesh: null,
};

// ---------- DOM ----------
const canvas = document.getElementById('scene');
const loaderFill = document.getElementById('loader-fill');
const loaderText = document.getElementById('loader-text');
const loadingScreen = document.getElementById('loading-screen');
const tooltip = document.getElementById('tooltip');
const infoCard = document.getElementById('info-card');
const infoName = document.getElementById('info-name');
const infoType = document.getElementById('info-type');
const infoDesc = document.getElementById('info-desc');
const infoGrid = document.getElementById('info-grid');
const infoFact = document.getElementById('info-fact');
const infoSwatch = document.getElementById('info-swatch');
const hudDate = document.getElementById('hud-date');
const hudFps = document.getElementById('hud-fps');

// ---------- Three.js setup ----------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  6000
);

// Posiciones clave de cámara
const CAMERA_START = new THREE.Vector3(0, 280, 1200); // muy lejos, intro
const CAMERA_END   = new THREE.Vector3(0, 50, 90);    // posición normal de uso
camera.position.copy(CAMERA_START);

// Marca body en modo intro hasta que la animación cinemática termine
document.body.classList.add('intro-active');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.82; // suavizado para que el Sol no eclipse a los planetas

// ---------- Controles de cámara ----------
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.9;
controls.panSpeed = 0.7;
controls.minDistance = 4;
controls.maxDistance = 700;
controls.maxPolarAngle = Math.PI; // permitir mirar desde abajo también
controls.target.set(0, 0, 0);
// Zoom hacia donde apunta el cursor (no al centro de la pantalla)
controls.zoomToCursor = true;

// ---------- Loaders y progreso ----------
const loadManager = new THREE.LoadingManager();
const texLoader = new THREE.TextureLoader(loadManager);

loadManager.onProgress = (url, loaded, total) => {
  const pct = Math.round((loaded / total) * 100);
  loaderFill.style.width = `${pct}%`;
  loaderText.textContent = `Cargando texturas… ${pct}%`;
};
loadManager.onLoad = () => {
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
    // Encadenar la intro cinemática justo después de ocultar el loader
    startCinematicIntro();
  }, 400);
};
loadManager.onError = (url) => {
  console.warn('No se pudo cargar:', url);
};

function loadTex(url, opts = {}) {
  const t = texLoader.load(url, undefined, undefined, () =>
    console.warn('Texture failed:', url)
  );
  t.colorSpace = opts.colorSpace || THREE.SRGBColorSpace;
  if (opts.wrap) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
  }
  return t;
}

// ---------- Iluminación ----------
// PointLight más suave para que los planetas no queden quemados
const sunLight = new THREE.PointLight(0xfff2d6, 1.7, 0, 0);
scene.add(sunLight);
// Ambient un poco más alto: la cara nocturna deja de ser negro absoluto
scene.add(new THREE.AmbientLight(0x2a3358, 0.85));

// Luz hemisférica muy sutil para ese tinte azulado del espacio profundo
const hemiLight = new THREE.HemisphereLight(0xb6ccff, 0x101830, 0.12);
scene.add(hemiLight);

// ---------- Fondo: estrellas ----------
let starsField = null;
function buildStars() {
  const count = 6000;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const r = 1500 + Math.random() * 800;
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // ligeros tintes (azul, blanco, amarillo)
    const tint = Math.random();
    const c = new THREE.Color();
    if (tint < 0.6) c.setHSL(0.6, 0.1, 0.8 + Math.random() * 0.2);
    else if (tint < 0.85) c.setHSL(0.15, 0.4, 0.8);
    else c.setHSL(0.0, 0.5, 0.85);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 1.6,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  starsField = new THREE.Points(geo, mat);
  scene.add(starsField);
}

// ---------- Sol ----------
function buildSun() {
  const data = SOLAR_DATA.sun;
  const geo = new THREE.SphereGeometry(data.radius, 96, 96);
  const mat = new THREE.MeshBasicMaterial({
    map: loadTex(data.texture),
    color: 0xfff0c0, // ligeramente cálido pero no quemante
  });
  const sun = new THREE.Mesh(geo, mat);
  sun.name = 'sun';
  scene.add(sun);

  // Glow del sol — más sutil para no eclipsar a los planetas
  const glowGeo = new THREE.SphereGeometry(data.radius * 1.28, 32, 32);
  const glowMat = new THREE.ShaderMaterial({
    uniforms: {
      c: { value: 0.55 },
      p: { value: 5.2 },
      glowColor: { value: new THREE.Color(0xff9420) },
      strength: { value: 0.55 }, // antes era 1.0 implícito
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform float c; uniform float p; uniform vec3 glowColor; uniform float strength;
      varying vec3 vNormal;
      void main() {
        // Clamp a positivo para evitar pow(negativo, fraccional) que produce NaN/sombras oscuras
        float base = max(c - dot(vNormal, vec3(0.0,0.0,1.0)), 0.0);
        float intensity = pow(base, p) * strength;
        gl_FragColor = vec4(glowColor, 1.0) * intensity;
      }`,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  sun.add(glow);

  state.bodies.push({
    mesh: sun,
    info: { ...data, id: 'sun', kind: 'sun' },
  });
  state.planets.sun = sun;
}

// ---------- Planetas ----------
function buildPlanet(data) {
  const pivot = new THREE.Object3D();
  pivot.name = `${data.id}-pivot`;
  scene.add(pivot);

  // Órbita visual
  const orbitGeo = new THREE.RingGeometry(data.distance - 0.02, data.distance + 0.02, 128);
  const orbitMat = new THREE.MeshBasicMaterial({
    color: 0x4a6fa5,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.18,
  });
  const orbit = new THREE.Mesh(orbitGeo, orbitMat);
  orbit.rotation.x = Math.PI / 2;
  orbit.name = `${data.id}-orbit`;
  orbit.userData.isOrbit = true;
  scene.add(orbit);

  // Planeta — más resolución para que se vean los detalles de la textura
  const geo = new THREE.SphereGeometry(data.radius, 96, 96);
  let mat;

  if (data.id === 'earth') {
    // Shader custom para día/noche
    const day = loadTex(data.textureDay);
    const night = loadTex(data.textureNight);
    const spec = loadTex(data.textureSpec, { colorSpace: THREE.NoColorSpace });

    mat = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: day },
        nightTexture: { value: night },
        specularMap: { value: spec },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) },
        cameraWorldPos: { value: new THREE.Vector3() },
      },
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
    });
    state.earthShader = mat;
  } else {
    const map = loadTex(data.texture);
    // Emisivo muy sutil con el color del planeta para que la cara nocturna no quede en negro absoluto
    const emissive = new THREE.Color(data.color || 0xffffff).multiplyScalar(0.08);
    mat = new THREE.MeshPhongMaterial({
      map,
      color: 0xffffff,
      shininess: 14,
      specular: 0x222233,
      emissive,
      emissiveIntensity: 0.6,
    });
    if (data.bump) {
      mat.bumpMap = loadTex(data.bump, { colorSpace: THREE.NoColorSpace });
      mat.bumpScale = 0.12; // antes 0.04 — ahora se notan las texturas
    }
  }

  const planet = new THREE.Mesh(geo, mat);
  planet.position.x = data.distance;
  planet.rotation.z = THREE.MathUtils.degToRad(data.tilt || 0);
  planet.name = data.id;
  pivot.add(planet);

  // Posición orbital inicial aleatoria para que no estén alineados
  pivot.rotation.y = Math.random() * Math.PI * 2;

  // Nubes terrestres
  if (data.id === 'earth' && data.textureClouds) {
    const cloudsGeo = new THREE.SphereGeometry(data.radius * 1.012, 48, 48);
    const cloudsMat = new THREE.MeshPhongMaterial({
      map: loadTex(data.textureClouds),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
    planet.add(clouds);
    state.cloudsMesh = clouds;

    // Halo atmosférico
    const atmoGeo = new THREE.SphereGeometry(data.radius * 1.06, 48, 48);
    const atmoMat = new THREE.ShaderMaterial({
      uniforms: {
        atmoColor: { value: new THREE.Color(0x4a90e2) },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) },
        cameraWorldPos: { value: new THREE.Vector3() },
      },
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const atmo = new THREE.Mesh(atmoGeo, atmoMat);
    planet.add(atmo);
    state.earthAtmoMat = atmoMat;
  }

  // Anillos (Saturno / Urano)
  if (data.rings) {
    const ringGeo = new THREE.RingGeometry(data.rings.inner, data.rings.outer, 96);
    // arreglar UVs para que la textura se vea bien
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const r = Math.sqrt(x * x + y * y);
      const u = (r - data.rings.inner) / (data.rings.outer - data.rings.inner);
      uv.setXY(i, u, 0.5);
    }
    const ringMat = new THREE.MeshBasicMaterial({
      map: loadTex(data.rings.texture),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    planet.add(ring);
  }

  // Lunas
  if (data.moons) {
    data.moons.forEach((m) => {
      const moonPivot = new THREE.Object3D();
      planet.add(moonPivot);

      const moonGeo = new THREE.SphereGeometry(m.radius, 32, 32);
      let moonMat;
      if (m.texture) {
        moonMat = new THREE.MeshPhongMaterial({ map: loadTex(m.texture), shininess: 3 });
      } else {
        moonMat = new THREE.MeshPhongMaterial({ color: m.color || 0x999999, shininess: 3 });
      }
      const moon = new THREE.Mesh(moonGeo, moonMat);
      moon.position.x = m.distance;
      moon.name = `moon-${m.name}`;
      moonPivot.add(moon);
      moonPivot.rotation.y = Math.random() * Math.PI * 2;
      moonPivot.userData = { orbitSpeed: 1 / m.orbit, isMoon: true, parent: data.id };

      state.bodies.push({
        mesh: moon,
        info: {
          name: m.name,
          type: `Luna de ${data.name}`,
          radius: m.radius,
          description: `Luna del planeta ${data.name}.`,
          facts: [
            { label: 'Radio (escala)', value: `${m.radius.toFixed(2)}` },
            { label: 'Orbita en', value: data.name },
          ],
          curious: '',
          kind: 'moon',
        },
      });
    });
  }

  state.bodies.push({
    mesh: planet,
    info: { ...data, kind: 'planet' },
  });
  state.planets[data.id] = planet;
  state.pivots[data.id] = pivot;

  // Guardamos referencia a la órbita para toggle
  pivot.userData.orbitMesh = orbit;
  pivot.userData.orbitSpeed = 1 / data.orbit;
  pivot.userData.rotationSpeed = 1 / data.rotation;
}

// ---------- Cinturón de asteroides ----------
function buildAsteroids() {
  const count = 1500;
  const innerR = 41;
  const outerR = 49;

  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const r = innerR + Math.random() * (outerR - innerR);
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 1.2;
    positions[i * 3]     = r * Math.cos(theta);
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = r * Math.sin(theta);

    const c = new THREE.Color().setHSL(0.08, 0.3, 0.4 + Math.random() * 0.25);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    sizes[i] = 0.25 + Math.random() * 0.45;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.4,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
  });
  state.asteroids = new THREE.Points(geo, mat);
  scene.add(state.asteroids);
}

// ---------- ISS ----------
function buildISS() {
  const earth = state.planets.earth;
  if (!earth) return;

  const issGroup = new THREE.Group();
  issGroup.name = 'iss';

  // Cuerpo central
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.06, 0.06),
    new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 80 })
  );
  issGroup.add(body);

  // Paneles solares (4)
  const panelMat = new THREE.MeshPhongMaterial({
    color: 0x1a3b6e,
    emissive: 0x0a1a3a,
    shininess: 100,
    side: THREE.DoubleSide,
  });
  const panelGeo = new THREE.PlaneGeometry(0.14, 0.08);
  for (let i = 0; i < 2; i++) {
    const p1 = new THREE.Mesh(panelGeo, panelMat);
    p1.position.x = (i === 0 ? -0.12 : 0.12);
    issGroup.add(p1);
    const p2 = new THREE.Mesh(panelGeo, panelMat);
    p2.position.x = (i === 0 ? -0.22 : 0.22);
    issGroup.add(p2);
  }

  // Pivote orbital alrededor de la Tierra
  const issPivot = new THREE.Object3D();
  issPivot.rotation.x = THREE.MathUtils.degToRad(51.6); // inclinación real de la ISS
  earth.add(issPivot);
  issGroup.position.set(1.4, 0, 0);
  issPivot.add(issGroup);
  issPivot.userData = { orbitSpeed: 16.5, isISS: true }; // ~15.5 órbitas/día

  state.iss = { group: issGroup, pivot: issPivot };
  state.bodies.push({
    mesh: issGroup,
    info: {
      name: ISS_INFO.name,
      type: ISS_INFO.type,
      description: ISS_INFO.description,
      facts: ISS_INFO.facts,
      curious: ISS_INFO.curious,
      color: 0xc0c0c0,
      kind: 'iss',
    },
  });
}

// ---------- Cometas ----------
function spawnComet(cometData) {
  const group = new THREE.Group();
  group.name = `comet-${cometData.name}`;

  // Núcleo
  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 16, 16),
    new THREE.MeshBasicMaterial({ color: cometData.color })
  );
  group.add(nucleus);

  // Cola de partículas
  const tailCount = 400;
  const tailGeo = new THREE.BufferGeometry();
  const tailPositions = new Float32Array(tailCount * 3);
  const tailColors = new Float32Array(tailCount * 3);

  for (let i = 0; i < tailCount; i++) {
    const t = i / tailCount;
    const spread = 0.5 + t * 2.5;
    tailPositions[i * 3]     = -t * 18 + (Math.random() - 0.5) * spread;
    tailPositions[i * 3 + 1] = (Math.random() - 0.5) * spread;
    tailPositions[i * 3 + 2] = (Math.random() - 0.5) * spread;

    const c = new THREE.Color(cometData.color);
    const fade = 1 - t;
    tailColors[i * 3] = c.r * fade;
    tailColors[i * 3 + 1] = c.g * fade;
    tailColors[i * 3 + 2] = c.b * fade;
  }
  tailGeo.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
  tailGeo.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));

  const tailMat = new THREE.PointsMaterial({
    size: 0.45,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const tail = new THREE.Points(tailGeo, tailMat);
  group.add(tail);

  // Halo brillante
  const haloMat = new THREE.SpriteMaterial({
    color: cometData.color,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(3, 3, 1);
  group.add(halo);

  scene.add(group);

  // Trayectoria elíptica simplificada
  const trajectory = {
    group,
    data: cometData,
    t: 0,
    life: 30, // segundos de vida en la escena
    startAngle: Math.random() * Math.PI * 2,
  };

  state.comets.push(trajectory);

  // También lo añadimos al raycaster para info al click
  state.bodies.push({
    mesh: nucleus,
    info: {
      name: `Cometa ${cometData.name}`,
      type: 'Cometa',
      description: `Cometa periódico con un período orbital de ${cometData.period} años.`,
      facts: cometData.facts,
      curious: cometData.curious,
      color: cometData.color,
      kind: 'comet',
      _cometRef: trajectory,
    },
  });

  return trajectory;
}

function updateComets(dt) {
  for (let i = state.comets.length - 1; i >= 0; i--) {
    const c = state.comets[i];
    c.t += dt;
    const progress = c.t / c.life;

    if (progress >= 1) {
      scene.remove(c.group);
      // limpiar de bodies
      const idx = state.bodies.findIndex((b) => b.info._cometRef === c);
      if (idx >= 0) state.bodies.splice(idx, 1);
      state.comets.splice(i, 1);
      continue;
    }

    // Elipse: pasa cerca del sol y se aleja
    const a = c.data.semiMajor;
    const e = c.data.eccentricity;
    const incl = THREE.MathUtils.degToRad(c.data.inclination);
    const theta = c.startAngle + progress * Math.PI * 1.4 - Math.PI * 0.7;
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
    const scaledR = Math.min(r, 280) * 0.4;

    const x = scaledR * Math.cos(theta);
    const z = scaledR * Math.sin(theta);
    const y = z * Math.sin(incl) * 0.3;
    const zRot = z * Math.cos(incl);

    c.group.position.set(x, y, zRot);

    // Orientar la cola en dirección opuesta al sol
    const dirFromSun = c.group.position.clone().normalize();
    const lookTarget = c.group.position.clone().add(dirFromSun);
    c.group.lookAt(lookTarget);

    // Fade in/out
    const fade = Math.sin(progress * Math.PI);
    c.group.children.forEach((ch) => {
      if (ch.material && ch.material.opacity !== undefined) {
        ch.material.opacity = 0.85 * fade;
      }
    });
  }
}

// ---------- Lanzamiento de satélites ----------
function launchSatellite() {
  const earth = state.planets.earth;
  if (!earth) return;

  const sat = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.06, 0.06),
    new THREE.MeshPhongMaterial({ color: 0xeeeeee, shininess: 50 })
  );
  sat.add(body);
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.05),
    new THREE.MeshPhongMaterial({ color: 0x2a4d8f, side: THREE.DoubleSide })
  );
  sat.add(panel);

  // Trail
  const trailGeo = new THREE.BufferGeometry();
  const trailPositions = new Float32Array(80 * 3);
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
  const trailMat = new THREE.LineBasicMaterial({
    color: 0xff8855,
    transparent: true,
    opacity: 0.8,
  });
  const trail = new THREE.Line(trailGeo, trailMat);
  scene.add(trail);

  // Punto de lanzamiento en superficie terrestre
  const earthWorld = new THREE.Vector3();
  earth.getWorldPosition(earthWorld);
  const startPos = earthWorld.clone().add(new THREE.Vector3(1.05, 0.2, 0));
  sat.position.copy(startPos);
  scene.add(sat);

  state.satellites.push({
    mesh: sat,
    trail,
    trailPositions,
    trailIdx: 0,
    t: 0,
    phase: 'launch',     // launch -> orbit
    targetAltitude: 2.5,
    angle: 0,
  });
}

function updateSatellites(dt) {
  const earth = state.planets.earth;
  if (!earth) return;
  const earthPos = new THREE.Vector3();
  earth.getWorldPosition(earthPos);

  for (let i = state.satellites.length - 1; i >= 0; i--) {
    const s = state.satellites[i];
    s.t += dt;

    if (s.phase === 'launch') {
      // Subida acelerada
      const launchTime = 2.5;
      const k = Math.min(s.t / launchTime, 1);
      const altitude = 1.05 + (s.targetAltitude - 1.05) * k * k;
      s.angle = k * 1.5;
      const pos = earthPos.clone().add(new THREE.Vector3(
        Math.cos(s.angle) * altitude,
        0.3 * (1 - k),
        Math.sin(s.angle) * altitude
      ));
      s.mesh.position.copy(pos);
      s.mesh.lookAt(earthPos);
      if (k >= 1) { s.phase = 'orbit'; s.t = 0; }
    } else {
      // Órbita
      const speed = 0.8;
      s.angle += dt * speed;
      const altitude = s.targetAltitude;
      const pos = earthPos.clone().add(new THREE.Vector3(
        Math.cos(s.angle) * altitude,
        Math.sin(s.angle * 0.3) * 0.4,
        Math.sin(s.angle) * altitude
      ));
      s.mesh.position.copy(pos);
      s.mesh.lookAt(earthPos);
    }

    // Actualizar trail (ring buffer)
    const positions = s.trail.geometry.attributes.position.array;
    const total = positions.length / 3;
    const idx = s.trailIdx % total;
    positions[idx * 3]     = s.mesh.position.x;
    positions[idx * 3 + 1] = s.mesh.position.y;
    positions[idx * 3 + 2] = s.mesh.position.z;
    s.trailIdx++;
    s.trail.geometry.setDrawRange(0, Math.min(s.trailIdx, total));
    s.trail.geometry.attributes.position.needsUpdate = true;
    s.trail.geometry.computeBoundingSphere();

    // Eliminar después de un tiempo
    if (s.phase === 'orbit' && s.t > 25) {
      scene.remove(s.mesh);
      scene.remove(s.trail);
      state.satellites.splice(i, 1);
    }
  }
}

// ---------- Construir todo ----------
buildStars();
buildSun();
SOLAR_DATA.planets.forEach(buildPlanet);
buildAsteroids();
buildISS();

// ---------- Intro cinemática ----------
// Logo grande blanco fade-in → mientras la cámara se aproxima desde lejos →
// logo encoge y se va, UI fade-in.
const introOverlay = document.getElementById('intro-overlay');
const skipBtn = document.getElementById('skip-intro');

const introState = {
  active: false,
  startTime: 0,
  duration: 6000,                   // ms total
  cameraStartAt: 1400,              // ms — empezar dolly-in
  logoLeaveAt: 3600,                // ms — logo encoge / se va
  uiRevealAt: 4800,                 // ms — UI aparece
  endAt: 6000,                      // ms — fin total
  skipped: false,
};

function startCinematicIntro() {
  // Mostrar overlay con el logo centrado (fade-in)
  introOverlay.classList.remove('intro-hidden');
  // Forzar reflow para que la transición arranque
  void introOverlay.offsetWidth;
  introOverlay.classList.add('intro-enter');

  // Mostrar botón de saltar tras 1s
  setTimeout(() => skipBtn.classList.replace('skip-intro-hidden', 'skip-intro-visible'), 600);

  // Desactivar controles del usuario durante la intro
  controls.enabled = false;

  introState.active = true;
  introState.startTime = performance.now();
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function updateIntro(nowMs) {
  if (!introState.active) return;

  const t = nowMs - introState.startTime;

  // 1) Dolly-in de cámara (entre cameraStartAt y endAt)
  if (t >= introState.cameraStartAt) {
    const localT = Math.min((t - introState.cameraStartAt) / (introState.endAt - introState.cameraStartAt), 1);
    const eased = easeInOutCubic(localT);
    camera.position.lerpVectors(CAMERA_START, CAMERA_END, eased);
    controls.target.set(0, 0, 0);
  }

  // 2) Logo se va a partir de logoLeaveAt
  if (t >= introState.logoLeaveAt && !introOverlay.classList.contains('intro-leave')) {
    introOverlay.classList.add('intro-leave');
  }

  // 3) Revelar UI (fade-in topbar, paneles, HUD) en uiRevealAt
  if (t >= introState.uiRevealAt && document.body.classList.contains('intro-active')) {
    document.body.classList.remove('intro-active');
  }

  // 4) Fin: ocultar overlay y botón, devolver control al usuario
  if (t >= introState.endAt) {
    introOverlay.classList.add('intro-done');
    skipBtn.classList.replace('skip-intro-visible', 'skip-intro-hidden');
    controls.enabled = true;
    introState.active = false;

    // Mostrar modal de ayuda la primera vez (movido aquí desde el final del archivo)
    if (!localStorage.getItem('etk-planets-seen') && !introState.skipped) {
      setTimeout(() => {
        helpModal.classList.remove('hidden');
        localStorage.setItem('etk-planets-seen', '1');
      }, 800);
    }
  }
}

function skipIntro() {
  if (!introState.active) return;
  introState.skipped = true;
  // Saltar al estado final inmediatamente
  camera.position.copy(CAMERA_END);
  controls.target.set(0, 0, 0);
  introOverlay.classList.add('intro-leave');
  document.body.classList.remove('intro-active');
  // En 600ms hacer cleanup
  setTimeout(() => {
    introOverlay.classList.add('intro-done');
    skipBtn.classList.replace('skip-intro-visible', 'skip-intro-hidden');
    controls.enabled = true;
    introState.active = false;
  }, 600);
}

skipBtn.addEventListener('click', skipIntro);

// ---------- Animación ----------
const clock = new THREE.Clock();
let frameCount = 0;
let fpsAccum = 0;
let fpsLast = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  const speed = state.timeScale;
  const dDays = dt * speed * 5; // 1 segundo real = 5 días simulados a velocidad 1
  state.simulatedDays += dDays;

  // Intro cinemática (si está activa, controla cámara)
  updateIntro(performance.now());

  // Rotar pivotes (órbitas)
  Object.values(state.pivots).forEach((pivot) => {
    pivot.rotation.y += dt * speed * pivot.userData.orbitSpeed * 0.5;
  });

  // Rotación propia de cada planeta
  SOLAR_DATA.planets.forEach((d) => {
    const p = state.planets[d.id];
    if (p) p.rotation.y += dt * speed * (1 / d.rotation) * 2;
  });

  // Rotación del Sol
  if (state.planets.sun) state.planets.sun.rotation.y += dt * 0.05;

  // Lunas
  state.planets.earth?.children.forEach((child) => {
    if (child.userData.isMoon || child.userData.orbitSpeed) {
      child.rotation.y += dt * speed * child.userData.orbitSpeed * 0.5;
    }
  });
  // Generalizado para todos los planetas con lunas
  Object.values(state.planets).forEach((p) => {
    p.children?.forEach((child) => {
      if (child.userData.isMoon || (child.userData.orbitSpeed && !child.userData.isISS)) {
        child.rotation.y += dt * speed * child.userData.orbitSpeed * 0.5;
      }
    });
  });

  // Nubes Tierra (rotación más rápida que la superficie)
  if (state.cloudsMesh) state.cloudsMesh.rotation.y += dt * speed * 0.05;

  // ISS
  if (state.iss) {
    state.iss.pivot.rotation.y += dt * speed * state.iss.pivot.userData.orbitSpeed * 0.5;
  }

  // Asteroides: rotación lenta del cinturón
  if (state.asteroids) state.asteroids.rotation.y += dt * speed * 0.04;

  // Shader Tierra: actualizar dirección del sol y posición de cámara
  if (state.earthShader && state.planets.earth) {
    const earthWorld = new THREE.Vector3();
    state.planets.earth.getWorldPosition(earthWorld);
    // dirección desde el centro del planeta hacia el Sol (en origen)
    const toSun = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), earthWorld).normalize();
    state.earthShader.uniforms.sunDirection.value.copy(toSun);
    state.earthShader.uniforms.cameraWorldPos.value.copy(camera.position);
    if (state.earthAtmoMat) {
      state.earthAtmoMat.uniforms.sunDirection.value.copy(toSun);
      state.earthAtmoMat.uniforms.cameraWorldPos.value.copy(camera.position);
    }
  }

  // Cometas
  updateComets(dt);
  updateSatellites(dt);

  // Fondo de estrellas: visibilidad
  if (starsField) starsField.visible = state.showStars;
  if (state.asteroids) state.asteroids.visible = state.showAsteroids;

  // Mostrar/ocultar lunas (incluye ISS bajo Tierra)
  Object.values(state.planets).forEach((p) => {
    p.children.forEach((child) => {
      if (child.userData.isMoon) child.visible = state.showMoons;
      if (child.userData.isISS) child.visible = state.showISS;
    });
  });

  // Mostrar/ocultar órbitas
  scene.traverse((obj) => {
    if (obj.userData?.isOrbit) obj.visible = state.showOrbits;
  });

  controls.update();
  renderer.render(scene, camera);

  // HUD
  frameCount++;
  fpsAccum += dt;
  if (fpsAccum >= 0.5) {
    const fps = Math.round(frameCount / fpsAccum);
    hudFps.textContent = `${fps}`;
    frameCount = 0;
    fpsAccum = 0;
  }
  // Fecha simulada
  const date = new Date(state.epoch.getTime() + state.simulatedDays * 86400000);
  hudDate.textContent = date.toLocaleDateString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

animate();

// ---------- Raycasting (hover + click) ----------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredBody = null;

function onPointerMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const meshes = state.bodies.map((b) => b.mesh).filter(Boolean);
  const hits = raycaster.intersectObjects(meshes, true);

  if (hits.length > 0) {
    // Buscar el body asociado al mesh impactado o su padre
    let body = null;
    for (const hit of hits) {
      body = state.bodies.find((b) => b.mesh === hit.object || hit.object.parent === b.mesh);
      if (body) break;
    }
    if (body) {
      hoveredBody = body;
      tooltip.textContent = body.info.name;
      tooltip.style.left = `${event.clientX}px`;
      tooltip.style.top = `${event.clientY}px`;
      tooltip.classList.remove('hidden');
      canvas.style.cursor = 'pointer';
      return;
    }
  }
  hoveredBody = null;
  tooltip.classList.add('hidden');
  canvas.style.cursor = '';
}

function onClick(event) {
  if (event.target !== canvas) return;
  if (hoveredBody) {
    showInfoCard(hoveredBody.info);
  } else {
    hideInfoCard();
  }
}

window.addEventListener('pointermove', onPointerMove);
window.addEventListener('click', onClick);

// ---------- Info card ----------
function colorToHex(c) {
  if (typeof c === 'number') return '#' + c.toString(16).padStart(6, '0');
  return c || '#888';
}

// Body actualmente mostrado en la ficha (para que el botón de Enfocar sepa a quién apuntar)
let currentInfoBodyId = null;

function showInfoCard(info) {
  infoName.textContent = info.name;
  infoType.textContent = info.type || '';
  infoDesc.textContent = info.description || '';

  // Guardar el id para el botón de enfoque
  currentInfoBodyId = info.id || null;

  // Mostrar/ocultar el botón de Enfocar (sólo planetas y el Sol tienen id válido)
  const focusBtn = document.getElementById('info-focus');
  if (focusBtn) {
    if (currentInfoBodyId && state.planets[currentInfoBodyId]) {
      focusBtn.classList.remove('hidden');
    } else {
      focusBtn.classList.add('hidden');
    }
  }

  // Swatch
  const hex = colorToHex(info.color || 0x6fb3ff);
  infoSwatch.style.background = `radial-gradient(circle at 35% 35%, #fff 0%, ${hex} 45%, #111 95%)`;
  infoSwatch.style.boxShadow = `
    0 0 0 1px rgba(255,255,255,0.12),
    0 0 30px ${hex}55,
    0 6px 20px rgba(0,0,0,0.4),
    inset -8px -8px 16px rgba(0,0,0,0.35)
  `;

  // Grid de datos
  infoGrid.innerHTML = '';
  (info.facts || []).forEach((f) => {
    const cell = document.createElement('div');
    cell.className = 'info-cell';
    cell.innerHTML = `
      <div class="info-cell-label">${f.label}</div>
      <div class="info-cell-value">${f.value}</div>
    `;
    infoGrid.appendChild(cell);
  });

  if (info.curious) {
    infoFact.textContent = info.curious;
    infoFact.classList.remove('hidden');
  } else {
    infoFact.classList.add('hidden');
  }

  infoCard.classList.remove('hidden');
}

function hideInfoCard() {
  infoCard.classList.add('hidden');
}

document.getElementById('info-close').addEventListener('click', hideInfoCard);

// Botón "Enfocar" dentro de la ficha
document.getElementById('info-focus')?.addEventListener('click', () => {
  if (currentInfoBodyId && state.planets[currentInfoBodyId]) {
    focusOn(currentInfoBodyId);
  }
});

// ---------- UI bindings ----------
const timeSpeed = document.getElementById('time-speed');
const timeSpeedVal = document.getElementById('time-speed-val');
timeSpeed.addEventListener('input', () => {
  state.timeScale = parseFloat(timeSpeed.value);
  timeSpeedVal.textContent = `${state.timeScale.toFixed(1)}×`;
});

document.getElementById('toggle-orbits').addEventListener('change', (e) => {
  state.showOrbits = e.target.checked;
});
document.getElementById('toggle-labels').addEventListener('change', (e) => {
  state.showLabels = e.target.checked;
});
document.getElementById('toggle-asteroids').addEventListener('change', (e) => {
  state.showAsteroids = e.target.checked;
});
document.getElementById('toggle-moons').addEventListener('change', (e) => {
  state.showMoons = e.target.checked;
});
document.getElementById('toggle-iss').addEventListener('change', (e) => {
  state.showISS = e.target.checked;
});
document.getElementById('toggle-stars').addEventListener('change', (e) => {
  state.showStars = e.target.checked;
});

// Botones de eventos
document.getElementById('btn-halley').addEventListener('click', () => {
  spawnComet(COMETS[0]);
});
document.getElementById('btn-comets').addEventListener('click', () => {
  COMETS.forEach((c, i) => setTimeout(() => spawnComet(c), i * 800));
});
document.getElementById('btn-launch').addEventListener('click', () => {
  launchSatellite();
});
document.getElementById('btn-reset').addEventListener('click', () => {
  camera.position.set(0, 50, 90);
  controls.target.set(0, 0, 0);
  controls.update();
  hideInfoCard();
});

// Planet jump pills
const planetJump = document.getElementById('planet-jump');
const jumpBodies = [
  { id: 'sun', label: 'Sol' },
  ...SOLAR_DATA.planets.map((p) => ({ id: p.id, label: p.name })),
];
jumpBodies.forEach((b) => {
  const btn = document.createElement('button');
  btn.textContent = b.label;
  btn.addEventListener('click', () => focusOn(b.id));
  planetJump.appendChild(btn);
});

// Estado de la animación de enfoque actual (para cancelarla si llega otra)
let activeFocusId = null;

function focusOn(id) {
  const target = state.planets[id];
  if (!target) return;

  // Cancela cualquier focusOn en curso
  activeFocusId = id;
  const myFocusId = id;

  // Posición del planeta (puede estar en movimiento orbital)
  const getTargetPos = () => {
    const p = new THREE.Vector3();
    target.getWorldPosition(p);
    return p;
  };

  // Calcular distancia adecuada al astro
  const radius = id === 'sun'
    ? SOLAR_DATA.sun.radius
    : (SOLAR_DATA.planets.find((p) => p.id === id)?.radius || 1);
  // Distancia: 4× radio para gigantes, mínimo 6 unidades, más para el Sol
  const dist = Math.max(radius * 4.5, id === 'sun' ? 26 : 6);

  // Estado inicial
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();

  // Vector de offset relativo al planeta (un poco arriba y al lado)
  const offset = new THREE.Vector3(dist * 0.7, dist * 0.45, dist * 0.7);

  const duration = 1800; // ms — más cinemático
  const t0 = performance.now();

  function step() {
    if (activeFocusId !== myFocusId) return; // cancelado por otro focusOn

    const t = Math.min((performance.now() - t0) / duration, 1);
    // easeInOutCubic — arranque y final suaves, tránsito acelerado
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Recalcular targetPos cada frame porque el planeta sigue orbitando
    const targetPos = getTargetPos();
    const endPos = targetPos.clone().add(offset);

    camera.position.lerpVectors(startPos, endPos, ease);
    controls.target.lerpVectors(startTarget, targetPos, ease);
    controls.update();

    if (t < 1) requestAnimationFrame(step);
    else {
      activeFocusId = null;
      const body = state.bodies.find((b) => b.mesh === target);
      if (body) showInfoCard(body.info);
    }
  }
  step();
}

// Help modal
const helpModal = document.getElementById('help-modal');
document.getElementById('btn-help').addEventListener('click', () => {
  helpModal.classList.remove('hidden');
});
document.getElementById('help-close').addEventListener('click', () => {
  helpModal.classList.add('hidden');
});
helpModal.addEventListener('click', (e) => {
  if (e.target === helpModal) helpModal.classList.add('hidden');
});

// Esc cierra ficha y modal
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideInfoCard();
    helpModal.classList.add('hidden');
  }
});

// ---------- Resize ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// (El modal de ayuda inicial se dispara al final de la intro cinemática
//  en updateIntro(), no aquí, para no interrumpir la cinemática.)
