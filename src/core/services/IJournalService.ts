import { ArticleDTO, AvailableJournalTypes } from "../models/JournalModel";

export interface IJournalService {
    scrapeJournals(type: AvailableJournalTypes): Promise<ArticleDTO[]>;
}