import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { test } from 'node:test';

const source = await readFile(new URL('../docs/assets/sponsor.js', import.meta.url), 'utf8');
const serviceWorker = await readFile(new URL('../docs/sw.js', import.meta.url), 'utf8');

function render(sponsor) {
  const events = [];
  const slot = {
    children: [],
    replaceChildren(...children) { this.children = children; },
    setAttribute(name, value) { this[name] = value; },
  };
  const infoLink = { addEventListener(name, callback) { this[name] = callback; } };
  const document = {
    currentScript: { src: 'https://dotjoel.github.io/DSArcade/assets/sponsor.js' },
    querySelectorAll: selector => selector === '[data-sponsor-slot]' ? [slot] : [infoLink],
    createElement: tag => ({ tag, addEventListener(name, callback) { this[name] = callback; } }),
  };
  const window = {
    DSA_SPONSOR: sponsor,
    dsaTrack: (...args) => events.push(args),
  };
  vm.runInNewContext(source, {
    document,
    window,
    location: { href: 'https://dotjoel.github.io/DSArcade/index.html' },
    URL,
  });
  return { slot, events, infoLink };
}

test('empty slot links to sponsor information under the project-page base path', () => {
  const { slot, events, infoLink } = render(null);
  const [label, link, copy] = slot.children;
  assert.equal(slot['aria-label'], 'Sponsor placement');
  assert.equal(label.textContent, 'Sponsor');
  assert.equal(link.textContent, 'Your ad here');
  assert.equal(link.href, 'https://dotjoel.github.io/DSArcade/sponsors.html');
  assert.equal(copy.textContent, 'Reach people practicing for technical interviews.');
  link.click();
  infoLink.click();
  assert.deepEqual(events, [['sponsor-info-click', undefined], ['sponsor-info-click', undefined]]);
});

test('configured sponsor is labelled, links safely and counts its click', () => {
  const { slot, events, infoLink } = render({
    id: 'Brand / One', name: 'Partner', message: '<em>Offer</em>', href: 'https://example.org/offer',
  });
  const [label, link, copy] = slot.children;
  assert.equal(slot['aria-label'], 'Sponsored placement');
  assert.equal(label.textContent, 'Sponsored');
  assert.equal(link.href, 'https://example.org/offer');
  assert.equal(link.target, '_blank');
  assert.equal(link.rel, 'sponsored noopener noreferrer');
  assert.equal(copy.textContent, '<em>Offer</em>');
  link.click();
  infoLink.click();
  assert.deepEqual(events, [['sponsor-click', 'brand-one'], ['sponsor-info-click', undefined]]);
});

test('non-HTTPS or missing sponsor URLs do not render a sponsored link', () => {
  for (const sponsor of [
    { id: 'bad', name: 'Bad', message: 'Bad', href: 'javascript:alert(1)' },
    { id: 'insecure', name: 'Insecure', message: 'Insecure', href: 'http://example.org/' },
    { id: 'credentials', name: 'Credentials', message: 'Credentials', href: 'https://user:pass@example.org/' },
    { id: 'missing', name: 'Missing', message: 'Missing' },
  ]) {
    const { slot } = render(sponsor);
    assert.equal(slot.children[0].textContent, 'Sponsor');
    assert.equal(slot.children[1].textContent, 'Your ad here');
    assert.equal(slot.children[1].href, 'https://dotjoel.github.io/DSArcade/sponsors.html');
  }
});

test('service worker precaches the sponsor renderer, config and info page', () => {
  for (const path of ['./assets/sponsor.js', './data/sponsor.js', './sponsors.html']) {
    assert.ok(serviceWorker.includes(`'${path}'`), `${path} missing from service worker cache`);
  }
});
