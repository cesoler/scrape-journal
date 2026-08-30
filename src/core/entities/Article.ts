import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ArticleAuthorDTO, ArticleOrigin, AvailableColumnCategory } from '../models/JournalModel';

@Entity('articles')
export class Article {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index('idx_articles_canonical_url', { unique: true })
    @Column({ name: 'canonical_url', type: 'text' })
    canonicalUrl!: string;

    @Column({ name: 'source_url', type: 'text' })
    sourceUrl!: string;

    @Column({ type: 'text' })
    title!: string;

    // The headline of the article page itself; `title` is the home page teaser,
    // which the newsroom often rewrites for the front page.
    @Column({ name: 'article_title', type: 'text', nullable: true })
    articleTitle!: string | null;

    @Column({ type: 'text', nullable: true })
    subtitle!: string | null;

    @Column({ type: 'boolean', default: false })
    featured!: boolean;

    @Column({ name: 'image_url', type: 'text', nullable: true })
    imageUrl!: string | null;

    @Column({ type: 'text', array: true, default: () => "'{}'" })
    sections!: string[];

    @Column({ type: 'jsonb', default: () => "'[]'" })
    authors!: ArticleAuthorDTO[];

    @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
    publishedAt!: Date | null;

    @Column({ name: 'modified_at', type: 'timestamptz', nullable: true })
    modifiedAt!: Date | null;

    // One row per article: an article listed under more than one column keeps
    // every category instead of having the last scrape overwrite the previous one.
    @Index('idx_articles_categories')
    @Column({ type: 'text', array: true, default: () => "'{}'" })
    categories!: AvailableColumnCategory[];

    @Column({ type: 'text' })
    origin!: ArticleOrigin;

    @Column({ name: 'scraped_at', type: 'timestamptz' })
    scrapedAt!: Date;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;
}
