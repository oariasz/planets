# Planets — Sistema Solar Interactivo

Demostración web 3D del sistema solar para Estratek. Construida con Three.js (sin build, ES modules + importmap), totalmente estática y autocontenida.

URL pública prevista: **https://demo.estratekdata.com/planets/**

---

## Características

- Sistema solar completo: Sol + 8 planetas + lunas principales (Luna, Ío, Europa, Ganímedes, Calisto, Titán, Rea, Fobos, Deimos, Tritón).
- **Tierra con sombra día/noche dinámica** (shader custom) que se actualiza con la posición del Sol en tiempo real.
- Nubes, halo atmosférico, anillos de Saturno y Urano.
- **Cinturón de asteroides** entre Marte y Júpiter.
- **Estación Espacial Internacional (ISS)** orbitando la Tierra con inclinación real de 51,6°.
- **Cometas**: Halley, Hale-Bopp, NEOWISE — con núcleo, halo y cola de partículas.
- **Lanzamiento animado de satélites** desde la Tierra con trayectoria de subida + órbita.
- **Fichas didácticas**: hover muestra etiqueta, click muestra ficha completa con datos y curiosidades.
- Controles totalmente con ratón: scroll = zoom, click+drag = rotar, click derecho = paneo.
- Control de velocidad temporal (0–10×).
- Toggles para órbitas, etiquetas, cinturón, lunas, ISS y estrellas.
- Branding Estratek en barra superior y pantalla de carga.
- Tema dark cosmic con glassmorphism, animaciones suaves.

---

## Estructura

```
planets/
├── index.html              # entrada
├── css/styles.css          # estilos (tema dark + glass)
├── js/
│   ├── main.js             # entrada Three.js, escena, controles, UI
│   ├── data.js             # datos de planetas, cometas, ISS
│   └── shaders.js          # shaders custom (día/noche, atmósfera)
├── assets/
│   └── estratek-logo.svg   # logo
├── deploy/
│   ├── apache-vhost.conf   # snippet para Apache (demo.estratekdata.com)
│   └── README-DEPLOY.md    # instrucciones de despliegue
├── create_repo.sh          # crea repo GitHub con gh CLI
├── .gitignore
└── README.md
```

---

## Ejecutar en local

No requiere build. Cualquier servidor estático sirve.

```bash
# Opción 1: Python
python3 -m http.server 3112

# Opción 2: Node
npx serve -l 3112 .

# Opción 3: PHP
php -S localhost:3112
```

Luego abre http://localhost:3112/ en el navegador.

> El puerto 3112 está reservado para autosocial según la auditoría ETK Web; en local cualquier puerto sirve.

---

## Crear el repositorio en GitHub

```bash
# autenticarse una vez si no lo has hecho
gh auth login

# desde la raíz del proyecto
./create_repo.sh
```

Variables opcionales:

```bash
REPO_NAME=planets \
REPO_VISIBILITY=public \
GH_OWNER=mi-usuario \
./create_repo.sh
```

---

## Despliegue en demo.estratekdata.com/planets

Ver `deploy/README-DEPLOY.md`. Resumen:

1. Clonar el repo en `/opt/estratek/planets` en el servidor `etk-web`.
2. Apache sirve el contenido estático bajo el path `/planets/` del vhost `demo.estratekdata.com`.
3. No requiere contenedor, runtime ni puertos — es 100% estático.
4. Snippet de Apache en `deploy/apache-vhost.conf`.

Esta app **no toca** rutas protegidas (`/invoicer/`, `/news_scraper/`, etc.) ni servicios legacy.

---

## Tecnología

- **Three.js 0.160** (vía esm.sh / unpkg CDN, sin npm install).
- ES Modules + importmap nativo del navegador — sin bundler.
- Texturas reales de planetas:
  - Tierra (day/night/clouds/specular): `threejs.org/examples/textures/planets/` (NASA).
  - Resto de planetas: `cdn.jsdelivr.net/gh/jeromeetienne/threex.planets` (NASA/USGS public domain).

---

## Créditos

- Texturas planetarias: NASA / USGS (dominio público) vía repositorios públicos.
- Diseño y desarrollo: Estratek.
- Datos planetarios: NASA Planetary Fact Sheet.

---

© 2026 Estratek — Demostración técnica.
