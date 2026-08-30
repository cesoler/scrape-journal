import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Article } from '../../core/entities/Article';
import { ScrapeRun } from '../../core/entities/ScrapeRun';
import { CreateArticles1787443200000 } from './migrations/1787443200000-CreateArticles';
import { AddArticleTitleAndCategories1787616000000 } from './migrations/1787616000000-AddArticleTitleAndCategories';
import { AddSeenTimestampsAndRuns1787702400000 } from './migrations/1787702400000-AddSeenTimestampsAndRuns';

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    // Supabase (and other managed hosts) require TLS; the local compose database
    // does not serve it, so this is opt-in through the environment.
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    entities: [Article, ScrapeRun],
    // Explicit imports instead of a glob: a glob would have to match `src/**/*.ts`
    // in development and `dist/**/*.js` in production.
    migrations: [
        CreateArticles1787443200000,
        AddArticleTitleAndCategories1787616000000,
        AddSeenTimestampsAndRuns1787702400000
    ],
    migrationsRun: true,
    synchronize: false,
    logging: false
});

export async function initializeDatabase(): Promise<DataSource> {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set');
    }
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
    return AppDataSource;
}
