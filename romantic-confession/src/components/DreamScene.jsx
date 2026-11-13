import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  Small deterministic helpers                                        */
/* ------------------------------------------------------------------ */

function mulberry32(seed) {
  let value = seed >>> 0;
  return function random() {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCloudTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const random = mulberry32(19);
  ctx.globalCompositeOperation = "lighter";

  // A cloud is a cluster of softly lit cotton puffs. Keeping the puffs
  // scattered around an oval core stops the cloud from looking like a smear.
  for (let index = 0; index < 56; index += 1) {
    const angle = random() * Math.PI * 2;
    const radial = Math.pow(random(), 1.28);
    const x = 0.5 + Math.cos(angle) * radial * 0.27;
    const y = 0.43 + Math.sin(angle) * radial * 0.17;
    const radius = 0.055 + random() * 0.115;
    const alpha = 0.08 + random() * 0.16;
    const gradient = ctx.createRadialGradient(
      x * size,
      y * size,
      0,
      x * size,
      y * size,
      radius * size,
    );
    gradient.addColorStop(0, `rgba(255, 250, 246, ${alpha})`);
    gradient.addColorStop(0.45, `rgba(255, 242, 238, ${alpha * 0.48})`);
    gradient.addColorStop(1, "rgba(255, 238, 235, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  // A cloud has a slightly flatter underside than top.
  ctx.globalCompositeOperation = "destination-out";
  const erase = ctx.createLinearGradient(0, size * 0.64, 0, size * 0.82);
  erase.addColorStop(0, "rgba(0,0,0,0)");
  erase.addColorStop(1, "rgba(0,0,0,0.46)");
  ctx.fillStyle = erase;
  ctx.fillRect(0, size * 0.62, size, size * 0.3);

  // Feather the outer edges so the cloud dissolves into the sky.
  ctx.globalCompositeOperation = "destination-in";
  const mask = ctx.createRadialGradient(size / 2, size * 0.45, size * 0.16, size / 2, size * 0.47, size * 0.48);
  mask.addColorStop(0, "rgba(255,255,255,1)");
  mask.addColorStop(0.74, "rgba(255,255,255,0.8)");
  mask.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function makeGlowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.16, "rgba(255,245,232,0.92)");
  gradient.addColorStop(0.45, "rgba(255,209,188,0.3)");
  gradient.addColorStop(1, "rgba(255,190,180,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeMountainNoise(seed = 7) {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  const hash = (x, y) => {
    let n = x * 374761393 + y * 668265263 + seed * 1442695041;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967295;
  };
  const fade = (t) => t * t * (3 - 2 * t);
  const value = (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = fade(x - xi);
    const yf = fade(y - yi);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
  const fbm = (x, y) => {
    let total = 0;
    let amplitude = 0.5;
    let frequency = 1;
    for (let octave = 0; octave < 4; octave += 1) {
      total += value(x * frequency, y * frequency) * amplitude;
      frequency *= 2.07;
      amplitude *= 0.46;
    }
    return total;
  };
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = fbm(x / 38, y / 30);
      const grain = 188 + n * 62;
      const index = (y * size + x) * 4;
      data[index] = grain;
      data[index + 1] = grain;
      data[index + 2] = grain;
      data[index + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.5, 2.2);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function makeMistTexture() {
  const width = 256;
  const height = 64;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.38, "rgba(255,255,255,0.22)");
  gradient.addColorStop(0.58, "rgba(255,255,255,0.62)");
  gradient.addColorStop(0.8, "rgba(255,255,255,0.14)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makePetalTexture() {
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(
    size * 0.42,
    size * 0.4,
    2,
    size * 0.5,
    size * 0.52,
    size * 0.48,
  );
  gradient.addColorStop(0, "rgba(255, 245, 246, 1)");
  gradient.addColorStop(0.55, "rgba(255, 206, 220, 0.9)");
  gradient.addColorStop(1, "rgba(247, 173, 199, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(size / 2, size / 2, size * 0.3, size * 0.46, -0.55, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* ------------------------------------------------------------------ */
/*  Sky details                                                        */
/* ------------------------------------------------------------------ */

function SunGlow() {
  const glow = useMemo(makeGlowTexture, []);
  return (
    <group position={[10.5, 7.6, -56]}>
      <sprite scale={[40, 40, 1]} renderOrder={-10}>
        <spriteMaterial
          map={glow}
          color="#ffd3b5"
          transparent
          opacity={0.62}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      <sprite scale={[5.2, 5.2, 1]} renderOrder={-9}>
        <spriteMaterial
          map={glow}
          color="#fff0dd"
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}

function Stars({ reducedMotion }) {
  const { geometry, material } = useMemo(() => {
    const count = 180;
    const random = mulberry32(91);
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (random() - 0.5) * 110;
      positions[i * 3 + 1] = 8 + random() * 34;
      positions[i * 3 + 2] = -30 - random() * 45;
      phases[i] = random() * Math.PI * 2;
      sizes[i] = 0.35 + random() * 1.1;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
      vertexShader: `
        attribute float aPhase;
        attribute float aSize;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uPixelRatio * (90.0 / max(1.0, -mv.z));
          float twinkle = 0.55 + 0.45 * sin(uTime * 0.55 + aPhase * 3.1);
          vAlpha = twinkle * smoothstep(-80.0, -25.0, position.z);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          float alpha = smoothstep(0.5, 0.05, d) * vAlpha;
          gl_FragColor = vec4(1.0, 0.93, 0.9, alpha * 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    return { geometry: geo, material: mat };
  }, []);

  useEffect(() => {
    material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
  }, [material]);

  useFrame(({ clock }) => {
    if (!reducedMotion) material.uniforms.uTime.value = clock.elapsedTime;
  });

  return <points geometry={geometry} material={material} renderOrder={-8} />;
}

/* ------------------------------------------------------------------ */
/*  Clouds                                                             */
/* ------------------------------------------------------------------ */

function CloudField({ reducedMotion, quality = "high" }) {
  const meshRef = useRef(null);
  const { camera } = useThree();
  const texture = useMemo(makeCloudTexture, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const layout = useMemo(() => {
    const random = mulberry32(27);
    const puffs = [];
    const spots = [
      [-28, 7.8, -40, 10.2, 0],
      [-15.5, 5.4, -30, 6.8, 1],
      [24, 9.2, -46, 11.4, 2],
      [32, 5.8, -34, 7.4, 0],
      [-34, 10.4, -52, 8.6, 1],
      [13, 11.2, -54, 7.8, 2],
      [1.5, 8.8, -36, 5.6, 0],
      [-6, 10.6, -48, 6.4, 1],
      [33, 10.8, -56, 6.9, 2],
    ];

    const chosen = quality === "low" ? spots.filter((_, index) => index % 2 === 0) : spots;
    for (const [x, y, z, scale, tint] of chosen) {
      const companions = quality === "low" ? 1 : 2;
      for (let companion = 0; companion < companions; companion += 1) {
        const size = companion === 0 ? scale : scale * (0.48 + random() * 0.18);
        puffs.push({
          x: x + (companion === 0 ? 0 : (random() - 0.5) * 7),
          y: y + (companion === 0 ? 0 : (random() - 0.5) * 2.4),
          z: z + companion * 1.5,
          sx: size * (0.85 + random() * 0.1),
          sy: size * (0.78 + random() * 0.16),
          phase: random() * Math.PI * 2,
          speed: 0.018 + random() * 0.03,
          drift: 1.4 + random() * 2.8,
          rotation: (random() - 0.5) * 0.14,
          tint: (tint + companion) % 3,
        });
      }
    }
    return puffs;
  }, [quality]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const tints = ["#ffe9dc", "#e2d7ff", "#fff0dd"];
    layout.forEach((puff, index) => {
      mesh.setColorAt(index, new THREE.Color(tints[puff.tint]));
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }, [layout]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const time = reducedMotion ? 0 : clock.elapsedTime;
    layout.forEach((puff, index) => {
      const x = puff.x + Math.sin(time * puff.speed + puff.phase) * puff.drift;
      const y = puff.y + Math.sin(time * 0.12 + puff.phase * 1.7) * 0.22;
      dummy.position.set(x, y, puff.z);
      dummy.quaternion.copy(camera.quaternion);
      dummy.rotateZ(puff.rotation + Math.sin(time * 0.05 + puff.phase) * 0.035);
      dummy.scale.set(puff.sx, puff.sy, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, layout.length]}
      frustumCulled={false}
      renderOrder={-4}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.3}
        depthWrite={false}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Mountains                                                          */
/* ------------------------------------------------------------------ */

function buildRidge({
  width,
  peakHeight,
  seed,
  colorBottom,
  colorTop,
  rimColor = "#f5cfc3",
  peakCount = 9,
  jag = 1,
}) {
  const random = mulberry32(seed);
  const steps = 180;
  const phases = [random() * 10, random() * 10, random() * 10];

  // A mountain range is built from sharp, overlapping peaks rather than soft
  // sine blobs. Taking the maximum of triangular peaks keeps valleys distinct
  // and gives the silhouette real ridges.
  const peaks = Array.from({ length: peakCount }, (_, index) => {
    const spread = 0.62 + random() * 0.45;
    return {
      x: -width * 0.52 + ((index + 0.5) / peakCount) * width * 1.04 + (random() - 0.5) * width * 0.09,
      halfWidth: (width / peakCount) * spread * (0.55 + random() * 0.45),
      height: peakHeight * (0.38 + random() * 0.72),
      shoulder: peakHeight * (0.12 + random() * 0.25),
    };
  });

  const points = [];
  let maxY = -Infinity;
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const x = -width / 2 + t * width;
    let y = -0.8;

    for (const peak of peaks) {
      const distance = Math.abs(x - peak.x) / peak.halfWidth;
      if (distance >= 1) continue;
      const triangular = peak.height * Math.pow(1 - distance, 1.55);
      const shoulder = peak.shoulder * Math.pow(1 - distance, 0.72);
      y = Math.max(y, triangular + shoulder * 0.4);
    }

    const detailEnvelope = Math.max(0, y) / Math.max(1, peakHeight);
    y +=
      (Math.sin(t * 46 + phases[0]) * 0.14 +
        Math.sin(t * 83 + phases[1]) * 0.07 +
        Math.sin(t * 131 + phases[2]) * 0.035) *
      jag *
      detailEnvelope;

    y = Math.max(-1.2, y);
    points.push(new THREE.Vector2(x, y));
    maxY = Math.max(maxY, y);
  }

  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -24);
  for (const point of points) shape.lineTo(point.x, point.y);
  shape.lineTo(width / 2, -24);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);

  const positions = geometry.attributes.position;
  const uvs = new Float32Array(positions.count * 2);
  for (let index = 0; index < positions.count; index += 1) {
    uvs[index * 2] = (positions.getX(index) + width / 2) / width;
    uvs[index * 2 + 1] = (positions.getY(index) + 24) / (maxY + 24);
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

  const colors = new Float32Array(positions.count * 3);
  const bottom = new THREE.Color(colorBottom);
  const top = new THREE.Color(colorTop);
  const rim = new THREE.Color(rimColor);
  const color = new THREE.Color();
  for (let index = 0; index < positions.count; index += 1) {
    const y = positions.getY(index);
    const blend = THREE.MathUtils.smoothstep(y, -3.5, maxY + 0.3);
    color.copy(bottom).lerp(top, Math.pow(blend, 0.82));
    const rimBlend = THREE.MathUtils.smoothstep(y, maxY - 1.8, maxY + 0.2);
    color.lerp(rim, rimBlend * 0.42);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  return { geometry, points, maxY };
}

function MountainRange({
  width,
  height,
  seed,
  colorBottom,
  colorTop,
  glowColor,
  position,
  opacity,
  phase,
  drift,
  renderOrder,
  peakCount = 9,
  jag = 1,
  texture,
  reducedMotion,
}) {
  const groupRef = useRef(null);
  const ridge = useMemo(
    () =>
      buildRidge({
        width,
        peakHeight: height,
        seed,
        colorBottom,
        colorTop,
        rimColor: glowColor,
        peakCount,
        jag,
      }),
    [width, height, seed, colorBottom, colorTop, glowColor, peakCount, jag],
  );

  const lineGeometry = useMemo(() => {
    const points = ridge.points.map((point) => new THREE.Vector3(point.x, point.y, 0.02));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [ridge]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group || reducedMotion) return;
    const time = clock.elapsedTime;
    group.position.y = position[1] + Math.sin(time * 0.09 + phase) * 0.11;
    group.position.x = Math.sin(time * 0.022 + phase * 1.7) * drift;
  });

  return (
    <group ref={groupRef} position={position} renderOrder={renderOrder}>
      <mesh geometry={ridge.geometry} renderOrder={renderOrder}>
        <meshBasicMaterial
          map={texture}
          vertexColors
          transparent
          opacity={opacity}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </mesh>
      <line geometry={lineGeometry} renderOrder={renderOrder + 1}>
        <lineBasicMaterial
          color={glowColor}
          transparent
          opacity={0.045}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </line>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Lake                                                               */
/* ------------------------------------------------------------------ */

function DreamLake({ reducedMotion }) {
  const materialRef = useRef(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color("#241b38") },
      uWarm: { value: new THREE.Color("#b97886") },
    }),
    [],
  );

  useFrame(({ clock }) => {
    if (materialRef.current && !reducedMotion) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh position={[0, -4.15, -13]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <planeGeometry args={[100, 62]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uDeep;
          uniform vec3 uWarm;
          varying vec2 vUv;

          float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }

          void main() {
            float depth = smoothstep(0.0, 0.9, vUv.y);
            vec3 color = mix(uDeep, uWarm, depth * 0.9);
            float wave = sin(vUv.y * 85.0 + uTime * 1.15 + sin(vUv.x * 22.0 + uTime * 0.35) * 2.4);
            float glitter = smoothstep(0.965, 1.0, wave);
            float column = exp(-pow((vUv.x - 0.66) * 5.5, 2.0)) * smoothstep(0.1, 0.85, vUv.y);
            float shimmer = glitter * (0.11 + 0.14 * hash(floor(vUv * 90.0)));
            color += vec3(1.0, 0.82, 0.72) * (shimmer + column * 0.09);
            float edge = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
            gl_FragColor = vec4(color, 0.55 * edge);
          }
        `}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Atmospheric mist                                                   */
/* ------------------------------------------------------------------ */

function MistBand({ position, scale, opacity, color, phase, speed, reducedMotion }) {
  const ref = useRef(null);
  const texture = useMemo(makeMistTexture, []);
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return;
    const time = clock.elapsedTime;
    ref.current.position.x = position[0] + Math.sin(time * speed + phase) * 3.5;
    ref.current.position.y = position[1] + Math.sin(time * 0.11 + phase) * 0.16;
  });
  return (
    <mesh ref={ref} position={position} renderOrder={2}>
      <planeGeometry args={scale} />
      <meshBasicMaterial
        map={texture}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Fireflies and petals                                               */
/* ------------------------------------------------------------------ */

function Fireflies({ reducedMotion, quality = "high" }) {
  const { geometry, material } = useMemo(() => {
    const count = quality === "low" ? 120 : 230;
    const random = mulberry32(73);
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color("#ffd8ba"),
      new THREE.Color("#ffc1cf"),
      new THREE.Color("#e6d6ff"),
    ];
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (random() - 0.5) * 38;
      positions[index * 3 + 1] = -3 + random() * 15;
      positions[index * 3 + 2] = -30 + random() * 33;
      phases[index] = random() * Math.PI * 2;
      sizes[index] = 1.2 + random() * 3.6;
      const chosen = palette[Math.floor(random() * palette.length)];
      colors[index * 3] = chosen.r;
      colors[index * 3 + 1] = chosen.g;
      colors[index * 3 + 2] = chosen.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
      vertexShader: `
        attribute float aPhase;
        attribute float aSize;
        attribute vec3 aColor;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.17 + aPhase * 2.3) * 1.6;
          p.y += sin(uTime * 0.21 + aPhase * 1.7) * 0.62;
          p.z += cos(uTime * 0.13 + aPhase * 2.9) * 0.8;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uPixelRatio * (62.0 / max(1.0, -mv.z));
          vColor = aColor;
          vAlpha = 0.28 + 0.72 * pow(0.5 + 0.5 * sin(uTime * 1.15 + aPhase * 4.2), 2.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          float alpha = smoothstep(0.5, 0.02, d) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    return { geometry: geo, material: mat };
  }, [quality]);

  useEffect(() => {
    material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
  }, [material]);

  useFrame(({ clock }) => {
    if (!reducedMotion) material.uniforms.uTime.value = clock.elapsedTime;
  });

  return <points geometry={geometry} material={material} renderOrder={5} />;
}

function Petals({ reducedMotion, quality = "high" }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const texture = useMemo(makePetalTexture, []);
  const petals = useMemo(() => {
    const random = mulberry32(411);
    return Array.from({ length: quality === "low" ? 16 : 30 }, () => ({
      x: (random() - 0.5) * 34,
      y: -4 + random() * 18,
      z: -22 + random() * 24,
      scale: 0.18 + random() * 0.38,
      speed: 0.35 + random() * 0.65,
      sway: 0.5 + random() * 1.8,
      phase: random() * Math.PI * 2,
      spin: (random() - 0.5) * 1.6,
    }));
  }, [quality]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const time = reducedMotion ? 0 : clock.elapsedTime;
    petals.forEach((petal, index) => {
      const y = ((petal.y - time * petal.speed + 24) % 24) - 6;
      dummy.position.set(
        petal.x + Math.sin(time * 0.24 + petal.phase) * petal.sway,
        y,
        petal.z,
      );
      dummy.rotation.set(
        time * 0.2 + petal.phase,
        time * 0.13 + petal.phase * 2,
        time * petal.spin,
      );
      dummy.scale.setScalar(petal.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, petals.length]}
      frustumCulled={false}
      renderOrder={6}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.72}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Camera                                                             */
/* ------------------------------------------------------------------ */

function CameraRig({ scrollRef, reducedMotion }) {
  const { camera } = useThree();
  const base = useRef(new THREE.Vector3(0, 2.0, 14));

  useFrame(({ pointer }, delta) => {
    if (reducedMotion) return;
    const scroll = scrollRef?.current ?? 0;
    const targetX = pointer.x * 0.85;
    const targetY = 2.0 + pointer.y * 0.34 + scroll * 1.05;
    const targetZ = 14 - scroll * 1.1;
    const damping = 1 - Math.exp(-delta * 1.9);
    camera.position.x += (targetX - camera.position.x) * damping;
    camera.position.y += (targetY - camera.position.y) * damping;
    camera.position.z += (targetZ - camera.position.z) * damping;
    camera.lookAt(0, 4.25 + scroll * 0.5, -30);
  });

  useEffect(() => {
    camera.position.copy(base.current);
    camera.lookAt(0, 4.25, -30);
  }, [camera]);

  return null;
}

/* ------------------------------------------------------------------ */
/*  Scene                                                              */
/* ------------------------------------------------------------------ */

function Scene({ scrollRef, reducedMotion, quality }) {
  const mountainTexture = useMemo(() => makeMountainNoise(7), []);

  return (
    <>
      <CameraRig scrollRef={scrollRef} reducedMotion={reducedMotion} />
      <SunGlow />
      <Stars reducedMotion={reducedMotion} />

      <CloudField reducedMotion={reducedMotion} quality={quality} />

      <MountainRange
        width={180}
        height={10.5}
        seed={12}
        peakCount={15}
        jag={1.35}
        colorBottom="#5a3c4b"
        colorTop="#c08b9b"
        glowColor="#f8cfc4"
        position={[0, -5.4, -66]}
        opacity={0.9}
        phase={0.2}
        drift={0.9}
        renderOrder={-1}
        texture={mountainTexture}
        reducedMotion={reducedMotion}
      />
      <MountainRange
        width={155}
        height={8.8}
        seed={37}
        peakCount={12}
        jag={1.15}
        colorBottom="#402c3e"
        colorTop="#946074"
        glowColor="#f2bcb7"
        position={[0, -5.0, -50]}
        opacity={0.95}
        phase={2.1}
        drift={0.7}
        renderOrder={0}
        texture={mountainTexture}
        reducedMotion={reducedMotion}
      />
      <MountainRange
        width={135}
        height={6.9}
        seed={64}
        peakCount={9}
        jag={0.98}
        colorBottom="#241a2b"
        colorTop="#5e3b4b"
        glowColor="#e7a6ad"
        position={[0, -4.5, -36]}
        opacity={0.98}
        phase={4.4}
        drift={0.5}
        renderOrder={1}
        texture={mountainTexture}
        reducedMotion={reducedMotion}
      />
      <MountainRange
        width={118}
        height={5.1}
        seed={88}
        peakCount={7}
        jag={0.82}
        colorBottom="#100c15"
        colorTop="#32202f"
        glowColor="#cf8e9f"
        position={[0, -4.1, -25]}
        opacity={1}
        phase={1.2}
        drift={0.35}
        renderOrder={2}
        texture={mountainTexture}
        reducedMotion={reducedMotion}
      />

      <MistBand
        position={[-8, -2.5, -31]}
        scale={[50, 3.2]}
        opacity={0.07}
        color="#ffc9c0"
        phase={0.5}
        speed={0.04}
        reducedMotion={reducedMotion}
      />
      <MistBand
        position={[10, -1.4, -40]}
        scale={[62, 4]}
        opacity={0.075}
        color="#e7c8ee"
        phase={2.7}
        speed={0.032}
        reducedMotion={reducedMotion}
      />
      <MistBand
        position={[0, -3.2, -17]}
        scale={[86, 7]}
        opacity={0.2}
        color="#e3ada7"
        phase={1.8}
        speed={0.026}
        reducedMotion={reducedMotion}
      />

      <DreamLake reducedMotion={reducedMotion} />

      <Fireflies reducedMotion={reducedMotion} quality={quality} />
      <Petals reducedMotion={reducedMotion} quality={quality} />
    </>
  );
}

export default function DreamScene({
  scrollRef,
  paused,
  reducedMotion,
  maxDpr = 1.65,
  quality = "high",
}) {
  return (
    <div className="dream-canvas" aria-hidden="true">
      <Canvas
        flat
        dpr={[1, maxDpr]}
        frameloop={paused || reducedMotion ? "demand" : "always"}
        camera={{ position: [0, 2.0, 14], fov: 45, near: 0.1, far: 220 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <Scene scrollRef={scrollRef} reducedMotion={reducedMotion} quality={quality} />
      </Canvas>
    </div>
  );
}
