import { DataSource, In, Repository } from 'typeorm';
import { Article } from '../../core/entities/Article';
import { ArticleUpsertInput, IArticleRepository } from '../../core/repositories/IArticleRepository';
import { AppDataSource } from '../database/DataSource';

const OVERWRITTEN_COLUMNS = [
    'source_url',
    'title',
    'article_title',
    'subtitle',
    'featured',
    'image_url',
    'sections',
    'authors',
    'published_at',
    'modified_at',
    'origin',
    'scraped_at'
];

const FRESHNESS_GUARD =
    '"articles"."modified_at" IS NULL' +
    ' OR EXCLUDED."modified_at" IS NULL' +
    ' OR EXCLUDED."modified_at" > "articles"."modified_at"';

class ArticleRepository implements IArticleRepository {
    constructor(private dataSource: DataSource = AppDataSource) {}

    async saveMany(inputs: ArticleUpsertInput[]): Promise<Article[]> {
        if (inputs.length === 0) {
            return [];
        }

        // Postgres refuses a batch that touches the same conflicting row twice:
        // "ON CONFLICT DO UPDATE command cannot affect row a second time".
        const deduped = new Map<string, ArticleUpsertInput>();
        for (const input of inputs) {
            deduped.set(input.canonicalUrl, input);
        }
        const rows = [...deduped.values()];
        const scrapedAt = new Date();

        // Built through the query builder on purpose: `Repository.upsert()` accepts
        // `overwriteCondition` in its type but drops it before reaching `orUpdate`,
        // so the freshness guard would silently never make it into the SQL.
        // `dataSource.createQueryBuilder()` also leaves the table unaliased, which is
        // what lets the guard reference "articles" directly.
        await this.dataSource
            .createQueryBuilder()
            .insert()
            .into(Article)
            .values(rows.map(({ category, ...row }) => ({
                ...row,
                categories: [category],
                scrapedAt
            })))
            .orUpdate(OVERWRITTEN_COLUMNS, ['canonical_url'], {
                overwriteCondition: { where: FRESHNESS_GUARD }
            })
            .execute();

        await this.mergeCategories(rows);

        // The freshness guard makes Postgres skip some rows, and skipped rows are
        // absent from RETURNING. Reading them back is what keeps every requested
        // article in the HTTP response.
        const saved = await this.getRepository().find({
            where: { canonicalUrl: In(rows.map(row => row.canonicalUrl)) }
        });
        const byUrl = new Map(saved.map(article => [article.canonicalUrl, article]));

        return rows
            .map(row => byUrl.get(row.canonicalUrl))
            .filter((article): article is Article => article !== undefined);
    }

    // `categories` stays out of the upsert's overwritten columns on purpose: an
    // article listed under two columns must keep both, and the freshness guard
    // would skip the row anyway whenever its content has not changed.
    private async mergeCategories(rows: ArticleUpsertInput[]): Promise<void> {
        const urlsByCategory = new Map<string, string[]>();
        for (const row of rows) {
            const urls = urlsByCategory.get(row.category) ?? [];
            urls.push(row.canonicalUrl);
            urlsByCategory.set(row.category, urls);
        }

        for (const [category, urls] of urlsByCategory) {
            await this.dataSource.query(
                `UPDATE "articles"
                 SET "categories" = (
                     SELECT array_agg(DISTINCT category ORDER BY category)
                     FROM unnest("categories" || $1::text[]) AS category
                 )
                 WHERE "canonical_url" = ANY($2::text[])
                   AND NOT ("categories" @> $1::text[])`,
                [[category], urls]
            );
        }
    }

    private getRepository(): Repository<Article> {
        return this.dataSource.getRepository(Article);
    }
}

export const articleRepository = new ArticleRepository();
