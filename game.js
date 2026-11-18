// 월하무쌍 v0.4: 2D 스프라이트를 3D 공간에 세우는 벨트스크롤 액션 (7막, 5인, 스킬, 아이템, 스토리 컷신)
import * as THREE from './lib/three.module.min.js';
THREE.ColorManagement.enabled = false;

const $ = (s) => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sign = (v) => (v >= 0 ? 1 : -1);
const pick = (...a) => a[Math.floor(Math.random() * a.length)];

// ================================================================ data
const HEROES = {
  h1_mujin: { name: '무진', sub: '화염검객', desc: '환도 · 화염<br>균형형', face: 'face_h1_mujin.jpg', cutin: 'cutin_h1_mujin.jpg', cutPos: '50% 37%', skillImg: 'name_hwaryongcham.webp', quote: '베어낸다.', color: 0xff7a1a, css: '#ff9a3a', hp: 100, speed: 4.5, shadow: 1.0, body: 0.3,
    combo: [{ dur: .36, range: 1.9, dmg: 10, kb: 2.6 }, { dur: .36, range: 1.9, dmg: 10, kb: 2.6 }, { dur: .62, range: 2.3, dmg: 20, kb: 5.5, down: true }],
    skills: [
      { name: '돌진참', icon: 'sk_h1_a', cd: 5, type: 'dash', dur: .75, dist: 5.5, dmg: 24, kb: 4.5, down: true },
      { name: '승룡참', icon: 'sk_h1_b', cd: 7, type: 'aoe', dur: .8, front: true, r: 2.6, dmg: 28, kb: 2, down: true },
      { name: '화염파', icon: 'sk_h1_c', cd: 8, type: 'proj', dur: .8, pkind: 'fire', speed: 13, dmg: 26, pierce: true, range: 10, kb: 4, down: true },
    ] },
  h2_seolhwa: { name: '설화', sub: '빙월창', desc: '월아창 · 얼음<br>긴 사거리', face: 'face_h2_seolhwa.jpg', cutin: 'cutin_h2_seolhwa.jpg', cutPos: '50% 34%', skillImg: 'name_bingwolchang.webp', quote: '얼어붙어라.', color: 0x7fd4ff, css: '#9fe0ff', hp: 90, speed: 4.2, shadow: 1.0, body: 0.3,
    combo: [{ dur: .4, range: 2.7, dmg: 8, kb: 2.8 }, { dur: .4, range: 2.7, dmg: 8, kb: 2.8 }, { dur: .66, range: 3.1, dmg: 18, kb: 5.5, down: true }],
    skills: [
      { name: '연환창', icon: 'sk_h2_a', cd: 5, type: 'multi', dur: .9, hits: 5, front: true, r: 3.3, dmg: 8, kb: 1.2 },
      { name: '회전창', icon: 'sk_h2_b', cd: 7, type: 'aoe', dur: .85, r: 3.1, dmg: 24, kb: 5, down: true },
      { name: '빙결진', icon: 'sk_h2_c', cd: 11, type: 'aoe', dur: .9, r: 3.8, dmg: 16, kb: 0, freeze: 2.6 },
    ] },
  h3_gangsan: { name: '강산', sub: '철권', desc: '철권 장갑 · 대지<br>느리고 강함', face: 'face_h3_gangsan.jpg', cutin: 'cutin_h3_gangsan.jpg', cutPos: '50% 40%', skillImg: 'name_bungsangwon.webp', quote: '부순다.', color: 0xd8a24a, css: '#e6b25a', hp: 130, speed: 3.9, shadow: 1.2, body: 0.36,
    combo: [{ dur: .42, range: 1.7, dmg: 13, kb: 3 }, { dur: .42, range: 1.7, dmg: 13, kb: 3 }, { dur: .7, range: 2.0, dmg: 26, kb: 7, down: true }],
    skills: [
      { name: '붕권', icon: 'sk_h3_a', cd: 5, type: 'aoe', dur: .75, front: true, r: 2.4, dmg: 36, kb: 8, down: true },
      { name: '지진각', icon: 'sk_h3_b', cd: 8, type: 'aoe', dur: .9, r: 3.6, dmg: 26, kb: 3, down: true, quake: true },
      { name: '철산고', icon: 'sk_h3_c', cd: 7, type: 'dash', dur: .7, dist: 4.5, dmg: 28, kb: 6, down: true },
    ] },
  h4_biyeon: { name: '비연', sub: '쌍검', desc: '쌍단검 · 바람<br>빠른 연타', face: 'face_h4_biyeon.jpg', cutin: 'cutin_h4_biyeon.jpg', cutPos: '50% 38%', skillImg: 'name_biyeonnanmu.webp', quote: '눈으로 좇을 수 있을까?', color: 0xcfe8ff, css: '#dfeeff', hp: 80, speed: 5.2, shadow: 0.95, body: 0.28,
    combo: [{ dur: .28, range: 1.6, dmg: 7, kb: 2 }, { dur: .28, range: 1.6, dmg: 7, kb: 2 }, { dur: .5, range: 1.9, dmg: 15, kb: 5, down: true }],
    skills: [
      { name: '비연참', icon: 'sk_h4_a', cd: 4, type: 'dash', dur: .6, dist: 6.5, dmg: 18, kb: 2, down: false },
      { name: '회오리', icon: 'sk_h4_b', cd: 7, type: 'multi', dur: 1.0, hits: 6, r: 2.5, dmg: 7, kb: .6 },
      { name: '비도', icon: 'sk_h4_c', cd: 6, type: 'proj', dur: .7, pkind: 'dagger', count: 3, speed: 16, dmg: 13, range: 9, kb: 2 },
    ] },
  h5_cheongun: { name: '청운', sub: '도사', desc: '학선과 부적 · 번개<br>원거리 술법', face: 'face_h5_cheongun.jpg', cutin: 'cutin_h5_cheongun.jpg', cutPos: '50% 38%', skillImg: 'name_noesin.webp', quote: '하늘의 벼락을 받아라.', color: 0xffe25a, css: '#ffe880', hp: 85, speed: 4.0, shadow: 1.0, body: 0.3,
    combo: [{ dur: .4, range: 2.9, dmg: 8, kb: 2.4 }, { dur: .4, range: 2.9, dmg: 8, kb: 2.4 }, { dur: .66, range: 3.2, dmg: 18, kb: 5.5, down: true }],
    skills: [
      { name: '폭염부', icon: 'sk_h5_a', cd: 5, type: 'proj', dur: .7, pkind: 'talisman', speed: 11, dmg: 30, range: 8, explode: 2.4, kb: 4, down: true },
      { name: '뇌전', icon: 'sk_h5_b', cd: 8, type: 'bolt', dur: .85, targets: 4, range: 8, dmg: 30, kb: 2, down: true },
      { name: '청풍결계', icon: 'sk_h5_c', cd: 12, type: 'aoe', dur: .9, r: 3.4, dmg: 10, kb: 7, heal: 18 },
    ] },
};
const HERO_IDS = Object.keys(HEROES);
const ENEMIES = {
  e1_grunt: { kind: 'melee', hp: 30, speed: 2.3, range: 1.3, dmg: 6, cd: 1.5, windup: .4, score: 100, shadow: 1.0, body: 0.3 },
  e2_spearman: { kind: 'melee', hp: 36, speed: 1.9, range: 2.35, dmg: 9, cd: 2.1, windup: .5, score: 150, shadow: 1.05, body: 0.3 },
  e3_archer: { kind: 'archer', hp: 22, speed: 2.2, range: 6, dmg: 7, cd: 2.6, windup: .55, score: 150, shadow: 1.0, body: 0.3 },
  e4_brute: { vr: 0.82, kind: 'melee', hp: 95, speed: 1.35, range: 1.75, dmg: 18, cd: 2.6, windup: .68, armor: true, heavy: true, score: 400, shadow: 1.7, body: 0.55 },
  e5_assassin: { vr: 1.12, kind: 'assassin', hp: 28, speed: 3.9, range: 1.25, dmg: 5, cd: 1.7, windup: .2, score: 250, shadow: 1.0, body: 0.3 },
  e6_pirate: { kind: 'melee', hp: 34, speed: 2.7, range: 1.6, dmg: 7, cd: 1.5, windup: .36, score: 150, shadow: 1.0, body: 0.3 },
  e7_monk: { vr: 0.92, kind: 'melee', hp: 46, speed: 2.2, range: 2.0, dmg: 9, cd: 1.9, windup: .45, score: 200, shadow: 1.05, body: 0.32 },
  e8_soldier: { vr: 0.95, kind: 'melee', guard: true, hp: 52, speed: 1.8, range: 1.7, dmg: 10, cd: 2.0, windup: .5, score: 250, shadow: 1.1, body: 0.35 },
  e9_ghost: { vr: 0.82, kind: 'ghost', hp: 36, speed: 3.0, range: 1.9, dmg: 9, cd: 1.8, windup: .32, score: 250, shadow: 0.9, body: 0.3 },
  boss_heukrang: { kind: 'boss', hp: 460, speed: 1.75, range: 2.7, dmg: 16, cd: 2.2, windup: .58, armor: true, heavy: true, score: 3000, shadow: 2.2, body: 0.7 },
  boss_yeompa: { kind: 'boss', hp: 540, speed: 1.7, range: 2.9, dmg: 17, cd: 2.1, windup: .55, armor: true, heavy: true, score: 3500, shadow: 2.1, body: 0.7 },
  boss_hyeolbul: { kind: 'boss', hp: 580, speed: 1.9, range: 3.0, dmg: 18, cd: 2.0, windup: .5, armor: true, heavy: true, score: 4000, shadow: 2.0, body: 0.65 },
  boss_muryang: { kind: 'boss', hp: 720, speed: 1.45, range: 2.6, dmg: 22, cd: 2.4, windup: .62, armor: true, heavy: true, score: 4500, shadow: 2.3, body: 0.8 },
  boss_hongryeon: { kind: 'boss', hp: 580, speed: 2.3, range: 2.6, dmg: 16, cd: 1.9, windup: .45, armor: true, score: 5000, shadow: 1.7, body: 0.55 },
  boss_eumgwi: { kind: 'boss', hp: 660, speed: 2.0, range: 3.2, dmg: 19, cd: 2.1, windup: .5, armor: true, heavy: true, score: 5500, shadow: 2.0, body: 0.65 },
  boss_yachawang: { kind: 'boss', hp: 960, speed: 2.0, range: 3.2, dmg: 24, cd: 1.9, windup: .5, armor: true, heavy: true, score: 9000, shadow: 2.3, body: 0.75 },
};
const BOSSES = {
  boss_heukrang: { title: '흑랑채 두목 · 흑랑', name: '흑랑', cutin: 'cutin_boss_heukrang.jpg', pos: '50% 36%', nameImg: 'name_heukrang.webp', quote: '감히 내 산채에 발을 들여?', css: '#b48cff', vo: 'boss', atk2: 'charge', proj: 0x9a6bff },
  boss_yeompa: { title: '수적 두목 · 염파', name: '염파', cutin: 'cutin_boss_yeompa.jpg', pos: '50% 36%', nameImg: 'name_yeompa.webp', quote: '물귀신 무서운 줄 모르는구나!', css: '#6cc4ff', vo: 'yeompa', atk2: 'charge', proj: 0x5fb8ff },
  boss_hyeolbul: { title: '타락승 · 혈불', name: '혈불', cutin: 'cutin_boss_hyeolbul.jpg', pos: '50% 34%', nameImg: 'name_hyeolbul.webp', quote: '부처도 피를 원하노라.', css: '#ff5a5a', vo: 'hyeolbul', atk2: 'slam', proj: 0xff4040 },
  boss_muryang: { title: '철갑장군 · 무량', name: '무량', cutin: 'cutin_boss_muryang.jpg', pos: '50% 34%', nameImg: 'name_muryang.webp', quote: '이 관문은 아무도 넘지 못한다.', css: '#a8d8ff', vo: 'muryang', atk2: 'charge', proj: 0xbfe6ff },
  boss_hongryeon: { title: '화염무희 · 홍련', name: '홍련', cutin: 'cutin_boss_hongryeon.jpg', pos: '50% 32%', nameImg: 'name_hongryeon.webp', quote: '불꽃 속에서 춤을 춰 볼까?', css: '#ff8a40', vo: 'hongryeon', atk2: 'proj', proj: 0xff7a2a },
  boss_eumgwi: { title: '묘지기 · 음귀', name: '음귀', cutin: 'cutin_boss_eumgwi.jpg', pos: '50% 34%', nameImg: 'name_eumgwi.webp', quote: '산 자가 여기까지 오다니…', css: '#c08aff', vo: 'eumgwi', atk2: 'proj', proj: 0xa070ff, teleport: true },
  boss_yachawang: { title: '귀면장군 · 야차왕', name: '야차왕', cutin: 'cutin_boss_yachawang.jpg', pos: '50% 34%', nameImg: 'name_yachawang.webp', quote: '월옥은 이미 내 것이다. 엎드려라!', css: '#ff4a6a', vo: 'yachawang', atk2: 'mix', proj: 0xb050ff },
};
const W3 = (a, b, c) => [a, b, c];
const STAGES = [
  { id: 's1', name: '흑랑 고개', sky: 'bg_far.jpg', bgm: 'bgm_stage', bossBgm: 'bgm_boss', fog: 0x0c1438, groundTint: 0xc4cdff, boss: 'boss_heukrang', adds: ['e1_grunt', 'e5_assassin', 'e1_grunt'], tokens: [1, 2, 2, 2],
    waves: W3([['e1_grunt', 'e1_grunt'], ['e1_grunt', 'e2_spearman', 'e1_grunt']], [['e1_grunt', 'e3_archer', 'e2_spearman'], ['e5_assassin', 'e1_grunt', 'e3_archer', 'e1_grunt']], [['e4_brute', 'e1_grunt', 'e1_grunt'], ['e2_spearman', 'e5_assassin', 'e3_archer', 'e4_brute']]),
    parts: { color: 0xbfe6ff, n: 70, mode: 'float', size: .16 } },
  { id: 's2', name: '갈대 나루', sky: 's2_sky.jpg', bgm: 'bgm_s2', bossBgm: 'bgm_boss', fog: 0x2a1830, groundTint: 0xe8d8d0, midTint: 0xf2e6ee, ridgeTint: 0xe6d8ee, p1H: 1.7, p2H: 2.1, p2glow: { color: 0xffa040, y: .7, s: 2.2 }, arenaGlow: 0xff8a2a, boss: 'boss_yeompa', adds: ['e6_pirate', 'e6_pirate', 'e3_archer'], tokens: [1, 2, 2, 2],
    waves: W3([['e6_pirate', 'e6_pirate'], ['e6_pirate', 'e1_grunt', 'e6_pirate']], [['e6_pirate', 'e3_archer', 'e1_grunt'], ['e5_assassin', 'e6_pirate', 'e3_archer', 'e6_pirate']], [['e4_brute', 'e6_pirate', 'e6_pirate'], ['e6_pirate', 'e5_assassin', 'e3_archer', 'e4_brute']]),
    parts: { color: 0xffc080, n: 50, mode: 'float', size: .12 } },
  { id: 's3', name: '대숲 사찰', sky: 's3_sky.jpg', bgm: 'bgm_s3', bossBgm: 'bgm_boss', fog: 0x6f87a6, groundTint: 0xd8e2ee, midTint: 0xe2ecf8, ridgeTint: 0xdde8f6, p1H: 3.2, p2H: 1.6, arenaGlow: 0xffa050, boss: 'boss_hyeolbul', adds: ['e7_monk', 'e5_assassin', 'e7_monk'], tokens: [1, 2, 2, 2],
    waves: W3([['e7_monk', 'e7_monk'], ['e7_monk', 'e5_assassin', 'e7_monk']], [['e7_monk', 'e3_archer', 'e5_assassin'], ['e5_assassin', 'e7_monk', 'e3_archer', 'e7_monk']], [['e4_brute', 'e7_monk', 'e7_monk'], ['e7_monk', 'e5_assassin', 'e5_assassin', 'e4_brute']]),
    parts: { color: 0xe8f2ff, n: 60, mode: 'mist', size: .5 } },
  { id: 's4', name: '설산 관문', sky: 's4_sky.jpg', bgm: 'bgm_s4', bossBgm: 'bgm_boss', fog: 0x8a96a8, groundTint: 0xe6ecf6, midTint: 0xeef2fa, ridgeTint: 0xe8eef8, p1H: 1.9, p2H: 2.2, p2glow: { color: 0xff9a3a, y: .82, s: 2.4 }, arenaGlow: 0xff9040, boss: 'boss_muryang', adds: ['e8_soldier', 'e8_soldier', 'e2_spearman'], tokens: [2, 2, 2, 2],
    waves: W3([['e8_soldier', 'e2_spearman'], ['e8_soldier', 'e2_spearman', 'e8_soldier']], [['e8_soldier', 'e3_archer', 'e2_spearman'], ['e2_spearman', 'e8_soldier', 'e3_archer', 'e8_soldier']], [['e4_brute', 'e8_soldier', 'e8_soldier'], ['e8_soldier', 'e2_spearman', 'e4_brute', 'e8_soldier']]),
    parts: { color: 0xffffff, n: 140, mode: 'snow', size: .1 } },
  { id: 's5', name: '불타는 저잣거리', sky: 's5_sky.jpg', bgm: 'bgm_s5', bossBgm: 'bgm_boss', fog: 0x2a0c08, groundTint: 0xf0d8d0, p1H: 1.8, p2H: 1.2, p2glow: { color: 0xff6a20, y: .5, s: 2.6 }, arenaGlow: 0xff6a20, boss: 'boss_hongryeon', adds: ['e5_assassin', 'e5_assassin', 'e6_pirate'], tokens: [2, 2, 2, 2],
    waves: W3([['e6_pirate', 'e1_grunt', 'e5_assassin'], ['e5_assassin', 'e6_pirate', 'e1_grunt']], [['e4_brute', 'e5_assassin', 'e3_archer'], ['e6_pirate', 'e5_assassin', 'e3_archer', 'e1_grunt']], [['e4_brute', 'e4_brute', 'e5_assassin'], ['e6_pirate', 'e5_assassin', 'e3_archer', 'e4_brute']]),
    parts: { color: 0xff9a40, n: 90, mode: 'ember', size: .12 } },
  { id: 's6', name: '왕릉 지하', sky: 's6_sky.jpg', bgm: 'bgm_s6', bossBgm: 'bgm_boss', fog: 0x0a0c22, groundTint: 0xc8d0ff, p1H: 2.4, p2H: 1.7, p2glow: { color: 0x6aa8ff, y: .8, s: 2.2 }, arenaGlow: 0x6a8aff, boss: 'boss_eumgwi', adds: ['e9_ghost', 'e9_ghost', 'e9_ghost'], tokens: [2, 2, 2, 2],
    waves: W3([['e9_ghost', 'e9_ghost'], ['e9_ghost', 'e7_monk', 'e9_ghost']], [['e9_ghost', 'e7_monk', 'e5_assassin'], ['e9_ghost', 'e9_ghost', 'e3_archer', 'e7_monk']], [['e4_brute', 'e9_ghost', 'e9_ghost'], ['e9_ghost', 'e7_monk', 'e9_ghost', 'e4_brute']]),
    parts: { color: 0x7aa8ff, n: 60, mode: 'wisp', size: .2 } },
  { id: 's7', name: '월궁', noRidge: true, sky: 's7_sky.jpg', bgm: 'bgm_s7', bossBgm: 'bgm_final', fog: 0x1a0410, groundTint: 0xf0d0d8, p1H: 3.2, p2H: 2.0, p2glow: { color: 0xb060ff, y: .75, s: 2.4 }, arenaGlow: 0xb050ff, boss: 'boss_yachawang', adds: ['e8_soldier', 'e9_ghost', 'e4_brute'], tokens: [2, 2, 3, 2],
    waves: W3([['e8_soldier', 'e9_ghost', 'e5_assassin'], ['e8_soldier', 'e8_soldier', 'e9_ghost']], [['e9_ghost', 'e5_assassin', 'e3_archer', 'e8_soldier'], ['e4_brute', 'e9_ghost', 'e8_soldier']], [['e4_brute', 'e4_brute', 'e9_ghost'], ['e8_soldier', 'e9_ghost', 'e5_assassin', 'e4_brute', 'e3_archer']]),
    parts: { color: 0xff5a7a, n: 70, mode: 'ember', size: .1 } },
];
const SEG_X = [11, 27, 43, 60];
const STORY = [
  [{ shot: 'st1a', lines: [['흑랑', '크윽… 이걸로 끝난 줄 아느냐.', 'st1a_1'], ['흑랑', '귀면장군께서… 달이 붉어지는 밤에…', 'st1a_2']] }, { shot: 'st1b', lines: [['', '흑랑채의 패에는 낯선 귀면 문양이 새겨져 있었다.', 'st1b_1'], ['', '흔적은 남쪽 갈대 나루로 이어졌다.', 'st1b_2']] }],
  [{ shot: 'st2a', lines: [['염파', '그 옥은… 귀면장군께 바칠 물건이었다!', 'st2a_1']] }, { shot: 'st2b', lines: [['', '누군가 일곱 조각의 월옥을 모으고 있었다.', 'st2b_1'], ['', '다음 행방은 안개 속 대숲의 옛 절.', 'st2b_2']] }],
  [{ shot: 'st3a', lines: [['혈불', '나는… 그자의 주술에 홀렸을 뿐…', 'st3a_1'], ['혈불', '북쪽 설산 관문이… 열리고 있소.', 'st3a_2']] }, { shot: 'st3b', lines: [['', '귀면장군의 손길은 관군에게까지 뻗어 있었다.', 'st3b_1']] }],
  [{ shot: 'st4a', lines: [['무량', '관군 절반이 이미 그자 편에 섰다.', 'st4a_1'], ['무량', '막으려면… 서둘러라.', 'st4a_2']] }, { shot: 'st4b', lines: [['', '그날 밤, 산 아래 저잣거리에 불길이 치솟았다.', 'st4b_1']] }],
  [{ shot: 'st5a', lines: [['홍련', '늦었어… 마지막 월옥은 이미 왕릉으로 갔지.', 'st5a_1']] }, { shot: 'st5b', lines: [['', '월하단은 죽은 자들의 땅, 왕릉 아래로 내려갔다.', 'st5b_1']] }],
  [{ shot: 'st6a', lines: [['음귀', '달이… 피로 물든다…', 'st6a_1']] }, { shot: 'st6b', lines: [['', '마침내 귀면장군 야차왕이 월궁에 모습을 드러냈다.', 'st6b_1']] }],
  [{ shot: 'st7a', lines: [['야차왕', '이럴 수가… 달빛이… 나를 거부한다…', 'st7a_1']] }, { shot: 'st7b', lines: [['', '붉은 달이 걷히고, 은빛 달이 다시 떠올랐다.', 'st7b_1'], ['', '그날 이후 사람들은 그들을 월하무쌍이라 불렀다.', 'st7b_2']] }],
];
const FOODS = { food_rice: { heal: 20, w: 0.8 }, food_bun: { heal: 35, w: 0.95 }, food_meat: { heal: 70, w: 1.15 } };
const ITEMS = [{ id: 'it_ginseng', name: '인삼' }, { id: 'it_bomb', name: '화약 폭탄' }, { id: 'it_charm', name: '금강 부적' }];
const PICK_W = { it_ginseng: .9, it_bomb: .85, it_charm: .7, it_gold: .85 };
const DROPS = { e1_grunt: [0.2, 'food_rice'], e2_spearman: [0.2, 'food_rice'], e3_archer: [0.25, 'food_rice'], e5_assassin: [0.25, 'food_bun'], e4_brute: [1, 'food_bun'], e6_pirate: [0.2, 'food_rice'], e7_monk: [0.22, 'food_rice'], e8_soldier: [0.22, 'food_bun'], e9_ghost: [0.18, 'food_rice'] };
const Z_MIN = -2.2, Z_MAX = 1.5;
const CAM = { y: 2.9, z: 10.6, ty: 2.0 };
const STAGE_START = 6;
const BUILD = '40';

// ================================================================ renderer
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
const MOBILE = !window.__ASSETS && (QS.has('m') || (TOUCH && !QS.has('hd') && Math.min(screen.width, screen.height) < 820));
// one sprite set (130 px per unit) for PC and phones: keeps the whole site under the free hosting upload limit
const CHAR_DIR = 'assets/chars/';
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
if (TOUCH) $('#stage').classList.add('touch');
resize();

// ================================================================ textures
const assetUrl = (u) => (window.__ASSETS && window.__ASSETS[u]) || u;
const loader = new THREE.TextureLoader();
const TEX = {};
const texLoads = {};
function loadTex(key, url, opt = {}) {
  if (TEX[key]) return Promise.resolve(TEX[key]);
  return (texLoads[key] ??= loader.loadAsync(assetUrl(url)).then((t) => {
    t.premultiplyAlpha = true;
    if (opt.sprite) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
    if (opt.repeat) { t.wrapS = opt.mirror ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping; t.wrapT = opt.mirror ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping; }
    TEX[key] = t; delete texLoads[key]; return t;
  }));
}
function dropTex(key) { if (TEX[key]) { TEX[key].dispose(); delete TEX[key]; } }
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.premultiplyAlpha = true; return t;
}
TEX.spark = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.75)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
TEX.shadow = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 4, 32, 32, 32); r.addColorStop(0, 'rgba(0,0,10,.9)'); r.addColorStop(.6, 'rgba(0,0,10,.5)'); r.addColorStop(1, 'rgba(0,0,10,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
TEX.streak = canvasTex(128, 32, (g) => { const r = g.createLinearGradient(0, 0, 128, 0); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(.7, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.beginPath(); g.ellipse(64, 16, 64, 7, 0, 0, 7); g.fill(); });
TEX.slash = canvasTex(256, 256, (g) => {
  g.translate(128, 128);
  for (let i = 0; i < 26; i++) { const k = i / 25; g.beginPath(); g.arc(-40 + k * 26, 0, 118 - k * 34, -1.15, 1.15); g.lineWidth = 3 + (1 - k) * 5; g.strokeStyle = `rgba(255,255,255,${0.05 + Math.pow(1 - k, 2) * 0.5})`; g.stroke(); }
  g.beginPath(); g.arc(-40, 0, 118, -1.1, 1.1); g.lineWidth = 5; g.shadowColor = '#fff'; g.shadowBlur = 14; g.strokeStyle = 'rgba(255,255,255,1)'; g.stroke();
});
TEX.ring = canvasTex(256, 256, (g) => { const r = g.createRadialGradient(128, 128, 70, 128, 128, 128); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(.72, 'rgba(255,255,255,.9)'); r.addColorStop(.86, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 256, 256); });
TEX.arrow = canvasTex(128, 16, (g) => { g.strokeStyle = '#d9c9a0'; g.lineWidth = 3; g.beginPath(); g.moveTo(8, 8); g.lineTo(112, 8); g.stroke(); g.fillStyle = '#e8eefc'; g.beginPath(); g.moveTo(126, 8); g.lineTo(106, 2); g.lineTo(106, 14); g.fill(); g.fillStyle = '#a33'; g.fillRect(4, 3, 16, 10); });
TEX.bolt = canvasTex(64, 256, (g) => { g.strokeStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 10; g.lineWidth = 6; g.beginPath(); let x = 32; g.moveTo(x, 0); for (let y = 16; y <= 256; y += 16) { x = 32 + (Math.random() - .5) * 34; g.lineTo(x, y); } g.stroke(); g.lineWidth = 2; g.stroke(); });
TEX.dagger = canvasTex(128, 24, (g) => { g.fillStyle = '#eef4ff'; g.beginPath(); g.moveTo(124, 12); g.lineTo(70, 5); g.lineTo(70, 19); g.fill(); g.fillStyle = '#7a2a2a'; g.fillRect(40, 8, 30, 8); g.fillStyle = '#d9b44a'; g.fillRect(66, 4, 5, 16); });

const QUAD = new THREE.PlaneGeometry(1, 1);
const FOGC = new THREE.Color(0x0c1438);
function spriteMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: null }, uvRect: { value: new THREE.Vector4(0, 0, 1, 1) }, tint: { value: new THREE.Color(1, 1, 1) }, flashColor: { value: new THREE.Color(1, 1, 1) }, flash: { value: 0 }, opacity: { value: 1 }, fogColor: { value: FOGC.clone() }, fogAmt: { value: 0 } },
    vertexShader: 'varying vec2 vUv; uniform vec4 uvRect; void main(){ vUv = uv*uvRect.zw + uvRect.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform sampler2D map; uniform vec3 tint; uniform vec3 flashColor; uniform vec3 fogColor; uniform float fogAmt; uniform float flash; uniform float opacity; varying vec2 vUv; void main(){ vec4 c = texture2D(map, vUv); if(c.a < 0.01) discard; vec3 rgb = mix(c.rgb*tint, flashColor*c.a, flash); rgb = mix(rgb, fogColor*c.a, fogAmt); gl_FragColor = vec4(rgb*opacity, c.a*opacity); }',
    transparent: true, depthWrite: false, side: THREE.DoubleSide, premultipliedAlpha: true,
  });
}
function flatMat(tex, o = {}) {
  const m = spriteMaterial(); m.uniforms.map.value = tex; m.uniforms.tint.value.setHex(o.color ?? 0xffffff); m.uniforms.fogColor.value.copy(FOGC);
  if (o.fog !== false && o.z !== undefined) m.uniforms.fogAmt.value = clamp((CAM.z - o.z - 9) / 37, 0, 1) * (o.fogK ?? 1);
  if (o.repeatX) m.uniforms.uvRect.value.set(0, 0, o.repeatX, 1);
  return m;
}
function addMat(tex, color) { return new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, side: THREE.DoubleSide, fog: false }); }

// ================================================================ world (one stage at a time)
let CHARS, PROPS, LAYERS, STAGEBG = {}, ITEMS_META = {};
const world = new THREE.Group(); scene.add(world);
const glows = [];
const W = { parts: null, stage: -1 };
function plane(mat, w, h, x, y, z, order = 0) { const m = new THREE.Mesh(QUAD, mat); m.scale.set(w, h, 1); m.position.set(x, y, z); m.renderOrder = order; world.add(m); return m; }
function addGlow(color, s, x, y, z, a = 0.55) { const g = plane(addMat(TEX.spark, color), s, s, x, y, z, 1); glows.push({ m: g, base: a, ph: Math.random() * 9 }); return g; }
function addProp(key, worldH, pw, ph, x, z, s = 1, o = {}) {
  const h = worldH * s, w = h * pw / ph;
  const m = plane(flatMat(TEX[key], { color: o.color ?? 0xffffff, z }), w * (o.flip ? -1 : 1), h, x, h / 2 - 0.04, z, o.order ?? 0);
  if (o.glow) addGlow(o.glow.color ?? 0xff9a3a, o.glow.s, x, h * o.glow.y, z + 0.05, o.glow.a ?? 0.55);
  return m;
}
function clearWorld() {
  for (const c of [...world.children]) { world.remove(c); if (c.geometry && c.geometry !== QUAD) c.geometry.dispose(); if (c.material) c.material.dispose(); }
  glows.length = 0; W.parts = null;
}
function buildGround(S) {
  const t = TEX['ground_' + S.id]; t.repeat.set(150 / 6, 12 / 6);
  const g = new THREE.Mesh(new THREE.PlaneGeometry(150, 12), new THREE.MeshBasicMaterial({ map: t, color: S.groundTint ?? 0xffffff }));
  g.rotation.x = -Math.PI / 2; g.position.set(33, 0, -0.5); world.add(g);
}
function buildS1() {
  const rl = LAYERS.far_ridge; const rH = 5.0, rW = rH * rl.w / rl.h, span = 132;
  plane(flatMat(TEX.far_ridge, { color: 0xb9c6ff, z: -14, repeatX: span / rW }), span, rH, 33, rH / 2 - 0.05, -14, -6);
  const fa = LAYERS.mid_forest_a, fb = LAYERS.mid_forest_b; const fH = 3.5;
  let x = -14, i = 0;
  while (x < 84) { const L = i % 2 ? fb : fa; const key = i % 2 ? 'mid_forest_b' : 'mid_forest_a'; const w = fH * L.w / L.h; plane(flatMat(TEX[key], { color: 0xd4dcff, z: -5.5 }), w * ((i >> 1) % 2 ? -1 : 1), fH, x + w / 2, fH / 2 - 0.06, -5.5, -4); x += w - 0.15; i++; }
  const gl = LAYERS.gate_cut; const gW = 13.5, gH = gW * gl.h / gl.w;
  plane(flatMat(TEX.gate_cut, { color: 0xe6e9ff, z: -4.9, fogK: 0.6 }), gW, gH, 60, gH / 2 - 0.05, -4.9, -3);
  for (const sx of [-1, 1]) addGlow(0xff8a2a, 3.0, 60 + sx * 2.7, 1.75, -4.8, 0.5);
  const P = (id, px, pz, s, o) => addProp(id, PROPS[id].worldH, PROPS[id].w, PROPS[id].h, px, pz, s, o);
  const lg = { glow: { y: 0.56, s: 2.6 } };
  [[1.5, -4.6, 1], [8.6, -4.2, .9, 1], [15.5, -4.7, 1.05], [22.4, -4.1, .95, 1], [30.2, -4.6, 1], [37.6, -4.2, 1.1], [46.5, -4.6, .95, 1], [51.0, -4.3, 1.05]].forEach(([px, pz, s, f]) => P('prop_pine', px, pz, s, { flip: !!f }));
  [[5.8, -3.0], [19.6, -3.1], [33.8, -3.0], [48.4, -3.1]].forEach(([px, pz]) => P('prop_lantern', px, pz, 1, lg));
  P('prop_totems', 25.6, -3.3, 1); P('prop_totems', 53.6, -3.4, 0.95, { flip: true });
  [[12.2, -3.4, 1], [40.8, -3.5, 1.15, 1], [29.0, -3.9, .8]].forEach(([px, pz, s, f]) => P('prop_rock', px, pz, s, { flip: !!f }));
  P('prop_pine', 52.6, -4.4, 1.15); P('prop_pine', 67.4, -4.4, 1.2, { flip: true });
}
function buildGeneric(S) {
  const M = STAGEBG[S.id], s = S.id;
  const rl = M.ridge; const rH = 5.0, rW = rH * rl.w / rl.h, span = 132;
  if (!S.noRidge) plane(flatMat(TEX[s + '_ridge'], { color: S.ridgeTint ?? 0xffffff, z: -14, repeatX: span / rW }), span, rH, 33, rH / 2 - 0.05, -14, -6);
  const fH = 3.6; let x = -14, i = 0;
  while (x < 84) { const L = i % 2 ? M.midB : M.midA; const key = s + (i % 2 ? '_midB' : '_midA'); const w = fH * L.w / L.h; plane(flatMat(TEX[key], { color: S.midTint ?? 0xffffff, z: -5.5 }), w * ((i >> 1) % 2 ? -1 : 1), fH, x + w / 2, fH / 2 - 0.06, -5.5, -4); x += w - 0.15; i++; }
  const ar = M.arena; const gW = 14, gH = gW * ar.h / ar.w;
  plane(flatMat(TEX[s + '_arena'], { color: 0xffffff, z: -4.9, fogK: 0.5 }), gW, gH, 60, gH / 2 - 0.05, -4.9, -3);
  if (S.arenaGlow) for (const sx of [-1, 1]) addGlow(S.arenaGlow, 3.0, 60 + sx * 3.2, 1.6, -4.8, 0.45);
  const p1 = M.p1, p2 = M.p2;
  [[2, -4.2, 1], [17.5, -3.6, .95, 1], [33, -4.3, 1.05], [47.5, -3.7, 1, 1]].forEach(([px, pz, sc, f]) => addProp(s + '_p1', S.p1H, p1.w, p1.h, px, pz, sc, { flip: !!f }));
  [[9, -3.2, 1], [24.5, -3.4, 1.05, 1], [40, -3.2, 1], [55, -3.3, .95, 1]].forEach(([px, pz, sc, f]) => addProp(s + '_p2', S.p2H, p2.w, p2.h, px, pz, sc, { flip: !!f, glow: S.p2glow }));
  addProp(s + '_p1', S.p1H, p1.w, p1.h, 52.4, -4.4, 1.15); addProp(s + '_p1', S.p1H, p1.w, p1.h, 67.6, -4.4, 1.15, { flip: true });
}
function buildParticles(P) {
  const n = P.n, pos = new Float32Array(n * 3);
  for (let k = 0; k < n; k++) { pos[k * 3] = rand(-4, 74); pos[k * 3 + 1] = rand(0.2, 5.2); pos[k * 3 + 2] = rand(-5, 2.8); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ map: TEX.spark, size: P.size, color: P.color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: P.mode === 'mist' ? 0.18 : 0.85, fog: false }));
  pts.renderOrder = 2; world.add(pts); W.parts = { pts, mode: P.mode };
}
function updateParticlesBg(dt) {
  const P = W.parts; if (!P) return;
  if (P.mode === 'float' || P.mode === 'mist') { P.pts.position.y = Math.sin(G.t * 0.6) * 0.25; P.pts.position.x = P.mode === 'mist' ? Math.sin(G.t * 0.2) * 1.5 : 0; return; }
  const a = P.pts.geometry.attributes.position, d = a.array;
  for (let i = 0; i < d.length; i += 3) {
    if (P.mode === 'snow') { d[i + 1] -= dt * (1.2 + (i % 7) * 0.12); d[i] += dt * (0.9 + Math.sin(G.t + i) * 0.4); if (d[i + 1] < 0) { d[i + 1] = 5.4; d[i] = rand(G.camX - 14, G.camX + 14); } }
    else { d[i + 1] += dt * (P.mode === 'wisp' ? 0.35 : 0.9 + (i % 5) * 0.15); d[i] += Math.sin(G.t * 2 + i) * dt * 0.3; if (d[i + 1] > 5.4) { d[i + 1] = 0.1; d[i] = rand(G.camX - 14, G.camX + 14); } }
  }
  a.needsUpdate = true;
}
const stageTexKeys = (si) => { const s = STAGES[si].id; return s === 's1' ? [] : [s + '_ridge', s + '_midA', s + '_midB', s + '_arena', 'ground_' + s, s + '_p1', s + '_p2']; };
function loadStageTex(si) {
  const S = STAGES[si], s = S.id; if (s === 's1') return Promise.resolve();
  const M = STAGEBG[s];
  return Promise.all([loadTex(s + '_ridge', 'assets/bg/' + M.ridge.file, { repeat: true, mirror: true }), loadTex(s + '_midA', 'assets/bg/' + M.midA.file), loadTex(s + '_midB', 'assets/bg/' + M.midB.file), loadTex(s + '_arena', 'assets/bg/' + M.arena.file),
    loadTex('ground_' + s, 'assets/bg/' + M.ground, { repeat: true }), loadTex(s + '_p1', 'assets/bg/' + M.p1.file), loadTex(s + '_p2', 'assets/bg/' + M.p2.file)]);
}
function buildStage(si) {
  const S = STAGES[si]; clearWorld();
  FOGC.setHex(S.fog); scene.fog.color.setHex(S.fog);
  buildGround(S);
  if (S.id === 's1') buildS1(); else buildGeneric(S);
  buildParticles(S.parts);
  if (sky) sky.style.backgroundImage = `url(${assetUrl('assets/bg/' + S.sky)})`;
  // free the textures of the previous stage (phones are short on graphics memory)
  if (W.stage >= 0 && W.stage !== si) for (const k of stageTexKeys(W.stage)) dropTex(k);
  W.stage = si;
}

// ================================================================ audio
const AC = { ctx: null };
function audioInit() {
  if (!AC.ctx) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    AC.ctx = new C(); AC.master = AC.ctx.createGain(); AC.master.gain.value = muted ? 0 : 0.5; AC.master.connect(AC.ctx.destination);
    const len = AC.ctx.sampleRate; AC.noise = AC.ctx.createBuffer(1, len, len); const d = AC.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    loadSounds(['pickup', 'hit1', 'hit2', 'hit3', 'heavy', 'boom', 'land', 'swing1', 'swing2', 'whoosh', 'ui', 'power', 'en_hurt1', 'en_hurt2', 'en_hurt3', 'en_die1', 'en_die2']);
    if (G.heroId) loadSounds(heroVoices(G.heroId));
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
const SND = {}, sndLoads = {};
function loadSound(name, url) {
  if (SND[name] || !AC.ctx) return Promise.resolve(SND[name]);
  return (sndLoads[name] ??= fetch(assetUrl(url)).then((r) => (r.ok ? r.arrayBuffer() : null)).then((b) => b && AC.ctx.decodeAudioData(b)).then((buf) => { if (buf) SND[name] = buf; return buf; }).catch(() => null));
}
function loadSounds(names) { for (const n of names) loadSound(n, 'assets/audio/' + n + '.mp3'); }
const heroVoices = (hid) => ['atk1', 'atk2', 'atk3', 'hurt1', 'hurt2', 'down', 'special', 'jump', 'sk1', 'sk2', 'sk3'].map((s) => hid.slice(0, 2) + '_' + s);
const bossVoices = (bid) => ['_intro', '_atk', '_hurt', '_die'].map((s) => BOSSES[bid].vo + s);
function play(name, vol = 1, rate = 1) {
  const b = SND[name]; if (!b || !AC.ctx) return false;
  const s = AC.ctx.createBufferSource(), g = AC.ctx.createGain(); s.buffer = b; s.playbackRate.value = rate; g.gain.value = vol; s.connect(g); g.connect(AC.master); s.start(); return s;
}
const sfx = {
  hit() { if (!play(pick('hit1', 'hit2', 'hit3'), .95, rand(.92, 1.1))) { noise(.09, .55, 1900, 300); tone('sine', 170, 50, .12, .6); } },
  heavy() { if (!play('heavy', 1)) { noise(.18, .7, 1200, 120); tone('sine', 120, 35, .3, .8); } play('hit1', .8, .78); },
  swing() { if (!play(pick('swing1', 'swing2'), .5, rand(.95, 1.25))) noise(.12, .16, 700, 2600); },
  hurt() { if (!play('hit3', 1, .88)) { tone('square', 230, 90, .16, .22); noise(.08, .3, 900, 200); } },
  special() { if (!play('boom', 1)) { tone('sawtooth', 80, 720, .55, .3); noise(.8, .55, 300, 3200); tone('sine', 60, 30, .9, .8); } },
  boom() { if (!play('boom', .9, 1.15)) noise(.4, .6, 400, 60); },
  ui() { if (!play('ui', .8)) tone('triangle', 660, 990, .08, .2); },
  arrow() { if (!play('swing1', .4, 1.6)) noise(.08, .14, 3000, 1200); },
  warn() { if (!play('power', .7)) tone('square', 440, 440, .18, .15); },
  guard() { if (!play('hit2', .7, 1.9)) tone('square', 1400, 900, .06, .2); },
  zap() { noise(.25, .5, 5000, 800); play('boom', .5, 1.6); },
  freeze() { if (!play('power', .7, 1.5)) tone('sine', 1200, 2400, .3, .2); },
  land() { play('land', .7); }, jump() { play('whoosh', .45, 1.35); },
};
const vLast = {};
function voice(names, chance = 1, gap = 0.12, vol = 1, rate = 1) {
  if (Math.random() > chance) return; const list = [].concat(names).sort(() => Math.random() - 0.5);
  const key = list[0].replace(/\d+$/, ''), t = now(); if (t - (vLast[key] || -9) < gap) return;
  for (const n of list) if (play(n, vol, rate * rand(.97, 1.04))) { vLast[key] = t; return; }
}
const hv = (s) => G.heroId.slice(0, 2) + '_' + s;
const bv = (s) => BOSSES[STAGES[G.stage].boss].vo + '_' + s;
const BGM = { el: {}, gain: {}, cur: null };
function bgm(name, vol = 0.5) {
  if (!AC.ctx) return; const t = AC.ctx.currentTime;
  if (BGM.cur === name) { const g = BGM.gain[name]; if (g) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(vol, t + 0.6); } return; }
  const old = BGM.cur; BGM.cur = name;
  if (old && BGM.el[old]) { const g = BGM.gain[old], el = BGM.el[old]; if (g) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.7); } setTimeout(() => { if (BGM.cur !== old) el.pause(); }, 800); }
  if (!name) return;
  const el = bgmEl(name);
  try { el.currentTime = 0; } catch (e) { /* not seekable yet */ }
  el.play().catch(() => {});
  const g = BGM.gain[name]; if (g) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.8); }
}
function bgmEl(name) {
  let el = BGM.el[name];
  if (!el) {
    el = BGM.el[name] = new Audio(assetUrl('assets/audio/' + name + '.mp3')); el.loop = true; el.preload = 'auto';
    try { const src = AC.ctx.createMediaElementSource(el), g = AC.ctx.createGain(); g.gain.value = 0; src.connect(g); g.connect(AC.master); BGM.gain[name] = g; } catch (e) { el.volume = 0.4; }
  }
  return el;
}
function primeBgm(name) { if (!AC.ctx || BGM.el[name]) return; const el = bgmEl(name); const p = el.play(); if (p && p.then) p.then(() => { if (BGM.cur !== name) el.pause(); }).catch(() => {}); }
let muted = localStorage.getItem('wolha_mute') === '1';
function setMute(m) { muted = m; localStorage.setItem('wolha_mute', m ? '1' : '0'); if (AC.master) AC.master.gain.value = m ? 0 : 0.5; $('#mute').textContent = m ? '소리 끔' : '소리 켬'; }
document.addEventListener('visibilitychange', () => { if (!AC.ctx) return; if (document.hidden) { AC.ctx.suspend(); if (BGM.cur) BGM.el[BGM.cur].pause(); } else { AC.ctx.resume(); if (BGM.cur) BGM.el[BGM.cur].play().catch(() => {}); } });

// ================================================================ fx
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
  const p = spawnP(TEX.slash, color, x, y, z, { max: .2, s0: s * 1.5, s1: s * 2.2, rot: rot * facing, vx: facing * 3 }); p.fx = facing;
  spawnP(TEX.slash, 0xffffff, x, y, z + 0.01, { max: .1, s0: s * 1.35, s1: s * 1.8, rot: rot * facing, vx: facing * 3 }).fx = facing;
}
function ring(x, z, color, s) { spawnP(TEX.ring, color, x, 0.05, z, { max: .45, s0: 1, s1: s, flat: true, a0: .9 }); }
function embers(x, y, z, color, n) { for (let i = 0; i < n; i++) spawnP(TEX.spark, color, x + rand(-.6, .6), y + rand(0, 1.6), z + rand(-.3, .3), { max: rand(.5, 1), vx: rand(-1, 1), vy: rand(2, 5), s0: rand(.25, .5), s1: 0.05 }); }
function boltFx(x, z, color) {
  const b = spawnP(TEX.bolt, color, x, 3.2, z + 0.1, { max: .28, s0: 1, s1: 1, a0: 1 }); b.m.scale.set(1.2, 6.4, 1); b.fixed = true;
  spawnP(TEX.spark, 0xffffff, x, 0.4, z + 0.1, { max: .2, s0: 3, s1: .6 }); ring(x, z, color, 4); embers(x, 0, z, color, 6);
}
function explodeFx(x, y, z, color, r) {
  ring(x, z, color, r * 2.6); ring(x, z, 0xffffff, r * 1.6);
  spawnP(TEX.spark, 0xffffff, x, y + .6, z + .1, { max: .18, s0: r * 2.2, s1: r * .6 });
  spawnP(TEX.spark, color, x, y + .8, z + .1, { max: .4, s0: r * 1.4, s1: r * 3, a0: .8 });
  embers(x, y, z, color, 14); sparks(x, y + .8, z + .1, color, 12, 8);
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.life += dt; const k = p.life / p.max;
    if (k >= 1) { scene.remove(p.m); p.m.material.dispose(); particles.splice(i, 1); continue; }
    p.vy += p.g * dt; p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
    if (!p.fixed) { const s = lerp(p.s0, p.s1, k); p.m.scale.set(s * (p.fx || 1), s * p.ax, 1); }
    p.m.material.opacity = p.a0 * (1 - k * k);
    if (p.spin) p.m.rotation.z += p.spin * dt;
  }
}
let flashT = 0, flashDur = 1;
function screenFlash(css, a, ms) { const f = $('#flash'); f.style.background = css; f.style.opacity = a; flashT = ms / 1000; flashDur = ms / 1000; f.dataset.a = a; }
function shake(a) { G.shake = Math.max(G.shake, a); }
function hitstop(t) { G.freeze = Math.max(G.freeze, t); }

// ================================================================ actors
class Actor {
  constructor(charId, def, isPlayer) {
    this.charId = charId; this.def = def; this.isPlayer = isPlayer; this.meta = CHARS[charId];
    this.x = 0; this.z = 0; this.facing = 1; this.hp = def.hp; this.maxHp = def.hp;
    this.state = 'idle'; this.stateT = 0; this.flash = 0; this.opacity = 1; this.kbV = 0; this.invuln = 0; this.y = 0; this.vy = 0; this.hitJit = 0; this.frozen = 0;
    this.t = Math.random() * 10; this.zBias = Math.random() * 0.004; this.animProgress = 0; this.alive = true;
    this.root = new THREE.Group(); this.flipG = new THREE.Group(); this.poseG = new THREE.Group();
    this.mat = spriteMaterial(); this.mesh = new THREE.Mesh(QUAD, this.mat);
    this.root.add(this.flipG); this.flipG.add(this.poseG); this.poseG.add(this.mesh);
    this.shadow = new THREE.Mesh(QUAD, new THREE.MeshBasicMaterial({ map: TEX.shadow, transparent: true, premultipliedAlpha: true, depthWrite: false, opacity: 0.55, fog: false }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.renderOrder = -1; this.shadow.scale.set(def.shadow * 1.5, def.shadow * 0.5, 1);
    scene.add(this.root); scene.add(this.shadow);
    this.animName = ''; this.animT = 0; this.setAnim('idle');
    this.headY = this.anim.anchorY * (this.anim.upp ?? this.meta.unitsPerPx);
    if (!isPlayer) {
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
    this.t += dt; if (!this.frozen) this.animT += dt; this.flash = Math.max(0, this.flash - dt * 4.2);
    const a = this.anim; let f = 0;
    const cnt = a.seq ? a.seq.length : a.count;
    if (cnt > 1) f = a.loop ? Math.floor(this.animT * a.fps) % cnt : Math.min(cnt - 1, Math.floor(clamp(this.animProgress, 0, 0.999) * cnt));
    if (a.seq) f = a.seq[f];
    const c = f % a.cols, r = Math.floor(f / a.cols);
    this.mat.uniforms.uvRect.value.set(c / a.cols, 1 - (r + 1) / a.rows, 1 / a.cols, 1 / a.rows);
    if (!this.frozen) this.pose();
    const jit = G.freeze > 0 && this.hitJit > 0 ? (Math.random() - 0.5) * 0.16 : 0; if (G.freeze <= 0) this.hitJit = 0;
    this.root.position.set(this.x + jit, this.y, this.z + this.zBias); this.flipG.scale.x = this.facing;
    const blink = this.invuln > 0 && this.state !== 'special' && this.state !== 'skill' && Math.floor(this.t * 14) % 2 === 0;
    this.mat.uniforms.flash.value = Math.min(1, this.flash); this.mat.uniforms.opacity.value = this.opacity * (blink ? 0.35 : 1);
    const sh = 1 / (1 + this.y * 0.6); this.shadow.position.set(this.x, 0.02, this.z); this.shadow.scale.set(this.def.shadow * 1.5 * sh, this.def.shadow * 0.5 * sh, 1); this.shadow.material.opacity = 0.55 * this.opacity * sh;
    if (this.bar) {
      const rr = clamp(this.hp / this.maxHp, 0, 1), w = this.barW; this.lagHp = Math.max(rr, this.lagHp - dt * 0.7);
      this.bar.visible = this.alive && this.opacity > 0.3; this.bar.position.set(this.x, this.headY + 0.16 + this.y, this.z + 0.03);
      this.barFill.scale.set(Math.max(0.0001, w * rr), 0.07, 1); this.barFill.position.x = -w / 2 + w * rr / 2;
      this.barLag.scale.set(Math.max(0.0001, w * this.lagHp), 0.07, 1); this.barLag.position.x = -w / 2 + w * this.lagHp / 2;
      this.barFill.material.color.setHex(rr > 0.5 ? 0x5fe36a : rr > 0.25 ? 0xffc23a : 0xff4a3a);
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
      case 'down': { const k = Math.min(1, st / 0.16); rz = 1.48 * k; py = 0.14 * k; sx = 1 - 0.06 * k; break; }
      case 'getup': { const k = 1 - Math.min(1, st / 0.3); rz = 1.48 * k; py = 0.14 * k; break; }
      case 'charge': rz = -0.3; px = 0.3; break;
    }
    g.position.set(px * a, py * a, 0); g.rotation.z = rz * a; g.scale.set(lerp(1, sx, a), lerp(1, sy, a), 1);
  }
  dispose() { scene.remove(this.root); scene.remove(this.shadow); this.mat.dispose(); this.shadow.material.dispose(); if (this.bar) { scene.remove(this.bar); this.bar.children.forEach((m) => m.material.dispose()); } }
}

// ================================================================ input
const input = { x: 0, y: 0, attackAt: -9, specialAt: -9, jumpAt: -9, sk: [-9, -9, -9], keys: {} };
const now = () => performance.now() / 1000;
function consume(k) { const key = k + 'At'; if (now() - input[key] < 0.22) { input[key] = -9; return true; } return false; }
function consumeSk() { for (let i = 0; i < 3; i++) if (now() - input.sk[i] < 0.22) { input.sk[i] = -9; return i; } return -1; }
window.addEventListener('keydown', (e) => {
  if (e.repeat) return; input.keys[e.code] = true; audioInit();
  if (['ArrowLeft', 'ArrowRight'].includes(e.code)) { if (input.lastDir === e.code && now() - input.lastDirAt < 0.3) input.runKey = e.code; input.lastDir = e.code; input.lastDirAt = now(); }
  if (e.code === 'KeyJ' || e.code === 'KeyZ') input.attackAt = now();
  if (e.code === 'KeyX' || e.code === 'KeyL' || e.code === 'KeyC') input.jumpAt = now();
  if (e.code === 'Space' || e.code === 'KeyK') input.specialAt = now();
  const si = ['KeyA', 'KeyS', 'KeyD'].indexOf(e.code); if (si >= 0) input.sk[si] = now();
  const ii = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code) >= 0 ? ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code) : ['Numpad1', 'Numpad2', 'Numpad3'].indexOf(e.code);
  if (ii >= 0 && G.state === 'play') useItem(ii);
  if (e.code === 'Escape' && $('#cine').style.display === 'block') CINE.skip = true;
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
window.addEventListener('keyup', (e) => { input.keys[e.code] = false; if (input.runKey === e.code) input.runKey = null; });
function readKeys() {
  const k = input.keys; let x = 0, y = 0;
  if (k.ArrowLeft) x -= 1; if (k.ArrowRight) x += 1; if (k.ArrowUp) y -= 1; if (k.ArrowDown) y += 1;
  if (x || y || !input.touchMove) { input.x = x; input.y = y; }
  input.run = !!(input.runKey && k[input.runKey]) || ((k.ShiftLeft || k.ShiftRight) && x !== 0);
}
(function touchSetup() {
  const zone = $('#joyzone'), joy = $('#joy'), knob = $('#knob'); let id = null, ox = 0, oy = 0;
  const R = 52;
  const local = (t) => (VIEW.rot ? { x: t.clientY, y: window.innerWidth - t.clientX } : { x: t.clientX, y: t.clientY });
  zone.addEventListener('touchstart', (e) => { audioInit(); const t = e.changedTouches[0]; id = t.identifier; const p = local(t); ox = p.x; oy = p.y; joy.style.left = ox + 'px'; joy.style.top = (oy - VIEW.h * 0.28) + 'px'; input.touchMove = true; e.preventDefault(); }, { passive: false });
  zone.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) if (t.identifier === id) { const p = local(t); let dx = p.x - ox, dy = p.y - oy; const m = Math.hypot(dx, dy); if (m > R) { dx *= R / m; dy *= R / m; } knob.style.transform = `translate(${dx}px,${dy}px)`; input.x = dx / R; input.y = dy / R; } e.preventDefault(); }, { passive: false });
  const end = (e) => { for (const t of e.changedTouches) if (t.identifier === id) { id = null; input.x = 0; input.y = 0; input.touchMove = false; knob.style.transform = ''; } };
  zone.addEventListener('touchend', end); zone.addEventListener('touchcancel', end);
  const bindFn = (el, fn) => { const dn = (e) => { audioInit(); fn(); el.classList.add('on'); e.preventDefault(); e.stopPropagation(); }; const up = () => el.classList.remove('on'); el.addEventListener('touchstart', dn, { passive: false }); el.addEventListener('touchend', up); el.addEventListener('touchcancel', up); el.addEventListener('mousedown', dn); el.addEventListener('mouseup', up); el.addEventListener('mouseleave', up); };
  bindFn($('#btnA'), () => { input.attackAt = now(); }); bindFn($('#btnS'), () => { input.specialAt = now(); }); bindFn($('#btnJ'), () => { input.jumpAt = now(); });
  document.querySelectorAll('.skb').forEach((el) => bindFn(el, () => { input.sk[+el.dataset.i] = now(); }));
  document.querySelectorAll('.itb').forEach((el) => bindFn(el, () => { if (G.state === 'play') useItem(+el.dataset.i); }));
  $('#mute').addEventListener('click', () => { audioInit(); setMute(!muted); }); $('#mute').addEventListener('touchstart', (e) => { audioInit(); setMute(!muted); e.preventDefault(); e.stopPropagation(); }, { passive: false });
  if (TOUCH) {
    $('#hint').textContent = '왼쪽 화면 이동(끝까지 밀면 달리기) · 오른쪽 공격·점프·필살 · 스킬 버튼 3개 · 오른쪽 위 아이템';
    document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gesturestart', (e) => e.preventDefault()); document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
})();
function goFullscreen() {
  if (!TOUCH) return; const el = document.documentElement;
  try { const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : null; if (p && p.then) p.then(() => { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); }).catch(() => {}); } catch (e) { /* not available */ }
}

// ================================================================ game state / progress
const G = { items: [], pshots: [], state: 'title', t: 0, freeze: 0, paused: false, shake: 0, zoom: 1, zoomT: 1, camX: STAGE_START, enemies: [], shots: [], timers: [], tokens: 0, seg: 0, segState: 'travel', wave: 0, spawnQ: [], combo: 0, comboT: 0, score: 0, time: 0, heroId: null, stage: 0, player: null, endT: 0, bossRef: null, inv: [0, 0, 0] };
const after = (t, fn) => G.timers.push({ t, fn });
const PROG = (() => { try { return JSON.parse(localStorage.getItem('wolha_v4') || '{}'); } catch (e) { return {}; } })();
PROG.cleared = PROG.cleared || [];
const unlockedUpTo = () => (QS.has('all') ? STAGES.length - 1 : Math.min(STAGES.length - 1, PROG.cleared.filter(Boolean).length ? Math.max(...PROG.cleared.map((c, i) => (c ? i + 1 : 0))) : 0));
function saveProg() { localStorage.setItem('wolha_v4', JSON.stringify(PROG)); }

// ---------------------------------------------------------------- pickups
function spawnPickup(id, x, z, pop) {
  const m = ITEMS_META[id]; if (!m || !TEX[id]) return null;
  const w = FOODS[id]?.w ?? PICK_W[id] ?? 0.8, h = w * m.h / m.w;
  const mesh = new THREE.Mesh(QUAD, flatMat(TEX[id], { fog: false })); mesh.scale.set(w, h, 1); mesh.renderOrder = 1; scene.add(mesh);
  const glow = new THREE.Mesh(QUAD, addMat(TEX.spark, id === 'it_gold' ? 0xffe36a : FOODS[id] ? 0xffe39a : 0x9fe0ff)); glow.scale.set(w * 1.7, w * 0.6, 1); glow.rotation.x = -Math.PI / 2; glow.renderOrder = 0; scene.add(glow);
  const it = { id, x, z, y: pop ? 0.7 : 0, vy: pop ? 5 : 0, h, mesh, glow, life: 0, t: Math.random() * 6 };
  G.items.push(it); return it;
}
function removePickup(i) { const it = G.items[i]; scene.remove(it.mesh); scene.remove(it.glow); it.mesh.material.dispose(); it.glow.material.dispose(); G.items.splice(i, 1); }
function updatePickups(dt) {
  const p = G.player;
  for (let i = G.items.length - 1; i >= 0; i--) {
    const it = G.items[i]; it.life += dt; it.t += dt;
    if (it.vy || it.y > 0) { it.vy -= 22 * dt; it.y += it.vy * dt; if (it.y <= 0) { it.y = 0; it.vy = Math.abs(it.vy) > 2 ? -it.vy * 0.35 : 0; } }
    const bob = it.vy === 0 && it.y === 0 ? 0.04 + Math.sin(it.t * 4) * 0.04 : 0;
    it.mesh.position.set(it.x, it.y + bob + it.h / 2, it.z + 0.02); it.glow.position.set(it.x, 0.03, it.z);
    it.glow.material.opacity = 0.45 + 0.25 * Math.sin(it.t * 6);
    it.mesh.visible = it.life < 18 || Math.floor(it.t * 8) % 2 === 0;
    if (it.life > 22) { removePickup(i); continue; }
    if (p && !['down', 'getup', 'dead', 'special'].includes(p.state) && p.y < 0.7 && Math.abs(p.x - it.x) < 0.8 && Math.abs(p.z - it.z) < 0.55 && it.y < 0.3) {
      takePickup(p, it.id); removePickup(i);
    }
  }
}
function takePickup(p, id) {
  if (FOODS[id]) {
    const heal = Math.min(FOODS[id].heal, p.maxHp - p.hp); p.hp += heal; G.score += heal > 0 ? 100 : 500;
    p.flash = 0.8; p.mat.uniforms.flashColor.value.setRGB(0.5, 1, 0.55);
    floatNum(p.x, 2.1, p.z, heal > 0 ? '+' + Math.round(heal) : '+500', 'hl');
    for (let k = 0; k < 10; k++) spawnP(TEX.spark, 0x9dff9a, p.x + rand(-.4, .4), rand(.3, 1.6), p.z + 0.05, { max: rand(.4, .7), vy: rand(1.5, 3.5), s0: rand(.25, .45), s1: .05 });
  } else if (id === 'it_gold') { G.score += 1000; floatNum(p.x, 2.1, p.z, '+1000', 'au'); embers(p.x, .4, p.z, 0xffe36a, 8); }
  else {
    const i = ITEMS.findIndex((x) => x.id === id);
    if (G.inv[i] < 3) { G.inv[i]++; floatNum(p.x, 2.1, p.z, ITEMS[i].name, 'au'); } else { G.score += 300; floatNum(p.x, 2.1, p.z, '+300', 'au'); }
    updateInv();
  }
  if (!play('pickup', .9)) tone('triangle', 660, 1320, .18, .25);
}
function rollDrop(e) {
  const ex = clamp(e.x, G.camX - edgeHalf(e.z, 1.2), G.camX + edgeHalf(e.z, 1.2)), ez = e.z;
  const drop = (id, d = 0.5) => after(d, () => spawnPickup(id, ex + rand(-.4, .4), ez, true));
  if (e.def.kind === 'boss') return;
  const dr = DROPS[e.charId]; const r = Math.random();
  if (dr && r < dr[0]) drop(dr[1]);
  else if (r < (dr ? dr[0] : 0) + 0.13) drop(pick('it_ginseng', 'it_ginseng', 'it_bomb', 'it_bomb', 'it_charm'));
  else if (r < (dr ? dr[0] : 0) + 0.28) drop('it_gold');
}
function useItem(i) {
  const p = G.player; if (!p || G.paused || G.inv[i] <= 0 || ['down', 'getup', 'dead', 'special'].includes(p.state)) return;
  const id = ITEMS[i].id; G.inv[i]--; updateInv(); sfx.ui();
  if (id === 'it_ginseng') { const heal = Math.min(50, p.maxHp - p.hp); p.hp += heal; floatNum(p.x, 2.1, p.z, '+' + Math.round(heal), 'hl'); p.flash = .8; p.mat.uniforms.flashColor.value.setRGB(.5, 1, .55); for (let k = 0; k < 14; k++) spawnP(TEX.spark, 0x9dff9a, p.x + rand(-.5, .5), rand(.2, 1.8), p.z + .05, { max: rand(.5, .8), vy: rand(1.5, 3.5), s0: rand(.3, .5), s1: .05 }); play('pickup', 1, .8); }
  else if (id === 'it_bomb') { spawnPShot(p, { pkind: 'bomb', speed: 6.5, dmg: 45, kb: 6, down: true, explode: 3, range: 99 }, 0); sfx.swing(); }
  else if (id === 'it_charm') { p.buff = 6; $('#face').classList.add('buff'); sfx.warn(); screenFlash('#ffe36a', .35, 300); ring(p.x, p.z, 0xffe36a, 6); skillName('금강 부적', '#ffe36a'); }
}
function updateInv() {
  document.querySelectorAll('.itb').forEach((el, i) => { el.style.backgroundImage = `url(${assetUrl('assets/items/' + ITEMS[i].id + '.webp')})`; el.querySelector('b').textContent = G.inv[i] ? '×' + G.inv[i] : ''; el.classList.toggle('empty', !G.inv[i]); });
}

// ---------------------------------------------------------------- loading characters
const charLoads = {}, charDone = {};
function loadChar(cid) {
  return (charLoads[cid] ??= (async () => {
    const files = new Set(Object.values(CHARS[cid].anims).map((a) => a.file));
    await Promise.all([...files].map((f) => loadTex('chr_' + f, CHAR_DIR + f, { sprite: true })));
    charDone[cid] = true;
  })());
}
function unloadChar(cid) {
  if (!charDone[cid]) return;
  for (const a of Object.values(CHARS[cid].anims)) dropTex('chr_' + a.file);
  delete charDone[cid]; delete charLoads[cid];
}
const stageChars = (si) => { const S = STAGES[si]; return [...new Set([...S.waves.flat(2), ...S.adds, S.boss])]; };

// ---------------------------------------------------------------- flow
function clearActors() {
  while (G.items.length) removePickup(G.items.length - 1);
  for (const s of G.pshots) { scene.remove(s.m); s.m.material.dispose(); if (s.g) { scene.remove(s.g); s.g.material.dispose(); } } G.pshots.length = 0;
  for (const e of G.enemies) e.dispose(); G.enemies.length = 0;
  for (const s of G.shots) { scene.remove(s.m); s.m.material.dispose(); } G.shots.length = 0;
  if (G.player) { G.player.dispose(); G.player = null; }
  G.timers.length = 0; G.spawnQ.length = 0;
}
function showPanel(id) { for (const p of ['title', 'stages', 'clear', 'over', 'ending']) $('#' + p).style.display = p === id ? 'flex' : 'none'; if (id) { $('#hud').style.display = 'none'; $('#touch').style.display = 'none'; $('#skillui').style.display = 'none'; } }
function buildCards() {
  $('#cards').innerHTML = HERO_IDS.map((id) => { const h = HEROES[id]; return `<div class="card" data-hero="${id}"><div class="pf" style="background-image:url(${assetUrl('assets/ui/' + h.cutin)});background-position:${id === 'h1_mujin' ? '42% 40%' : '45% 35%'}"></div><h3>${h.name}</h3><p>${h.desc}</p></div>`; }).join('');
  document.querySelectorAll('.card').forEach((c) => c.addEventListener('click', () => { audioInit(); sfx.ui(); G.heroId = c.dataset.hero; openStages(); }));
}
function openStages() {
  const h = HEROES[G.heroId]; $('#stwho').textContent = `${h.name} · ${h.sub}`;
  const up = unlockedUpTo();
  $('#stagelist').innerHTML = STAGES.map((S, i) => `<div class="stg${i > up ? ' lock' : ''}${PROG.cleared[i] ? ' done' : ''}" data-i="${i}" style="background-image:url(${assetUrl('assets/bg/' + S.sky)})"><span><small>제${i + 1}막</small>${S.name}</span></div>`).join('');
  document.querySelectorAll('.stg').forEach((el) => el.addEventListener('click', () => { if (!el.classList.contains('lock')) startStage(G.heroId, +el.dataset.i); }));
  showPanel('stages');
}
async function startStage(heroId, si) {
  audioInit(); sfx.ui(); goFullscreen();
  const S = STAGES[si];
  $('#loading').style.display = 'flex'; $('#loading').textContent = '불러오는 중…';
  const need = new Set([heroId, ...stageChars(si)]);
  for (const cid of Object.keys(charDone)) if (!need.has(cid)) unloadChar(cid);
  const first = [...new Set(S.waves[0].flat())];
  await Promise.all([loadChar(heroId), loadStageTex(si), ...first.map(loadChar)]);
  (async () => { for (const cid of stageChars(si)) await loadChar(cid).catch(() => {}); })();
  loadSounds(heroVoices(heroId)); loadSounds(bossVoices(S.boss));
  buildStage(si);
  clearActors();
  G.heroId = heroId; G.stage = si; const hero = HEROES[heroId];
  const p = new Actor(heroId, hero, true); p.x = 3; p.z = -0.3; p.gauge = 100; p.step = 0; p.cd = [0, 0, 0]; p.buff = 0; G.player = p;
  Object.assign(G, { state: 'play', seg: 0, segState: 'travel', wave: 0, combo: 0, comboT: 0, score: 0, time: 0, camX: STAGE_START, tokens: 0, freeze: 0, paused: false, endT: 0, bossRef: null, zoomT: 1, slow: 0, inv: [1, 0, 0] });
  $('#loading').style.display = 'none';
  showPanel(null); $('#hud').style.display = 'block'; $('#touch').style.display = TOUCH ? 'block' : 'none'; $('#skillui').style.display = 'block'; $('#boss').style.display = 'none'; $('#go').style.display = 'none';
  $('#face').classList.remove('buff');
  $('#face').style.backgroundImage = `url(${assetUrl('assets/ui/' + hero.face)})`; $('#pname').innerHTML = `${hero.name}<small>${hero.sub}</small>`;
  $('#stname').textContent = `제${si + 1}막 ${S.name}`;
  hero.skills.forEach((sk, i) => { $('#sk' + (i + 1) + ' .ic').style.backgroundImage = `url(${assetUrl('assets/ui/skills/' + sk.icon + '.jpg')})`; });
  updateInv();
  message(`제${si + 1}막 ${S.name}`, 1800); bgm(S.bgm); primeBgm(S.bossBgm);
}
function message(txt, ms) { const m = $('#msg'); m.textContent = txt; m.style.transition = 'none'; m.style.opacity = 1; setTimeout(() => { m.style.transition = 'opacity .5s'; m.style.opacity = 0; }, ms); }
function skillName(txt, css) { const el = $('#skname'); el.textContent = txt; el.style.setProperty('--c', css); el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }

// ---------------------------------------------------------------- combat helpers
const JUMP_V = 9.8, JUMP_G = 27;
const atkMul = () => (G.player && G.player.buff > 0 ? 1.5 : 1);
const hittable = (e) => e.alive && e.state !== 'down' && e.state !== 'getup' && e.opacity > 0.4;
function heroHit(e, dmg, dir, down, kb, o = {}) { hitEnemy(e, Math.round(dmg * atkMul()), dir, down, kb, false, o); }
function startJump(p) {
  p.jumpRun = p.state === 'run'; p.state = 'jump'; p.stateT = 0; p.vy = JUMP_V; p.y = 0.01; p.airAtk = false; p.airHit = false; p.setAnim('jump');
  sfx.jump(); voice(hv('jump'), .7); ring(p.x, p.z, 0xcfd8ff, 1.6);
}
function airStrike(p) {
  const hero = p.def; let any = false; const reach = hero.combo[0].range + 0.5;
  for (const e of G.enemies) { if (!hittable(e)) continue; const d = (e.x - p.x) * p.facing; if (d > -0.6 && d < reach + e.def.body && Math.abs(e.z - p.z) < 0.95) { heroHit(e, 14, p.facing, true, 4.5); any = true; } }
  slashArc(p.x + p.facing * reach * 0.5, p.y + 0.9, p.z + 0.05, p.facing, hero.color, 1.5, 1);
  if (any) { hitstop(.12); shake(.3); sfx.heavy(); }
}
function startAttack(p, step, dash) {
  p.step = step; p.state = 'attack'; p.stateT = 0; p.didHit = false; p.queued = false; p.dash = !!dash; p.setAnim('atk' + (step + 1)); sfx.swing();
  if (dash || step === 2) voice(hv('atk3')); else voice(hv('atk' + (step + 1)), .6);
  const a = p.def.combo[step], an = p.meta.anims['atk' + (step + 1)];
  p.atk = Object.assign({}, a, { hitAt: (an && an.hitFrac ? an.hitFrac : 0.33) * a.dur });
}
function playerHit(p, a) {
  const hero = p.def; let any = false;
  for (const e of G.enemies) { if (!hittable(e)) continue; const d = (e.x - p.x) * p.facing; if (d > -0.45 && d < a.range + e.def.body && Math.abs(e.z - p.z) < 0.85) { heroHit(e, a.dmg, p.facing, !!a.down, a.kb); any = true; } }
  slashArc(p.x + p.facing * a.range * 0.5, 1.15, p.z + 0.05, p.facing, hero.color, a.down ? 1.5 : 1.05, p.step);
  if (any) { hitstop(a.down ? .17 : .075); shake(a.down ? .42 : .16); if (a.down) { sfx.heavy(); G.zoomT = .94; after(.2, () => { G.zoomT = 1; }); } else sfx.hit(); }
}
function hitEnemy(e, dmg, dir, down, kb, special, o = {}) {
  if (!e.alive) return; const p = G.player; const hero = p.def; const big = down || special || o.big;
  // shields block light frontal hits
  if (e.def.guard && !big && !e.frozen && (e.state === 'approach' || e.state === 'recover') && e.facing === -dir && Math.random() < 0.55) {
    sfx.guard(); sparks(e.x - dir * 0.3, 1.2, e.z + 0.08, 0xcfd8ff, 5, 4); floatNum(e.x, 2.1, e.z, '막음', 'gd'); e.kbV = dir * 1.2; e.x += dir * 0.15; G.combo = Math.max(0, G.combo); return;
  }
  e.hp -= dmg; e.flash = 1; e.mat.uniforms.flashColor.value.setRGB(1, 1, 1);
  const hy = rand(.9, 1.4) * (e.def.heavy ? 1.3 : 1);
  sparks(e.x - dir * 0.15, hy, e.z + 0.08, o.color ?? hero.color, big ? 14 : 9, big ? 9 : 6.5);
  spawnP(TEX.spark, 0xffffff, e.x - dir * 0.1, hy, e.z + 0.09, { max: .1, s0: big ? 4.2 : 2.8, s1: .8 });
  for (let i = 0; i < (big ? 5 : 3); i++) spawnP(TEX.streak, 0xffffff, e.x, hy, e.z + 0.09, { max: .14, s0: big ? 2.6 : 1.8, s1: big ? 4.5 : 3, ax: .1, rot: rand(0, Math.PI), a0: .9 });
  e.hitJit = 1; dmgNum(e.x, e.def.heavy ? 2.6 : 2.0, e.z, dmg, big);
  G.combo++; G.comboT = 2.2; G.score += 10; if (!special) p.gauge = Math.min(100, p.gauge + 6);
  comboPop();
  if (e.hasToken) { e.hasToken = false; G.tokens--; }
  if (o.freeze && e.hp > 0) { e.frozen = e.def.kind === 'boss' ? o.freeze * 0.4 : o.freeze; e.mat.uniforms.tint.value.setRGB(.62, .86, 1.0); for (let k = 0; k < 6; k++) spawnP(TEX.streak, 0xbfeaff, e.x + rand(-.4, .4), rand(.3, 1.8), e.z + .1, { max: .4, s0: .8, s1: .2, ax: .25, rot: Math.PI / 2 }); }
  if (e.hp <= 0) {
    if (e.def.kind === 'boss') voice(bv('die')); else voice(['en_die1', 'en_die2'], .9, .12, .9, e.def.vr || 1);
    e.frozen = 0; e.alive = false; e.state = 'down'; e.stateT = 0; e.dying = true; e.kbV = dir * (kb + 4.5); e.facing = -dir; e.vy = special ? 9 : 7.5; e.bounced = false; e.setAnim('down'); G.score += e.def.score;
    rollDrop(e);
    if (!G.enemies.some((x) => x.alive) && !G.spawnQ.length) { G.slow = Math.max(G.slow || 0, .5); G.zoomT = .92; after(.22, () => { G.zoomT = 1; }); }
    if (e.def.kind === 'boss') { G.freeze = 0; G.slow = 1.6; sfx.heavy(); screenFlash('#fff', .8, 500); shake(.7); for (let k = 0; k < 3; k++) spawnPickup('it_gold', e.x + rand(-1, 1), e.z + rand(-.5, .5), true); }
    return;
  }
  if (e.frozen) return;
  if (e.def.kind === 'boss') {
    e.stagger = (e.stagger || 0) + dmg;
    if (special || e.stagger >= 70) { voice(bv('hurt'), 1, .8); e.stagger = 0; e.setState('hurt'); e.hurtDur = special ? .8 : .5; e.kbV = dir * 2.5; e.setAnim('hurt'); }
    return;
  }
  voice(['en_hurt1', 'en_hurt2', 'en_hurt3'], .75, .16, .85, e.def.vr || 1);
  if (down) { e.setState('down'); e.stateT = 0; e.kbV = dir * (kb + 1); e.facing = -dir; e.vy = special ? 8.5 : 6.5; e.bounced = false; e.setAnim('down'); }
  else if (e.def.armor && (e.state === 'windup' || e.state === 'strike')) { /* armored during its attack */ }
  else { e.state = 'hurt'; e.stateT = 0; e.hurtDur = .36; e.kbV = dir * kb; e.facing = -dir; e.setAnim('hurt'); }
}
function hurtPlayer(dmg, dir, down) {
  const p = G.player; if (!p || p.invuln > 0 || ['special', 'down', 'getup', 'dead'].includes(p.state)) return false;
  if (p.y > 0.9) return false;
  if (p.buff > 0) { sfx.guard(); floatNum(p.x, 2.1, p.z, '무적', 'au'); sparks(p.x, 1.2, p.z + .08, 0xffe36a, 5, 4); return true; }
  if (p.state === 'jump') { down = true; p.y = 0; p.vy = 0; }
  if (p.state === 'skill') down = down || false;
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
  for (const e of G.enemies) if (e.alive && Math.abs(e.x - p.x) < 11) after(0.06 + Math.abs(e.x - p.x) * 0.03, () => { hitEnemy(e, Math.round(55 * atkMul()), sign(e.x - p.x), true, 6.5, true); ring(e.x, e.z, hero.color, 4); });
  after(0.5, () => { G.zoomT = 1; });
}

// ---------------------------------------------------------------- skills (던파식: 버튼마다 쿨타임)
function trySkill(p, i) {
  const sk = p.def.skills[i]; if (!sk || p.cd[i] > 0) return false;
  p.cd[i] = sk.cd; p.state = 'skill'; p.stateT = 0; p.sk = sk; p.skI = i; p.skHit = false; p.skHits = 0; p.skSet = new Set();
  const an = p.meta.anims['sk' + (i + 1)]; p.setAnim(an ? 'sk' + (i + 1) : 'atk3');
  p.skDur = sk.dur; p.skAt = clamp((an && an.hitFrac ? an.hitFrac : 0.4), 0.2, 0.7) * sk.dur;
  if (sk.type === 'dash') p.invuln = Math.max(p.invuln, sk.dur);
  skillName(sk.name, p.def.css); voice(hv('sk' + (i + 1))); sfx.swing();
  return true;
}
function areaHit(p, sk, finalHit) {
  let any = false;
  for (const e of G.enemies) {
    if (!hittable(e)) continue; const dx = e.x - p.x, dz = e.z - p.z;
    const ok = sk.front ? (dx * p.facing > -0.5 && dx * p.facing < sk.r + e.def.body && Math.abs(dz) < 0.95) : (Math.hypot(dx, dz * 1.6) < sk.r + e.def.body);
    if (ok) { heroHit(e, sk.dmg, sk.front ? p.facing : sign(dx), !!sk.down && finalHit, sk.kb, { freeze: sk.freeze, big: finalHit && !!sk.down }); any = true; }
  }
  return any;
}
function updateSkill(p, dt) {
  const sk = p.sk; p.animProgress = clamp(p.stateT / p.skDur, 0, .999); const c = p.def.color;
  if (sk.type === 'dash') {
    const t0 = p.skDur * 0.18, t1 = p.skDur * 0.62;
    if (p.stateT > t0 && p.stateT < t1) {
      p.x += p.facing * sk.dist / (t1 - t0) * dt;
      if (Math.floor(p.stateT * 40) % 2 === 0) spawnP(TEX.streak, c, p.x - p.facing * .6, rand(.5, 1.6), p.z + .05, { max: .25, s0: 2.2, s1: .6, ax: .2, fx: p.facing });
      for (const e of G.enemies) {
        if (!hittable(e) || p.skSet.has(e)) continue;
        if (Math.abs(e.x - p.x) < 1.0 + e.def.body && Math.abs(e.z - p.z) < 0.85) { p.skSet.add(e); heroHit(e, sk.dmg, p.facing, sk.down, sk.kb, { big: true }); hitstop(.05); sfx.hit(); }
      }
    }
  } else if (sk.type === 'multi') {
    if (p.stateT >= p.skAt && p.skHits < sk.hits) {
      const span = p.skDur * 0.85 - p.skAt, next = p.skAt + p.skHits * span / sk.hits;
      if (p.stateT >= next) {
        p.skHits++; const fin = p.skHits === sk.hits;
        const any = areaHit(p, { ...sk, down: fin }, fin);
        if (sk.front) slashArc(p.x + p.facing * sk.r * .5, rand(.9, 1.4), p.z + .05, p.facing, c, 1.1, p.skHits); else { slashArc(p.x + rand(-1, 1), rand(.8, 1.5), p.z + .05, pick(1, -1), c, 1.2, p.skHits); ring(p.x, p.z, c, sk.r * 1.6); }
        if (any) { sfx.hit(); hitstop(.03); } else sfx.swing();
      }
    }
  } else if (!p.skHit && p.stateT >= p.skAt) { p.skHit = true; fireSkill(p, sk); }
  if (p.stateT >= p.skDur) { p.state = 'idle'; p.stateT = 0; p.setAnim('idle'); }
}
function fireSkill(p, sk) {
  const c = p.def.color;
  if (sk.type === 'aoe') {
    const any = areaHit(p, sk, true);
    if (sk.front) { slashArc(p.x + p.facing * sk.r * .5, 1.2, p.z + .05, p.facing, c, 2.2, 2); ring(p.x + p.facing * sk.r * .5, p.z, c, sk.r * 1.8); }
    else { ring(p.x, p.z, c, sk.r * 2.6); ring(p.x, p.z, 0xffffff, sk.r * 1.6); }
    if (sk.quake) { shake(.55); for (let k = 0; k < 14; k++) spawnP(TEX.spark, 0xc89a5a, p.x + rand(-sk.r, sk.r), .1, p.z + rand(-1, 1), { max: rand(.4, .7), vy: rand(3, 6), g: -14, s0: rand(.3, .5), s1: .1 }); }
    if (sk.freeze) { sfx.freeze(); for (let k = 0; k < 16; k++) spawnP(TEX.streak, 0xbfeaff, p.x + rand(-sk.r, sk.r), rand(.1, .5), p.z + rand(-1.2, 1.2), { max: .6, s0: 1.4, s1: .4, ax: .3, rot: Math.PI / 2, vy: 2 }); screenFlash('#bfeaff', .3, 250); }
    if (sk.heal) { const h = Math.min(sk.heal, p.maxHp - p.hp); p.hp += h; if (h > 0) floatNum(p.x, 2.2, p.z, '+' + Math.round(h), 'hl'); for (let k = 0; k < 18; k++) spawnP(TEX.spark, 0x9dffb0, p.x + Math.cos(k) * sk.r * .7, rand(.3, 1.8), p.z + Math.sin(k) * .8, { max: .7, vy: 1.2, s0: .5, s1: .1 }); }
    if (any) { hitstop(.1); sfx.heavy(); shake(.3); } else sfx.swing();
  } else if (sk.type === 'proj') {
    const n = sk.count || 1; for (let k = 0; k < n; k++) spawnPShot(p, sk, n > 1 ? (k - (n - 1) / 2) * 0.55 : 0);
    sfx.swing();
  } else if (sk.type === 'bolt') {
    const tg = G.enemies.filter((e) => hittable(e) && (e.x - p.x) * p.facing > -0.5 && (e.x - p.x) * p.facing < sk.range && Math.abs(e.z - p.z) < 2.2).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x)).slice(0, sk.targets);
    screenFlash('#fff6c0', .35, 160);
    if (!tg.length) { boltFx(p.x + p.facing * 3, p.z, c); sfx.zap(); }
    tg.forEach((e, k) => after(k * 0.09, () => { if (!e.alive) return; boltFx(e.x, e.z, c); sfx.zap(); heroHit(e, sk.dmg, sign(e.x - p.x), sk.down, sk.kb, { big: true, color: c }); shake(.25); }));
  }
}
// player projectiles: fire wave, daggers, talisman, bomb
function spawnPShot(p, sk, zOff) {
  const k = sk.pkind, c = p.def.color; let m, g = null, len = 1;
  if (k === 'fire') { m = new THREE.Mesh(QUAD, addMat(TEX.slash, c)); m.scale.set(2.6 * p.facing, 2.6, 1); g = new THREE.Mesh(QUAD, addMat(TEX.spark, c)); g.scale.set(3, 2, 1); len = 1.3; }
  else if (k === 'dagger') { m = new THREE.Mesh(QUAD, flatMat(TEX.dagger, { fog: false })); m.scale.set(0.9 * p.facing, 0.17, 1); g = new THREE.Mesh(QUAD, addMat(TEX.streak, 0xe0f0ff)); g.scale.set(1.6, 0.35, 1); len = 0.5; }
  else if (k === 'talisman') { m = new THREE.Mesh(QUAD, addMat(TEX.spark, 0xffe25a)); m.scale.set(1.1, 1.1, 1); g = new THREE.Mesh(QUAD, addMat(TEX.streak, 0xffc040)); g.scale.set(1.8, .5, 1); len = .5; }
  else { m = new THREE.Mesh(QUAD, flatMat(TEX.it_bomb, { fog: false })); m.scale.set(0.7, 0.7 * (ITEMS_META.it_bomb ? ITEMS_META.it_bomb.h / ITEMS_META.it_bomb.w : 1), 1); len = .4; }
  m.renderOrder = 5; scene.add(m); if (g) { g.renderOrder = 4; scene.add(g); }
  const s = { kind: k, m, g, x: p.x + p.facing * 0.7, y: k === 'bomb' ? 1.4 : 1.2, z: p.z + zOff, dir: p.facing, speed: sk.speed, dmg: sk.dmg, kb: sk.kb, down: sk.down, range: sk.range, explode: sk.explode, pierce: sk.pierce, vy: k === 'bomb' ? 6.5 : 0, traveled: 0, hit: new Set(), len, color: c, life: 0 };
  G.pshots.push(s); return s;
}
function explodeAt(s) {
  explodeFx(s.x, 0, s.z, s.kind === 'bomb' ? 0xffa040 : s.color, s.explode); sfx.boom(); shake(.45); hitstop(.06);
  for (const e of G.enemies) if (hittable(e) && Math.hypot(e.x - s.x, (e.z - s.z) * 1.5) < s.explode + e.def.body) heroHit(e, s.dmg, sign(e.x - s.x), s.down, s.kb, { big: true, color: 0xffa040 });
}
function updatePShots(dt) {
  for (let i = G.pshots.length - 1; i >= 0; i--) {
    const s = G.pshots[i]; s.life += dt; let dead = false;
    s.x += s.dir * s.speed * dt; s.traveled += s.speed * dt;
    if (s.kind === 'bomb') { s.vy -= 20 * dt; s.y += s.vy * dt; s.m.rotation.z -= s.dir * dt * 8; if (s.y <= 0.2) { explodeAt(s); dead = true; } }
    if (s.kind === 'talisman') s.m.rotation.z += dt * 10;
    s.m.position.set(s.x, s.y, s.z + 0.05); if (s.g) { s.g.position.set(s.x - s.dir * s.len * .6, s.y, s.z + 0.04); s.g.material.opacity = 0.7; }
    if (s.kind === 'fire' && Math.random() < .5) embers(s.x, s.y - .8, s.z, s.color, 1);
    if (!dead && s.kind !== 'bomb') {
      for (const e of G.enemies) {
        if (!hittable(e) || s.hit.has(e)) continue;
        if (Math.abs(e.x - s.x) < s.len + e.def.body && Math.abs(e.z - s.z) < 0.7) {
          s.hit.add(e);
          if (s.explode) { explodeAt(s); dead = true; break; }
          heroHit(e, s.dmg, s.dir, s.down, s.kb, { color: s.color }); sfx.hit(); hitstop(.03);
          if (!s.pierce) { dead = true; break; }
        }
      }
    }
    if (!dead && s.traveled > s.range) { if (s.explode) explodeAt(s); dead = true; }
    if (dead || s.life > 4) { scene.remove(s.m); s.m.material.dispose(); if (s.g) { scene.remove(s.g); s.g.material.dispose(); } G.pshots.splice(i, 1); }
  }
}
function airPhysics(a, dt) {
  if (a.meta.anims.down) { a.x += a.kbV * dt; a.kbV *= Math.exp(-6 * dt); if (a.y > 0) { a.vy -= 26 * dt; a.y = Math.max(0, a.y + a.vy * dt); } return; }
  a.x += a.kbV * dt; a.vy -= 26 * dt; a.y += a.vy * dt;
  if (a.y <= 0) { a.y = 0; if (!a.bounced) { a.bounced = true; a.vy = 3.4; a.kbV *= 0.55; ring(a.x, a.z, 0xcfd8ff, 2.6); shake(.16); noise(.12, .35, 500, 90); } else { a.vy = 0; a.kbV *= Math.exp(-7 * dt); } }
}
function floatNum(x, y, z, txt, cls) {
  const v = new THREE.Vector3(x, y, z).project(camera); const el = document.createElement('div'); el.className = 'dn ' + cls; el.textContent = txt;
  el.style.left = ((v.x * 0.5 + 0.5) * VIEW.w) + 'px'; el.style.top = ((-v.y * 0.5 + 0.5) * VIEW.h) + 'px';
  $('#hud').appendChild(el); el.addEventListener('animationend', () => el.remove());
}
function dmgNum(x, y, z, val, big) {
  const v = new THREE.Vector3(x, y, z).project(camera); const el = document.createElement('div'); el.className = 'dn' + (big ? ' big' : ''); el.textContent = val;
  el.style.left = ((v.x * 0.5 + 0.5) * VIEW.w + rand(-14, 14)) + 'px'; el.style.top = ((-v.y * 0.5 + 0.5) * VIEW.h) + 'px';
  $('#hud').appendChild(el); el.addEventListener('animationend', () => el.remove());
}
function comboPop() { const c = $('#combo'); if (G.combo >= 2) { c.innerHTML = `${G.combo}<small>HIT</small>`; c.style.opacity = 1; c.style.transition = 'none'; c.style.transform = 'scale(1.35)'; requestAnimationFrame(() => { c.style.transition = 'transform .15s'; c.style.transform = 'scale(1)'; }); } else c.style.opacity = 0; }

// ================================================================ player update
function updatePlayer(p, dt) {
  p.stateT += dt; p.invuln = Math.max(0, p.invuln - dt);
  for (let i = 0; i < 3; i++) p.cd[i] = Math.max(0, p.cd[i] - dt);
  if (p.buff > 0) { p.buff -= dt; if (Math.random() < .5) spawnP(TEX.spark, 0xffe36a, p.x + rand(-.5, .5), rand(.2, 1.9) + p.y, p.z + .06, { max: .5, vy: 1.4, s0: .35, s1: .05 }); if (p.buff <= 0) $('#face').classList.remove('buff'); }
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
      const ski = consumeSk(); if (ski >= 0 && trySkill(p, ski)) break;
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
        if (consume('attack')) {
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
      if (p.didHit) { const ski = consumeSk(); if (ski >= 0 && trySkill(p, ski)) break; }
      if (consume('special') && p.gauge >= 100) { startSpecial(p); break; }
      if (p.stateT >= a.dur) { if (p.queued && p.step < 2) startAttack(p, p.step + 1); else { p.state = 'idle'; p.stateT = 0; p.setAnim('idle'); } }
      break;
    }
    case 'skill': updateSkill(p, dt); break;
    case 'special': p.animProgress = p.stateT / p.spDur; if (!p.spFired && p.stateT > p.spAt) { p.spFired = true; fireSpecial(p); } if (p.stateT > p.spDur) { p.state = 'idle'; p.stateT = 0; p.invuln = 0.4; p.setAnim('idle'); } break;
    case 'hurt': p.animProgress = Math.min(0.6, p.stateT / 0.34 * 0.6); p.x += p.kbV * dt; p.kbV *= Math.exp(-8 * dt); if (p.stateT > .34) { p.state = 'idle'; p.stateT = 0; p.setAnim('idle'); } break;
    case 'down': p.animProgress = Math.min(1, p.stateT / 0.7); airPhysics(p, dt);
      if (p.stateT > 1.05) { if (p.hp <= 0) { p.state = 'dead'; G.endT = 1.3; G.endKind = 'over'; } else { p.state = 'getup'; p.stateT = 0; p.setAnim('getup'); } } break;
    case 'getup': { const gd = A.getup ? 0.45 : 0.3; p.animProgress = p.stateT / gd; if (p.stateT > gd) { p.state = 'idle'; p.stateT = 0; p.invuln = 1.2; p.setAnim('idle'); } break; }
  }
  p.z = clamp(p.z, Z_MIN, Z_MAX); const hw = edgeHalf(p.z, 1.5); p.x = clamp(p.x, G.camX - hw, G.camX + hw);
}

// ================================================================ enemies
function spawnEnemy(id, side, i) {
  const def = ENEMIES[id]; const e = new Actor(id, def, false);
  const k = G.stage; if (def.kind !== 'boss') { e.maxHp = e.hp = Math.round(def.hp * (1 + 0.12 * k)); }
  e.dmgMul = 1 + 0.07 * k;
  e.x = G.camX + side * (halfW + 1.3 + i * 0.5); e.z = rand(Z_MIN + 0.2, Z_MAX - 0.2); e.facing = -side; e.state = 'approach';
  e.cdT = rand(.4, 1.2); e.zOff = rand(-1.2, 1.2); e.orbit = rand(0, 1.2); e.hasToken = false; e.strikes = 0; e.chargeT = rand(4, 6); e.tpT = rand(3, 6);
  if (def.kind === 'boss') { e.x = G.camX + edgeHalf(-0.4, 2.4); e.z = -0.4; G.bossRef = e; }
  G.enemies.push(e); return e;
}
function edgeHalf(z, margin) { return Math.max(1.5, halfW * (CAM.z - z) / CAM.z - margin); }
function moveToward(e, tx, tz, sp, dt) { const dx = tx - e.x, dz = tz - e.z, d = Math.hypot(dx, dz); if (d < 0.05) return false; const s = Math.min(d, sp * dt); e.x += dx / d * s; e.z += dz / d * s * 0.75; return true; }
function release(e) { if (e.hasToken) { e.hasToken = false; G.tokens--; } }
function enemyShoot(e, kind, zTo, color) {
  if (kind === 'arrow') { sfx.arrow(); const m = new THREE.Mesh(QUAD, flatMat(TEX.arrow, { fog: false })); m.scale.set(1.1 * e.facing, 0.14, 1); m.position.set(e.x + e.facing * 0.6, 1.15, e.z + 0.02); scene.add(m); G.shots.push({ m, x: e.x + e.facing * 0.6, z: e.z, y: 1.15, dz: 0, dir: e.facing, speed: 10.5, dmg: Math.round(e.def.dmg * e.dmgMul), life: 0 }); return; }
  const m = new THREE.Mesh(QUAD, addMat(TEX.spark, color)); m.scale.set(1.2, 1.2, 1); m.renderOrder = 5; scene.add(m);
  G.shots.push({ m, x: e.x + e.facing * 1.0, z: e.z, y: 1.3, dz: (zTo - e.z) / 1.4, dir: e.facing, speed: 7.5, dmg: Math.round(e.def.dmg * 0.8 * e.dmgMul), life: 0, orb: color });
}
function bossAtk2(e) {
  const t = BOSSES[e.charId].atk2; return t === 'mix' ? pick('charge', 'proj', 'slam') : t;
}
function updateEnemy(e, dt) {
  const p = G.player, def = e.def; e.stateT += dt;
  if (e.frozen > 0) { e.frozen -= dt; if (e.frozen <= 0) { e.frozen = 0; e.mat.uniforms.tint.value.setRGB(1, 1, 1); } if (e.state !== 'down') return; }
  e.cdT -= dt; e.tpT -= dt;
  const dx = p.x - e.x, dz = p.z - e.z, adx = Math.abs(dx);
  const rage = def.kind === 'boss' && e.hp < e.maxHp * 0.35; const spd = def.speed * (rage ? 1.35 : 1);
  if (rage && !e.frozen) e.mat.uniforms.tint.value.setRGB(1, .72, .72);
  const pOut = p.state === 'dead' || (p.state === 'down' && p.hp <= 0);
  const info = BOSSES[e.charId];
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
        if ((def.kind === 'ghost' || (info && info.teleport)) && e.tpT <= 0 && adx > 2.4 && Math.abs(e.x - G.camX) < edgeHalf(e.z, 1)) { release(e); e.setState('phase'); break; }
        if (!e.hasToken && e.cdT <= 0 && G.tokens < (STAGES[G.stage].tokens[G.seg] ?? 2)) { e.hasToken = true; G.tokens++; }
        const side = -sign(dx); const reach = def.range * 0.82;
        if (def.kind === 'boss' && e.chargeT <= 0 && adx > 2.6 && Math.abs(dz) < 1.6) {
          release(e); e.a2 = bossAtk2(e); e.setAnim(e.meta.anims.atk2 ? 'atk2' : 'windup'); sfx.warn();
          e.setState(e.a2 === 'charge' ? 'chargeWind' : e.a2 === 'proj' ? 'cast' : 'leap0'); break;
        }
        if (e.hasToken) {
          moved = moveToward(e, p.x + side * reach, p.z, spd, dt);
          if (adx <= def.range * 0.97 && Math.abs(dz) < 0.42) { e.setState('windup'); e.setAnim('attack'); e.windT = def.windup * (rage ? .75 : 1); if (def.kind === 'boss') voice(bv('atk'), .6, 2.5); }
        } else moved = moveToward(e, p.x + side * (def.range + 1.5 + e.orbit), clamp(p.z + e.zOff, Z_MIN, Z_MAX), spd * 0.8, dt);
        if (def.kind === 'boss') e.chargeT -= dt;
      }
      e.setAnim(e.state === 'approach' ? (moved ? 'walk' : 'idle') : e.procName);
      break;
    }
    case 'phase': { // ghosts fade out and reappear behind the player
      if (e.stateT < 0.28) e.opacity = Math.max(0.05, 1 - e.stateT / 0.28);
      else if (!e.tpDone) { e.tpDone = true; e.x = clamp(p.x - p.facing * 1.6, G.camX - edgeHalf(p.z, 1.4), G.camX + edgeHalf(p.z, 1.4)); e.z = clamp(p.z + rand(-.2, .2), Z_MIN, Z_MAX); e.facing = sign(p.x - e.x); for (let k = 0; k < 8; k++) spawnP(TEX.spark, 0xa070ff, e.x + rand(-.4, .4), rand(.3, 1.8), e.z + .05, { max: .5, vy: 1, s0: .5, s1: .1 }); }
      else e.opacity = Math.min(1, (e.stateT - 0.28) / 0.25);
      if (e.stateT >= 0.55) { e.opacity = 1; e.tpDone = false; e.tpT = rand(4, 7); e.setState('windup'); e.setAnim('attack'); e.windT = def.windup * 1.2; }
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
        if (def.kind === 'archer') enemyShoot(e, 'arrow');
        else {
          const d = (p.x - e.x) * e.facing;
          if (d > -0.3 && d < def.range + 0.35 && Math.abs(p.z - e.z) < 0.75) hurtPlayer(Math.round(def.dmg * e.dmgMul), e.facing, !!def.heavy);
          if (def.heavy) { shake(.2); ring(e.x + e.facing * def.range * 0.6, e.z, 0xffffff, 3); }
          slashArc(e.x + e.facing * def.range * 0.5, 1.1, e.z + 0.05, e.facing, def.kind === 'ghost' ? 0xb08aff : 0xdfe6ff, def.heavy ? 1.5 : .9, 1);
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
      e.x += e.facing * 13 * dt; e.animProgress = Math.min(0.99, (e.meta.anims.atk2?.hitFrac || 0.4) + 0.12); embers(e.x - e.facing * 0.8, 0.1, e.z, info.proj, 1);
      if (!e.didHit && Math.abs(p.x - e.x) < 1.4 && Math.abs(p.z - e.z) < 0.9) { if (hurtPlayer(Math.round(20 * e.dmgMul), e.facing, true)) e.didHit = true; }
      if (e.stateT >= 0.55) { e.setState('recover'); e.chargeT = rage ? rand(3, 4.5) : rand(5, 7); e.cdT = 1.0; shake(.25); }
      break;
    }
    case 'cast': { // throw three orbs
      e.facing = sign(dx); const hf = e.meta.anims.atk2?.hitFrac || 0.45; e.animProgress = hf * Math.min(1, e.stateT / 0.7);
      if (Math.floor(e.stateT * 14) % 2 === 0) { e.flash = 0.5; e.mat.uniforms.flashColor.value.setHex(info.proj); }
      if (e.stateT >= 0.7 && !e.didCast) { e.didCast = true; for (const o of [-0.9, 0, 0.9]) enemyShoot(e, 'orb', clamp(p.z + o, Z_MIN, Z_MAX), info.proj); sfx.boom(); }
      if (e.stateT >= 0.7) e.animProgress = hf + (1 - hf) * Math.min(1, (e.stateT - 0.7) / 0.5);
      if (e.stateT >= 1.2) { e.didCast = false; e.setState('recover'); e.chargeT = rage ? rand(3, 4.5) : rand(4.5, 6.5); e.cdT = .8; }
      break;
    }
    case 'leap0': { e.facing = sign(dx); e.animProgress = 0.2 * e.stateT / 0.45; if (Math.floor(e.stateT * 14) % 2 === 0) { e.flash = 0.6; e.mat.uniforms.flashColor.value.setRGB(1, .2, .2); } if (e.stateT >= 0.45) { e.setState('leap'); e.vy = 10; e.lx0 = e.x; e.lz0 = e.z; e.lx1 = p.x; e.lz1 = p.z; ring(e.lx1, e.lz1, 0xff3030, 3); } break; }
    case 'leap': {
      const T = 2 * 10 / 26, k = Math.min(1, e.stateT / T); e.x = lerp(e.lx0, e.lx1, k); e.z = lerp(e.lz0, e.lz1, k); e.vy -= 26 * dt; e.y = Math.max(0, e.y + e.vy * dt); e.animProgress = 0.2 + 0.5 * k;
      if (k >= 1 || (e.stateT > 0.2 && e.y <= 0)) {
        e.y = 0; shake(.6); sfx.heavy(); explodeFx(e.x, 0, e.z, info.proj, 2.6);
        if (Math.hypot(p.x - e.x, (p.z - e.z) * 1.5) < 3.2 && p.y < 0.9) hurtPlayer(Math.round((def.dmg + 6) * e.dmgMul), sign(p.x - e.x), true);
        e.setState('recover'); e.chargeT = rage ? rand(3, 4.5) : rand(5, 7); e.cdT = 1.0;
      }
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
  const ehw = edgeHalf(e.z, 1.1 + def.body);
  // anyone who is about to attack must be on screen (no poking from outside the view)
  if (!e.entered && (Math.abs(e.x - G.camX) < ehw || e.hasToken || (e.state !== 'approach' && e.state !== 'down'))) e.entered = true;
  if (e.entered) e.x = clamp(e.x, G.camX - ehw, G.camX + ehw);
}
function separate() {
  const L = G.enemies;
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const a = L[i], b = L[j]; if (!a.alive || !b.alive) continue;
    const dx = b.x - a.x, dz = b.z - a.z; if (Math.abs(dx) < 0.8 && Math.abs(dz) < 0.35) { const s = (0.8 - Math.abs(dx)) * 0.5 * sign(dx || rand(-1, 1)); a.x -= s * 0.1; b.x += s * 0.1; a.z -= 0.012 * sign(dz || 1); b.z += 0.012 * sign(dz || 1); }
  }
}
function updateShots(dt) {
  const p = G.player;
  for (let i = G.shots.length - 1; i >= 0; i--) {
    const s = G.shots[i]; s.life += dt; s.x += s.dir * s.speed * dt; s.z += s.dz * dt; s.m.position.set(s.x, s.y, s.z + 0.02); let dead = s.life > 2.6;
    if (s.orb && Math.random() < .4) spawnP(TEX.spark, s.orb, s.x, s.y, s.z, { max: .3, s0: .6, s1: .1 });
    if (!dead && Math.abs(p.x - s.x) < 0.5 && Math.abs(p.z - s.z) < 0.6) { if (hurtPlayer(s.dmg, s.dir, !!s.orb)) dead = true; }
    if (dead) { scene.remove(s.m); s.m.material.dispose(); G.shots.splice(i, 1); }
  }
}

// ================================================================ director
function segData(i) { const S = STAGES[G.stage]; return i < 3 ? { lockX: SEG_X[i], waves: S.waves[i] } : { lockX: SEG_X[3], boss: true, waves: [[S.boss]] }; }
function updateDirector(dt) {
  if (G.seg > 3) return; const seg = segData(G.seg); const S = STAGES[G.stage];
  if (G.segState === 'travel') {
    if (G.camX >= seg.lockX - 0.08) {
      G.segState = 'fight'; G.wave = 0; $('#go').style.display = 'none';
      if (G.seg === 1) spawnPickup('food_rice', seg.lockX - 3, -1.4); if (G.seg === 2) spawnPickup('food_bun', seg.lockX + 2.5, 0.8);
      if (seg.boss) {
        const info = BOSSES[S.boss]; G.paused = true; sfx.warn(); message('WARNING', 900); bgm(S.bossBgm);
        setTimeout(() => { voice(bv('intro')); $('#cutin').classList.add('long'); showCutin({ img: info.cutin, pos: info.pos, skillImg: info.nameImg, name: info.name, quote: info.quote, css: info.css }, () => { $('#cutin').classList.remove('long'); G.paused = false; queueWave(seg.waves[0]); $('#bossname').textContent = info.title; $('#boss').style.display = 'block'; }, 2000); }, 700);
      } else queueWave(seg.waves[0]);
    }
  } else if (G.segState === 'fight') {
    for (let i = G.spawnQ.length - 1; i >= 0; i--) { const q = G.spawnQ[i]; q.t -= dt; if (q.t <= 0) { if (!charDone[q.id]) { loadChar(q.id); continue; } spawnEnemy(q.id, q.side, q.i); G.spawnQ.splice(i, 1); } }
    const b = G.bossRef;
    if (b && b.alive && !b.adds && b.hp < b.maxHp * 0.5) { b.adds = true; spawnPickup('food_meat', G.camX - 2.5, -1.2, true); message('수하들이 몰려온다!', 1100); queueWave(S.adds); }
    if (!G.spawnQ.length && !G.enemies.length) {
      G.wave++;
      if (G.wave < seg.waves.length) queueWave(seg.waves[G.wave]);
      else if (seg.boss) { G.segState = 'done'; G.endT = 1.6; G.endKind = 'clear'; }
      else { G.seg++; G.segState = 'travel'; G.tokens = 0; $('#go').style.display = 'block'; }
    }
  }
}
function queueWave(list) { list.forEach((id, i) => G.spawnQ.push({ id, side: ENEMIES[id].kind === 'archer' ? 1 : (i % 2 ? -1 : 1), i, t: 0.35 + i * 0.55 })); }

// ================================================================ cut-in, story, hud
function showCutin(o, done, ms = 1250) {
  const el = $('#cutin'); el.querySelector('.img').style.backgroundImage = `url(${assetUrl('assets/ui/' + o.img)})`; el.querySelector('.img').style.backgroundPosition = o.pos;
  el.querySelector('.skill').src = assetUrl('assets/ui/' + o.skillImg); el.querySelector('.quote').innerHTML = `<b style="color:${o.css}">${o.name}</b>「${o.quote}」`;
  el.querySelector('.band').style.borderColor = o.css;
  el.style.display = 'block'; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  setTimeout(() => { el.style.display = 'none'; el.classList.remove('on'); done(); }, ms);
}
const CINE = { skip: false };
const wait = (ms) => new Promise((r) => { const t0 = performance.now(); const tick = () => { if (CINE.skip || performance.now() - t0 >= ms) r(); else setTimeout(tick, 50); }; tick(); });
async function playStory(si) {
  const shots = STORY[si]; if (!shots) return;
  CINE.skip = false; const cine = $('#cine'), v = $('#cv'), img = $('#ci'), sub = $('#sub'), fade = $('#cfade');
  cine.style.display = 'block'; sub.style.opacity = 0; fade.style.opacity = 1;
  bgm(STAGES[si].bgm, 0.16);
  for (const sh of shots) {
    if (CINE.skip) break;
    for (const l of sh.lines) if (l[2]) loadSound(l[2], 'assets/story/' + l[2] + '.mp3');
    img.style.display = 'none'; v.style.display = 'block';
    const ok = await new Promise((res) => { v.onerror = () => res(false); v.oncanplay = () => res(true); v.src = assetUrl('assets/story/' + sh.shot + '.mp4'); v.load(); setTimeout(() => res(v.readyState >= 2), 2500); });
    if (ok) { v.currentTime = 0; v.play().catch(() => {}); } else { v.style.display = 'none'; img.src = assetUrl('assets/story/' + sh.shot + '.jpg'); img.style.display = 'block'; img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''; }
    fade.style.opacity = 0; const t0 = performance.now();
    await wait(600);
    for (const [who, txt, vo] of sh.lines) {
      if (CINE.skip) break;
      sub.className = who ? '' : 'narr'; sub.innerHTML = who ? `<b>${who}</b>${txt}` : txt; sub.style.opacity = 1;
      const buf = vo ? await loadSound(vo, 'assets/story/' + vo + '.mp3') : null;
      if (buf) play(vo, 1.1);
      await wait(buf ? buf.duration * 1000 + 550 : txt.length * 110 + 1200);
      sub.style.opacity = 0; await wait(250);
    }
    await wait(Math.max(0, 7200 - (performance.now() - t0)));
    fade.style.opacity = 1; await wait(600);
  }
  v.pause(); v.removeAttribute('src'); v.load(); cine.style.display = 'none'; sub.style.opacity = 0;
}
$('#skip').addEventListener('click', () => { CINE.skip = true; }); $('#skip').addEventListener('touchstart', (e) => { CINE.skip = true; e.preventDefault(); e.stopPropagation(); }, { passive: false });
const hudCache = {};
function setBar(id, v, cls) { const k = Math.round(v * 200); if (hudCache[id] !== k) { hudCache[id] = k; $(id + ' i').style.transform = `scaleX(${clamp(v, 0, 1)})`; } if (cls) $(id).classList.toggle(cls[0], cls[1]); }
function updateHud() {
  const p = G.player; if (!p) return;
  setBar('#hp', p.hp / p.maxHp, ['low', p.hp / p.maxHp < 0.3]); setBar('#gauge', p.gauge / 100, ['full', p.gauge >= 100]);
  $('#btnS').classList.toggle('ready', p.gauge >= 100);
  const sc = String(G.score).padStart(6, '0'); if (hudCache.sc !== sc) { hudCache.sc = sc; $('#score').textContent = sc; }
  if (G.bossRef) setBar('#bosshp', Math.max(0, G.bossRef.hp) / G.bossRef.maxHp);
  p.def.skills.forEach((sk, i) => {
    const r = p.cd[i] / sk.cd, key = Math.round(r * 60) + ':' + Math.ceil(p.cd[i]);
    if (hudCache['sk' + i] === key) return; hudCache['sk' + i] = key;
    const el = $('#sk' + (i + 1)); el.querySelector('.cd').style.setProperty('--p', (r * 100).toFixed(1) + '%'); el.querySelector('.ct').textContent = p.cd[i] > 0 ? Math.ceil(p.cd[i]) : ''; el.classList.toggle('ready', p.cd[i] <= 0);
  });
}
async function endGame(kind) {
  G.state = kind; $('#hud').style.display = 'none'; $('#touch').style.display = 'none'; $('#skillui').style.display = 'none';
  const si = G.stage;
  if (kind === 'clear') {
    PROG.cleared[si] = true; saveProg();
    const t = Math.floor(G.time); const res = `점수 <b>${G.score}</b><br>시간 ${Math.floor(t / 60)}분 ${t % 60}초 · 남은 체력 ${Math.round(G.player.hp)}`;
    await playStory(si);
    clearActors(); bgm(null);
    if (si === STAGES.length - 1) { showPanel('ending'); return; }
    $('#cleartitle').textContent = `제${si + 1}막 클리어`; $('#clearres').innerHTML = res; $('#btnNext').textContent = `제${si + 2}막 ${STAGES[si + 1].name}`; showPanel('clear');
  } else { bgm(null); showPanel('over'); }
}
document.querySelectorAll('.pbtn').forEach((b) => b.addEventListener('click', () => {
  audioInit(); const a = b.dataset.act;
  if (a === 'retry') startStage(G.heroId, G.stage);
  else if (a === 'next') startStage(G.heroId, Math.min(STAGES.length - 1, G.stage + 1));
  else if (a === 'stages') { clearActors(); bgm(null); G.state = 'title'; openStages(); }
  else { clearActors(); bgm(null); G.state = 'title'; G.camX = STAGE_START; if (W.stage !== 0) buildStage(0); showPanel('title'); }
}));

// ================================================================ loop
function update(dt) {
  G.t += dt;
  if (flashT > 0) { flashT -= dt; const f = $('#flash'); f.style.opacity = Math.max(0, flashT / flashDur) * (+f.dataset.a || 1); }
  for (const g of glows) g.m.material.opacity = g.base * (0.8 + 0.2 * Math.sin(G.t * 9 + g.ph) + 0.1 * Math.sin(G.t * 23 + g.ph * 2));
  updateParticlesBg(dt);
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
  updateShots(dt); updatePShots(dt); updateDirector(dt); updatePickups(dt); updateParticles(dt);
  if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) { G.combo = 0; comboPop(); } }
  const seg = segData(Math.min(G.seg, 3));
  const camMax = seg.lockX, camMin = G.seg > 0 ? SEG_X[G.seg - 1] : STAGE_START;
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

// ================================================================ boot
(async function boot() {
  setMute(muted);
  [CHARS, PROPS, LAYERS, STAGEBG, ITEMS_META] = await Promise.all([CHAR_DIR + 'chars.json', 'assets/bg/props.json', 'assets/bg/layers.json', 'assets/bg/stages.json', 'assets/items/items.json'].map((u) => fetch(assetUrl(u) + (window.__ASSETS ? '' : '?v=' + BUILD), { cache: 'no-cache' }).then((r) => r.json())));
  const jobs = [loadTex('ground_s1', 'assets/bg/ground.jpg', { repeat: true })];
  for (const id of Object.keys(PROPS)) jobs.push(loadTex(id, `assets/bg/${id}.png`));
  for (const id of Object.keys(ITEMS_META)) jobs.push(loadTex(id, `assets/items/${id}.webp`));
  for (const id of Object.keys(LAYERS)) jobs.push(loadTex(id, `assets/bg/${LAYERS[id].file}`, id === 'far_ridge' ? { repeat: true, mirror: true } : {}));
  let doneN = 0; jobs.forEach((j) => j.then(() => { doneN++; $('#loading').textContent = '불러오는 중… ' + Math.round(doneN / jobs.length * 100) + '%'; }));
  await Promise.all(jobs);
  sky = document.createElement('div'); sky.style.cssText = 'position:absolute;left:0;top:0;width:114%;height:100%;background:#070a1e center top/cover no-repeat;will-change:transform';
  $('#stage').insertBefore(sky, canvas); canvas.style.position = 'relative';
  buildStage(0); buildCards(); updateInv();
  $('#loading').style.display = 'none';
  window.__step = (n, d = 1 / 60, noRender) => { for (let i = 0; i < n; i++) update(d); if (!noRender) render(); };
  window.__G = G; window.__startStage = startStage; window.__startGame = (h) => startStage(h, 0); window.__input = input; window.__VIEW = VIEW; window.__charDone = charDone; window.__SND = SND; window.__BGM = BGM; window.__AC = AC; window.__playStory = playStory; window.__CINE = CINE;
  requestAnimationFrame(frame);
})().catch((e) => { $('#loading').textContent = '불러오기 실패: ' + e.message; console.error(e); });
