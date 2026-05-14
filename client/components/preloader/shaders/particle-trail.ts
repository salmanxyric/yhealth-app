export const particleVertex = /* glsl */`
  attribute float aSize;
  attribute float aOpacity;
  attribute vec3 aColor;

  varying float vOpacity;
  varying vec3 vColor;

  void main() {
    vOpacity = aOpacity;
    vColor = aColor;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = max(1.0, aSize * (80.0 / -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const particleFragment = /* glsl */`
  varying float vOpacity;
  varying vec3 vColor;

  void main() {
    // Soft circle — discard corners outside the point circle
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.1, dist) * vOpacity;

    gl_FragColor = vec4(vColor, alpha);
  }
`;
