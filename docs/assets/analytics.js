// Cookieless usage counting for DSArcade, via GoatCounter.
//
// Counts pageviews (with mode and installed-app suffixes) and a small set of
// named events, so the site can quote real numbers without tracking people.
// No cookies, no cross-site tracking, no personal data, no consent banner.
//
// Opt out:  ?gc=off  (persists on the device)   |   ?gc=on  (turns it back on)
// Debug:    ?gcdebug=1  (logs the payloads instead of sending them)
//
// Requires app.js for isDaily().
'use strict';

(function () {
  const SITE = 'https://dotjoel.goatcounter.com/count';
  // GitHub Pages serves the site under /<repo>/. Stripped so the dashboard
  // reads /games/pattern instead of /DSArcade/games/pattern.html.
  const BASE = '/DSArcade';
  const OPT_OUT_KEY = 'dsa:gc-optout';

  const params = new URLSearchParams(location.search);

  function setOptOut(on) {
    try {
      if (on) localStorage.setItem(OPT_OUT_KEY, '1');
      else localStorage.removeItem(OPT_OUT_KEY);
    } catch (e) { /* storage blocked: fall through to the other signals */ }
  }

  if (params.get('gc') === 'off') setOptOut(true);
  if (params.get('gc') === 'on') setOptOut(false);

  function optedOut() {
    try { return localStorage.getItem(OPT_OUT_KEY) === '1'; } catch (e) { return false; }
  }

  function isStandalone() {
    try {
      return (!!window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        navigator.standalone === true;
    } catch (e) { return false; }
  }

  const dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1' ||
    navigator.globalPrivacyControl === true;
  const blocked = dnt || optedOut() || location.protocol === 'file:' || !SITE;
  const debug = params.get('gcdebug') === '1';

  // '' -> /home; strips the repo prefix, .html and trailing slashes, then
  // tags daily runs and installed-app traffic.
  function pagePath(pathname, daily, app) {
    let p = String(pathname || '/');
    if (p.indexOf(BASE + '/') === 0) p = p.slice(BASE.length);
    else if (p === BASE) p = '/';
    p = p.replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/+$/, '');
    if (p === '') p = '/home';
    if (p.charAt(0) !== '/') p = '/' + p;
    return p + (daily ? '/daily' : '') + (app ? '/app' : '');
  }

  // Same thresholds the end screen uses, so the buckets match the copy.
  function scoreBucket(score) {
    if (score >= 1000) return 'interview-ready';
    if (score >= 600) return 'solid';
    return 'drill';
  }

  window.dsaPagePath = pagePath;
  window.dsaScoreBucket = scoreBucket;

  if (blocked) {
    window.dsaTrack = function () {};
    return;
  }

  const standalone = isStandalone();
  let gc = null;
  const queue = [];

  function flush() {
    while (queue.length && gc) {
      const ev = queue.shift();
      try { gc.count(ev); } catch (e) { queue.length = 0; }
    }
  }

  function send(ev) {
    if (debug) { console.log('[gc]', ev.event ? 'event' : 'view', ev.path); return; }
    queue.push(ev);
    if (gc) flush();
  }

  // detail becomes a path segment, e.g. /event/game-end/pattern/daily/solid
  window.dsaTrack = function (name, detail) {
    if (!name) return;
    send({
      path: '/event/' + name + (detail ? '/' + detail : ''),
      title: name + (detail ? ' — ' + detail : ''),
      event: true
    });
  };

  window.addEventListener('appinstalled', function () { window.dsaTrack('install'); });

  // Pageview first, so its position in the queue matches the visit order.
  send({ path: pagePath(location.pathname, isDaily(), standalone), title: document.title, event: false });

  if (debug) return;

  // count.js must not count a pageview of its own; we send ours above so the
  // path carries mode and installed-app state.
  window.goatcounter = { no_onload: true, allow_local: false, allow_frame: false };

  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', SITE);
  s.onload = function () {
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      gc = window.goatcounter;
      flush();
    }
  };
  s.onerror = function () { queue.length = 0; }; // offline or blocked: drop
  document.head.appendChild(s);
})();
