import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer, { Browser, Page } from 'puppeteer';
import { getSelectorsForBrowser } from '../../constants/Selectors';
import { articleService } from './ArticleService';

const selectors = getSelectorsForBrowser('jornalismo').articlePage;
let browser: Browser;

function loadFixture(name: string): string {
    return readFileSync(join(__dirname, '../../../../tests/fixtures', name), 'utf8');
}

async function pageFor(fixture: string): Promise<Page> {
    const page = await browser.newPage();
    await page.setContent(loadFixture(fixture), { waitUntil: 'domcontentloaded' });
    return page;
}

before(async () => {
    browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
});

after(async () => {
    await browser.close();
});

test('extracts the canonical url', async () => {
    const page = await pageFor('g1-article.html');
    const details = await articleService.extractArticleDetails(page, selectors);
    await page.close();

    assert.equal(
        details.canonicalUrl,
        'https://g1.globo.com/sp/campinas-regiao/noticia/2026/08/23/materia.ghtml'
    );
});

test('extracts the ISO publication timestamps', async () => {
    const page = await pageFor('g1-article.html');
    const details = await articleService.extractArticleDetails(page, selectors);
    await page.close();

    assert.equal(details.publishedAt, '2026-08-23T03:00:18.243-03:00');
    assert.equal(details.modifiedAt, '2026-08-23T10:02:44.074-03:00');
});

test('extracts every article:section', async () => {
    const page = await pageFor('g1-article.html');
    const details = await articleService.extractArticleDetails(page, selectors);
    await page.close();

    assert.deepEqual(details.sections, ['G1', 'SP', 'Campinas e Região']);
});

test('extracts the authors without the Organization duplicate', async () => {
    const page = await pageFor('g1-article.html');
    const details = await articleService.extractArticleDetails(page, selectors);
    await page.close();

    assert.deepEqual(details.authors, [
        { name: 'Gabriel Pitor', url: 'https://g1.globo.com/autores/gabriel-pitor' },
        { name: 'Isadora de Paiva', url: null }
    ]);
});

test('extracts the og:image', async () => {
    const page = await pageFor('g1-article.html');
    const details = await articleService.extractArticleDetails(page, selectors);
    await page.close();

    assert.equal(details.imageUrl, 'https://s2-g1.glbimg.com/abc/img.jpg');
});

test('returns nulls and empty lists when the metadata is missing', async () => {
    const page = await pageFor('g1-article-no-canonical.html');
    const details = await articleService.extractArticleDetails(page, selectors);
    await page.close();

    assert.equal(details.canonicalUrl, null);
    assert.equal(details.publishedAt, null);
    assert.equal(details.modifiedAt, null);
    assert.equal(details.imageUrl, null);
    assert.deepEqual(details.sections, []);
    assert.deepEqual(details.authors, []);
    assert.equal(details.subtitle, 'Só o subtítulo');
});

test('reads the timestamps from a <time itemprop> when there is no <meta>', async () => {
    const page = await pageFor('oglobo-article.html');
    const details = await articleService.extractArticleDetails(page, selectors);
    await page.close();

    assert.equal(details.publishedAt, '2026-08-30T03:30:25.473-03:00');
    assert.equal(details.modifiedAt, '2026-08-30T03:30:26.314-03:00');
});

test('splits an article:section that packs several sections into one meta', async () => {
    const page = await pageFor('oglobo-article.html');
    const details = await articleService.extractArticleDetails(page, selectors);
    await page.close();

    assert.deepEqual(details.sections, ['Política', 'Eleições 2026']);
});

test('extracts the headline of the article page itself', async () => {
    const page = await pageFor('oglobo-article.html');
    const details = await articleService.extractArticleDetails(page, selectors);
    await page.close();

    assert.equal(
        details.articleTitle,
        'Uma década do impeachment: como estão hoje os pivôs da saída de Dilma'
    );
});

test('falls back to og:title when the page has no <h1>', async () => {
    const page = await pageFor('oglobo-article-og-title-only.html');
    const details = await articleService.extractArticleDetails(page, selectors);
    await page.close();

    assert.equal(details.articleTitle, 'Título vindo do og:title');
});

test('leaves the article headline null when the page carries neither', async () => {
    const page = await pageFor('g1-article-no-canonical.html');
    const details = await articleService.extractArticleDetails(page, selectors);
    await page.close();

    assert.equal(details.articleTitle, null);
});
