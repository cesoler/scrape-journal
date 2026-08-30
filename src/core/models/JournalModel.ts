export interface CompleteArticleDTO {
    id: number;
    title: string;
    articleTitle: string | null;
    categories: string[];
    url: string;
    featured: boolean;
    subtitle: string;
    createdAt: string;
    canonicalUrl: string;
    imageUrl: string | null;
    sections: string[];
    authors: ArticleAuthorDTO[];
    publishedAt: string | null;
    modifiedAt: string | null;
}

export interface MainArticleContentDTO {
    title: string;
    url: string | null;
    featured: boolean;
}

export interface DetailArticleContentDTO {
    articleTitle: string | null;
    subtitle: string;
    createdAt: string;
    canonicalUrl: string | null;
    publishedAt: string | null;
    modifiedAt: string | null;
    imageUrl: string | null;
    sections: string[];
    authors: ArticleAuthorDTO[];
}

export interface AiArticleSuggestionDTO {
  content: {
    url: string;
    image: {
      url: string;
    };
    section: string;
    video: string | null;
    recommendationTitle: string;
    category: string;
    recommendationSummary: string;
    title: string;
    summary: string;
  }
  publication: string;
  created: string;
  tenantId: string;
  type: string;
}

export type AvailableColumnCategory = 'jornalismo' | 'entretenimento' | 'esporte';

export const VALID_CATEGORIES: AvailableColumnCategory[] = [
  'jornalismo', 
  'entretenimento', 
  'esporte'
];

export function isAvailableColumnCategory(value: string): value is AvailableColumnCategory {
  return VALID_CATEGORIES.includes(value as AvailableColumnCategory);
}

export interface ArticleAuthorDTO {
    name: string;
    url: string | null;
}

export type ArticleOrigin = 'main-page' | 'ai-suggestion';
