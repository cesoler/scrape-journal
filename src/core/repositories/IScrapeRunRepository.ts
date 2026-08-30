import { ScrapeRun, ScrapeRunStatus } from '../entities/ScrapeRun';
import { ArticleOrigin, AvailableColumnCategory } from '../models/JournalModel';

export interface ScrapeRunResult {
    status: ScrapeRunStatus;
    items: number;
    attempts: number;
    error: string | null;
}

export interface IScrapeRunRepository {
    start(category: AvailableColumnCategory, origin: ArticleOrigin): Promise<ScrapeRun>;
    finish(id: number, result: ScrapeRunResult): Promise<ScrapeRun>;
}
