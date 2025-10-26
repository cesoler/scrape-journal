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

export interface InsideArticleContentDTO {
    subtitle: string;
    createdAt: string;
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