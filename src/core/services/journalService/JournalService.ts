import { CompleteArticleDTO, AvailableColumnCategory, DetailArticleContentDTO, AiArticleSuggestionDTO, MainArticleContentDTO } from "../../models/JournalModel";
import { IJournalService } from "./IJournalService";
import { getSelectorsForBrowser } from "../../constants/Selectors";
import { IBrowserService } from "../browserService/IBrowserService";
import { browserService } from "../browserService/BrowserService";
import { articleService } from "../articleService/ArticleService";
import { parseDate } from "../../utils/Parser";
import { IArticleService } from "../articleService/IArticleService";


class JournalService implements IJournalService {
    constructor(private browserService: IBrowserService = browserService, private articleService: IArticleService = articleService) {}

    async scrapeJournalColumn(columnCategory: AvailableColumnCategory): Promise<CompleteArticleDTO[]> {
        const browser = await this.browserService.startBrowser();
        const selectorsBrowser = getSelectorsForBrowser(columnCategory);

        const articleList = await this.articleService.scrapeArticleList(browser, 'https://globo.com', selectorsBrowser['mainPage']);
        const processedList = await this.articleService.scrapeDetailsForListSync(
            browser,
            articleList,
            selectorsBrowser['articlePage'],
            (article) => article.url
        );
        this.browserService.closeBrowser();

        return processedList
        .filter(res => res.details !== null)
        .map((res, index) => ({
            id: index + 1,
            title: res.item.title,
            url: res.item.url,
            featured: res.item.featured,
            subtitle: res.details!.subtitle,
            createdAt: parseDate(res.details!.createdAt)
        }));
    }

    async getAISuggestions(columnCategory: AvailableColumnCategory, itemsPerPage: number): Promise<CompleteArticleDTO[]> {
        const aiSuggestions = await articleService.getAISuggestions(columnCategory, itemsPerPage);
        const browser = await this.browserService.startBrowser();
    
        const selectors = getSelectorsForBrowser(columnCategory)['articlePage'];

        const processedList = await this.articleService.scrapeDetailsForListSync(
            browser,
            aiSuggestions,
            selectors,
            (suggestion) => suggestion.content.url
        );

        this.browserService.closeBrowser();

        return processedList
        .filter(res => res.details !== null)
        .map((res, index) => ({
            id: index + 1,
            title: res.item.content.title,
            url: res.item.content.url,
            featured: false,
            subtitle: res.details!.subtitle,
            createdAt: parseDate(res.details!.createdAt)
        }));
    }
}

export const journalService = new JournalService(browserService, articleService);