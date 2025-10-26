import { CompleteArticleDTO, AvailableColumnCategory, AiArticleSuggestionDTO, MainArticleContentDTO } from "../../models/JournalModel";

export interface IJournalService {
    scrapeJournalColumn(columnCategory: AvailableColumnCategory): Promise<CompleteArticleDTO[]>;
    getAISuggestions(columnCategory: AvailableColumnCategory, itemsPerPage: number): Promise<MainArticleContentDTO[]>;
}