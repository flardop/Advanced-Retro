'use client';

import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Scanline, Vignette } from '@react-three/postprocessing';
import { Leva, useControls } from 'leva';
import * as THREE from 'three';
import { BlendFunction } from 'postprocessing';

type MotionValues = {
  flight: number;
};

type CameraPose = {
  position: THREE.Vector3;
  target: THREE.Vector3;
};

type BuildingInstance = {
  position: [number, number, number];
  scale: [number, number, number];
  rotationY: number;
  phase: number;
  tint: THREE.ColorRepresentation;
};

type BuildingGroupData = {
  geometry: THREE.ExtrudeGeometry;
  instances: BuildingInstance[];
};

type ParticleSeed = {
  base: THREE.Vector3;
  phase: number;
  amplitude: number;
};

type CityData = {
  bounds: number;
  buildingGroups: BuildingGroupData[];
  particleSeeds: ParticleSeed[];
  landmarkPositions: {
    plaza: THREE.Vector3;
    castAlley: THREE.Vector3;
    ascent: THREE.Vector3;
  };
};

type Props = {
  isMobile: boolean;
  motionRef: React.MutableRefObject<MotionValues>;
  progressRef: React.MutableRefObject<number>;
};

const TAU = Math.PI * 2;
const INTRO_CAMERA = {
  position: new THREE.Vector3(0, 126, 168),
  target: new THREE.Vector3(0, 0, 0),
};

const CAMERA_POSES: readonly CameraPose[] = [
  {
    position: new THREE.Vector3(18, 7.8, 26),
    target: new THREE.Vector3(0, 5.4, -2),
  },
  {
    position: new THREE.Vector3(7.4, 6.2, 11.2),
    target: new THREE.Vector3(0, 4.4, -6),
  },
  {
    position: new THREE.Vector3(-5.6, 4.6, 6.4),
    target: new THREE.Vector3(-2.2, 3.9, -8),
  },
  {
    position: new THREE.Vector3(30, 28, 32),
    target: new THREE.Vector3(0, 4, -6),
  },
] as const;

const cityCache = new Map<string, CityData>();

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function eased(value: number) {
  return 1 - Math.pow(1 - THREE.MathUtils.clamp(value, 0, 1), 3);
}

function buildFootprint(random: () => number) {
  const points: THREE.Vector2[] = [];
  const count = 5 + Math.floor(random() * 4);
  const baseRadius = 0.64 + random() * 0.42;

  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * TAU + (random() - 0.5) * 0.22;
    const radius = baseRadius * (0.7 + random() * 0.72);
    points.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }

  return points;
}

function createBuildingGeometry(random: () => number) {
  const shape = new THREE.Shape(buildFootprint(random));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 6,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function createCityData(isMobile: boolean) {
  const cacheKey = isMobile ? 'mobile' : 'desktop';
  const cached = cityCache.get(cacheKey);
  if (cached) return cached;

  const random = createSeededRandom(isMobile ? 4012 : 9077);
  const geometryCount = isMobile ? 6 : 9;
  const groupCount = isMobile ? 124 : 236;
  const particleCount = isMobile ? 500 : 2000;
  const bounds = isMobile ? 64 : 92;
  const geometries = Array.from({ length: geometryCount }, () => createBuildingGeometry(random));
  const buildingGroups = geometries.map((geometry) => ({
    geometry,
    instances: [] as BuildingInstance[],
  }));

  let created = 0;
  while (created < groupCount) {
    const radius = 8 + Math.pow(random(), 0.72) * (bounds - 6);
    const angle = random() * TAU;
    const x = Math.cos(angle) * radius + (random() - 0.5) * 4.8;
    const z = Math.sin(angle) * radius + (random() - 0.5) * 4.8;

    const insideStreet = Math.abs(x) < 9.5 && z > -18 && z < 38;
    const insidePlaza = Math.hypot(x, z + 4) < 12;
    if (insideStreet || insidePlaza) continue;

    const shapeIndex = Math.floor(random() * buildingGroups.length);
    const height = 2 + random() * 13;
    const width = 0.82 + random() * 1.28;
    const depth = 0.82 + random() * 1.42;
    const tint = random() > 0.72 ? '#252525' : random() > 0.34 ? '#1a1a1a' : '#111111';

    buildingGroups[shapeIndex].instances.push({
      position: [x, 0, z],
      scale: [width, height, depth],
      rotationY: random() * TAU,
      phase: random(),
      tint,
    });
    created += 1;
  }

  const particleSeeds = Array.from({ length: particleCount }, () => {
    const radius = 8 + random() * (bounds - 4);
    const angle = random() * TAU;
    return {
      base: new THREE.Vector3(
        Math.cos(angle) * radius,
        2 + random() * 16,
        Math.sin(angle) * radius
      ),
      phase: random() * TAU,
      amplitude: 0.8 + random() * 2.4,
    };
  });

  const data = {
    bounds,
    buildingGroups,
    particleSeeds,
    landmarkPositions: {
      plaza: new THREE.Vector3(0, 0, -4),
      castAlley: new THREE.Vector3(-3, 0, -14),
      ascent: new THREE.Vector3(20, 0, 20),
    },
  };

  cityCache.set(cacheKey, data);
  return data;
}

function sampleCameraPose(progress: number) {
  const clamped = THREE.MathUtils.clamp(progress, 0, 1);
  const scaled = clamped * (CAMERA_POSES.length - 1);
  const index = Math.floor(scaled);
  const nextIndex = Math.min(CAMERA_POSES.length - 1, index + 1);
  const mix = eased(scaled - index);

  const position = CAMERA_POSES[index].position.clone().lerp(CAMERA_POSES[nextIndex].position, mix);
  const target = CAMERA_POSES[index].target.clone().lerp(CAMERA_POSES[nextIndex].target, mix);
  return { position, target };
}

function GridFloor({ bounds }: { bounds: number }) {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          varying vec2 vUv;

          float gridLine(vec2 uv, vec2 scale) {
            vec2 scaledUv = uv * scale;
            vec2 grid = abs(fract(scaledUv - 0.5) - 0.5) / fwidth(scaledUv);
            return 1.0 - min(min(grid.x, grid.y), 1.0);
          }

          void main() {
            vec2 centered = vUv - 0.5;
            float edgeFade = 1.0 - smoothstep(0.26, 0.74, length(centered * 1.6));
            float fineGrid = gridLine(vUv, vec2(140.0));
            float crossGrid = gridLine(vUv, vec2(24.0)) * 0.45;
            float pulse = 0.64 + sin(uTime * 0.22 + vUv.x * 6.2831) * 0.12;

            vec3 base = vec3(0.055, 0.055, 0.055);
            vec3 line = vec3(0.75, 0.15, 0.11);
            vec3 color = mix(base, line, (fineGrid * 0.78 + crossGrid) * pulse);
            float alpha = edgeFade * (0.12 + fineGrid * 0.32 + crossGrid * 0.16);

            gl_FragColor = vec4(color, alpha);
          }
        `,
      }),
    []
  );

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.06, 0]}>
      <planeGeometry args={[bounds * 2.2, bounds * 2.2, 1, 1]} />
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}

function BuildingGroup({ group }: { group: BuildingGroupData }) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const shaderRef = useRef<any>(null);
  const geometry = useMemo(() => group.geometry.clone(), [group.geometry]);
  const material = useMemo(() => {
    const nextMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.94,
      metalness: 0.08,
      emissive: '#0e0e0e',
    });

    nextMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          attribute float instancePhase;
          attribute vec3 instanceTint;
          varying float vInstancePhase;
          varying vec3 vInstanceTint;`
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vInstancePhase = instancePhase;
          vInstanceTint = instanceTint;`
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform float uTime;
          varying float vInstancePhase;
          varying vec3 vInstanceTint;`
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          diffuseColor.rgb = mix(diffuseColor.rgb, vInstanceTint, 0.32);`
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          float verticalMask = 1.0 - step(0.84, abs(normalize(vNormal).y));
          vec2 windowUv = vUv * vec2(7.2, 14.0);
          float windowColumns = step(0.2, fract(windowUv.x)) * step(fract(windowUv.y), 0.86);
          float rowPulse = sin(uTime * 0.46 + vInstancePhase * 6.2831 + floor(vUv.y * 12.0) * 0.18) * 0.5 + 0.5;
          vec3 windowColor = mix(vec3(0.75, 0.18, 0.12), vec3(0.91, 0.63, 0.13), smoothstep(0.18, 0.86, fract(vInstancePhase * 4.4)));
          totalEmissiveRadiance += windowColor * windowColumns * verticalMask * mix(0.18, 1.0, rowPulse) * 1.12;`
        );

      shaderRef.current = shader;
    };

    return nextMaterial;
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    const tintArray = new Float32Array(group.instances.length * 3);
    const phaseArray = new Float32Array(group.instances.length);
    const helper = new THREE.Object3D();

    group.instances.forEach((instance, index) => {
      helper.position.set(...instance.position);
      helper.rotation.set(0, instance.rotationY, 0);
      helper.scale.set(...instance.scale);
      helper.updateMatrix();

      meshRef.current?.setMatrixAt(index, helper.matrix);
      const color = new THREE.Color(instance.tint);
      tintArray.set([color.r, color.g, color.b], index * 3);
      phaseArray[index] = instance.phase;
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    geometry.setAttribute('instancePhase', new THREE.InstancedBufferAttribute(phaseArray, 1));
    geometry.setAttribute('instanceTint', new THREE.InstancedBufferAttribute(tintArray, 3));
  }, [geometry, group.instances]);

  useFrame(({ clock }) => {
    if (!shaderRef.current) return;
    shaderRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  if (!group.instances.length) return null;

  return <instancedMesh ref={meshRef} args={[geometry, material, group.instances.length]} castShadow receiveShadow />;
}

function LandmarkCores({ positions }: { positions: CityData['landmarkPositions'] }) {
  const pulseRef = useRef<THREE.Group | null>(null);

  useFrame(({ clock }) => {
    if (!pulseRef.current) return;
    const elapsed = clock.getElapsedTime();
    pulseRef.current.children.forEach((child, index) => {
      child.position.y = 1.8 + Math.sin(elapsed * 0.46 + index * 0.65) * 0.24;
    });
  });

  return (
    <group ref={pulseRef}>
      <mesh position={[positions.plaza.x, 1.6, positions.plaza.z]}>
        <cylinderGeometry args={[1.4, 1.4, 3.2, 6, 1, true]} />
        <meshStandardMaterial color="#111111" emissive="#c0392b" emissiveIntensity={1.4} roughness={0.45} metalness={0.12} />
      </mesh>
      <mesh position={[positions.castAlley.x, 1.4, positions.castAlley.z]}>
        <boxGeometry args={[1.8, 2.8, 1.8]} />
        <meshStandardMaterial color="#161616" emissive="#e8a020" emissiveIntensity={1.1} roughness={0.38} metalness={0.14} />
      </mesh>
      <mesh position={[positions.ascent.x, 2.2, positions.ascent.z]}>
        <boxGeometry args={[1.4, 4.2, 1.4]} />
        <meshStandardMaterial color="#151515" emissive="#c0392b" emissiveIntensity={1.5} roughness={0.36} metalness={0.18} />
      </mesh>
    </group>
  );
}

function ParticleField({
  particleSeeds,
  bounds,
  pointerWorldRef,
}: {
  particleSeeds: ParticleSeed[];
  bounds: number;
  pointerWorldRef: React.MutableRefObject<THREE.Vector3 | null>;
}) {
  const pointsRef = useRef<THREE.Points | null>(null);
  const trailsRef = useRef<THREE.LineSegments | null>(null);
  const positionsRef = useRef<Float32Array>(new Float32Array(particleSeeds.length * 3));
  const trailCount = Math.min(260, Math.max(72, Math.floor(particleSeeds.length * 0.18)));
  const trailsRefArray = useRef<Float32Array>(new Float32Array(trailCount * 6));
  const color = useMemo(() => new THREE.Color('#c0392b'), []);
  const trailColor = useMemo(() => new THREE.Color('#e8a020'), []);

  useLayoutEffect(() => {
    particleSeeds.forEach((seed, index) => {
      positionsRef.current[index * 3] = seed.base.x;
      positionsRef.current[index * 3 + 1] = seed.base.y;
      positionsRef.current[index * 3 + 2] = seed.base.z;
    });
  }, [particleSeeds]);

  useFrame(({ clock }) => {
    if (!pointsRef.current || !trailsRef.current) return;

    const elapsed = clock.getElapsedTime();
    const pointerWorld = pointerWorldRef.current;
    const positions = positionsRef.current;
    const trails = trailsRefArray.current;

    particleSeeds.forEach((seed, index) => {
      const positionIndex = index * 3;
      const driftX = Math.sin(elapsed * 0.24 + seed.phase) * seed.amplitude + Math.sin(elapsed * 0.76 + seed.phase * 1.7) * 0.44;
      const driftY = Math.cos(elapsed * 0.28 + seed.phase * 0.9) * (seed.amplitude * 0.38);
      const driftZ = Math.cos(elapsed * 0.22 + seed.phase * 1.2) * seed.amplitude + Math.sin(elapsed * 0.62 + seed.phase) * 0.4;

      const targetX = THREE.MathUtils.clamp(seed.base.x + driftX, -bounds, bounds);
      const targetY = THREE.MathUtils.clamp(seed.base.y + driftY, 0.8, 18);
      const targetZ = THREE.MathUtils.clamp(seed.base.z + driftZ, -bounds, bounds);

      positions[positionIndex] = THREE.MathUtils.lerp(positions[positionIndex], targetX, 0.03);
      positions[positionIndex + 1] = THREE.MathUtils.lerp(positions[positionIndex + 1], targetY, 0.03);
      positions[positionIndex + 2] = THREE.MathUtils.lerp(positions[positionIndex + 2], targetZ, 0.03);

      if (pointerWorld) {
        const dx = positions[positionIndex] - pointerWorld.x;
        const dz = positions[positionIndex + 2] - pointerWorld.z;
        const distance = Math.hypot(dx, dz);

        if (distance < 8) {
          const safeDistance = Math.max(distance, 0.001);
          const force = (1 - safeDistance / 8) * 0.42;
          positions[positionIndex] += (dx / safeDistance) * force;
          positions[positionIndex + 2] += (dz / safeDistance) * force;
        }
      }
    });

    for (let index = 0; index < trailCount; index += 1) {
      const seed = particleSeeds[index * Math.floor(particleSeeds.length / trailCount || 1)];
      const sourceIndex = index * Math.floor(particleSeeds.length / trailCount || 1) * 3;
      const trailIndex = index * 6;
      const trailLength = 0.65 + Math.sin(elapsed * 0.5 + seed.phase) * 0.18;

      trails[trailIndex] = positions[sourceIndex];
      trails[trailIndex + 1] = positions[sourceIndex + 1];
      trails[trailIndex + 2] = positions[sourceIndex + 2];
      trails[trailIndex + 3] = positions[sourceIndex] - Math.sin(elapsed + seed.phase) * trailLength;
      trails[trailIndex + 4] = positions[sourceIndex + 1] - Math.cos(elapsed * 1.2 + seed.phase) * trailLength * 0.2;
      trails[trailIndex + 5] = positions[sourceIndex + 2] - Math.cos(elapsed + seed.phase) * trailLength;
    }

    const pointAttribute = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    pointAttribute.needsUpdate = true;

    const trailAttribute = trailsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    trailAttribute.needsUpdate = true;
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleSeeds.length}
            array={positionsRef.current}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          transparent
          opacity={0.72}
          size={0.24}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <lineSegments ref={trailsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={trailCount * 2}
            array={trailsRefArray.current}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={trailColor} transparent opacity={0.32} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </>
  );
}

function SceneCore({ isMobile, motionRef, progressRef }: Props) {
  const cityData = useMemo(() => createCityData(isMobile), [isMobile]);
  const lookAtRef = useRef(new THREE.Vector3(0, 4.8, 0));
  const pointerWorldRef = useRef<THREE.Vector3 | null>(null);
  const groundPlane = useMemo(
    () => new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 2.4, 0)),
    []
  );
  const aberrationOffset = useMemo(() => new THREE.Vector2(0.0013, 0.0013), []);
  const zeroAberrationOffset = useMemo(() => new THREE.Vector2(0, 0), []);
  const debugControls = useControls('Retroville scene', {
    bloomIntensity: { value: isMobile ? 0.94 : 1.55, min: 0.5, max: 2.6, step: 0.01 },
    bloomLuminance: { value: 0.18, min: 0, max: 1, step: 0.01 },
    grain: { value: isMobile ? 0.02 : 0.06, min: 0, max: 0.18, step: 0.005 },
    vignette: { value: isMobile ? 0.62 : 0.82, min: 0.2, max: 1.4, step: 0.01 },
    scanlines: { value: isMobile ? 0.06 : 0.1, min: 0, max: 0.3, step: 0.005 },
  });

  useFrame((state) => {
    const introPose = motionRef.current.flight;
    const storyPose = sampleCameraPose(progressRef.current);
    const basePosition = INTRO_CAMERA.position.clone().lerp(storyPose.position, eased(introPose));
    const baseTarget = INTRO_CAMERA.target.clone().lerp(storyPose.target, eased(introPose));
    const pointerInfluence = state.pointer.clone().multiplyScalar(isMobile ? 0.35 : 1);

    basePosition.x += pointerInfluence.x * 2.4;
    basePosition.y += pointerInfluence.y * 0.9;
    baseTarget.x += pointerInfluence.x * 5.2;
    baseTarget.y += pointerInfluence.y * 1.2;

    state.camera.position.lerp(basePosition, 0.05);
    lookAtRef.current.lerp(baseTarget, 0.05);
    state.camera.lookAt(lookAtRef.current);

    state.raycaster.setFromCamera(state.pointer, state.camera);
    const hit = state.raycaster.ray.intersectPlane(groundPlane, new THREE.Vector3());
    pointerWorldRef.current = hit || null;
  });

  return (
    <>
      <color attach="background" args={['#0e0e0e']} />
      <fog attach="fog" args={['#0e0e0e', 24, cityData.bounds * 1.6]} />

      <ambientLight intensity={0.48} color="#2a2624" />
      <hemisphereLight intensity={0.46} color="#544746" groundColor="#080808" />
      <directionalLight position={[16, 22, 8]} intensity={0.9} color="#f2d6bb" />
      <pointLight position={[0, 8, -6]} intensity={6.2} color="#c0392b" distance={26} />
      <pointLight position={[-6, 6, -14]} intensity={3.4} color="#e8a020" distance={18} />

      <group position={[0, -0.08, 0]}>
        <mesh receiveShadow rotation-x={-Math.PI / 2}>
          <planeGeometry args={[cityData.bounds * 2.4, cityData.bounds * 2.4]} />
          <meshStandardMaterial color="#111111" roughness={0.98} metalness={0.02} />
        </mesh>
      </group>

      <GridFloor bounds={cityData.bounds} />
      <LandmarkCores positions={cityData.landmarkPositions} />

      <group>
        {cityData.buildingGroups.map((group, index) => (
          <BuildingGroup key={`${index}-${group.instances.length}`} group={group} />
        ))}
      </group>

      <ParticleField particleSeeds={cityData.particleSeeds} bounds={cityData.bounds} pointerWorldRef={pointerWorldRef} />

      <EffectComposer multisampling={isMobile ? 0 : 2}>
        <Bloom
          intensity={debugControls.bloomIntensity}
          luminanceThreshold={debugControls.bloomLuminance}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={isMobile ? zeroAberrationOffset : aberrationOffset}
          radialModulation={!isMobile}
          modulationOffset={isMobile ? 0 : 0.26}
        />
        <Noise premultiply opacity={debugControls.grain} />
        <Scanline blendFunction={BlendFunction.OVERLAY} density={1.18} opacity={debugControls.scanlines} />
        <Vignette eskil offset={0.24} darkness={debugControls.vignette} />
      </EffectComposer>
    </>
  );
}

function RetrovilleImmersiveScene({ isMobile, motionRef, progressRef }: Props) {
  return (
    <>
      <Leva hidden />
      <Canvas
        shadows={false}
        dpr={[1, 1.5]}
        camera={{ position: [0, 126, 168], fov: 42, near: 0.1, far: 320 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <SceneCore isMobile={isMobile} motionRef={motionRef} progressRef={progressRef} />
      </Canvas>
    </>
  );
}

export default memo(RetrovilleImmersiveScene);
