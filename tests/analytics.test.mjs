// Tests for docs/assets/analytics.js, run with: node --test tests/
// The script is browser code, so each test builds a small fake window and runs
// the real file in a VM context.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync(new URL('../docs/assets/analytics.js', import.meta.url), 'utf8');

function makeEnv(opts = {}) {
  const sent = [];
  const logs = [];
  const storage = new Map(Object.entries(opts.storage || {}));
  const scripts = [];
  const listeners = {};
  let pending = null;

  const env = {
    console: { log: (...a) => logs.push(a.join(' ')) },
    URLSearchParams,
    document: {
      title: 'Spot the Pattern — DSArcade',
      head: {
        appendChild(el) {
          scripts.push(el);
          if (!opts.manualLoad) el.run();
        }
      },
      createElement() {
        const el = {
          attrs: {},
          setAttribute(k, v) { this.attrs[k] = v; },
          run() {
            if (opts.failLoad) { if (el.onerror) el.onerror(); return; }
            env.window.goatcounter.count = ev => sent.push(ev);
            if (el.onload) el.onload();
          }
        };
        pending = el;
        return el;
      }
    },
    location: {
      pathname: opts.pathname || '/DSArcade/',
      search: opts.search || '',
      protocol: opts.protocol || 'https:'
    },
    navigator: {
      doNotTrack: opts.dnt ? '1' : null,
      globalPrivacyControl: opts.gpc === true,
      standalone: opts.navigatorStandalone === true
    },
    localStorage: {
      getItem: k => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: k => storage.delete(k)
    },
    matchMedia: () => ({ matches: opts.standalone === true }),
    addEventListener(name, fn) { (listeners[name] = listeners[name] || []).push(fn); },
    isDaily: () => opts.daily === true
  };
  env.window = env;
  env.window.addEventListener = env.addEventListener;
  vm.createContext(env);
  vm.runInContext(SRC, env);

  return {
    env, sent, logs, scripts, storage, listeners,
    load: () => (pending ? pending.run() : null),
    fire: name => (listeners[name] || []).forEach(fn => fn())
  };
}

test('hub counts as /home without a mode suffix', () => {
  const { sent } = makeEnv();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].path, '/home');
  assert.equal(sent[0].event, false);
});

test('game page path drops the repo prefix, .html and gains the mode', () => {
  const { sent } = makeEnv({ pathname: '/DSArcade/games/pattern.html', daily: true });
  assert.equal(sent[0].path, '/games/pattern/daily');
});

test('practice game pages keep a bare path', () => {
  const { sent } = makeEnv({ pathname: '/DSArcade/games/bughunt.html' });
  assert.equal(sent[0].path, '/games/bughunt');
});

test('installed app traffic is tagged /app', () => {
  const { sent } = makeEnv({ pathname: '/DSArcade/index.html', standalone: true });
  assert.equal(sent[0].path, '/home/app');
});

test('events are sent as event paths with detail segments', () => {
  const { env, sent } = makeEnv();
  env.window.dsaTrack('game-end', 'pattern/daily/solid');
  assert.deepEqual(sent.map(e => e.path), ['/home', '/event/game-end/pattern/daily/solid']);
  assert.equal(sent[1].event, true);
});

test('events queued before count.js loads flush in order after the pageview', () => {
  const { env, sent, load } = makeEnv({ manualLoad: true });
  env.window.dsaTrack('game-start', 'pattern/daily');
  env.window.dsaTrack('game-end', 'pattern/daily/drill');
  assert.equal(sent.length, 0);
  load();
  assert.deepEqual(sent.map(e => e.path), [
    '/home',
    '/event/game-start/pattern/daily',
    '/event/game-end/pattern/daily/drill'
  ]);
});

test('score buckets match the end-screen thresholds', () => {
  const { env } = makeEnv();
  assert.equal(env.window.dsaScoreBucket(1000), 'interview-ready');
  assert.equal(env.window.dsaScoreBucket(999), 'solid');
  assert.equal(env.window.dsaScoreBucket(600), 'solid');
  assert.equal(env.window.dsaScoreBucket(599), 'drill');
  assert.equal(env.window.dsaScoreBucket(0), 'drill');
});

test('Do Not Track stops everything', () => {
  const { env, sent, scripts } = makeEnv({ dnt: true });
  env.window.dsaTrack('game-start', 'pattern/daily');
  assert.equal(scripts.length, 0);
  assert.equal(sent.length, 0);
});

test('Global Privacy Control stops everything', () => {
  const { sent, scripts } = makeEnv({ gpc: true });
  assert.equal(scripts.length, 0);
  assert.equal(sent.length, 0);
});

test('?gc=off persists an opt-out and blocks the counter', () => {
  const { sent, scripts, storage } = makeEnv({ search: '?gc=off' });
  assert.equal(storage.get('dsa:gc-optout'), '1');
  assert.equal(scripts.length, 0);
  assert.equal(sent.length, 0);
});

test('a stored opt-out blocks later visits', () => {
  const { sent, scripts } = makeEnv({ storage: { 'dsa:gc-optout': '1' } });
  assert.equal(scripts.length, 0);
  assert.equal(sent.length, 0);
});

test('?gc=on reverses an opt-out', () => {
  const { sent, storage } = makeEnv({ search: '?gc=on', storage: { 'dsa:gc-optout': '1' } });
  assert.equal(storage.has('dsa:gc-optout'), false);
  assert.equal(sent.length, 1);
});

test('file: URLs never load count.js', () => {
  const fileEnv = makeEnv({ protocol: 'file:' });
  assert.equal(fileEnv.scripts.length, 0);
  assert.equal(fileEnv.sent.length, 0);
});

test('count.js is configured not to count its own pageview or localhost hits', () => {
  const { env } = makeEnv();
  assert.equal(env.window.goatcounter.no_onload, true);
  assert.equal(env.window.goatcounter.allow_local, false);
});

test('a failed count.js load drops the queue without throwing', () => {
  const t = makeEnv({ manualLoad: true, failLoad: true });
  t.env.window.dsaTrack('game-start', 'pattern/daily');
  t.load(); // fires onerror: offline or blocked
  assert.doesNotThrow(() => t.env.window.dsaTrack('game-end', 'pattern/daily/drill'));
  assert.equal(t.scripts.length, 1);
  assert.equal(t.sent.length, 0);
});

test('install event fires when the browser reports an installed PWA', () => {
  const { sent, fire } = makeEnv();
  fire('appinstalled');
  assert.deepEqual(sent.map(e => e.path), ['/home', '/event/install']);
});

test('?gcdebug=1 logs payloads and sends nothing', () => {
  const { env, sent, logs, scripts } = makeEnv({ search: '?gcdebug=1', pathname: '/DSArcade/games/pattern.html', daily: true });
  env.window.dsaTrack('game-start', 'pattern/daily');
  assert.equal(sent.length, 0);
  assert.equal(scripts.length, 0);
  assert.deepEqual(logs, [
    '[gc] view /games/pattern/daily',
    '[gc] event /event/game-start/pattern/daily'
  ]);
});
