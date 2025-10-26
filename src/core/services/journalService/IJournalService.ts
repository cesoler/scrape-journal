import { CompleteArticleDTO, AvailableColumnCategory } from "../../models/JournalModel";

export interface IJournalService {
    scrapeJournalColumn(columnCategory: AvailableColumnCategory): Promise<CompleteArticleDTO[]>;
}