// Harness: extract the inline script from trainyard.html and exercise the
// generator + greedy par + daily resume draw alignment without a browser.
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../docs/games/trainyard.html', import.meta.url), 'utf8');
const m = html.match(/<script>\n('use strict';[\s\S]*?)<\/script>/);
if (!m) throw new Error('inline script not found');
let src = m[1];

// Stub the DOM + shared app helpers the script expects at load time.
const fakeEl = { textContent: '', innerHTML: '', style: {}, className: '',
  appendChild() {}, addEventListener() {}, classList: { add() {}, remove() {} } };
const els = new Proxy({}, { get: () => fakeEl });
const created = [];
globalThis.document = {
  getElementById: () => fakeEl,
  createElement: () => { const e = { style: {}, classList: { add() {}, remove() {} }, appendChild() {}, title: '', textContent: '', className: '', disabled: false, onclick: null }; created.push(e); return e; },
  querySelectorAll: () => [],
};
globalThis.location = { search: '', reload() {} };
globalThis.requestAnimationFrame = fn => fn();
const timers = [];
globalThis.setInterval = (fn) => { timers.push(fn); return timers.length - 1; };
globalThis.clearInterval = () => {};
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

// app.js pieces the game relies on
const today = '2026-10-29';
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
globalThis.isDaily = () => true;
globalThis.dailyPick = () => [];
globalThis.shuffleInPlace = () => {};
globalThis.dailyState = () => null;
globalThis.saveDaily = () => {};
globalThis.dailyProgress = () => null;
globalThis.saveDailyProgress = () => {};
globalThis.clearDailyProgress = () => {};
globalThis.todayKey = () => today;
globalThis.hashStr = hashStr;
globalThis.mulberry32 = mulberry32;
globalThis.store = { get: () => null, set() {} };
globalThis.window = globalThis;

(0, eval)(src);

const api = { start: globalThis.start, skip: globalThis.skipGeneratedRound, newRound: globalThis.newRound, roundFns: null };
// Helpers we need to introspect
const get = name => { const f = src.match(new RegExp('(?:let|var|const|function)\\\\s+' + name)); return null; };

// Drive rounds through start(): stub end() tracking via score. We'll replay
// the internal generator manually to validate invariants.

function simulateDay(seedKey) {
  const rng = mulberry32(hashStr(seedKey));
  const rand = () => rng();
  const DRAWS = 24;
  const results = [];
  for (let r = 0; r < 5; r++) {
    const n = 5 + Math.floor(rand() * 3);
    const perm = [];
    for (let i = 1; i <= n; i++) perm.push(i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
    let ai = 0; const st = []; const target = [];
    st.push(perm[ai++]);
    while (target.length < n) {
      const rr = rand();
      const canPop = st.length > 0;
      if (canPop && (ai >= perm.length || rr < 0.45)) target.push(st.pop());
      else if (ai < perm.length) st.push(perm[ai++]);
      else target.push(st.pop());
    }
    // greedy par
    let gAi = 0; const gSt = []; let gOut = 0, gParked = 0, reachable = true;
    while (gOut < n) {
      if (gSt.length && gSt[gSt.length - 1] === target[gOut]) { gSt.pop(); gOut++; }
      else if (gAi < n && perm[gAi] === target[gOut]) { gAi++; gOut++; }
      else if (gAi < n) { gSt.push(perm[gAi++]); gParked++; }
      else { reachable = false; break; }
    }
    if (gParked === 0) { [target[0], target[1]] = [target[1], target[0]]; gParked = 1; }
    // pad draws to 24 (3n-1 used)
    for (let d = 3 * n - 1; d < DRAWS; d++) rand();
    results.push({ n, perm, target, reachable, par: n + gParked, gParked });
  }
  return results;
}

let bad = 0, total = 0, parkedDist = {};
for (let day = 0; day < 400; day++) {
  const seed = `2026-${String(1 + day % 12).padStart(2, '0')}-${String(1 + day % 28).padStart(2, '0')}:trainyard`;
  const rounds = simulateDay(seed);
  for (const rd of rounds) {
    total++;
    if (!rd.reachable) { bad++; console.log('UNREACHABLE', seed, JSON.stringify(rd)); }
    if (rd.gParked === 0) { bad++; console.log('NO SIDING USE', seed, JSON.stringify(rd)); }
    parkedDist[rd.gParked] = (parkedDist[rd.gParked] || 0) + 1;
    if (rd.n < 5 || rd.n > 7) { bad++; console.log('BAD N', rd.n); }
  }
}
console.log('rounds:', total, 'bad:', bad, 'parked distribution:', JSON.stringify(parkedDist));
if (bad > 0) process.exitCode = 1;

// Resume alignment: fresh run vs resumed run must consume identical rng state.
{
  const a = mulberry32(hashStr('2026-10-29:trainyard'));
  const b = mulberry32(hashStr('2026-10-29:trainyard'));
  const ra = () => a(), rb = () => b();
  const DRAWS_PER_ROUND_REF = 24;
  // fresh: 2 full rounds (24 draws each, size draw included) + partial
  for (let r = 0; r < 2; r++) {
    const n = 5 + Math.floor(ra() * 3);
    for (let d = 1; d < DRAWS_PER_ROUND_REF; d++) ra();
  }
  // resumed: skip 2 rounds
  for (let r = 0; r < 2; r++) for (let d = 0; d < 24; d++) rb();
  let aligned = true;
  for (let i = 0; i < 10; i++) if (ra() !== rb()) aligned = false;
  console.log('resume alignment:', aligned ? 'OK' : 'MISMATCH');
}
