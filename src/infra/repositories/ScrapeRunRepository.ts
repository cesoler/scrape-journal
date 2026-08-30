import { DataSource, Repository } from 'typeorm';
import { ScrapeRun } from '../../core/entities/ScrapeRun';
import { ArticleOrigin, AvailableColumnCategory } from '../../core/models/JournalModel';
import { IScrapeRunRepository, ScrapeRunResult } from '../../core/repositories/IScrapeRunRepository';
import { AppDataSource } from '../database/DataSource';

class ScrapeRunRepository implements IScrapeRunRepository {
    constructor(private dataSource: DataSource = AppDataSource) {}

    async start(category: AvailableColumnCategory, origin: ArticleOrigin): Promise<ScrapeRun> {
        return this.getRepository().save(
            this.getRepository().create({ category, origin, status: 'ok', items: 0, attempts: 1 })
        );
    }

    async finish(id: number, result: ScrapeRunResult): Promise<ScrapeRun> {
        await this.getRepository().update(id, { ...result, finishedAt: new Date() });

        const run = await this.getRepository().findOneBy({ id });
        if (!run) {
            throw new Error(`Scrape run ${id} disappeared while it was running`);
        }
        return run;
    }

    private getRepository(): Repository<ScrapeRun> {
        return this.dataSource.getRepository(ScrapeRun);
    }
}

export const scrapeRunRepository = new ScrapeRunRepository();
