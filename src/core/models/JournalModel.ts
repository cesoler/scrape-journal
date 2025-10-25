export interface ArticleDTO {
    id: number;
    title: string;
    subtitle: string;
    url: string;
    featured: boolean;
    createdAt: Date;
}

export type AvailableJournalTypes = 'jornalismo' | 'entretenimento' | 'esportes';