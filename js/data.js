// ============================================================
// Datos de los astros del sistema solar
// Fuentes: NASA Planetary Fact Sheet
// Escala didáctica: distancias y tamaños comprimidos para visualización
// ============================================================

// Base de texturas (jsdelivr sirve repos de GitHub con CORS adecuado)
export const TEX = 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/';

// Fallback textures (three.js oficial) para Tierra y Luna
export const TEX_THREE = 'https://threejs.org/examples/textures/planets/';

// ----- Sistema solar -----
// distance: unidades de escena (1 ud ≈ 10 millones de km en realidad)
// radius:   unidades de escena (sol está sobredimensionado para visibilidad pero más pequeño que realidad)
// orbit:    período orbital relativo a la Tierra (1 = 1 año)
// rotation: período de rotación relativo (1 = 1 día)

export const SOLAR_DATA = {
  sun: {
    name: 'Sol',
    type: 'Estrella · Tipo G2V',
    radius: 7,
    color: 0xffcb6f,
    texture: TEX + 'sunmap.jpg',
    description:
      'El Sol es la estrella central del sistema solar. Contiene el 99,86% de la masa total del sistema y proporciona la energía que sostiene la vida en la Tierra.',
    facts: [
      { label: 'Diámetro', value: '1 392 700 km' },
      { label: 'Masa', value: '1,989 × 10³⁰ kg' },
      { label: 'Temperatura sup.', value: '5 505 °C' },
      { label: 'Edad', value: '4 600 M de años' },
      { label: 'Tipo', value: 'Enana amarilla G2V' },
      { label: 'Composición', value: '73% H, 25% He' },
    ],
    curious:
      'Un grano de arena del tamaño de un alfiler del centro del Sol liberaría suficiente energía para matar a una persona a 150 km de distancia.',
  },

  planets: [
    {
      id: 'mercury',
      name: 'Mercurio',
      type: 'Planeta rocoso',
      radius: 0.55,
      distance: 14,
      orbit: 0.241,
      rotation: 58.65,
      tilt: 0.034,
      color: 0xb8b1a7,
      texture: TEX + 'mercurymap.jpg',
      bump: TEX + 'mercurybump.jpg',
      description:
        'Mercurio es el planeta más cercano al Sol y el más pequeño del sistema solar. Su superficie está cubierta de cráteres similares a los de la Luna.',
      facts: [
        { label: 'Diámetro', value: '4 879 km' },
        { label: 'Distancia al Sol', value: '57,9 M km' },
        { label: 'Año (terr.)', value: '88 días' },
        { label: 'Día (terr.)', value: '58,65 días' },
        { label: 'Lunas', value: '0' },
        { label: 'Gravedad', value: '3,7 m/s²' },
      ],
      curious:
        'Un día solar en Mercurio dura 176 días terrestres — más que su propio año.',
    },
    {
      id: 'venus',
      name: 'Venus',
      type: 'Planeta rocoso',
      radius: 0.95,
      distance: 19,
      orbit: 0.615,
      rotation: -243,
      tilt: 177.4,
      color: 0xe8c992,
      texture: TEX + 'venusmap.jpg',
      bump: TEX + 'venusbump.jpg',
      description:
        'Venus es el planeta más caliente del sistema solar. Su densa atmósfera de CO₂ atrapa el calor en un efecto invernadero descontrolado.',
      facts: [
        { label: 'Diámetro', value: '12 104 km' },
        { label: 'Distancia al Sol', value: '108,2 M km' },
        { label: 'Año (terr.)', value: '225 días' },
        { label: 'Día (terr.)', value: '243 días (retro)' },
        { label: 'Lunas', value: '0' },
        { label: 'Temperatura', value: '462 °C' },
      ],
      curious:
        'Venus gira al revés que la mayoría de planetas: en Venus el Sol sale por el oeste.',
    },
    {
      id: 'earth',
      name: 'Tierra',
      type: 'Planeta rocoso · habitable',
      radius: 1,
      distance: 26,
      orbit: 1,
      rotation: 1,
      tilt: 23.44,
      color: 0x4a90e2,
      // Texturas día/noche (three.js oficiales — muy estables)
      textureDay: TEX_THREE + 'earth_atmos_2048.jpg',
      textureNight: TEX_THREE + 'earth_lights_2048.png',
      textureSpec: TEX_THREE + 'earth_specular_2048.jpg',
      textureClouds: TEX_THREE + 'earth_clouds_1024.png',
      description:
        'Único planeta conocido con vida. El 71% de su superficie está cubierta de agua líquida y posee una atmósfera rica en nitrógeno y oxígeno.',
      facts: [
        { label: 'Diámetro', value: '12 742 km' },
        { label: 'Distancia al Sol', value: '149,6 M km' },
        { label: 'Año', value: '365,25 días' },
        { label: 'Día', value: '23 h 56 m' },
        { label: 'Lunas', value: '1 (la Luna)' },
        { label: 'Gravedad', value: '9,81 m/s²' },
      ],
      curious:
        'La Tierra es el único planeta no nombrado por un dios romano o griego — su nombre viene del germánico "erde", que significa suelo.',
      moons: [
        {
          name: 'Luna',
          radius: 0.27,
          distance: 2.2,
          orbit: 0.0748,
          texture: TEX_THREE + 'moon_1024.jpg',
        },
      ],
    },
    {
      id: 'mars',
      name: 'Marte',
      type: 'Planeta rocoso',
      radius: 0.53,
      distance: 34,
      orbit: 1.881,
      rotation: 1.026,
      tilt: 25.19,
      color: 0xc1440e,
      texture: TEX + 'marsmap1k.jpg',
      bump: TEX + 'marsbump1k.jpg',
      description:
        'Marte, el Planeta Rojo, tiene casquetes polares de hielo y los volcanes más grandes del sistema solar, como el Olympus Mons (22 km de altura).',
      facts: [
        { label: 'Diámetro', value: '6 779 km' },
        { label: 'Distancia al Sol', value: '227,9 M km' },
        { label: 'Año', value: '687 días' },
        { label: 'Día', value: '24 h 37 m' },
        { label: 'Lunas', value: '2 (Fobos, Deimos)' },
        { label: 'Gravedad', value: '3,71 m/s²' },
      ],
      curious:
        'El Olympus Mons en Marte es 2,5 veces más alto que el Monte Everest.',
      moons: [
        { name: 'Fobos', radius: 0.08, distance: 1.4, orbit: 0.0087, color: 0x8b7355 },
        { name: 'Deimos', radius: 0.06, distance: 1.9, orbit: 0.0345, color: 0x9b8265 },
      ],
    },
    {
      id: 'jupiter',
      name: 'Júpiter',
      type: 'Gigante gaseoso',
      radius: 3.5,
      distance: 55,
      orbit: 11.86,
      rotation: 0.41,
      tilt: 3.13,
      color: 0xd8ca9d,
      texture: TEX + 'jupitermap.jpg',
      description:
        'Júpiter es el planeta más grande del sistema solar. Su Gran Mancha Roja es una tormenta anticiclónica que lleva activa al menos 350 años.',
      facts: [
        { label: 'Diámetro', value: '139 820 km' },
        { label: 'Distancia al Sol', value: '778,5 M km' },
        { label: 'Año', value: '11,86 años' },
        { label: 'Día', value: '9 h 56 m' },
        { label: 'Lunas', value: '95 conocidas' },
        { label: 'Composición', value: '90% H, 10% He' },
      ],
      curious:
        'Júpiter tiene más masa que todos los demás planetas juntos multiplicada por 2,5.',
      moons: [
        { name: 'Ío', radius: 0.18, distance: 4.5, orbit: 0.0048, color: 0xffd700 },
        { name: 'Europa', radius: 0.16, distance: 5.2, orbit: 0.0097, color: 0xc7b699 },
        { name: 'Ganímedes', radius: 0.26, distance: 6.2, orbit: 0.0196, color: 0x8e7a65 },
        { name: 'Calisto', radius: 0.24, distance: 7.3, orbit: 0.0457, color: 0x5c4a3a },
      ],
    },
    {
      id: 'saturn',
      name: 'Saturno',
      type: 'Gigante gaseoso · con anillos',
      radius: 3.0,
      distance: 78,
      orbit: 29.46,
      rotation: 0.45,
      tilt: 26.73,
      color: 0xead6b8,
      texture: TEX + 'saturnmap.jpg',
      description:
        'Saturno es conocido por su espectacular sistema de anillos, compuestos principalmente de hielo y polvo. Es el planeta menos denso — flotaría en agua.',
      facts: [
        { label: 'Diámetro', value: '116 460 km' },
        { label: 'Distancia al Sol', value: '1 433,5 M km' },
        { label: 'Año', value: '29,46 años' },
        { label: 'Día', value: '10 h 42 m' },
        { label: 'Lunas', value: '146 conocidas' },
        { label: 'Densidad', value: '0,687 g/cm³' },
      ],
      curious:
        'Si pudieras poner Saturno en un océano lo suficientemente grande, flotaría — es menos denso que el agua.',
      rings: {
        inner: 3.6,
        outer: 6.0,
        texture: TEX + 'saturnringcolor.jpg',
        alphaTexture: TEX + 'saturnringpattern.gif',
      },
      moons: [
        { name: 'Titán', radius: 0.2, distance: 7.5, orbit: 0.0437, color: 0xc9a47a },
        { name: 'Rea', radius: 0.1, distance: 6.2, orbit: 0.0124, color: 0xa39782 },
      ],
    },
    {
      id: 'uranus',
      name: 'Urano',
      type: 'Gigante helado',
      radius: 1.8,
      distance: 100,
      orbit: 84.01,
      rotation: -0.72,
      tilt: 97.77,
      color: 0xa8d5e2,
      texture: TEX + 'uranusmap.jpg',
      description:
        'Urano gira casi de lado, con su eje inclinado 98°. Sus anillos son verticales respecto al plano orbital, y su color azul se debe al metano atmosférico.',
      facts: [
        { label: 'Diámetro', value: '50 724 km' },
        { label: 'Distancia al Sol', value: '2 872,5 M km' },
        { label: 'Año', value: '84,01 años' },
        { label: 'Día', value: '17 h 14 m (retro)' },
        { label: 'Lunas', value: '27 conocidas' },
        { label: 'Temperatura', value: '-224 °C' },
      ],
      curious:
        'Urano gira de costado: cada polo recibe 42 años de luz solar seguidos por 42 años de oscuridad.',
      rings: {
        inner: 2.2,
        outer: 2.6,
        texture: TEX + 'uranusringcolour.jpg',
        alphaTexture: TEX + 'uranusringtrans.gif',
      },
    },
    {
      id: 'neptune',
      name: 'Neptuno',
      type: 'Gigante helado',
      radius: 1.75,
      distance: 122,
      orbit: 164.8,
      rotation: 0.67,
      tilt: 28.32,
      color: 0x4166f5,
      texture: TEX + 'neptunemap.jpg',
      description:
        'Neptuno es el planeta más lejano del Sol y tiene los vientos más fuertes del sistema solar, con velocidades de hasta 2 100 km/h.',
      facts: [
        { label: 'Diámetro', value: '49 244 km' },
        { label: 'Distancia al Sol', value: '4 495,1 M km' },
        { label: 'Año', value: '164,8 años' },
        { label: 'Día', value: '16 h 6 m' },
        { label: 'Lunas', value: '14 conocidas' },
        { label: 'Vientos máx.', value: '2 100 km/h' },
      ],
      curious:
        'Neptuno fue descubierto por cálculos matemáticos antes que por observación, en 1846.',
      moons: [
        { name: 'Tritón', radius: 0.13, distance: 3.0, orbit: -0.016, color: 0xd1c8b8 },
      ],
    },
  ],
};

// ----- Cometas famosos -----
export const COMETS = [
  {
    name: 'Halley',
    period: 75.3,
    semiMajor: 110,
    eccentricity: 0.967,
    inclination: 162,
    color: 0xa0f0ff,
    facts: [
      { label: 'Período', value: '75-76 años' },
      { label: 'Próximo paso', value: '2061' },
      { label: 'Último paso', value: '1986' },
    ],
    curious:
      'El cometa Halley aparece en el Tapiz de Bayeux (1066) y fue la primera vez que se identificó un cometa periódico.',
  },
  {
    name: 'Hale-Bopp',
    period: 2533,
    semiMajor: 200,
    eccentricity: 0.995,
    inclination: 89.4,
    color: 0xffffe0,
    facts: [
      { label: 'Período', value: '~2 533 años' },
      { label: 'Visible a simple vista', value: '18 meses (1996-97)' },
    ],
    curious:
      'Hale-Bopp fue visible a simple vista durante 18 meses, un récord histórico para cometas modernos.',
  },
  {
    name: 'NEOWISE',
    period: 6800,
    semiMajor: 280,
    eccentricity: 0.999,
    inclination: 128,
    color: 0xfff0d4,
    facts: [
      { label: 'Período', value: '~6 800 años' },
      { label: 'Descubierto', value: '27 marzo 2020' },
    ],
    curious:
      'NEOWISE fue uno de los cometas más brillantes visibles desde el hemisferio norte en 2020.',
  },
];

// ----- ISS Estación Espacial Internacional -----
export const ISS_INFO = {
  name: 'Estación Espacial Internacional',
  type: 'Estación orbital',
  description:
    'La ISS orbita la Tierra a unos 400 km de altitud y a 27 600 km/h. Es el objeto más grande construido por la humanidad en el espacio.',
  facts: [
    { label: 'Altitud media', value: '400 km' },
    { label: 'Velocidad orbital', value: '27 600 km/h' },
    { label: 'Período orbital', value: '92,7 min' },
    { label: 'Masa', value: '420 000 kg' },
    { label: 'Tripulación habitual', value: '6-7' },
    { label: 'En órbita desde', value: '1998' },
  ],
  curious:
    'La ISS completa 15,5 órbitas alrededor de la Tierra cada día — sus tripulantes ven 16 amaneceres y atardeceres al día.',
};
