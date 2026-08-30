import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { AppDataSource, initializeDatabase } from '../database/DataSource';
import { ScrapeRun } from '../../core/entities/ScrapeRun';
import { scrapeRunRepository } from './ScrapeRunRepository';

const databaseUrl = process.env.DATABASE_URL ?? '';
const isLocalDatabase = /@(localhost|127\.0\.0\.1|db)[:/]/.test(databaseUrl);
const shouldSkip = !databaseUrl || !isLocalDatabase;

before(async () => {
    if (shouldSkip) return;
    await initializeDatabase();
});

beforeEach(async () => {
    if (shouldSkip) return;
    await AppDataSource.getRepository(ScrapeRun).clear();
});

after(async () => {
    if (shouldSkip) return;
    await AppDataSource.destroy();
});

test('opens a run without a finish mark', { skip: shouldSkip }, async () => {
    const run = await scrapeRunRepository.start('jornalismo', 'main-page');

    assert.ok(run.id > 0);
    assert.ok(run.startedAt instanceof Date);
    assert.equal(run.finishedAt, null);
});

test('closes a successful run with the item count', { skip: shouldSkip }, async () => {
    const open = await scrapeRunRepository.start('esporte', 'ai-suggestion');
    const closed = await scrapeRunRepository.finish(open.id, {
        status: 'ok',
        items: 4,
        attempts: 1,
        error: null
    });

    assert.equal(closed.status, 'ok');
    assert.equal(closed.items, 4);
    assert.ok(closed.finishedAt instanceof Date);
});

test('closes a failed run with the error message', { skip: shouldSkip }, async () => {
    const open = await scrapeRunRepository.start('entretenimento', 'main-page');
    const closed = await scrapeRunRepository.finish(open.id, {
        status: 'failed',
        items: 0,
        attempts: 2,
        error: 'Navigation timeout of 30000 ms exceeded'
    });

    assert.equal(closed.status, 'failed');
    assert.equal(closed.attempts, 2);
    assert.match(closed.error ?? '', /Navigation timeout/);
});
