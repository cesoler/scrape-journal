export interface RetryOptions {
    attempts: number;
    delayMs: number;
    sleep?: (ms: number) => Promise<void>;
}

export interface RetryOutcome<T> {
    result: T;
    attempts: number;
}

const defaultSleep = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

/**
 * Runs `operation` until it resolves or the attempts run out, waiting twice as
 * long before each retry. A scraped page fails often enough — a timeout, a slow
 * render — that losing a whole category to one bad request is not acceptable.
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    { attempts, delayMs, sleep = defaultSleep }: RetryOptions
): Promise<RetryOutcome<T>> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return { result: await operation(), attempts: attempt };
        } catch (error) {
            lastError = error;
            if (attempt < attempts) {
                await sleep(delayMs * 2 ** (attempt - 1));
            }
        }
    }

    throw lastError;
}
