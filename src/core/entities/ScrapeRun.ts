import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ArticleOrigin, AvailableColumnCategory } from '../models/JournalModel';

export type ScrapeRunStatus = 'ok' | 'failed';

/** One row per category/origin pair of a scrape run: what the daily job did. */
@Entity('scrape_runs')
export class ScrapeRun {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'text' })
    category!: AvailableColumnCategory;

    @Column({ type: 'text' })
    origin!: ArticleOrigin;

    @Column({ type: 'text' })
    status!: ScrapeRunStatus;

    @Column({ type: 'int', default: 0 })
    items!: number;

    @Column({ type: 'int', default: 1 })
    attempts!: number;

    @Column({ type: 'text', nullable: true })
    error!: string | null;

    @Index('idx_scrape_runs_started_at')
    @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
    startedAt!: Date;

    @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
    finishedAt!: Date | null;
}
