export const energyFlowVertex = /* glsl */`
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const energyFlowFragment = /* glsl */`
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform float uEmissiveIntensity;
  uniform float uDissolve;

  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    // Fresnel edge detection
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 1.5);

    // Primary pulse traveling along edges
    float pulse = smoothstep(0.3, 1.0, sin(vPosition.x * 3.0 + vPosition.y * 2.0 + vPosition.z * 4.0 + uTime * 3.0));

    // Secondary pulse
    float pulse2 = smoothstep(0.5, 1.0, sin(vPosition.y * 5.0 - vPosition.z * 3.0 + uTime * 2.0)) * 0.5;

    // Combined energy
    float energy = (pulse + pulse2) * uEmissiveIntensity;

    // Final color
    vec3 color = uBaseColor * (fresnel * 0.4 + energy * 0.8 + 0.2);
    float alpha = (fresnel * 0.6 + 0.4) * (1.0 - uDissolve);

    gl_FragColor = vec4(color, alpha);
  }
`;
