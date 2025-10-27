import { CompleteArticleDTO, AvailableColumnCategory, AiArticleSuggestionDTO, MainArticleContentDTO } from "../../models/JournalModel";

export interface IJournalService {
    scrapeJournalColumnSync(columnCategory: AvailableColumnCategory): Promise<CompleteArticleDTO[]>;
    scrapeJournalColumnAsync(columnCategory: AvailableColumnCategory): Promise<CompleteArticleDTO[]>;

    getAISuggestionsSync(columnCategory: AvailableColumnCategory, itemsPerPage: number): Promise<MainArticleContentDTO[]>;
    getAISuggestionsAsync(columnCategory: AvailableColumnCategory, itemsPerPage: number): Promise<MainArticleContentDTO[]>;

}