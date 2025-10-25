import { ArticleDTO } from "../models/JournalModel";

export interface IJournalService {
    scrapeJournals(type: 'jornalismo' | 'entretenimento' | 'esportes'): Promise<ArticleDTO[]>;
}