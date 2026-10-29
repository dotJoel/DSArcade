// Shared helpers: deterministic daily seeding, local storage, small UI glue.
// Everyone gets the same questions per day: the seed is derived from the UTC
// date plus the game id, so no backend is needed.
'use strict';

const DAILY_N = 5;

function hashStr(s) {
  let h = 2166136261;
  for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function todayKey() { return new Date().toISOString().slice(0, 10); }

function dailyRng(game) { return mulberry32(hashStr(todayKey() + ':' + game)); }

// Deterministic Fisher-Yates over the pool, seeded by date+game.
function dailyPick(pool, game, n = DAILY_N) {
  const rng = dailyRng(game);
  const idx = pool.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, n).map(i => pool[i]);
}

function randomPick(pool, n) {
  const idx = pool.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, n).map(i => pool[i]);
}

const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};

// Daily state for a game: only valid for today's date.
function dailyState(game) {
  const s = store.get('dsa:' + game + ':daily', {});
  return s.date === todayKey() ? s : null;
}

function saveDaily(game, res) {
  store.set('dsa:' + game + ':daily', { date: todayKey(), ...res });
}

function isDaily() { return new URLSearchParams(location.search).get('mode') === 'daily'; }

function shuffleInPlace(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('../sw.js').catch(() => {});
}
