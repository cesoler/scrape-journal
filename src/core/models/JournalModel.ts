export interface ArticleDTO {
    id: number;
    title: string;
    subtitle: string;
    url: string;
    featured: boolean;
    createdAt: string;
}

export type AvailableColumnCategory = 'jornalismo' | 'entretenimento' | 'esportes';