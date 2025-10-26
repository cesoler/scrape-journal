export interface CompleteArticleDTO {
    id: number;
    title: string;
    url: string | null;
    featured: boolean;
    subtitle: string;
    createdAt: string;
}

export interface MainArticleContentDTO {
    title: string;
    url: string | null;
    featured: boolean;
}

export interface DetailArticleContentDTO {
    subtitle: string;
    createdAt: string;
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