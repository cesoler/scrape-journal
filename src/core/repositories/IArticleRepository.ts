import { Article } from '../entities/Article';
import { ArticleAuthorDTO, ArticleOrigin, AvailableColumnCategory } from '../models/JournalModel';

export interface ArticleUpsertInput {
    canonicalUrl: string;
    sourceUrl: string;
    title: string;
    articleTitle: string | null;
    subtitle: string | null;
    featured: boolean;
    imageUrl: string | null;
    sections: string[];
    authors: ArticleAuthorDTO[];
    publishedAt: Date | null;
    modifiedAt: Date | null;
    category: AvailableColumnCategory;
    origin: ArticleOrigin;
}

export interface IArticleRepository {
    saveMany(inputs: ArticleUpsertInput[]): Promise<Article[]>;
}
