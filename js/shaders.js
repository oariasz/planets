// ============================================================
// Shaders para efectos especiales
// - Tierra: día/noche dinámico según posición del sol
// ============================================================

export const earthVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    // Normal en world space (incluye rotación del planeta y de su pivote padre)
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const earthFragmentShader = /* glsl */ `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform sampler2D specularMap;
  uniform vec3 sunDirection;       // dirección unitaria del planeta hacia el Sol
  uniform vec3 cameraWorldPos;     // posición de la cámara en world space

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 L = normalize(sunDirection);

    float cosAngle = dot(N, L);

    // Mezcla suave día/noche
    float dayMix = smoothstep(-0.12, 0.18, cosAngle);

    vec3 dayColor = texture2D(dayTexture, vUv).rgb;
    vec3 nightColor = texture2D(nightTexture, vUv).rgb * 1.5;

    vec3 color = mix(nightColor, dayColor, dayMix);

    // Brillo especular sobre océanos (specular map: oscuro = océano)
    float specMask = 1.0 - texture2D(specularMap, vUv).r;
    vec3 V = normalize(cameraWorldPos - vWorldPos);
    vec3 R = reflect(-L, N);
    float spec = pow(max(dot(R, V), 0.0), 24.0) * specMask;
    color += vec3(1.0, 0.95, 0.85) * spec * 0.6 * max(dayMix, 0.0);

    // Atmósfera azulada en el limbo (rim lighting) en la cara iluminada
    float rim = 1.0 - max(dot(N, V), 0.0);
    rim = pow(rim, 2.5);
    color += vec3(0.35, 0.6, 1.0) * rim * 0.35 * dayMix;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Shader para halo atmosférico (esfera ligeramente mayor que el planeta)
export const atmosphereVertexShader = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 atmoColor;
  uniform vec3 sunDirection;
  uniform vec3 cameraWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraWorldPos - vWorldPos);
    // Halo más visible en el limbo
    float intensity = pow(1.0 - max(dot(N, V), 0.0), 2.0);
    // Sólo en la cara iluminada
    float sunSide = max(dot(N, normalize(sunDirection)), 0.0);
    intensity *= 0.25 + 0.75 * sunSide;
    gl_FragColor = vec4(atmoColor, 1.0) * intensity;
  }
`;
