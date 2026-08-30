import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArticleTitleAndCategories1787616000000 implements MigrationInterface {
    name = 'AddArticleTitleAndCategories1787616000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" ADD COLUMN "article_title" text`);

        // "category" held a single column name, so an article listed under two
        // columns lost the first one on the next upsert. The array keeps both.
        await queryRunner.query(
            `ALTER TABLE "articles" ADD COLUMN "categories" text array NOT NULL DEFAULT '{}'`
        );
        await queryRunner.query(`UPDATE "articles" SET "categories" = ARRAY["category"]`);
        await queryRunner.query(`DROP INDEX "idx_articles_category"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "category"`);
        await queryRunner.query(
            `CREATE INDEX "idx_articles_categories" ON "articles" USING GIN ("categories")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" ADD COLUMN "category" text`);
        // Only the first category survives the rollback: the old column holds one.
        await queryRunner.query(
            `UPDATE "articles" SET "category" = COALESCE("categories"[1], 'jornalismo')`
        );
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "category" SET NOT NULL`);
        await queryRunner.query(`DROP INDEX "idx_articles_categories"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "categories"`);
        await queryRunner.query(
            `CREATE INDEX "idx_articles_category" ON "articles" ("category")`
        );
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "article_title"`);
    }
}
