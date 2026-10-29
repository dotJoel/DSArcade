// Renders one reusable sponsor card on the hub and game result screens.
'use strict';

(function () {
  const slots = document.querySelectorAll('[data-sponsor-slot]');
  if (!slots.length) return;

  const scriptUrl = document.currentScript && document.currentScript.src;
  const base = scriptUrl ? new URL('../', scriptUrl) : new URL('../', location.href);
  const pageUrl = new URL('sponsors.html', base).href;
  const sponsor = window.DSA_SPONSOR;
  const sponsorUrl = sponsor && safeUrl(sponsor.href);
  const isSponsored = !!(sponsor && sponsor.name && sponsor.message && sponsorUrl);
  if (sponsor && !isSponsored && window.console && typeof window.console.warn === 'function') {
    window.console.warn('[DSArcade] Sponsor config is incomplete or its destination is not a valid HTTPS URL.');
  }

  function safeUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
    } catch (e) { return ''; }
  }

  function event(name, detail) {
    if (window.dsaTrack) window.dsaTrack(name, detail);
  }

  for (const slot of slots) {
    slot.setAttribute('aria-label', isSponsored ? 'Sponsored placement' : 'Sponsor placement');
    const eyebrow = document.createElement('span');
    eyebrow.className = 'sponsor-eyebrow';
    eyebrow.textContent = isSponsored ? 'Sponsored' : 'Sponsor';

    const link = document.createElement('a');
    link.className = 'sponsor-link';
    if (isSponsored) {
      link.href = safeUrl(sponsor.href);
      link.textContent = sponsor.name;
      link.target = '_blank';
      link.rel = 'sponsored noopener noreferrer';
      link.addEventListener('click', () => {
        const id = String(sponsor.id || 'sponsor').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
        event('sponsor-click', id || 'sponsor');
      });
    } else {
      link.href = pageUrl;
      link.textContent = 'Your ad here';
      link.addEventListener('click', () => event('sponsor-info-click'));
    }

    const message = document.createElement('p');
    message.className = 'sponsor-copy';
    message.textContent = isSponsored ? sponsor.message : 'Reach people practicing for technical interviews.';

    slot.replaceChildren(eyebrow, link, message);
  }

  for (const infoLink of document.querySelectorAll('[data-sponsor-info-link]')) {
    infoLink.addEventListener('click', () => event('sponsor-info-click'));
  }
})();
