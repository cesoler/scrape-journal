import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArticles1787443200000 implements MigrationInterface {
    name = 'CreateArticles1787443200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "articles" (
                "id" SERIAL NOT NULL,
                "canonical_url" text NOT NULL,
                "source_url" text NOT NULL,
                "title" text NOT NULL,
                "subtitle" text,
                "featured" boolean NOT NULL DEFAULT false,
                "image_url" text,
                "sections" text array NOT NULL DEFAULT '{}',
                "authors" jsonb NOT NULL DEFAULT '[]',
                "published_at" TIMESTAMP WITH TIME ZONE,
                "modified_at" TIMESTAMP WITH TIME ZONE,
                "category" text NOT NULL,
                "origin" text NOT NULL,
                "scraped_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_articles" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(
            `CREATE UNIQUE INDEX "idx_articles_canonical_url" ON "articles" ("canonical_url")`
        );
        await queryRunner.query(
            `CREATE INDEX "idx_articles_category" ON "articles" ("category")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_articles_category"`);
        await queryRunner.query(`DROP INDEX "idx_articles_canonical_url"`);
        await queryRunner.query(`DROP TABLE "articles"`);
    }
}
