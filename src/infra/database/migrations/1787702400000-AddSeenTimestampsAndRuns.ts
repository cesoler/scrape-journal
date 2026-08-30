import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSeenTimestampsAndRuns1787702400000 implements MigrationInterface {
    name = 'AddSeenTimestampsAndRuns1787702400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // "scraped_at" only moved when the article itself was rewritten, so an
        // article seen every day but never edited looked stale. It becomes the
        // last-seen mark, and the row's creation date backfills the first one.
        await queryRunner.query(`ALTER TABLE "articles" RENAME COLUMN "scraped_at" TO "last_seen_at"`);
        await queryRunner.query(
            `ALTER TABLE "articles" ADD COLUMN "first_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
        );
        await queryRunner.query(`UPDATE "articles" SET "first_seen_at" = "created_at"`);
        await queryRunner.query(
            `CREATE INDEX "idx_articles_last_seen_at" ON "articles" ("last_seen_at")`
        );

        await queryRunner.query(`
            CREATE TABLE "scrape_runs" (
                "id" SERIAL NOT NULL,
                "category" text NOT NULL,
                "origin" text NOT NULL,
                "status" text NOT NULL,
                "items" integer NOT NULL DEFAULT 0,
                "attempts" integer NOT NULL DEFAULT 1,
                "error" text,
                "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "finished_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_scrape_runs" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(
            `CREATE INDEX "idx_scrape_runs_started_at" ON "scrape_runs" ("started_at")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_scrape_runs_started_at"`);
        await queryRunner.query(`DROP TABLE "scrape_runs"`);
        await queryRunner.query(`DROP INDEX "idx_articles_last_seen_at"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "first_seen_at"`);
        await queryRunner.query(`ALTER TABLE "articles" RENAME COLUMN "last_seen_at" TO "scraped_at"`);
    }
}
