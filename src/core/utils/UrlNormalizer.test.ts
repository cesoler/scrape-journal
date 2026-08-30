import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUrl } from './UrlNormalizer';

test('drops the AI suggestion tracking fragment', () => {
    const raw = 'https://g1.globo.com/sp/noticia/2026/08/23/materia.ghtml' +
        '#HOME-AREA-COLUNA-JORNALISMO-user,rec-principal,c6a5f00e-6a37-4b59-985c-ac8126f00ef2';
    assert.equal(
        normalizeUrl(raw),
        'https://g1.globo.com/sp/noticia/2026/08/23/materia.ghtml'
    );
});

test('drops the query string', () => {
    assert.equal(
        normalizeUrl('https://g1.globo.com/materia.ghtml?utm_source=home&utm_medium=coluna'),
        'https://g1.globo.com/materia.ghtml'
    );
});

test('drops the trailing slash', () => {
    assert.equal(normalizeUrl('https://g1.globo.com/economia/'), 'https://g1.globo.com/economia');
});

test('keeps the root path as a single slash', () => {
    assert.equal(normalizeUrl('https://g1.globo.com/'), 'https://g1.globo.com/');
});

test('upgrades http to https', () => {
    assert.equal(normalizeUrl('http://g1.globo.com/materia.ghtml'), 'https://g1.globo.com/materia.ghtml');
});

test('lowercases the host but preserves the path case', () => {
    assert.equal(
        normalizeUrl('https://G1.GLOBO.com/SP/Materia.ghtml'),
        'https://g1.globo.com/SP/Materia.ghtml'
    );
});

test('prefers the canonical url over the raw url', () => {
    assert.equal(
        normalizeUrl(
            'https://g1.globo.com/wrong.ghtml#tracking',
            'https://g1.globo.com/right.ghtml'
        ),
        'https://g1.globo.com/right.ghtml'
    );
});

test('falls back to the raw url when the canonical is empty', () => {
    assert.equal(
        normalizeUrl('https://g1.globo.com/materia.ghtml', ''),
        'https://g1.globo.com/materia.ghtml'
    );
});

test('returns null for an unparseable url', () => {
    assert.equal(normalizeUrl('not a url'), null);
});

test('returns null when both inputs are missing', () => {
    assert.equal(normalizeUrl(null), null);
});
