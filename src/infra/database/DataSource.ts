import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Article } from '../../core/entities/Article';
import { CreateArticles1787443200000 } from './migrations/1787443200000-CreateArticles';

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [Article],
    // Explicit imports instead of a glob: a glob would have to match `src/**/*.ts`
    // in development and `dist/**/*.js` in production.
    migrations: [CreateArticles1787443200000],
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
