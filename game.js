// 월하무쌍 테스트 빌드: 2D 스프라이트를 3D 공간에 세우는 벨트스크롤 액션
import * as THREE from './lib/three.module.min.js';
THREE.ColorManagement.enabled = false;

const $ = (s) => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sign = (v) => (v >= 0 ? 1 : -1);

// ---------------------------------------------------------------- data
const HEROES = {
  h1_mujin: { name: '무진', sub: '화염검객', face: 'face_h1_mujin.jpg', cutin: 'cutin_h1_mujin.jpg', cutPos: '50% 37%', skillImg: 'name_hwaryongcham.webp', quote: '베어낸다.', color: 0xff7a1a, css: '#ff9a3a', hp: 100, speed: 4.5, shadow: 1.0, body: 0.3,
    combo: [{ dur: .36, hitAt: .12, range: 1.9, dmg: 10, kb: 2.6 }, { dur: .36, hitAt: .12, range: 1.9, dmg: 10, kb: 2.6 }, { dur: .62, hitAt: .24, range: 2.3, dmg: 20, kb: 5.5, down: true }] },
  h2_seolhwa: { name: '설화', sub: '빙월창', face: 'face_h2_seolhwa.jpg', cutin: 'cutin_h2_seolhwa.jpg', cutPos: '50% 34%', skillImg: 'name_bingwolchang.webp', quote: '얼어붙어라.', color: 0x7fd4ff, css: '#9fe0ff', hp: 90, speed: 4.2, shadow: 1.0, body: 0.3,
    combo: [{ dur: .4, hitAt: .14, range: 2.7, dmg: 8, kb: 2.8 }, { dur: .4, hitAt: .14, range: 2.7, dmg: 8, kb: 2.8 }, { dur: .66, hitAt: .27, range: 3.1, dmg: 18, kb: 5.5, down: true }] },
};
const ENEMIES = {
  e1_grunt: { name: '졸개', kind: 'melee', hp: 30, speed: 2.3, range: 1.3, dmg: 6, cd: 1.5, windup: .4, score: 100, shadow: 1.0, body: 0.3 },
  e2_spearman: { name: '창병', kind: 'melee', hp: 36, speed: 1.9, range: 2.35, dmg: 9, cd: 2.1, windup: .5, score: 150, shadow: 1.05, body: 0.3 },
  e3_archer: { name: '궁수', kind: 'archer', hp: 22, speed: 2.2, range: 6, dmg: 7, cd: 2.6, windup: .55, score: 150, shadow: 1.0, body: 0.3 },
  e4_brute: { name: '덩치', vr: 0.82, kind: 'melee', hp: 95, speed: 1.35, range: 1.75, dmg: 18, cd: 2.6, windup: .68, armor: true, heavy: true, score: 400, shadow: 1.7, body: 0.55 },
  e5_assassin: { name: '자객', vr: 1.12, kind: 'assassin', hp: 28, speed: 3.9, range: 1.25, dmg: 5, cd: 1.7, windup: .2, score: 250, shadow: 1.0, body: 0.3 },
  boss_heukrang: { name: '흑랑', kind: 'boss', hp: 460, speed: 1.75, range: 2.7, dmg: 16, cd: 2.2, windup: .58, armor: true, heavy: true, score: 3000, shadow: 2.2, body: 0.7 },
};
const SEGS = [
  { lockX: 11, tokens: 1, waves: [['e1_grunt', 'e1_grunt'], ['e1_grunt', 'e2_spearman', 'e1_grunt']] },
  { lockX: 27, tokens: 2, waves: [['e1_grunt', 'e3_archer', 'e2_spearman'], ['e5_assassin', 'e1_grunt', 'e3_archer', 'e1_grunt']] },
  { lockX: 43, tokens: 2, waves: [['e4_brute', 'e1_grunt', 'e1_grunt'], ['e2_spearman', 'e5_assassin', 'e3_archer', 'e4_brute']] },
  { lockX: 60, tokens: 2, boss: true, waves: [['boss_heukrang']] },
];
const Z_MIN = -2.2, Z_MAX = 1.5;
const CAM = { y: 2.9, z: 10.6, ty: 2.0 };
const STAGE_START = 6;

// ---------------------------------------------------------------- renderer
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0c1438, 9, 46);
const camera = new THREE.PerspectiveCamera(32, 2, 0.1, 200);
let halfW = 6;
const QS = new URLSearchParams(location.search);
const TOUCH = QS.has('touch') || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
// phones get the lighter sprite set and a lower render scale
const MOBILE = !window.__ASSETS && (QS.has('m') || (TOUCH && !QS.has('hd') && Math.min(screen.width, screen.height) < 820));
const CHAR_DIR = MOBILE ? 'assets/chars_m/' : 'assets/chars/';
// logical stage size. A phone held sideways with rotation lock on still reports portrait, so the stage is turned 90 degrees instead of asking the player to change settings.
const VIEW = { w: 1, h: 1, rot: false };
function resize() {
  const iw = window.innerWidth, ih = window.innerHeight;
  VIEW.rot = TOUCH && ih > iw; VIEW.w = VIEW.rot ? ih : iw; VIEW.h = VIEW.rot ? iw : ih;
  const st = $('#stage').style; st.width = VIEW.w + 'px'; st.height = VIEW.h + 'px'; st.transform = VIEW.rot ? 'rotate(90deg) translateY(-100%)' : 'none';
  st.setProperty('--sw', VIEW.w / 100 + 'px'); st.setProperty('--sh', VIEW.h / 100 + 'px');
  st.setProperty('--safeL', VIEW.rot ? 'env(safe-area-inset-top, 0px)' : 'env(safe-area-inset-left, 0px)'); st.setProperty('--safeR', VIEW.rot ? 'env(safe-area-inset-bottom, 0px)' : 'env(safe-area-inset-right, 0px)');
  const w = VIEW.w, h = VIEW.h;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 2));
  renderer.setSize(w, h, false);
  const aspect = w / h;
  camera.aspect = aspect;
  camera.fov = clamp(THREE.MathUtils.radToDeg(2 * Math.atan(0.56 / aspect)), 24, 62);
  camera.updateProjectionMatrix();
  const dist = Math.hypot(CAM.z, CAM.y - CAM.ty);
  halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist * aspect;
}
window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 250));
resize();

// ---------------------------------------------------------------- textures
const assetUrl = (u) => (window.__ASSETS && window.__ASSETS[u]) || u;
const loader = new THREE.TextureLoader();
const TEX = {};
async function loadTex(key, url, opt = {}) {
  const t = await loader.loadAsync(assetUrl(url));
  t.premultiplyAlpha = true;
  if (opt.sprite) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  if (opt.repeat) { t.wrapS = opt.mirror ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping; t.wrapT = opt.mirror ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping; }
  TEX[key] = t;
  return t;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.premultiplyAlpha = true;
  return t;
}
TEX.spark = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.75)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
TEX.shadow = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 4, 32, 32, 32); r.addColorStop(0, 'rgba(0,0,10,.9)'); r.addColorStop(.6, 'rgba(0,0,10,.5)'); r.addColorStop(1, 'rgba(0,0,10,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
TEX.streak = canvasTex(128, 32, (g) => { const r = g.createLinearGradient(0, 0, 128, 0); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(.7, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.beginPath(); g.ellipse(64, 16, 64, 7, 0, 0, 7); g.fill(); });
TEX.slash = canvasTex(256, 256, (g) => {
  g.translate(128, 128);
  for (let i = 0; i < 26; i++) {
    const k = i / 25; g.beginPath(); g.arc(-40 + k * 26, 0, 118 - k * 34, -1.15, 1.15);
    g.lineWidth = 3 + (1 - k) * 5; g.strokeStyle = `rgba(255,255,255,${0.05 + Math.pow(1 - k, 2) * 0.5})`; g.stroke();
  }
  g.beginPath(); g.arc(-40, 0, 118, -1.1, 1.1); g.lineWidth = 5; g.shadowColor = '#fff'; g.shadowBlur = 14; g.strokeStyle = 'rgba(255,255,255,1)'; g.stroke();
});
TEX.ring = canvasTex(256, 256, (g) => { const r = g.createRadialGradient(128, 128, 70, 128, 128, 128); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(.72, 'rgba(255,255,255,.9)'); r.addColorStop(.86, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 256, 256); });
TEX.arrow = canvasTex(128, 16, (g) => { g.strokeStyle = '#d9c9a0'; g.lineWidth = 3; g.beginPath(); g.moveTo(8, 8); g.lineTo(112, 8); g.stroke(); g.fillStyle = '#e8eefc'; g.beginPath(); g.moveTo(126, 8); g.lineTo(106, 2); g.lineTo(106, 14); g.fill(); g.fillStyle = '#a33'; g.fillRect(4, 3, 16, 10); });

const QUAD = new THREE.PlaneGeometry(1, 1);
function spriteMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: null }, uvRect: { value: new THREE.Vector4(0, 0, 1, 1) }, tint: { value: new THREE.Color(1, 1, 1) }, flashColor: { value: new THREE.Color(1, 1, 1) }, flash: { value: 0 }, opacity: { value: 1 }, fogColor: { value: new THREE.Color(0x0c1438) }, fogAmt: { value: 0 } },
    vertexShader: 'varying vec2 vUv; uniform vec4 uvRect; void main(){ vUv = uv*uvRect.zw + uvRect.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform sampler2D map; uniform vec3 tint; uniform vec3 flashColor; uniform vec3 fogColor; uniform float fogAmt; uniform float flash; uniform float opacity; varying vec2 vUv; void main(){ vec4 c = texture2D(map, vUv); if(c.a < 0.01) discard; vec3 rgb = mix(c.rgb*tint, flashColor*c.a, flash); rgb = mix(rgb, fogColor*c.a, fogAmt); gl_FragColor = vec4(rgb*opacity, c.a*opacity); }',
    transparent: true, depthWrite: false, side: THREE.DoubleSide, premultipliedAlpha: true,
  });
}
// flat textured quad (props, layers): same premultiplied shader, fog amount fixed per object from its depth
function flatMat(tex, o = {}) {
  const m = spriteMaterial(); m.uniforms.map.value = tex; m.uniforms.tint.value.setHex(o.color ?? 0xffffff);
  if (o.fog !== false && o.z !== undefined) m.uniforms.fogAmt.value = clamp((CAM.z - o.z - 9) / 37, 0, 1) * (o.fogK ?? 1);
  if (o.repeatX) m.uniforms.uvRect.value.set(0, 0, o.repeatX, 1);
  return m;
}
function addMat(tex, color) {
  return new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, side: THREE.DoubleSide, fog: false });
}

// ---------------------------------------------------------------- world
let CHARS, PROPS, LAYERS;
const glows = [];
function plane(mat, w, h, x, y, z, order = 0) {
  const m = new THREE.Mesh(QUAD, mat); m.scale.set(w, h, 1); m.position.set(x, y, z); m.renderOrder = order; scene.add(m); return m;
}
function addProp(id, x, z, s = 1, o = {}) {
  const p = PROPS[id]; const h = p.worldH * s, w = h * p.w / p.h;
  const m = plane(flatMat(TEX[id], { color: o.color ?? 0xffffff, fog: o.fog ?? true, z }), w * (o.flip ? -1 : 1), h, x, h / 2 - 0.04, z, o.order ?? 0);
  if (o.glow) { const g = plane(addMat(TEX.spark, o.glow.color ?? 0xff9a3a), o.glow.s, o.glow.s, x, h * o.glow.y, z + 0.05, 1); glows.push({ m: g, base: o.glow.a ?? 0.55, ph: Math.random() * 9 }); }
  return m;
}
function buildWorld() {
  // ground
  TEX.ground.repeat.set(150 / 6, 12 / 6);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 12), new THREE.MeshBasicMaterial({ map: TEX.ground, color: 0xc4cdff }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(33, 0, -0.5); scene.add(ground);
  // far ridge strip (mirrored repeat)
  const rl = LAYERS.far_ridge; const rH = 5.0, rW = rH * rl.w / rl.h, span = 132;
  plane(flatMat(TEX.far_ridge, { color: 0xb9c6ff, z: -14, repeatX: span / rW }), span, rH, 33, rH / 2 - 0.05, -14, -6);
  // forest tiles
  const fa = LAYERS.mid_forest_a, fb = LAYERS.mid_forest_b; const fH = 3.5;
  let x = -14, i = 0;
  while (x < 84) {
    const L = i % 2 ? fb : fa; const key = i % 2 ? 'mid_forest_b' : 'mid_forest_a'; const w = fH * L.w / L.h;
    plane(flatMat(TEX[key], { color: 0xd4dcff, z: -5.5 }), w * ((i >> 1) % 2 ? -1 : 1), fH, x + w / 2, fH / 2 - 0.06, -5.5, -4);
    x += w - 0.15; i++;
  }
  // boss gate
  const gl = LAYERS.gate_cut; const gW = 13.5, gH = gW * gl.h / gl.w;
  plane(flatMat(TEX.gate_cut, { color: 0xe6e9ff, z: -4.9, fogK: 0.6 }), gW, gH, 60, gH / 2 - 0.05, -4.9, -3);
  for (const sx of [-1, 1]) { const g = plane(addMat(TEX.spark, 0xff8a2a), 3.0, 3.0, 60 + sx * 2.7, 1.75, -4.8, 1); glows.push({ m: g, base: 0.5, ph: Math.random() * 9 }); }
  // props behind the belt
  const lg = { glow: { y: 0.56, s: 2.6 } };
  [[1.5, -4.6, 1], [8.6, -4.2, .9, 1], [15.5, -4.7, 1.05], [22.4, -4.1, .95, 1], [30.2, -4.6, 1], [37.6, -4.2, 1.1], [46.5, -4.6, .95, 1], [51.0, -4.3, 1.05]].forEach(([px, pz, s, f]) => addProp('prop_pine', px, pz, s, { flip: !!f }));
  [[5.8, -3.0], [19.6, -3.1], [33.8, -3.0], [48.4, -3.1]].forEach(([px, pz]) => addProp('prop_lantern', px, pz, 1, lg));
  addProp('prop_totems', 25.6, -3.3, 1); addProp('prop_totems', 53.6, -3.4, 0.95, { flip: true });
  [[12.2, -3.4, 1], [40.8, -3.5, 1.15, 1], [29.0, -3.9, .8]].forEach(([px, pz, s, f]) => addProp('prop_rock', px, pz, s, { flip: !!f }));
  // foreground silhouettes for depth
  // (foreground silhouettes removed: they covered the corners of the play field)
  // pines hide the two ends of the gate wall
  addProp('prop_pine', 52.6, -4.4, 1.15); addProp('prop_pine', 67.4, -4.4, 1.2, { flip: true });
  // fireflies
  const n = 70, pos = new Float32Array(n * 3);
  for (let k = 0; k < n; k++) { pos[k * 3] = rand(-4, 74); pos[k * 3 + 1] = rand(0.4, 4.2); pos[k * 3 + 2] = rand(-5, 2.5); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ map: TEX.spark, size: 0.16, color: 0xbfe6ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8, fog: false }));
  pts.renderOrder = 2; scene.add(pts); W.fireflies = pts;
}
const W = {};

// ---------------------------------------------------------------- audio
const AC = { ctx: null };
function audioInit() {
  if (!AC.ctx) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    AC.ctx = new C(); AC.master = AC.ctx.createGain(); AC.master.gain.value = 0.5; AC.master.connect(AC.ctx.destination);
    const len = AC.ctx.sampleRate; AC.noise = AC.ctx.createBuffer(1, len, len); const d = AC.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    loadSounds();
  }
  if (AC.ctx.state === 'suspended') AC.ctx.resume();
}
function tone(type, f0, f1, dur, vol) {
  if (!AC.ctx) return; const t = AC.ctx.currentTime, o = AC.ctx.createOscillator(), g = AC.ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g); g.connect(AC.master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, f0, f1) {
  if (!AC.ctx) return; const t = AC.ctx.currentTime, s = AC.ctx.createBufferSource(), f = AC.ctx.createBiquadFilter(), g = AC.ctx.createGain();
  s.buffer = AC.noise; f.type = 'bandpass'; f.Q.value = 0.9; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(f); f.connect(g); g.connect(AC.master); s.start(t, Math.random() * 0.5, dur + 0.05);
}
// recorded samples (hits, whooshes, voices); the synth above stays as a fallback while they load
const SND = {};
const SND_LIST = ['pickup', 'hit1', 'hit2', 'hit3', 'heavy', 'boom', 'land', 'swing1', 'swing2', 'whoosh', 'ui', 'power',
  'h1_atk1', 'h1_atk2', 'h1_atk3', 'h1_hurt1', 'h1_hurt2', 'h1_down', 'h1_special', 'h1_jump', 'h2_atk1', 'h2_atk2', 'h2_atk3', 'h2_hurt1', 'h2_hurt2', 'h2_down', 'h2_special', 'h2_jump',
  'en_hurt1', 'en_hurt2', 'en_hurt3', 'en_die1', 'en_die2', 'boss_intro', 'boss_atk', 'boss_hurt', 'boss_die'];
function loadSounds() {
  for (const n of SND_LIST) fetch(assetUrl('assets/audio/' + n + '.mp3')).then((r) => (r.ok ? r.arrayBuffer() : null)).then((b) => b && AC.ctx.decodeAudioData(b)).then((buf) => { if (buf) SND[n] = buf; }).catch(() => {});
}
function play(name, vol = 1, rate = 1) {
  const b = SND[name]; if (!b || !AC.ctx) return false;
  const s = AC.ctx.createBufferSource(), g = AC.ctx.createGain(); s.buffer = b; s.playbackRate.value = rate; g.gain.value = vol; s.connect(g); g.connect(AC.master); s.start(); return true;
}
const pick = (...a) => a[Math.floor(Math.random() * a.length)];
const sfx = {
  hit() { if (!play(pick('hit1', 'hit2', 'hit3'), .95, rand(.92, 1.1))) { noise(.09, .55, 1900, 300); tone('sine', 170, 50, .12, .6); } },
  heavy() { if (!play('heavy', 1)) { noise(.18, .7, 1200, 120); tone('sine', 120, 35, .3, .8); } play('hit1', .8, .78); },
  swing() { if (!play(pick('swing1', 'swing2'), .5, rand(.95, 1.25))) noise(.12, .16, 700, 2600); },
  hurt() { if (!play('hit3', 1, .88)) { tone('square', 230, 90, .16, .22); noise(.08, .3, 900, 200); } },
  special() { if (!play('boom', 1)) { tone('sawtooth', 80, 720, .55, .3); noise(.8, .55, 300, 3200); tone('sine', 60, 30, .9, .8); } },
  ui() { if (!play('ui', .8)) tone('triangle', 660, 990, .08, .2); },
  arrow() { if (!play('swing1', .4, 1.6)) noise(.08, .14, 3000, 1200); },
  warn() { if (!play('power', .7)) tone('square', 440, 440, .18, .15); },
  land() { play('land', .7); }, jump() { play('whoosh', .45, 1.35); },
};
// voices: random pick from the given names, with a chance and a minimum gap so shouts do not machine-gun
const vLast = {};
function voice(names, chance = 1, gap = 0.12, vol = 1, rate = 1) {
  if (Math.random() > chance) return; const list = [].concat(names).sort(() => Math.random() - 0.5);
  const key = list[0].replace(/\d+$/, ''), t = now(); if (t - (vLast[key] || -9) < gap) return;
  for (const n of list) if (play(n, vol, rate * rand(.97, 1.04))) { vLast[key] = t; return; }
}
const hv = (s) => G.heroId.slice(0, 2) + '_' + s;
// background music through the same master gain (so the mute button and phone volume behave the same way)
const BGM = { el: {}, gain: {}, cur: null };
function bgm(name) {
  if (BGM.cur === name || !AC.ctx) return; const t = AC.ctx.currentTime, old = BGM.cur; BGM.cur = name;
  if (old && BGM.el[old]) { const g = BGM.gain[old], el = BGM.el[old]; if (g) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.7); } setTimeout(() => { if (BGM.cur !== old) el.pause(); }, 800); }
  if (!name) return;
  const el = bgmEl(name);
  try { el.currentTime = 0; } catch (e) { /* not seekable yet */ }
  el.play().catch(() => {});
  const g = BGM.gain[name]; if (g) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.8); }
}
function bgmEl(name) {
  let el = BGM.el[name];
  if (!el) {
    el = BGM.el[name] = new Audio(assetUrl('assets/audio/' + name + '.mp3')); el.loop = true; el.preload = 'auto';
    try { const src = AC.ctx.createMediaElementSource(el), g = AC.ctx.createGain(); g.gain.value = 0; src.connect(g); g.connect(AC.master); BGM.gain[name] = g; } catch (e) { el.volume = 0.4; }
  }
  return el;
}
// phones only allow audio that was started inside a tap: start the later track silently now so it can be switched to freely
function primeBgm(name) { if (!AC.ctx || BGM.el[name]) return; const el = bgmEl(name); const p = el.play(); if (p && p.then) p.then(() => { if (BGM.cur !== name) el.pause(); }).catch(() => {}); }
let muted = false;
function setMute(m) { muted = m; if (AC.master) AC.master.gain.value = m ? 0 : 0.5; const b = $('#mute'); if (b) b.textContent = m ? '소리 끔' : '소리 켬'; }
document.addEventListener('visibilitychange', () => { if (!AC.ctx) return; if (document.hidden) { AC.ctx.suspend(); if (BGM.cur) BGM.el[BGM.cur].pause(); } else { AC.ctx.resume(); if (BGM.cur) BGM.el[BGM.cur].play().catch(() => {}); } });

// ---------------------------------------------------------------- fx
const particles = [];
function spawnP(tex, color, x, y, z, o) {
  const m = new THREE.Mesh(QUAD, addMat(tex, color)); m.position.set(x, y, z); m.renderOrder = 5; scene.add(m);
  const p = Object.assign({ m, life: 0, max: .3, vx: 0, vy: 0, vz: 0, g: 0, s0: 1, s1: 1, ax: 1, rot: 0, spin: 0, a0: 1, flat: false }, o);
  if (p.flat) m.rotation.x = -Math.PI / 2; m.rotation.z = p.rot; particles.push(p); return p;
}
function sparks(x, y, z, color, n = 7, sp = 5) {
  for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), v = rand(sp * .4, sp); spawnP(TEX.streak, color, x, y, z, { max: rand(.18, .34), vx: Math.cos(a) * v, vy: Math.sin(a) * v + 1.5, g: -9, s0: rand(.5, .9), s1: .1, ax: .28, rot: a }); }
  spawnP(TEX.spark, 0xffffff, x, y, z, { max: .12, s0: 1.6, s1: .3 });
  spawnP(TEX.spark, color, x, y, z, { max: .22, s0: 1.2, s1: 2.6, a0: .7 });
}
function slashArc(x, y, z, facing, color, s = 1, variant = 0) {
  const rot = [0.35, -0.35, 0.0][variant % 3];
  const p = spawnP(TEX.slash, color, x, y, z, { max: .2, s0: s * 1.5, s1: s * 2.2, rot: rot * facing, vx: facing * 3 });
  p.m.scale.x *= facing; p.fx = facing;
  spawnP(TEX.slash, 0xffffff, x, y, z + 0.01, { max: .1, s0: s * 1.35, s1: s * 1.8, rot: rot * facing, vx: facing * 3 }).fx = facing;
}
function ring(x, z, color, s) { spawnP(TEX.ring, color, x, 0.05, z, { max: .45, s0: 1, s1: s, flat: true, a0: .9 }); }
function embers(x, y, z, color, n) { for (let i = 0; i < n; i++) spawnP(TEX.spark, color, x + rand(-.6, .6), y + rand(0, 1.6), z + rand(-.3, .3), { max: rand(.5, 1), vx: rand(-1, 1), vy: rand(2, 5), s0: rand(.25, .5), s1: 0.05 }); }
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.life += dt; const k = p.life / p.max;
    if (k >= 1) { scene.remove(p.m); p.m.material.dispose(); particles.splice(i, 1); continue; }
    p.vy += p.g * dt; p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
    const s = lerp(p.s0, p.s1, k); p.m.scale.set(s * (p.fx || 1), s * p.ax, 1); p.m.material.opacity = p.a0 * (1 - k * k);
    if (p.spin) p.m.rotation.z += p.spin * dt;
  }
}
let flashT = 0, flashDur = 1;
function screenFlash(css, a, ms) { const f = $('#flash'); f.style.background = css; f.style.opacity = a; flashT = ms / 1000; flashDur = ms / 1000; f.dataset.a = a; }
function shake(a) { G.shake = Math.max(G.shake, a); }
function hitstop(t) { G.freeze = Math.max(G.freeze, t); }

// ---------------------------------------------------------------- actors
class Actor {
  constructor(charId, def, isPlayer) {
    this.charId = charId; this.def = def; this.isPlayer = isPlayer; this.meta = CHARS[charId];
    this.x = 0; this.z = 0; this.facing = 1; this.hp = def.hp; this.maxHp = def.hp;
    this.state = 'idle'; this.stateT = 0; this.flash = 0; this.opacity = 1; this.kbV = 0; this.invuln = 0; this.y = 0; this.vy = 0; this.hitJit = 0;
    this.t = Math.random() * 10; this.zBias = Math.random() * 0.004; this.animProgress = 0; this.alive = true;
    this.root = new THREE.Group(); this.flipG = new THREE.Group(); this.poseG = new THREE.Group();
    this.mat = spriteMaterial(); this.mesh = new THREE.Mesh(QUAD, this.mat);
    this.root.add(this.flipG); this.flipG.add(this.poseG); this.poseG.add(this.mesh);
    this.shadow = new THREE.Mesh(QUAD, new THREE.MeshBasicMaterial({ map: TEX.shadow, transparent: true, premultipliedAlpha: true, depthWrite: false, opacity: 0.55, fog: false }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.renderOrder = -1; this.shadow.scale.set(def.shadow * 1.5, def.shadow * 0.5, 1);
    scene.add(this.root); scene.add(this.shadow);
    this.animName = ''; this.animT = 0; this.setAnim('idle');
    this.headY = this.anim.anchorY * (this.anim.upp ?? this.meta.unitsPerPx);
    if (!isPlayer) { // every enemy carries its own HP bar above the head
      const w = def.kind === 'boss' ? 2.0 : def.heavy ? 1.2 : 0.85; this.barW = w; this.lagHp = 1; this.bar = new THREE.Group();
      const mk = (color, op, z) => { const m = new THREE.Mesh(QUAD, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthTest: false, depthWrite: false, fog: false })); m.renderOrder = 6; m.position.z = z; this.bar.add(m); return m; };
      mk(0xf3d27a, 0.9, 0).scale.set(w + 0.07, 0.135, 1); mk(0x05060f, 0.95, 0.001).scale.set(w + 0.035, 0.1, 1);
      this.barLag = mk(0xffffff, 0.95, 0.002); this.barFill = mk(0x5fe36a, 1, 0.003);
      scene.add(this.bar);
    }
  }
  setAnim(name) {
    const A = this.meta.anims; const real = A[name] ? name : 'idle';
    this.procName = name; this.procAmt = A[name] && A[name].count > 1 ? 0 : 1;
    if (real === this.animName) return;
    this.animName = real; this.animT = 0; const a = A[real]; this.anim = a;
    this.mat.uniforms.map.value = TEX['chr_' + a.file];
    const u = a.upp ?? this.meta.unitsPerPx;
    this.mesh.scale.set(a.cellW * u, a.cellH * u, 1);
    this.mesh.position.set((a.cellW / 2 - a.anchorX) * u, (a.anchorY - a.cellH / 2) * u, 0);
  }
  setState(s) { if (this.state !== s) { this.state = s; this.stateT = 0; } }
  sync(dt) {
    this.t += dt; this.animT += dt; this.flash = Math.max(0, this.flash - dt * 4.2);
    const a = this.anim; let f = 0;
    const cnt = a.seq ? a.seq.length : a.count;
    if (cnt > 1) f = a.loop ? Math.floor(this.animT * a.fps) % cnt : Math.min(cnt - 1, Math.floor(clamp(this.animProgress, 0, 0.999) * cnt));
    if (a.seq) f = a.seq[f];
    const c = f % a.cols, r = Math.floor(f / a.cols);
    this.mat.uniforms.uvRect.value.set(c / a.cols, 1 - (r + 1) / a.rows, 1 / a.cols, 1 / a.rows);
    this.pose();
    const jit = G.freeze > 0 && this.hitJit > 0 ? (Math.random() - 0.5) * 0.16 : 0; if (G.freeze <= 0) this.hitJit = 0;
    this.root.position.set(this.x + jit, this.y, this.z + this.zBias); this.flipG.scale.x = this.facing;
    const blink = this.invuln > 0 && this.state !== 'special' && Math.floor(this.t * 14) % 2 === 0;
    this.mat.uniforms.flash.value = Math.min(1, this.flash); this.mat.uniforms.opacity.value = this.opacity * (blink ? 0.35 : 1);
    const sh = 1 / (1 + this.y * 0.6); this.shadow.position.set(this.x, 0.02, this.z); this.shadow.scale.set(this.def.shadow * 1.5 * sh, this.def.shadow * 0.5 * sh, 1); this.shadow.material.opacity = 0.55 * this.opacity * sh;
    if (this.bar) {
      const r = clamp(this.hp / this.maxHp, 0, 1), w = this.barW; this.lagHp = Math.max(r, this.lagHp - dt * 0.7);
      this.bar.visible = this.alive; this.bar.position.set(this.x, this.headY + 0.16, this.z + 0.03);
      this.barFill.scale.set(Math.max(0.0001, w * r), 0.07, 1); this.barFill.position.x = -w / 2 + w * r / 2;
      this.barLag.scale.set(Math.max(0.0001, w * this.lagHp), 0.07, 1); this.barLag.position.x = -w / 2 + w * this.lagHp / 2;
      this.barFill.material.color.setHex(r > 0.5 ? 0x5fe36a : r > 0.25 ? 0xffc23a : 0xff4a3a);
    }
  }
  pose() {
    const g = this.poseG, a = this.procAmt, t = this.t, st = this.stateT; let px = 0, py = 0, rz = 0, sx = 1, sy = 1;
    switch (this.procName) {
      case 'idle': sy = 1 + 0.012 * Math.sin(t * 3.2); break;
      case 'walk': py = Math.abs(Math.sin(t * 9)) * 0.07; rz = Math.sin(t * 9) * 0.03; break;
      case 'atk1': case 'atk2': case 'atk3': case 'attack': { const k = Math.sin(Math.min(1, clamp(this.animProgress, 0, 1) * 1.7) * Math.PI); px = 0.42 * k; rz = -0.17 * k; sx = 1 + 0.06 * k; break; }
      case 'windup': { const k = Math.min(1, st / 0.2); px = -0.2 * k; rz = 0.13 * k; sy = 1 - 0.04 * k; break; }
      case 'hurt': { const k = Math.max(0, 1 - st / 0.3); rz = 0.22 + 0.42 * k; px = -0.14 - 0.24 * k; sx = 1 - 0.12 * k; sy = 1 + 0.1 * k; py = 0.16 * Math.sin(Math.min(1, st / 0.22) * Math.PI); break; }
      case 'down': { const k = Math.min(1, st / 0.16); rz = 1.48 * k + (this.y > 0.05 ? Math.sin(st * 16) * 0.12 : 0); py = 0.14 * k; sx = 1 - 0.06 * k; break; }
      case 'getup': { const k = 1 - Math.min(1, st / 0.3); rz = 1.48 * k; py = 0.14 * k; break; }
      case 'special': { const k = Math.min(1, st / 0.2); py = 0.3 * Math.sin(Math.min(1, st / 0.7) * Math.PI); sx = sy = 1 + 0.08 * k; rz = -0.12 * k; break; }
      case 'charge': rz = -0.3; px = 0.3; break;
    }
    g.position.set(px * a, py * a, 0); g.rotation.z = rz * a; g.scale.set(lerp(1, sx, a), lerp(1, sy, a), 1);
  }
  dispose() { scene.remove(this.root); scene.remove(this.shadow); this.mat.dispose(); this.shadow.material.dispose(); if (this.bar) { scene.remove(this.bar); this.bar.children.forEach((m) => m.material.dispose()); } }
}

// ---------------------------------------------------------------- input
const input = { x: 0, y: 0, attackAt: -9, specialAt: -9, jumpAt: -9, keys: {} };
const now = () => performance.now() / 1000;
function consume(k) { const key = k + 'At'; if (now() - input[key] < 0.22) { input[key] = -9; return true; } return false; }
window.addEventListener('keydown', (e) => {
  if (e.repeat) return; input.keys[e.code] = true; audioInit();
  if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) { if (input.lastDir === e.code && now() - input.lastDirAt < 0.3) input.runKey = e.code; input.lastDir = e.code; input.lastDirAt = now(); }
  if (e.code === 'KeyJ' || e.code === 'KeyZ') input.attackAt = now();
  if (e.code === 'KeyX' || e.code === 'KeyL' || e.code === 'KeyC') input.jumpAt = now();
  if (e.code === 'Space' || e.code === 'KeyK') input.specialAt = now();
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
window.addEventListener('keyup', (e) => { input.keys[e.code] = false; if (input.runKey === e.code) input.runKey = null; });
function readKeys() {
  const k = input.keys; let x = 0, y = 0;
  if (k.ArrowLeft || k.KeyA) x -= 1; if (k.ArrowRight || k.KeyD) x += 1; if (k.ArrowUp || k.KeyW) y -= 1; if (k.ArrowDown || k.KeyS) y += 1;
  if (x || y || !input.touchMove) { input.x = x; input.y = y; }
  input.run = !!(input.runKey && k[input.runKey]) || ((k.ShiftLeft || k.ShiftRight) && x !== 0);
}
(function touchSetup() {
  const zone = $('#joyzone'), joy = $('#joy'), knob = $('#knob'); let id = null, ox = 0, oy = 0;
  const R = 52;
  // touch point in stage coordinates (the stage may be rotated)
  const local = (t) => (VIEW.rot ? { x: t.clientY, y: window.innerWidth - t.clientX } : { x: t.clientX, y: t.clientY });
  zone.addEventListener('touchstart', (e) => { audioInit(); const t = e.changedTouches[0]; id = t.identifier; const p = local(t); ox = p.x; oy = p.y; joy.style.left = ox + 'px'; joy.style.top = (oy - VIEW.h * 0.28) + 'px'; input.touchMove = true; e.preventDefault(); }, { passive: false });
  zone.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) if (t.identifier === id) { const p = local(t); let dx = p.x - ox, dy = p.y - oy; const m = Math.hypot(dx, dy); if (m > R) { dx *= R / m; dy *= R / m; } knob.style.transform = `translate(${dx}px,${dy}px)`; input.x = dx / R; input.y = dy / R; } e.preventDefault(); }, { passive: false });
  const end = (e) => { for (const t of e.changedTouches) if (t.identifier === id) { id = null; input.x = 0; input.y = 0; input.touchMove = false; knob.style.transform = ''; } };
  zone.addEventListener('touchend', end); zone.addEventListener('touchcancel', end);
  const bind = (el, key) => { const dn = (e) => { audioInit(); input[key] = now(); el.classList.add('on'); e.preventDefault(); }; const up = () => el.classList.remove('on'); el.addEventListener('touchstart', dn, { passive: false }); el.addEventListener('touchend', up); el.addEventListener('touchcancel', up); el.addEventListener('mousedown', dn); el.addEventListener('mouseup', up); };
  bind($('#btnA'), 'attackAt'); bind($('#btnS'), 'specialAt'); bind($('#btnJ'), 'jumpAt');
  $('#mute').addEventListener('click', () => { audioInit(); setMute(!muted); }); $('#mute').addEventListener('touchstart', (e) => { audioInit(); setMute(!muted); e.preventDefault(); e.stopPropagation(); }, { passive: false });
  if (TOUCH) {
    $('#hint').textContent = '왼쪽 화면을 눌러 이동(끝까지 밀면 달리기) · 오른쪽 버튼으로 공격, 점프, 필살 · 달리며 공격 = 돌진 베기';
    // stop page scroll, pinch zoom and long-press menus while playing
    document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gesturestart', (e) => e.preventDefault()); document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
})();
// Android: go fullscreen and lock landscape on the first tap (ignored where unsupported, e.g. iPhone)
function goFullscreen() {
  if (!TOUCH) return; const el = document.documentElement;
  try { const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : null; if (p && p.then) p.then(() => { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); }).catch(() => {}); } catch (e) { /* not available */ }
}

// ---------------------------------------------------------------- game state
const G = { items: [], state: 'title', t: 0, freeze: 0, paused: false, shake: 0, zoom: 1, zoomT: 1, camX: STAGE_START, enemies: [], shots: [], timers: [], tokens: 0, seg: 0, segState: 'travel', wave: 0, spawnQ: [], combo: 0, comboT: 0, score: 0, time: 0, heroId: 'h1_mujin', player: null, endT: 0, bossRef: null };
const after = (t, fn) => G.timers.push({ t, fn });

// ---------------------------------------------------------------- food pickups (restore HP)
const FOODS = { food_rice: { heal: 20, w: 0.8 }, food_bun: { heal: 35, w: 0.95 }, food_meat: { heal: 70, w: 1.15 } };
const DROPS = { e1_grunt: [0.2, 'food_rice'], e2_spearman: [0.2, 'food_rice'], e3_archer: [0.25, 'food_rice'], e5_assassin: [0.3, 'food_bun'], e4_brute: [1, 'food_bun'] };
let ITEMS_META = {};
function spawnFood(id, x, z, pop) {
  const f = FOODS[id], m = ITEMS_META[id]; const w = f.w, h = w * m.h / m.w;
  const mesh = new THREE.Mesh(QUAD, flatMat(TEX[id], { fog: false })); mesh.scale.set(w, h, 1); mesh.renderOrder = 1; scene.add(mesh);
  const glow = new THREE.Mesh(QUAD, addMat(TEX.spark, 0xffe39a)); glow.scale.set(w * 1.7, w * 0.6, 1); glow.rotation.x = -Math.PI / 2; glow.renderOrder = 0; scene.add(glow);
  const it = { id, x, z, y: pop ? 0.7 : 0, vy: pop ? 5 : 0, h, mesh, glow, life: 0, t: Math.random() * 6 };
  G.items.push(it); return it;
}
function removeFood(i) { const it = G.items[i]; scene.remove(it.mesh); scene.remove(it.glow); it.mesh.material.dispose(); it.glow.material.dispose(); G.items.splice(i, 1); }
function updateItems(dt) {
  const p = G.player;
  for (let i = G.items.length - 1; i >= 0; i--) {
    const it = G.items[i]; it.life += dt; it.t += dt;
    if (it.vy || it.y > 0) { it.vy -= 22 * dt; it.y += it.vy * dt; if (it.y <= 0) { it.y = 0; it.vy = Math.abs(it.vy) > 2 ? -it.vy * 0.35 : 0; } }
    const bob = it.vy === 0 && it.y === 0 ? 0.04 + Math.sin(it.t * 4) * 0.04 : 0;
    it.mesh.position.set(it.x, it.y + bob + it.h / 2, it.z + 0.02); it.glow.position.set(it.x, 0.03, it.z);
    it.glow.material.opacity = 0.45 + 0.25 * Math.sin(it.t * 6);
    const fading = it.life > 18; it.mesh.visible = !fading || Math.floor(it.t * 8) % 2 === 0;
    if (it.life > 22) { removeFood(i); continue; }
    if (p && !['down', 'getup', 'dead', 'special'].includes(p.state) && p.y < 0.7 && Math.abs(p.x - it.x) < 0.8 && Math.abs(p.z - it.z) < 0.55 && it.y < 0.3) {
      const heal = Math.min(FOODS[it.id].heal, p.maxHp - p.hp); p.hp += heal; G.score += heal > 0 ? 100 : 500;
      p.flash = 0.8; p.mat.uniforms.flashColor.value.setRGB(0.5, 1, 0.55);
      healNum(p.x, 2.1, p.z, heal > 0 ? '+' + Math.round(heal) : '+500');
      for (let k = 0; k < 10; k++) spawnP(TEX.spark, 0x9dff9a, p.x + rand(-.4, .4), rand(.3, 1.6), p.z + 0.05, { max: rand(.4, .7), vy: rand(1.5, 3.5), s0: rand(.25, .45), s1: .05 });
      if (!play('pickup', .9)) tone('triangle', 660, 1320, .18, .25); removeFood(i);
    }
  }
}
function clearActors() {
  while (G.items.length) removeFood(G.items.length - 1);
  for (const e of G.enemies) e.dispose(); G.enemies.length = 0;
  for (const s of G.shots) scene.remove(s.m); G.shots.length = 0;
  if (G.player) { G.player.dispose(); G.player = null; }
  G.timers.length = 0; G.spawnQ.length = 0;
}
const charLoads = {}, charDone = {};
function loadChar(cid) {
  return (charLoads[cid] ??= (async () => {
    const files = new Set(Object.values(CHARS[cid].anims).map((a) => a.file));
    await Promise.all([...files].filter((f) => !TEX['chr_' + f]).map((f) => loadTex('chr_' + f, CHAR_DIR + f, { sprite: true })));
    charDone[cid] = true;
  })());
}
async function startGame(heroId) {
  audioInit(); sfx.ui(); goFullscreen(); bgm('bgm_stage'); primeBgm('bgm_boss');
  $('#loading').style.display = 'flex'; await loadChar(heroId); $('#loading').style.display = 'none';
  clearActors();
  G.heroId = heroId; const hero = HEROES[heroId];
  const p = new Actor(heroId, hero, true); p.x = 3; p.z = -0.3; p.gauge = 100; p.step = 0; G.player = p;
  Object.assign(G, { state: 'play', seg: 0, segState: 'travel', wave: 0, combo: 0, comboT: 0, score: 0, time: 0, camX: STAGE_START, tokens: 0, freeze: 0, paused: false, endT: 0, bossRef: null, zoomT: 1 });
  $('#title').style.display = 'none'; $('#clear').style.display = 'none'; $('#over').style.display = 'none'; $('#hud').style.display = 'block'; $('#touch').style.display = TOUCH ? 'block' : 'none'; $('#boss').style.display = 'none'; $('#go').style.display = 'none';
  $('#face').style.backgroundImage = `url(${assetUrl('assets/ui/' + hero.face)})`; $('#pname').innerHTML = `${hero.name}<small>${hero.sub}</small>`;
  message('제1막 흑랑 고개', 1800); bgm('bgm_stage');
}
function message(txt, ms) { const m = $('#msg'); m.textContent = txt; m.style.transition = 'none'; m.style.opacity = 1; setTimeout(() => { m.style.transition = 'opacity .5s'; m.style.opacity = 0; }, ms); }

// ---------------------------------------------------------------- combat
const JUMP_V = 9.8, JUMP_G = 27;
function startJump(p) {
  p.jumpRun = p.state === 'run'; p.state = 'jump'; p.stateT = 0; p.vy = JUMP_V; p.y = 0.01; p.airAtk = false; p.airHit = false; p.setAnim('jump');
  sfx.jump(); voice(hv('jump'), .7); ring(p.x, p.z, 0xcfd8ff, 1.6);
}
function airStrike(p) {
  const hero = p.def; let any = false; const reach = hero.combo[0].range + 0.5;
  for (const e of G.enemies) {
    if (!e.alive || e.state === 'down' || e.state === 'getup') continue;
    const d = (e.x - p.x) * p.facing;
    if (d > -0.6 && d < reach + e.def.body && Math.abs(e.z - p.z) < 0.95) { hitEnemy(e, 14, p.facing, true, 4.5, false); any = true; }
  }
  slashArc(p.x + p.facing * reach * 0.5, p.y + 0.9, p.z + 0.05, p.facing, hero.color, 1.5, 1);
  if (any) { hitstop(.12); shake(.3); sfx.heavy(); }
}
function startAttack(p, step, dash) {
  p.step = step; p.state = 'attack'; p.stateT = 0; p.didHit = false; p.queued = false; p.dash = !!dash; p.setAnim('atk' + (step + 1)); sfx.swing();
  if (dash || step === 2) voice(hv('atk3')); else voice(hv('atk' + (step + 1)), .6);
  const a = p.def.combo[step], an = p.meta.anims['atk' + (step + 1)];
  p.atk = an && an.hitFrac ? Object.assign({}, a, { hitAt: an.hitFrac * a.dur }) : a;
}
function playerHit(p, a) {
  const hero = p.def; let any = false;
  for (const e of G.enemies) {
    if (!e.alive || e.state === 'down' || e.state === 'getup') continue;
    const d = (e.x - p.x) * p.facing;
    if (d > -0.45 && d < a.range + e.def.body && Math.abs(e.z - p.z) < 0.85) { hitEnemy(e, a.dmg, p.facing, !!a.down, a.kb, false); any = true; }
  }
  slashArc(p.x + p.facing * a.range * 0.5, 1.15, p.z + 0.05, p.facing, hero.color, a.down ? 1.5 : 1.05, p.step);
  if (any) { hitstop(a.down ? .17 : .075); shake(a.down ? .42 : .16); if (a.down) { sfx.heavy(); G.zoomT = .94; after(.2, () => { G.zoomT = 1; }); } else sfx.hit(); }
}
function hitEnemy(e, dmg, dir, down, kb, special) {
  if (!e.alive) return; const p = G.player; const hero = p.def;
  e.hp -= dmg; e.flash = 1; e.mat.uniforms.flashColor.value.setRGB(1, 1, 1);
  const hy = rand(.9, 1.4) * (e.def.heavy ? 1.3 : 1); const big = down || special;
  sparks(e.x - dir * 0.15, hy, e.z + 0.08, hero.color, big ? 14 : 9, big ? 9 : 6.5);
  spawnP(TEX.spark, 0xffffff, e.x - dir * 0.1, hy, e.z + 0.09, { max: .1, s0: big ? 4.2 : 2.8, s1: .8 });
  for (let i = 0; i < (big ? 5 : 3); i++) spawnP(TEX.streak, 0xffffff, e.x, hy, e.z + 0.09, { max: .14, s0: big ? 2.6 : 1.8, s1: big ? 4.5 : 3, ax: .1, rot: rand(0, Math.PI), a0: .9 });
  e.hitJit = 1; dmgNum(e.x, e.def.heavy ? 2.6 : 2.0, e.z, dmg, big);
  G.combo++; G.comboT = 2.2; G.score += 10; if (!special) p.gauge = Math.min(100, p.gauge + 7);
  comboPop();
  if (e.hasToken) { e.hasToken = false; G.tokens--; }
  if (e.hp <= 0) {
    if (e.def.kind === 'boss') voice('boss_die'); else voice(['en_die1', 'en_die2'], .9, .12, .9, e.def.vr || 1);
    e.alive = false; e.state = 'down'; e.stateT = 0; e.dying = true; e.kbV = dir * (kb + 4.5); e.facing = -dir; e.vy = special ? 9 : 7.5; e.bounced = false; e.setAnim('down'); G.score += e.def.score;
    const dr = DROPS[e.charId]; if (dr && Math.random() < dr[0]) { const ex = e.x, ez = e.z; after(0.5, () => spawnFood(dr[1], clamp(ex, G.camX - edgeHalf(ez, 1.2), G.camX + edgeHalf(ez, 1.2)), ez, true)); }
    if (!G.enemies.some((o) => o.alive) && !G.spawnQ.length) { G.slow = Math.max(G.slow || 0, .5); G.zoomT = .92; after(.22, () => { G.zoomT = 1; }); }
    if (e.def.kind === 'boss') { G.freeze = 0; G.slow = 1.6; sfx.heavy(); screenFlash('#fff', .8, 500); shake(.7); }
    return;
  }
  if (e.def.kind === 'boss') {
    e.stagger = (e.stagger || 0) + dmg;
    if (special || e.stagger >= 70) { voice('boss_hurt', 1, .8); e.stagger = 0; e.setState('hurt'); e.hurtDur = special ? .8 : .5; e.kbV = dir * 2.5; e.setAnim('hurt'); }
    return;
  }
  voice(['en_hurt1', 'en_hurt2', 'en_hurt3'], .75, .16, .85, e.def.vr || 1);
  if (down) { e.setState('down'); e.stateT = 0; e.kbV = dir * (kb + 1); e.facing = -dir; e.vy = special ? 8.5 : 6.5; e.bounced = false; e.setAnim('down'); }
  else if (e.def.armor && (e.state === 'windup' || e.state === 'strike')) { /* armored during its attack */ }
  else { e.state = 'hurt'; e.stateT = 0; e.hurtDur = .36; e.kbV = dir * kb; e.facing = -dir; e.setAnim('hurt'); }
}
function hurtPlayer(dmg, dir, down) {
  const p = G.player; if (!p || p.invuln > 0 || p.state === 'special' || p.state === 'down' || p.state === 'getup' || p.state === 'dead') return false;
  if (p.y > 0.9) return false; // jumped over it
  if (p.state === 'jump') { down = true; p.y = 0; p.vy = 0; }
  p.hp = Math.max(0, p.hp - dmg); p.flash = 1; p.hitJit = 1; p.mat.uniforms.flashColor.value.setRGB(1, .25, .2); sfx.hurt(); shake(down ? .5 : .32); hitstop(down ? .14 : .09); screenFlash('#ff2a1a', .26, 220);
  spawnP(TEX.spark, 0xffffff, p.x, 1.2, p.z + 0.09, { max: .1, s0: 3, s1: .8 });
  sparks(p.x, 1.2, p.z + 0.08, 0xff5544, 5, 4); G.combo = 0; comboPop();
  if (p.hp <= 0 || down) voice(hv('down')); else voice([hv('hurt1'), hv('hurt2')]);
  if (p.hp <= 0 || down) { p.state = 'down'; p.stateT = 0; p.kbV = dir * 5.5; p.facing = -dir; p.vy = 6.5; p.bounced = false; p.setAnim('down'); }
  else { p.state = 'hurt'; p.stateT = 0; p.kbV = dir * 3.6; p.setAnim('hurt'); }
  return true;
}
function startSpecial(p) {
  const hero = p.def; p.state = 'special'; p.stateT = 0; p.gauge = 0; p.spFired = false; p.setAnim('special');
  const sa = p.meta.anims.special; p.spDur = sa ? 1.2 : 0.8; p.spAt = sa && sa.hitFrac ? sa.hitFrac * p.spDur : 0.1; G.paused = true; G.zoomT = 0.86; sfx.warn(); setTimeout(() => voice(hv('special')), 260);
  showCutin({ img: hero.cutin, pos: hero.cutPos, skillImg: hero.skillImg, name: hero.name, quote: hero.quote, css: hero.css }, () => { G.paused = false; });
}
function fireSpecial(p) {
  const hero = p.def; shake(.7); screenFlash(hero.css, .5, 300); sfx.special(); ring(p.x, p.z, hero.color, 16); ring(p.x, p.z, 0xffffff, 9);
  for (let i = 0; i < 6; i++) after(i * 0.05, () => { for (const s of [-1, 1]) { slashArc(p.x + s * (1.0 + i * 1.5), rand(1, 1.6), p.z + rand(-.8, .8), s, hero.color, 2.3 + i * 0.2, i); embers(p.x + s * (1.0 + i * 1.5), 0.1, p.z + rand(-1, 1), hero.color, 4); } });
  for (const e of G.enemies) if (e.alive && Math.abs(e.x - p.x) < 11) after(0.06 + Math.abs(e.x - p.x) * 0.03, () => { hitEnemy(e, 55, sign(e.x - p.x), true, 6.5, true); ring(e.x, e.z, hero.color, 4); });
  after(0.5, () => { G.zoomT = 1; });
}
// launched bodies: arc through the air, bounce once with dust, then slide
function airPhysics(a, dt) {
  if (a.meta.anims.down) { a.x += a.kbV * dt; a.kbV *= Math.exp(-6 * dt); return; } // drawn fall already carries the arc
  a.x += a.kbV * dt; a.vy -= 26 * dt; a.y += a.vy * dt;
  if (a.y <= 0) { a.y = 0; if (!a.bounced) { a.bounced = true; a.vy = 3.4; a.kbV *= 0.55; ring(a.x, a.z, 0xcfd8ff, 2.6); shake(.16); noise(.12, .35, 500, 90); } else { a.vy = 0; a.kbV *= Math.exp(-7 * dt); } }
}
function healNum(x, y, z, txt) {
  const v = new THREE.Vector3(x, y, z).project(camera); const el = document.createElement('div'); el.className = 'dn hl'; el.textContent = txt;
  el.style.left = ((v.x * 0.5 + 0.5) * VIEW.w) + 'px'; el.style.top = ((-v.y * 0.5 + 0.5) * VIEW.h) + 'px';
  $('#hud').appendChild(el); el.addEventListener('animationend', () => el.remove());
}
function dmgNum(x, y, z, val, big) {
  const v = new THREE.Vector3(x, y, z).project(camera); const el = document.createElement('div'); el.className = 'dn' + (big ? ' big' : ''); el.textContent = val;
  el.style.left = ((v.x * 0.5 + 0.5) * VIEW.w + rand(-14, 14)) + 'px'; el.style.top = ((-v.y * 0.5 + 0.5) * VIEW.h) + 'px';
  $('#hud').appendChild(el); el.addEventListener('animationend', () => el.remove());
}
function comboPop() { const c = $('#combo'); if (G.combo >= 2) { c.innerHTML = `${G.combo}<small>HIT</small>`; c.style.opacity = 1; c.style.transition = 'none'; c.style.transform = 'scale(1.35)'; requestAnimationFrame(() => { c.style.transition = 'transform .15s'; c.style.transform = 'scale(1)'; }); } else c.style.opacity = 0; }

// ---------------------------------------------------------------- player update
function updatePlayer(p, dt) {
  p.stateT += dt; p.invuln = Math.max(0, p.invuln - dt);
  const A = p.meta.anims;
  if (p.state !== 'dead' && p.state !== 'special') p.gauge = Math.min(100, p.gauge + 1.6 * dt);
  switch (p.state) {
    case 'idle': case 'walk': case 'run': {
      const mx = input.x, mz = input.y, mag = Math.hypot(mx, mz);
      if (mag > 0.18) {
        const run = input.run || mag > 0.93, n = Math.min(1, mag) / mag, sp = p.def.speed * (run ? 1.75 : 1);
        p.x += mx * n * sp * dt; p.z += mz * n * sp * 0.6 * dt; if (Math.abs(mx) > 0.2) p.facing = mx > 0 ? 1 : -1;
        const s = run ? 'run' : 'walk'; if (p.state !== s) { p.state = s; p.stateT = 0; } p.setAnim(s);
        if (run && Math.floor(p.stateT * 9) !== Math.floor((p.stateT - dt) * 9)) spawnP(TEX.spark, 0x9aa4d8, p.x - p.facing * 0.35, 0.12, p.z, { max: .4, s0: .3, s1: 1.0, a0: .32, vy: .7 });
      } else { if (p.state !== 'idle') { p.state = 'idle'; p.stateT = 0; } p.setAnim('idle'); }
      if (consume('jump')) { startJump(p); break; }
      if (consume('special')) { if (p.gauge >= 100) startSpecial(p); }
      else if (consume('attack')) { const dash = p.state === 'run'; startAttack(p, dash ? 2 : 0, dash); }
      break;
    }
    case 'jump': {
      const mx = input.x, mz = input.y, mag = Math.hypot(mx, mz);
      if (mag > 0.18) { const n = Math.min(1, mag) / mag, sp = p.def.speed * (p.jumpRun ? 1.65 : 0.95); p.x += mx * n * sp * dt; p.z += mz * n * sp * 0.5 * dt; if (!p.airAtk && Math.abs(mx) > 0.2) p.facing = mx > 0 ? 1 : -1; }
      p.vy -= JUMP_G * dt; p.y += p.vy * dt;
      if (!p.airAtk) {
        p.animProgress = clamp(p.stateT / (2 * JUMP_V / JUMP_G), 0, 0.99);
        if (consume('attack')) { // air attack: finish the jump with the slash frames
          p.airAtk = true; p.airHit = false; if (p.vy < 3.6) p.vy = 3.6; p.setAnim('jumpatk');
          const ja = p.meta.anims.jumpatk, hf = ja && ja.hitFrac ? ja.hitFrac : 0.4;
          p.airT0 = p.stateT; p.airR = (p.vy + Math.sqrt(p.vy * p.vy + 2 * JUMP_G * Math.max(0, p.y))) / JUMP_G; p.airP0 = Math.max(0.1, hf - 0.24); p.airHitP = hf;
          sfx.swing(); voice(hv('atk2'));
        }
      } else {
        p.animProgress = clamp(p.airP0 + (1 - p.airP0) * (p.stateT - p.airT0) / p.airR, 0, 0.99);
        if (!p.airHit && p.animProgress >= p.airHitP) { p.airHit = true; airStrike(p); }
      }
      if (p.y <= 0 && p.vy < 0) { p.y = 0; p.vy = 0; p.state = 'idle'; p.stateT = 0; p.setAnim('idle'); sfx.land(); ring(p.x, p.z, 0xcfd8ff, 1.9); }
      break;
    }
    case 'attack': {
      const a = p.atk; p.animProgress = p.stateT / a.dur;
      if (p.stateT < a.hitAt) p.x += p.facing * (p.dash ? 8 : 1.8) * dt;
      if (!p.didHit && p.stateT >= a.hitAt) { p.didHit = true; playerHit(p, a); }
      if (consume('attack')) p.queued = true;
      if (consume('special') && p.gauge >= 100) { startSpecial(p); break; }
      if (p.stateT >= a.dur) { if (p.queued && p.step < 2) startAttack(p, p.step + 1); else { p.state = 'idle'; p.stateT = 0; p.setAnim('idle'); } }
      break;
    }
    case 'special': p.animProgress = p.stateT / p.spDur; if (!p.spFired && p.stateT > p.spAt) { p.spFired = true; fireSpecial(p); } if (p.stateT > p.spDur) { p.state = 'idle'; p.stateT = 0; p.invuln = 0.4; p.setAnim('idle'); } break;
    case 'hurt': p.animProgress = Math.min(0.6, p.stateT / 0.34 * 0.6); p.x += p.kbV * dt; p.kbV *= Math.exp(-8 * dt); if (p.stateT > .34) { p.state = 'idle'; p.stateT = 0; p.setAnim('idle'); } break;
    case 'down': p.animProgress = Math.min(1, p.stateT / 0.7); airPhysics(p, dt);
      if (p.stateT > 1.05) { if (p.hp <= 0) { p.state = 'dead'; G.endT = 1.3; G.endKind = 'over'; } else { p.state = 'getup'; p.stateT = 0; p.setAnim('getup'); } } break;
    case 'getup': { const gd = A.getup ? 0.45 : 0.3; p.animProgress = p.stateT / gd; if (p.stateT > gd) { p.state = 'idle'; p.stateT = 0; p.invuln = 1.2; p.setAnim('idle'); } break; }
  }
  p.z = clamp(p.z, Z_MIN, Z_MAX); const hw = edgeHalf(p.z, 1.5); p.x = clamp(p.x, G.camX - hw, G.camX + hw);
}

// ---------------------------------------------------------------- enemies
function spawnEnemy(id, side, i) {
  const def = ENEMIES[id]; const e = new Actor(id, def, false);
  e.x = G.camX + side * (halfW + 1.3 + i * 0.5); e.z = rand(Z_MIN + 0.2, Z_MAX - 0.2); e.facing = -side; e.state = 'approach';
  e.cdT = rand(.4, 1.2); e.zOff = rand(-1.2, 1.2); e.orbit = rand(0, 1.2); e.hasToken = false; e.strikes = 0; e.chargeT = rand(4, 6);
  if (def.kind === 'boss') { e.x = G.camX + edgeHalf(-0.4, 2.4); e.z = -0.4; G.bossRef = e; }
  G.enemies.push(e); return e;
}
// visible half-width of the screen at depth z, minus a margin so sprites are never cut by the screen edge
function edgeHalf(z, margin) { return Math.max(1.5, halfW * (CAM.z - z) / CAM.z - margin); }
function moveToward(e, tx, tz, sp, dt) {
  const dx = tx - e.x, dz = tz - e.z, d = Math.hypot(dx, dz); if (d < 0.05) return false;
  const s = Math.min(d, sp * dt); e.x += dx / d * s; e.z += dz / d * s * 0.75; return true;
}
function release(e) { if (e.hasToken) { e.hasToken = false; G.tokens--; } }
function updateEnemy(e, dt) {
  const p = G.player, def = e.def; e.stateT += dt; e.cdT -= dt;
  const dx = p.x - e.x, dz = p.z - e.z, adx = Math.abs(dx);
  const rage = def.kind === 'boss' && e.hp < e.maxHp * 0.35; const spd = def.speed * (rage ? 1.35 : 1);
  if (rage) e.mat.uniforms.tint.value.setRGB(1, .72, .72);
  const pOut = p.state === 'dead' || (p.state === 'down' && p.hp <= 0);
  switch (e.state) {
    case 'approach': {
      e.facing = sign(dx); let moved = false;
      if (pOut) { e.setAnim('idle'); break; }
      if (def.kind === 'archer') {
        const onScreen = Math.abs(e.x - G.camX) < edgeHalf(e.z, 1.2);
        const tx = clamp(p.x - sign(dx) * 5.6, G.camX - edgeHalf(e.z, 1.6), G.camX + edgeHalf(e.z, 1.6));
        if (adx < 3.2 || !onScreen || Math.abs(tx - e.x) > 1.2) moved = moveToward(e, tx, p.z, spd, dt); else moved = Math.abs(dz) > 0.25 && moveToward(e, e.x, p.z, spd, dt);
        if (onScreen && Math.abs(dz) < 0.4 && adx > 2.5 && e.cdT <= 0) { e.setState('windup'); e.setAnim('attack'); e.windT = def.windup; }
      } else {
        if (!e.hasToken && e.cdT <= 0 && G.tokens < SEGS[G.seg].tokens) { e.hasToken = true; G.tokens++; }
        const side = -sign(dx); const reach = def.range * 0.82;
        if (def.kind === 'boss' && e.chargeT <= 0 && adx > 3.2 && Math.abs(dz) < 1.2) { release(e); e.setState('chargeWind'); e.setAnim(e.meta.anims.atk2 ? 'atk2' : 'windup'); sfx.warn(); break; }
        if (e.hasToken) {
          moved = moveToward(e, p.x + side * reach, p.z, spd, dt);
          if (adx <= def.range * 0.97 && Math.abs(dz) < 0.42) { e.setState('windup'); e.setAnim('attack'); e.windT = def.windup * (rage ? .75 : 1); if (def.kind === 'boss') voice('boss_atk', .6, 2.5); }
        } else moved = moveToward(e, p.x + side * (def.range + 1.5 + e.orbit), clamp(p.z + e.zOff, Z_MIN, Z_MAX), spd * 0.8, dt);
        if (def.kind === 'boss') e.chargeT -= dt;
      }
      e.setAnim(e.state === 'approach' ? (moved ? 'walk' : 'idle') : e.procName);
      break;
    }
    case 'windup': {
      const hf = e.meta.anims.attack ? (e.meta.anims.attack.hitFrac || 0.45) * 0.9 : 0.45; e.procName = e.meta.anims.attack ? 'attack' : 'windup'; e.animProgress = hf * e.stateT / e.windT;
      if (Math.floor(e.stateT * 12) % 2 === 0) { e.flash = 0.45; e.mat.uniforms.flashColor.value.setRGB(1, .9, .3); }
      if (e.stateT >= e.windT) { e.setState('strike'); e.didHit = false; e.procName = 'attack'; sfx.swing(); }
      break;
    }
    case 'strike': {
      const ra = e.meta.anims.attack, hf = ra ? (ra.hitFrac || 0.45) * 0.9 : 0, sd = ra ? 0.36 : 0.22;
      e.animProgress = ra ? hf + (1 - hf) * e.stateT / sd : 0.59 * e.stateT / sd;
      if (!e.didHit && e.stateT >= 0.06) {
        e.didHit = true;
        if (def.kind === 'archer') { shoot(e); }
        else {
          const d = (p.x - e.x) * e.facing;
          if (d > -0.3 && d < def.range + 0.35 && Math.abs(p.z - e.z) < 0.75) hurtPlayer(def.dmg, e.facing, !!def.heavy);
          if (def.heavy) { shake(.2); ring(e.x + e.facing * def.range * 0.6, e.z, 0xffffff, 3); }
          slashArc(e.x + e.facing * def.range * 0.5, 1.1, e.z + 0.05, e.facing, 0xdfe6ff, def.heavy ? 1.5 : .9, 1);
        }
      }
      if (e.stateT >= sd) {
        e.strikes++;
        if (def.kind === 'assassin' && e.strikes < 2) { e.setState('windup'); e.windT = 0.16; }
        else { e.strikes = 0; e.setState('recover'); e.cdT = def.cd * (rage ? .6 : 1) * rand(.8, 1.2); release(e); e.retreat = def.kind === 'assassin'; }
      }
      break;
    }
    case 'recover': {
      e.setAnim('idle');
      if (e.retreat) { moveToward(e, e.x - sign(dx) * 3, clamp(e.z + e.zOff, Z_MIN, Z_MAX), spd, dt); e.setAnim('walk'); }
      if (e.stateT >= (e.retreat ? 0.9 : 0.5)) { e.retreat = false; e.setState('approach'); }
      break;
    }
    case 'chargeWind': {
      e.facing = sign(dx); e.x -= e.facing * 0.8 * dt; e.animProgress = (e.meta.anims.atk2?.hitFrac || 0.4) * 0.8 * e.stateT / 0.8; if (Math.floor(e.stateT * 14) % 2 === 0) { e.flash = 0.6; e.mat.uniforms.flashColor.value.setRGB(1, .2, .2); }
      if (e.stateT >= 0.8) { e.setState('charge'); e.didHit = false; if (!e.meta.anims.atk2) e.procName = 'charge'; sfx.heavy(); }
      break;
    }
    case 'charge': {
      e.x += e.facing * 13 * dt; e.animProgress = Math.min(0.99, (e.meta.anims.atk2?.hitFrac || 0.4) + 0.12); embers(e.x - e.facing * 0.8, 0.1, e.z, 0x9a6bff, 1);
      if (!e.didHit && Math.abs(p.x - e.x) < 1.4 && Math.abs(p.z - e.z) < 0.9) { if (hurtPlayer(20, e.facing, true)) e.didHit = true; }
      if (e.stateT >= 0.55) { e.setState('recover'); e.chargeT = rage ? rand(3, 4.5) : rand(5, 7); e.cdT = 1.0; shake(.25); }
      break;
    }
    case 'hurt': e.animProgress = Math.min(0.6, e.stateT / (e.hurtDur || .28) * 0.6); e.x += e.kbV * dt; e.kbV *= Math.exp(-9 * dt); if (e.stateT >= (e.hurtDur || .28)) { e.setState('approach'); e.cdT = Math.max(e.cdT, .35); } break;
    case 'down': {
      e.animProgress = Math.min(1, e.stateT / 0.7); airPhysics(e, dt);
      if (e.dying) { if (e.stateT > 1.0) e.opacity = Math.max(0, 1 - (e.stateT - 1.0) / 0.5); if (e.stateT > 1.5) e.remove = true; }
      else if (e.stateT >= 1.25) { e.setState('getup'); e.setAnim('getup'); }
      break;
    }
    case 'getup': { const gd = e.meta.anims.getup ? 0.45 : 0.3; e.animProgress = e.stateT / gd; if (e.stateT >= gd) { e.setState('approach'); e.cdT = Math.max(e.cdT, .5); } break; }
  }
  e.z = clamp(e.z, Z_MIN, Z_MAX);
  // once an enemy has come on screen it stays fully visible (knock-backs stop at the screen edge)
  const ehw = edgeHalf(e.z, 1.1 + def.body);
  if (!e.entered && Math.abs(e.x - G.camX) < ehw) e.entered = true;
  if (e.entered) e.x = clamp(e.x, G.camX - ehw, G.camX + ehw);
}
function separate() {
  const L = G.enemies;
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const a = L[i], b = L[j]; if (!a.alive || !b.alive) continue;
    const dx = b.x - a.x, dz = b.z - a.z; if (Math.abs(dx) < 0.8 && Math.abs(dz) < 0.35) { const s = (0.8 - Math.abs(dx)) * 0.5 * sign(dx || rand(-1, 1)); a.x -= s * 0.1; b.x += s * 0.1; a.z -= 0.012 * sign(dz || 1); b.z += 0.012 * sign(dz || 1); }
  }
}
function shoot(e) {
  sfx.arrow(); const m = new THREE.Mesh(QUAD, flatMat(TEX.arrow, { fog: false })); m.scale.set(1.1 * e.facing, 0.14, 1); m.position.set(e.x + e.facing * 0.6, 1.15, e.z + 0.02); scene.add(m);
  G.shots.push({ m, x: e.x + e.facing * 0.6, z: e.z, dir: e.facing, dmg: e.def.dmg, life: 0 });
}
function updateShots(dt) {
  const p = G.player;
  for (let i = G.shots.length - 1; i >= 0; i--) {
    const s = G.shots[i]; s.life += dt; s.x += s.dir * 10.5 * dt; s.m.position.x = s.x; let dead = s.life > 2.2;
    if (!dead && Math.abs(p.x - s.x) < 0.45 && Math.abs(p.z - s.z) < 0.55) { if (hurtPlayer(s.dmg, s.dir, false)) dead = true; }
    if (dead) { scene.remove(s.m); s.m.material.dispose(); G.shots.splice(i, 1); }
  }
}

// ---------------------------------------------------------------- director
function updateDirector(dt) {
  const seg = SEGS[G.seg]; if (!seg) return;
  if (G.segState === 'travel') {
    if (G.camX >= seg.lockX - 0.08) {
      G.segState = 'fight'; G.wave = 0; $('#go').style.display = 'none';
      if (G.seg === 1) spawnFood('food_rice', seg.lockX - 3, -1.4); if (G.seg === 2) spawnFood('food_bun', seg.lockX + 2.5, 0.8);
      if (seg.boss) { G.paused = true; sfx.warn(); message('WARNING', 900); bgm('bgm_boss'); setTimeout(() => { voice('boss_intro'); showCutin({ img: 'cutin_boss_heukrang.jpg', pos: '50% 36%', skillImg: 'name_heukrang.webp', name: '흑랑', quote: '감히 내 산채에 발을 들여?', css: '#b48cff' }, () => { G.paused = false; queueWave(seg.waves[0]); $('#boss').style.display = 'block'; }); }, 700); }
      else queueWave(seg.waves[0]);
    }
  } else if (G.segState === 'fight') {
    for (let i = G.spawnQ.length - 1; i >= 0; i--) { const q = G.spawnQ[i]; q.t -= dt; if (q.t <= 0) { if (!charDone[q.id]) { loadChar(q.id); continue; } spawnEnemy(q.id, q.side, q.i); G.spawnQ.splice(i, 1); } }
    const b = G.bossRef;
    if (b && b.alive && !b.adds && b.hp < b.maxHp * 0.5) { b.adds = true; spawnFood('food_meat', G.camX - 2.5, -1.2, true); message('졸개들이 몰려온다!', 1100); queueWave(['e1_grunt', 'e5_assassin', 'e1_grunt']); }
    if (!G.spawnQ.length && !G.enemies.length) {
      G.wave++;
      if (G.wave < seg.waves.length) queueWave(seg.waves[G.wave]);
      else if (seg.boss) { G.segState = 'done'; G.endT = 1.4; G.endKind = 'clear'; }
      else { G.seg++; G.segState = 'travel'; G.tokens = 0; $('#go').style.display = 'block'; }
    }
  }
}
function queueWave(list) { list.forEach((id, i) => G.spawnQ.push({ id, side: ENEMIES[id].kind === 'archer' ? 1 : (i % 2 ? -1 : 1), i, t: 0.35 + i * 0.55 })); }

// ---------------------------------------------------------------- cut-in
function showCutin(o, done) {
  const el = $('#cutin'); el.querySelector('.img').style.backgroundImage = `url(${assetUrl('assets/ui/' + o.img)})`; el.querySelector('.img').style.backgroundPosition = o.pos;
  el.querySelector('.skill').src = assetUrl('assets/ui/' + o.skillImg); el.querySelector('.quote').innerHTML = `<b style="color:${o.css}">${o.name}</b>「${o.quote}」`;
  el.querySelector('.band').style.borderColor = o.css;
  el.style.display = 'block'; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  setTimeout(() => { el.style.display = 'none'; el.classList.remove('on'); done(); }, 1250);
}

// ---------------------------------------------------------------- hud
const hudCache = {};
function setBar(id, v, cls) { const k = Math.round(v * 200); if (hudCache[id] !== k) { hudCache[id] = k; $(id + ' i').style.transform = `scaleX(${clamp(v, 0, 1)})`; } if (cls) $(id).classList.toggle(cls[0], cls[1]); }
function updateHud() {
  const p = G.player; if (!p) return;
  setBar('#hp', p.hp / p.maxHp, ['low', p.hp / p.maxHp < 0.3]); setBar('#gauge', p.gauge / 100, ['full', p.gauge >= 100]);
  $('#btnS').classList.toggle('ready', p.gauge >= 100);
  const sc = String(G.score).padStart(6, '0'); if (hudCache.sc !== sc) { hudCache.sc = sc; $('#score').textContent = sc; }
  if (G.bossRef) setBar('#bosshp', Math.max(0, G.bossRef.hp) / G.bossRef.maxHp);
}
function endGame(kind) {
  G.state = kind; $('#hud').style.display = 'none'; $('#touch').style.display = 'none'; bgm(null);
  if (kind === 'clear') { const t = Math.floor(G.time); $('#clearres').innerHTML = `점수 <b>${G.score}</b><br>시간 ${Math.floor(t / 60)}분 ${t % 60}초 · 남은 체력 ${Math.round(G.player.hp)}`; $('#clear').style.display = 'flex'; }
  else $('#over').style.display = 'flex';
}
document.querySelectorAll('.card').forEach((c) => c.addEventListener('click', () => startGame(c.dataset.hero)));
document.querySelectorAll('.pbtn').forEach((b) => b.addEventListener('click', () => { if (b.dataset.act === 'retry') startGame(G.heroId); else { clearActors(); bgm(null); G.state = 'title'; G.camX = STAGE_START; $('#clear').style.display = 'none'; $('#over').style.display = 'none'; $('#hud').style.display = 'none'; $('#title').style.display = 'flex'; } }));

// ---------------------------------------------------------------- loop
function update(dt) {
  G.t += dt;
  if (flashT > 0) { flashT -= dt; const f = $('#flash'); f.style.opacity = Math.max(0, flashT / flashDur) * (+f.dataset.a || 1); }
  for (const g of glows) g.m.material.opacity = g.base * (0.8 + 0.2 * Math.sin(G.t * 9 + g.ph) + 0.1 * Math.sin(G.t * 23 + g.ph * 2));
  if (W.fireflies) W.fireflies.position.y = Math.sin(G.t * 0.6) * 0.25;
  if (G.state === 'title') { G.camX = STAGE_START + 3 + Math.sin(G.t * 0.25) * 3; return; }
  if (G.state !== 'play') { updateParticles(dt); for (const e of G.enemies) e.sync(dt); if (G.player) G.player.sync(dt); return; }
  if (G.paused) return;
  if (G.freeze > 0) { G.freeze -= dt; if (G.player) G.player.sync(0); for (const e of G.enemies) e.sync(0); return; }
  if (G.slow > 0) { G.slow -= dt; dt *= 0.3; }
  G.time += dt; readKeys();
  for (let i = G.timers.length - 1; i >= 0; i--) { const t = G.timers[i]; t.t -= dt; if (t.t <= 0) { G.timers.splice(i, 1); t.fn(); } }
  const p = G.player;
  updatePlayer(p, dt);
  for (const e of G.enemies) updateEnemy(e, dt);
  separate();
  for (let i = G.enemies.length - 1; i >= 0; i--) if (G.enemies[i].remove) { G.enemies[i].dispose(); G.enemies.splice(i, 1); }
  updateShots(dt); updateDirector(dt); updateItems(dt); updateParticles(dt);
  if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) { G.combo = 0; comboPop(); } }
  // camera
  const seg = SEGS[Math.min(G.seg, SEGS.length - 1)];
  const camMax = seg.lockX, camMin = G.seg > 0 ? SEGS[G.seg - 1].lockX : STAGE_START;
  const target = G.segState === 'travel' ? clamp(p.x + 1.6, camMin, camMax) : seg.lockX;
  G.camX = Math.max(camMin, lerp(G.camX, target, 1 - Math.exp(-5 * dt)));
  if (G.segState === 'travel' && G.camX > camMin + 1.5) $('#go').style.display = 'none';
  p.sync(dt); for (const e of G.enemies) e.sync(dt);
  updateHud();
  if (G.endT > 0) { G.endT -= dt; if (G.endT <= 0) endGame(G.endKind); }
}
let sky;
function render() {
  G.zoom = lerp(G.zoom, G.zoomT, 0.15); G.shake *= 0.86;
  const sx = (Math.random() - .5) * G.shake, sy = (Math.random() - .5) * G.shake;
  const focusX = G.player && G.zoom < 0.99 ? lerp(G.camX, G.player.x, 0.6) : G.camX;
  camera.position.set(focusX + sx, CAM.ty + (CAM.y - CAM.ty) * G.zoom + sy, CAM.z * G.zoom);
  camera.lookAt(focusX + sx, CAM.ty - (1 - G.zoom) * 3 + sy, 0);
  if (sky) sky.style.transform = `translateX(${-clamp((G.camX - STAGE_START) / 56, 0, 1) * 12}%)`;
  renderer.render(scene, camera);
}
let last = performance.now(), fpsT = 0, fpsN = 0;
function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  update(dt); render();
  fpsT += dt; fpsN++; if (fpsT >= 0.5) { $('#fps').textContent = Math.round(fpsN / fpsT) + ' fps'; fpsT = 0; fpsN = 0; }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- boot
(async function boot() {
  [CHARS, PROPS, LAYERS] = await Promise.all([CHAR_DIR + 'chars.json', 'assets/bg/props.json', 'assets/bg/layers.json'].map((u) => fetch(assetUrl(u)).then((r) => r.json())));
  const jobs = [loadTex('ground', 'assets/bg/ground.jpg', { repeat: true })];
  for (const id of Object.keys(PROPS)) jobs.push(loadTex(id, `assets/bg/${id}.png`));
  jobs.push(fetch(assetUrl('assets/items/items.json')).then((r) => r.json()).then((j) => { ITEMS_META = j; }));
  for (const id of Object.keys(FOODS)) jobs.push(loadTex(id, `assets/items/${id}.webp`));
  for (const id of Object.keys(LAYERS)) jobs.push(loadTex(id, `assets/bg/${LAYERS[id].file}`, id === 'far_ridge' ? { repeat: true, mirror: true } : {}));
  // only the first fight's enemies block the start; the rest stream in while the player is on the title screen
  for (const cid of SEGS[0].waves.flat()) jobs.push(loadChar(cid));
  let doneN = 0; jobs.forEach((j) => j.then(() => { doneN++; $('#loading').textContent = '불러오는 중… ' + Math.round(doneN / jobs.length * 100) + '%'; }));
  await Promise.all(jobs);
  (async () => { for (const cid of Object.keys(CHARS)) if (!HEROES[cid]) await loadChar(cid).catch(() => {}); })();
  sky = document.createElement('div'); sky.style.cssText = 'position:absolute;left:0;top:0;width:114%;height:100%;background:#070a1e url(' + assetUrl('assets/bg/bg_far.jpg') + ') center top/cover no-repeat;will-change:transform';
  $('#stage').insertBefore(sky, canvas); canvas.style.position = 'relative';
  buildWorld();
  $('#loading').style.display = 'none';
  window.__step = (n, d = 1 / 60) => { for (let i = 0; i < n; i++) update(d); render(); }; // test hook
  window.__G = G; window.__startGame = startGame; window.__input = input; window.__VIEW = VIEW; window.__charDone = charDone; window.__SND = SND; window.__BGM = BGM; window.__AC = AC;
  requestAnimationFrame(frame);
})().catch((e) => { $('#loading').textContent = '불러오기 실패: ' + e.message; console.error(e); });
