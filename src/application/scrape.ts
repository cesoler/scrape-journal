// Must come first: the DataSource is built at import time and reads DATABASE_URL.
import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource, initializeDatabase } from '../infra/database/DataSource';
import { journalService } from '../core/services/journalService/JournalService';
import { scrapeRunRepository } from '../infra/repositories/ScrapeRunRepository';
import { withRetry } from '../core/utils/Retry';
import { ArticleOrigin, AvailableColumnCategory, VALID_CATEGORIES } from '../core/models/JournalModel';

const AI_SUGGESTIONS_PER_PAGE = 4;
const ATTEMPTS = 2;
const RETRY_DELAY_MS = 5_000;

interface ScrapeTask {
    category: AvailableColumnCategory;
    origin: ArticleOrigin;
    run: () => Promise<unknown[]>;
}

function buildTasks(): ScrapeTask[] {
    return VALID_CATEGORIES.flatMap((category): ScrapeTask[] => [
        {
            category,
            origin: 'main-page',
            run: () => journalService.scrapeJournalColumnSync(category)
        },
        {
            category,
            origin: 'ai-suggestion',
            run: () => journalService.getAISuggestionsSync(category, AI_SUGGESTIONS_PER_PAGE)
        }
    ]);
}

async function executeTask(task: ScrapeTask): Promise<boolean> {
    const label = `${task.origin}/${task.category}`;
    const run = await scrapeRunRepository.start(task.category, task.origin);

    try {
        const outcome = await withRetry(task.run, { attempts: ATTEMPTS, delayMs: RETRY_DELAY_MS });
        await scrapeRunRepository.finish(run.id, {
            status: 'ok',
            items: outcome.result.length,
            attempts: outcome.attempts,
            error: null
        });
        console.log(`[scrape] ${label}: ${outcome.result.length} articles (attempt ${outcome.attempts})`);
        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await scrapeRunRepository.finish(run.id, {
            status: 'failed',
            items: 0,
            attempts: ATTEMPTS,
            error: message
        });
        console.error(`[scrape] ${label} failed after ${ATTEMPTS} attempts: ${message}`);
        return false;
    }
}

/**
 * Entry point for the scheduled run: every column, both origins, one process.
 * Each task is recorded in "scrape_runs" and a single failure is not allowed to
 * take the rest of the day's scrape down with it, so the exit code is what tells
 * the scheduler whether the run was complete.
 */
async function main(): Promise<void> {
    await initializeDatabase();

    const results: boolean[] = [];
    for (const task of buildTasks()) {
        results.push(await executeTask(task));
    }

    const failed = results.filter(succeeded => !succeeded).length;
    console.log(`[scrape] finished: ${results.length - failed} ok, ${failed} failed`);

    await AppDataSource.destroy();

    // Explicit exit: Chrome can outlive `browser.close()` and keep holding the
    // runner's stdout pipe, which left a scrape that had already finished in
    // 2m30 hanging until the job's 30 minute timeout killed it.
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (error) => {
    console.error('[scrape] run aborted:', error);
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
    process.exit(1);
});
