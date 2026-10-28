/**
 * Three.js stage for the home hero: brand wave-line backdrop + the three product models,
 * which rise from below the card, ease into place with a lean and drift with the pointer.
 * Loaded lazily so three.js stays out of the initial bundle.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

type Box = { cx: number; cy: number; h: number; w: number };
type Opts = {
  canvas: HTMLCanvasElement; hero: HTMLElement; models: string[]; accents: string[]; squiggle: string;
  placement: { desk: Box; tilt: number; rest: number; sway: number; sq: { cx: number; cy: number; w: number } }[];
  copyFor: (i: number) => HTMLElement | undefined; onFirstLoad: () => void; initial: number;
};

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes, uMouse, uFocus; uniform float uTime, uReveal, uLines; uniform vec3 uTint;
vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0); m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw; return 130.0 * dot(m, g);
}
void main(){
  float asp = uRes.x / uRes.y;
  vec2 p = vec2((vUv.x - .5) * asp, vUv.y - .5);
  vec2 fc = vec2((uFocus.x - .5) * asp, uFocus.y - .5);
  vec2 m = vec2((uMouse.x - .5) * asp, uMouse.y - .5);
  float t = uTime;
  float r = length(p - fc);
  vec3 col = mix(vec3(0.035, 0.17, 0.52), vec3(0.016, 0.07, 0.25), smoothstep(0.0, 1.1, r));
  col += vec3(0.05, 0.36, 0.85) * exp(-r * r * 3.0) * 0.55;
  vec2 b1 = fc + vec2(0.16 * sin(t * 0.13), 0.10 * cos(t * 0.11)) + vec2(0.06, -0.05);
  vec2 b2 = fc + vec2(-0.22 + 0.08 * cos(t * 0.09), 0.18 + 0.06 * sin(t * 0.12));
  col += uTint * exp(-dot(p - b1, p - b1) * 9.0) * 0.30;
  col += mix(vec3(0.35, 0.55, 1.0), uTint, 0.5) * exp(-dot(p - b2, p - b2) * 12.0) * 0.10;
  col += vec3(0.02, 0.06, 0.18) * exp(-dot(p - m, p - m) * 6.0) * 0.6;
  float f = p.x * 0.95 + p.y * 0.42;
  f += 0.30 * sin(p.y * 2.1 + t * 0.10 + sin(p.x * 1.4 - t * 0.06) * 1.5);
  f += 0.16 * snoise(p * 0.9 + vec2(t * 0.022, -t * 0.016));
  f += 0.06 * exp(-dot(p - fc, p - fc) * 5.0);
  float fl = f * uLines; float w = fwidth(fl);
  float dist = (0.5 - abs(fract(fl) - 0.5)) / max(w, 1e-4);
  float line = 1.0 - smoothstep(0.55, 1.55, dist);
  float reveal = smoothstep(uReveal * 2.4, uReveal * 2.4 - 0.45, r);
  float la = (0.03 + 0.10 * exp(-r * r * 2.6)) * reveal;
  col = mix(col, mix(vec3(0.72, 0.84, 1.0), uTint, 0.35), line * la);
  col *= 1.0 - 0.18 * smoothstep(0.55, 1.25, length(vec2((vUv.x - .5) * asp, vUv.y - .5)));
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - .5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

export async function createStage(o: Opts) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 900 ? 1.75 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(22, 1, 0.05, 60);
  camera.position.set(0, 0.25, 6); camera.lookAt(0, 0, 0); scene.add(camera);

  const bgU = {
    uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(.6, .5) },
    uFocus: { value: new THREE.Vector2(.62, .5) }, uReveal: { value: reduce ? 1 : 0 }, uTint: { value: new THREE.Color(o.accents[o.initial]) }, uLines: { value: 34 },
  };
  const BG = 40;
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    uniforms: bgU, depthWrite: false, fragmentShader: FRAG,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
  }));
  bg.position.z = -BG; bg.frustumCulled = false; bg.renderOrder = -10; camera.add(bg);

  scene.add(new THREE.HemisphereLight(0xbcd6ff, 0x0a1650, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(-2.5, 3.5, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0x9ccaff, 0.55); fill.position.set(3, 0.5, 3); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 1.6); rim.position.set(2.5, 2, -3); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xffffff, 0.9); rim2.position.set(-3, 1, -2.5); scene.add(rim2);

  /* Brand squiggle per product, on a plane set behind the model so the model covers it. The texture is baked
     once: each stroke pixel's red channel holds how far along the path it is (0..1), so a shader can
     "draw on" the line by thresholding against uDraw, with no per-frame canvas redraw or texture upload. */
  const SQ_VB = { x: -20, y: -20, w: 300, h: 280 }, SQ_Z = -1.2, SQ_PX = 3;
  const sqTex = (() => {
    const c = document.createElement('canvas'); c.width = SQ_VB.w * SQ_PX; c.height = SQ_VB.h * SQ_PX;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(SQ_PX, 0, 0, SQ_PX, -SQ_VB.x * SQ_PX, -SQ_VB.y * SQ_PX);
    ctx.lineWidth = 11; ctx.lineCap = 'round';
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path'); el.setAttribute('d', o.squiggle);
    const len = el.getTotalLength(), N = 480;
    let prev = el.getPointAtLength(0);
    for (let k = 1; k <= N; k++) {
      const pt = el.getPointAtLength(len * k / N);
      ctx.strokeStyle = `rgb(${Math.round(255 * k / N)},0,0)`;
      ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(pt.x, pt.y); ctx.stroke(); prev = pt;
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.NoColorSpace; return tex;
  })();
  const SQ_FRAG = /* glsl */ `
    varying vec2 vUv; uniform sampler2D uMap; uniform vec3 uColor; uniform float uDraw, uFade;
    void main(){
      vec4 t = texture2D(uMap, vUv);
      float a = t.a * smoothstep(uDraw + 0.004, uDraw - 0.004, t.r) * uFade;
      if (a < 0.003) discard;
      gl_FragColor = vec4(uColor, a);
      #include <colorspace_fragment>
    }`;
  const squiggles = o.accents.map(color => {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: sqTex }, uColor: { value: new THREE.Color(color) }, uDraw: { value: 0 }, uFade: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: SQ_FRAG, transparent: true, depthWrite: false, toneMapped: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); mesh.visible = false; mesh.renderOrder = -5; scene.add(mesh);
    return { mat, mesh, y: 0 };
  });
  renderer.initTexture(sqTex);
  const sqPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -SQ_Z);

  type Slot = { i: number; root: THREE.Group; tilt: THREE.Group; spin: THREE.Group; loaded: boolean; size: THREE.Vector3; state: 'hidden' | 'entering' | 'in' | 'leaving'; t: number; yawDrag: number; scale: number; pos: THREE.Vector3; offY: number };
  const slots: Slot[] = o.models.map((_, i) => {
    const root = new THREE.Group(); root.visible = false; scene.add(root);
    const tilt = new THREE.Group(); root.add(tilt);
    const spin = new THREE.Group(); tilt.add(spin);
    return { i, root, tilt, spin, loaded: false, size: new THREE.Vector3(1, 1, 1), state: 'hidden', t: 0, yawDrag: 0, scale: 1, pos: new THREE.Vector3(), offY: 2 };
  });

  let current = o.initial, W = 1, H = 1, mobile = false, firstDone = false, disposed = false;
  const ray = new THREE.Raycaster(), plane0 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), v2 = new THREE.Vector2(), hit = new THREE.Vector3();
  const toPlane = (fx: number, fy: number, pl = plane0) => { v2.set(fx * 2 - 1, -(fy * 2 - 1)); ray.setFromCamera(v2, camera); ray.ray.intersectPlane(pl, hit); return hit.clone(); };

  const boxFor = (i: number): Box => {
    if (!mobile) return o.placement[i].desk;
    const copy = o.copyFor(i);
    const top = copy ? (copy.offsetTop + copy.offsetHeight + 24) / H : .55;
    const avail = 1 - top;
    if (i === 1) return { cx: .5, cy: top + avail * 0.47, h: avail * 0.72, w: .84 };
    const h = avail * (i === 0 ? 1.0 : 1.12);
    return { cx: i === 0 ? .54 : .5, cy: top + h / 2 + 0.02, h, w: i === 0 ? .42 : .62 };
  };

  const tint = new THREE.Color(o.accents[current]), tintTarget = tint.clone();
  const focus = new THREE.Vector2(.62, .5), focusTarget = focus.clone();
  const tmp = new THREE.Vector3();
  const updateFocus = (snap = false) => {
    const s = slots[current];
    if (s.loaded) { tmp.copy(s.pos).project(camera); focusTarget.set((tmp.x + 1) / 2, (tmp.y + 1) / 2); }
    if (snap) focus.copy(focusTarget);
  };

  const layout = () => {
    mobile = innerWidth < 900;
    if (mobile) {
      let need = 0;
      for (let i = 0; i < slots.length; i++) { const c = o.copyFor(i); if (c) need = Math.max(need, c.offsetTop + c.offsetHeight); }
      o.hero.style.setProperty('--mh', Math.max(innerHeight - o.hero.offsetTop - 8, need + 24 + 400) + 'px');
    } else o.hero.style.removeProperty('--mh');
    const r = o.hero.getBoundingClientRect(); W = r.width; H = r.height;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    bgU.uRes.value.set(W, H);
    const hh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * BG;
    bg.scale.set(hh * 2 * camera.aspect, hh * 2, 1);
    for (const s of slots) {
      if (!s.loaded) continue;
      const b = boxFor(s.i);
      const c = toPlane(b.cx, b.cy), t = toPlane(b.cx, b.cy - b.h / 2), bt = toPlane(b.cx, b.cy + b.h / 2);
      const L = toPlane(b.cx - b.w / 2, b.cy), R = toPlane(b.cx + b.w / 2, b.cy);
      s.scale = Math.min((t.y - bt.y) / s.size.y, (R.x - L.x) / (Math.max(s.size.x, s.size.z) * 1.08));
      s.pos.copy(c); s.root.scale.setScalar(s.scale);
      s.offY = (t.y - toPlane(b.cx, 1.25).y) + s.size.y * s.scale;
    }
    squiggles.forEach((q, i) => {
      const a = o.placement[i].sq, c = toPlane(a.cx, a.cy, sqPlane);
      const w = toPlane(a.cx + a.w / 2, a.cy, sqPlane).x - toPlane(a.cx - a.w / 2, a.cy, sqPlane).x;
      q.mesh.position.copy(c); q.y = c.y; q.mesh.scale.set(w, w * SQ_VB.h / SQ_VB.w, 1);
    });
    updateFocus(true);
  };

  const show = (i: number) => {
    current = i;
    const someoneOut = slots.some(s => s.state === 'in' || s.state === 'entering');
    for (const s of slots) {
      if (!s.loaded) continue;
      if (s.i === i) { if (s.state !== 'in' && s.state !== 'entering') { s.state = 'entering'; s.t = someoneOut ? -0.32 : 0; s.yawDrag = 0; s.root.visible = true; } }
      else if (s.state === 'in' || s.state === 'entering') { s.state = 'leaving'; s.t = 0; }
    }
    tintTarget.set(o.accents[i]); updateFocus();
  };

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  // load the visible product first, then the rest
  const order = [current, ...slots.map(s => s.i).filter(i => i !== current)];
  (async () => {
    for (const i of order) {
      try {
        const gltf = await loader.loadAsync(o.models[i]);
        if (disposed) return;
        const s = slots[i], obj = gltf.scene;
        const box = new THREE.Box3().setFromObject(obj); const c = box.getCenter(new THREE.Vector3()); box.getSize(s.size);
        obj.position.set(-c.x, -c.y, -c.z);
        obj.traverse(m => {
          const mesh = m as THREE.Mesh; if (!mesh.isMesh) return;
          (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(mat => { (mat as THREE.MeshStandardMaterial).envMapIntensity = i === 0 ? 1.2 : 0.95; });
        });
        s.spin.add(obj); s.loaded = true; layout();
        // compile its shaders and upload its textures now, so its first appearance doesn't stall a frame
        const was = s.root.visible; s.root.visible = true; squiggles[i].mesh.visible = true;
        renderer.compile(scene, camera);
        obj.traverse(m => { const mesh = m as THREE.Mesh; if (!mesh.isMesh) return;
          (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(mat => Object.values(mat).forEach(v => { if (v instanceof THREE.Texture) renderer.initTexture(v); })); });
        s.root.visible = was; squiggles[i].mesh.visible = false;
        if (i === current) show(current);
        if (!firstDone) { firstDone = true; o.onFirstLoad(); }
      } catch (e) { console.error('model load failed', o.models[i], e); if (!firstDone) { firstDone = true; o.onFirstLoad(); } }
    }
  })();

  const mouse = new THREE.Vector2(), mouseS = new THREE.Vector2();
  let dragging = false, lastX = 0, dragVel = 0;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') mouse.set(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1);
    const r = o.canvas.getBoundingClientRect();
    bgU.uMouse.value.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    if (dragging) { const dx = e.clientX - lastX; lastX = e.clientX; dragVel = dx * 0.006; slots[current].yawDrag += dragVel; }
  };
  const onDown = (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; dragging = true; lastX = e.clientX; };
  const onUp = () => { dragging = false; };
  addEventListener('pointermove', onMove, { passive: true }); o.canvas.addEventListener('pointerdown', onDown); addEventListener('pointerup', onUp);
  const ro = new ResizeObserver(layout); ro.observe(o.hero);
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(o.hero);

  const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
  const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
  const easeIn = (x: number) => x * x * x;
  // no overshoot on entry: a product never rises past its resting spot (and over the card's top edge)
  const easeInOut = (x: number) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);
  const clock = new THREE.Clock(); let time = 0, raf = 0;
  const white = new THREE.Color(1, 1, 1);

  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), 0.1); time += dt;
    bgU.uReveal.value = reduce ? 1 : Math.min(1, time / 2.6);
    mouseS.lerp(mouse, 1 - Math.pow(0.001, dt));
    if (!dragging) { dragVel *= Math.pow(0.04, dt); slots[current].yawDrag += dragVel; }
    for (const s of slots) {
      if (!s.loaded || s.state === 'hidden') continue;
      s.t += dt;
      let rise = 1, spinIn = 0, tiltIn = 0;
      if (s.state === 'entering') {
        if (reduce) s.state = 'in';
        else { rise = easeOutQuart(clamp01(s.t / 1.25)); spinIn = 1 - easeOut(clamp01(s.t / 1.7)); tiltIn = 1 - easeOut(clamp01(s.t / 1.5)); if (s.t > 1.8) s.state = 'in'; }
      } else if (s.state === 'leaving') {
        if (reduce) { s.state = 'hidden'; s.root.visible = false; continue; }
        const k = clamp01(s.t / 0.6); rise = 1 - easeIn(k); spinIn = -easeIn(k) * 0.5; tiltIn = -easeIn(k) * 0.4;
        if (s.t > 0.62) { s.state = 'hidden'; s.root.visible = false; continue; }
      }
      const p = o.placement[s.i];
      const float = reduce ? 0 : Math.sin(time * 0.9 + s.i * 2) * 0.012 * s.size.y * s.scale;
      s.root.position.set(s.pos.x, s.pos.y + (rise - 1) * s.offY + float, s.pos.z);
      s.tilt.rotation.z = p.tilt * (1 - tiltIn * 0.9) + mouseS.x * -0.03;
      s.tilt.rotation.x = mouseS.y * 0.04;
      s.spin.rotation.y = p.rest + (reduce ? 0 : Math.sin(time * 0.32 + s.i) * p.sway * 0.35) + mouseS.x * 0.25 + s.yawDrag - spinIn * 1.9;
    }
    squiggles.forEach((q, i) => {
      const s = slots[i], on = !mobile && s.loaded && s.state !== 'hidden';
      q.mesh.visible = on; if (!on) return;
      const u = q.mat.uniforms;
      if (s.state === 'leaving') {
        // leave with the product: quick fade while dropping the way it does, so it never lingers into the next slide
        const k = clamp01(s.t / 0.22); u.uFade.value = 1 - k; q.mesh.position.y = q.y - easeIn(clamp01(s.t / 0.6)) * s.offY;
        if (k >= 1) q.mesh.visible = false;
      } else {
        u.uFade.value = 1; q.mesh.position.y = q.y;
        u.uDraw.value = reduce ? 1 : easeInOut(clamp01((s.t - 0.55) / 1.6));
      }
    });
    tint.lerp(tintTarget, 1 - Math.pow(0.02, dt)); bgU.uTint.value.copy(tint);
    rim.color.copy(tint).lerp(white, 0.45);
    focus.lerp(focusTarget, 1 - Math.pow(0.03, dt)); bgU.uFocus.value.copy(focus);
    bgU.uTime.value = reduce ? 0 : time;
    renderer.render(scene, camera);
  };
  layout(); frame();

  return {
    show,
    dragging: () => dragging,
    dispose: () => {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      removeEventListener('pointermove', onMove); o.canvas.removeEventListener('pointerdown', onDown); removeEventListener('pointerup', onUp);
      scene.traverse(obj => { const m = obj as THREE.Mesh; if (m.geometry) m.geometry.dispose(); const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : []; mats.forEach(mt => mt.dispose()); });
      sqTex.dispose();
      pmrem.dispose(); renderer.dispose();
    },
  };
}
