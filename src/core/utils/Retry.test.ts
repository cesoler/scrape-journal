import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withRetry } from './Retry';

test('returns the result on the first attempt', async () => {
    const outcome = await withRetry(async () => 'ok', { attempts: 3, delayMs: 0 });

    assert.equal(outcome.result, 'ok');
    assert.equal(outcome.attempts, 1);
});

test('retries until the operation succeeds', async () => {
    let calls = 0;
    const outcome = await withRetry(
        async () => {
            calls += 1;
            if (calls < 3) throw new Error('boom');
            return 'ok';
        },
        { attempts: 3, delayMs: 0 }
    );

    assert.equal(outcome.result, 'ok');
    assert.equal(outcome.attempts, 3);
});

test('rethrows the last error once the attempts run out', async () => {
    let calls = 0;
    await assert.rejects(
        withRetry(
            async () => {
                calls += 1;
                throw new Error(`boom ${calls}`);
            },
            { attempts: 2, delayMs: 0 }
        ),
        /boom 2/
    );
    assert.equal(calls, 2);
});

test('backs off for longer on every retry', async () => {
    const waits: number[] = [];
    let calls = 0;

    await withRetry(
        async () => {
            calls += 1;
            if (calls < 3) throw new Error('boom');
            return 'ok';
        },
        { attempts: 3, delayMs: 100, sleep: async (ms) => { waits.push(ms); } }
    );

    assert.deepEqual(waits, [100, 200]);
});
