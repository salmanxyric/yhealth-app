"use client";

import { Vector2 } from "three";
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { POST_PROCESSING } from "../constants";

interface PostProcessingEffectsProps {
  bloomIntensity?: number;
}

export function PostProcessingEffects({
  bloomIntensity,
}: PostProcessingEffectsProps) {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={POST_PROCESSING.bloom.luminanceThreshold}
        intensity={bloomIntensity ?? POST_PROCESSING.bloom.intensity}
        mipmapBlur={POST_PROCESSING.bloom.mipmapBlur}
      />
      <Vignette
        offset={POST_PROCESSING.vignette.offset}
        darkness={POST_PROCESSING.vignette.darkness}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration
        offset={
          new Vector2(
            POST_PROCESSING.chromaticAberration.offset,
            POST_PROCESSING.chromaticAberration.offset
          )
        }
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        opacity={POST_PROCESSING.noise.opacity}
        premultiply={POST_PROCESSING.noise.premultiply}
        blendFunction={BlendFunction.SCREEN}
      />
    </EffectComposer>
  );
}
