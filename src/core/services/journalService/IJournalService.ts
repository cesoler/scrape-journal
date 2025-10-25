import { ArticleDTO, AvailableColumnCategory } from "../../models/JournalModel";

export interface IJournalService {
    scrapeJournalColumn(columnCategory: AvailableColumnCategory): Promise<ArticleDTO[]>;
}