export const gridRippleVertex = /* glsl */`
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const gridRippleFragment = /* glsl */`
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uBaseOpacity;
  uniform float uRippleOpacity;
  uniform float uRippleInterval;
  uniform float uRippleSpeed;
  uniform float uFadeRadius;
  uniform float uDissolve;

  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    // Anti-aliased grid lines at 0.5 unit spacing
    vec2 gridUv = vWorldPos.xz * 2.0;
    vec2 gridFract = fract(gridUv);
    vec2 gridDeriv = fwidth(gridUv);
    vec2 gridLine = smoothstep(vec2(0.0), gridDeriv * 1.5, gridFract) *
                    (1.0 - smoothstep(vec2(1.0) - gridDeriv * 1.5, vec2(1.0), gridFract));
    float gridMask = 1.0 - min(gridLine.x, gridLine.y);

    // Distance from center fade
    float dist = length(vWorldPos.xz);
    float distanceFade = 1.0 - smoothstep(uFadeRadius * 0.5, uFadeRadius, dist);

    // 3 overlapping ripple waves expanding from center, phased 0.33 apart
    float ripple = 0.0;
    for (int i = 0; i < 3; i++) {
      float phase = uTime * uRippleInterval + float(i) * 0.33333;
      float waveFront = fract(phase) * uFadeRadius * uRippleSpeed;
      float waveWidth = 1.5;
      float waveDist = abs(dist - waveFront);
      float waveFade = 1.0 - fract(phase); // fades as it expands
      ripple += smoothstep(waveWidth, 0.0, waveDist) * waveFade;
    }
    ripple = clamp(ripple, 0.0, 1.0);

    // Final opacity
    float opacity = gridMask * distanceFade * (uBaseOpacity + ripple * uRippleOpacity) * (1.0 - uDissolve);

    gl_FragColor = vec4(uColor, opacity);
  }
`;
