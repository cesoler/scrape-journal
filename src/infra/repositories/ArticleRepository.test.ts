import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { AppDataSource, initializeDatabase } from '../database/DataSource';
import { Article } from '../../core/entities/Article';
import { ArticleUpsertInput } from '../../core/repositories/IArticleRepository';
import { articleRepository } from './ArticleRepository';

const databaseUrl = process.env.DATABASE_URL ?? '';

// This suite truncates "articles" between tests, so it refuses to run anywhere
// but a local database: pointing DATABASE_URL at a managed host wipes real rows.
const isLocalDatabase = /@(localhost|127\.0\.0\.1|db)[:/]/.test(databaseUrl);
const shouldSkip = !databaseUrl || !isLocalDatabase;

if (databaseUrl && !isLocalDatabase) {
    console.warn('[ArticleRepository.test] Skipping: DATABASE_URL does not point at a local database.');
}

function buildInput(overrides: Partial<ArticleUpsertInput> = {}): ArticleUpsertInput {
    return {
        canonicalUrl: 'https://g1.globo.com/materia.ghtml',
        sourceUrl: 'https://g1.globo.com/materia.ghtml#tracking',
        title: 'Original title',
        articleTitle: 'Original article headline',
        subtitle: 'Original subtitle',
        featured: false,
        imageUrl: null,
        sections: ['G1', 'SP'],
        authors: [{ name: 'Fulano', url: null }],
        publishedAt: new Date('2026-08-23T03:00:00.000Z'),
        modifiedAt: new Date('2026-08-23T10:00:00.000Z'),
        category: 'jornalismo',
        origin: 'main-page',
        ...overrides
    };
}

before(async () => {
    if (shouldSkip) return;
    await initializeDatabase();
});

beforeEach(async () => {
    if (shouldSkip) return;
    await AppDataSource.getRepository(Article).clear();
});

after(async () => {
    if (shouldSkip) return;
    await AppDataSource.destroy();
});

test('saves a new article', { skip: shouldSkip }, async () => {
    const [saved] = await articleRepository.saveMany([buildInput()]);
    assert.ok(saved.id > 0);
    assert.equal(saved.canonicalUrl, 'https://g1.globo.com/materia.ghtml');
    assert.equal(saved.articleTitle, 'Original article headline');
    assert.deepEqual(saved.categories, ['jornalismo']);
    assert.deepEqual(saved.sections, ['G1', 'SP']);
    assert.deepEqual(saved.authors, [{ name: 'Fulano', url: null }]);
});

test('does not duplicate the same canonical url across calls', { skip: shouldSkip }, async () => {
    await articleRepository.saveMany([buildInput()]);
    await articleRepository.saveMany([buildInput()]);

    const count = await AppDataSource.getRepository(Article).count();
    assert.equal(count, 1);
});

test('does not duplicate the same article inside a single batch', { skip: shouldSkip }, async () => {
    await articleRepository.saveMany([
        buildInput({ title: 'First' }),
        buildInput({ title: 'Second' })
    ]);

    const rows = await AppDataSource.getRepository(Article).find();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].title, 'Second');
});

test('overwrites when the incoming article is newer', { skip: shouldSkip }, async () => {
    await articleRepository.saveMany([buildInput()]);
    await articleRepository.saveMany([
        buildInput({
            title: 'Updated title',
            modifiedAt: new Date('2026-08-23T18:00:00.000Z')
        })
    ]);

    const [row] = await AppDataSource.getRepository(Article).find();
    assert.equal(row.title, 'Updated title');
});

test('keeps the stored article when the incoming one is older', { skip: shouldSkip }, async () => {
    await articleRepository.saveMany([buildInput()]);
    await articleRepository.saveMany([
        buildInput({
            title: 'Stale title',
            modifiedAt: new Date('2026-08-23T04:00:00.000Z')
        })
    ]);

    const [row] = await AppDataSource.getRepository(Article).find();
    assert.equal(row.title, 'Original title');
});

test('still returns an article that was not overwritten', { skip: shouldSkip }, async () => {
    await articleRepository.saveMany([buildInput()]);
    const returned = await articleRepository.saveMany([
        buildInput({
            title: 'Stale title',
            modifiedAt: new Date('2026-08-23T04:00:00.000Z')
        })
    ]);

    assert.equal(returned.length, 1);
    assert.equal(returned[0].title, 'Original title');
});

test('returns the articles in the order they were passed in', { skip: shouldSkip }, async () => {
    const returned = await articleRepository.saveMany([
        buildInput({ canonicalUrl: 'https://g1.globo.com/b.ghtml', title: 'B' }),
        buildInput({ canonicalUrl: 'https://g1.globo.com/a.ghtml', title: 'A' })
    ]);

    assert.deepEqual(returned.map(article => article.title), ['B', 'A']);
});

test('returns an empty array for an empty batch', { skip: shouldSkip }, async () => {
    assert.deepEqual(await articleRepository.saveMany([]), []);
});

test('keeps every category the article was listed under', { skip: shouldSkip }, async () => {
    await articleRepository.saveMany([buildInput({ category: 'jornalismo' })]);
    const [saved] = await articleRepository.saveMany([buildInput({ category: 'esporte' })]);

    assert.deepEqual(saved.categories, ['esporte', 'jornalismo']);
    assert.equal(await AppDataSource.getRepository(Article).count(), 1);
});

test('does not repeat a category the article already carries', { skip: shouldSkip }, async () => {
    await articleRepository.saveMany([buildInput()]);
    const [saved] = await articleRepository.saveMany([buildInput()]);

    assert.deepEqual(saved.categories, ['jornalismo']);
});

test('merges the category even when the article itself is not refreshed', { skip: shouldSkip }, async () => {
    await articleRepository.saveMany([buildInput({ category: 'jornalismo' })]);
    const [saved] = await articleRepository.saveMany([
        buildInput({
            category: 'esporte',
            title: 'Stale title',
            modifiedAt: new Date('2026-08-23T04:00:00.000Z')
        })
    ]);

    assert.equal(saved.title, 'Original title');
    assert.deepEqual(saved.categories, ['esporte', 'jornalismo']);
});


test('marks when the article was first and last seen', { skip: shouldSkip }, async () => {
    const [saved] = await articleRepository.saveMany([buildInput()]);

    assert.ok(saved.firstSeenAt instanceof Date);
    assert.equal(saved.firstSeenAt.getTime(), saved.lastSeenAt.getTime());
});

test('moves last_seen_at even when the article is not overwritten', { skip: shouldSkip }, async () => {
    const [first] = await articleRepository.saveMany([buildInput()]);
    await new Promise(resolve => setTimeout(resolve, 20));

    const [second] = await articleRepository.saveMany([
        buildInput({ title: 'Stale title', modifiedAt: new Date('2026-08-23T04:00:00.000Z') })
    ]);

    assert.equal(second.title, 'Original title');
    assert.ok(second.lastSeenAt.getTime() > first.lastSeenAt.getTime());
});

test('keeps first_seen_at from the run that discovered the article', { skip: shouldSkip }, async () => {
    const [first] = await articleRepository.saveMany([buildInput()]);
    await new Promise(resolve => setTimeout(resolve, 20));
    const [second] = await articleRepository.saveMany([
        buildInput({ title: 'Updated title', modifiedAt: new Date('2026-08-24T10:00:00.000Z') })
    ]);

    assert.equal(second.title, 'Updated title');
    assert.equal(second.firstSeenAt.getTime(), first.firstSeenAt.getTime());
});
