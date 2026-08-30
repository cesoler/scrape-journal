import { Article } from '../entities/Article';
import { CompleteArticleDTO } from '../models/JournalModel';
import { parseDate } from './Parser';

export function toCompleteArticleDTO(article: Article): CompleteArticleDTO {
    return {
        id: article.id,
        title: article.title,
        url: article.sourceUrl,
        featured: article.featured,
        subtitle: article.subtitle ?? 'No Subtitle',
        createdAt: article.publishedAt
            ? article.publishedAt.toISOString().split('T')[0]
            : parseDate(null),
        canonicalUrl: article.canonicalUrl,
        imageUrl: article.imageUrl,
        sections: article.sections,
        authors: article.authors,
        publishedAt: article.publishedAt?.toISOString() ?? null,
        modifiedAt: article.modifiedAt?.toISOString() ?? null
    };
}
