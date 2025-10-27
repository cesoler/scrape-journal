import { CompleteArticleDTO, AvailableColumnCategory, DetailArticleContentDTO, AiArticleSuggestionDTO, MainArticleContentDTO } from "../../models/JournalModel";
import { IJournalService } from "./IJournalService";
import { getSelectorsForBrowser, JournalSelector } from "../../constants/Selectors";
import { IBrowserService } from "../browserService/IBrowserService";
import { browserService } from "../browserService/BrowserService";
import { articleService } from "../articleService/ArticleService";
import { parseDate } from "../../utils/Parser";
import { IArticleService } from "../articleService/IArticleService";
import { Browser } from "puppeteer";


class JournalService implements IJournalService {
    constructor(private browserService: IBrowserService = browserService, private articleService: IArticleService = articleService) {}

    async scrapeJournalColumnSync(columnCategory: AvailableColumnCategory): Promise<CompleteArticleDTO[]> {
        const selectorsBrowser = getSelectorsForBrowser(columnCategory);
        const articleList = await this.getMainArticleList(selectorsBrowser);
        
        return this.processArticlesWithDetails<MainArticleContentDTO>(
            articleList,
            selectorsBrowser['articlePage'],
            (article: MainArticleContentDTO) => article.url,
            this.articleService.scrapeDetailsForListSync.bind(this.articleService),
            this.mapProcessedListToCompleteArticles.bind(this)
        );
    }

    async scrapeJournalColumnAsync(columnCategory: AvailableColumnCategory): Promise<CompleteArticleDTO[]> {
        const selectorsBrowser = getSelectorsForBrowser(columnCategory);
        const articleList = await this.getMainArticleList(selectorsBrowser);
        console.log('Filtered article list size for async scrape:', articleList.length);
        
        return this.processArticlesWithDetails<MainArticleContentDTO>(
            articleList,
            selectorsBrowser['articlePage'],
            (article: MainArticleContentDTO) => article.url,
            this.articleService.scrapeDetailsForListAsync.bind(this.articleService),
            this.mapProcessedListToCompleteArticles.bind(this)
        );
    }

    async getAISuggestionsSync(columnCategory: AvailableColumnCategory, itemsPerPage: number): Promise<CompleteArticleDTO[]> {
        const aiSuggestions = await articleService.getAISuggestions(columnCategory, itemsPerPage);
        const selectors = getSelectorsForBrowser(columnCategory)['articlePage'];

        return this.processArticlesWithDetails<AiArticleSuggestionDTO>(
            aiSuggestions,
            selectors,
            (suggestion: AiArticleSuggestionDTO) => suggestion.content.url,
            this.articleService.scrapeDetailsForListSync.bind(this.articleService),
            this.mapAiSuggestionsToCompleteArticles.bind(this)
        );
    }

    async getAISuggestionsAsync(columnCategory: AvailableColumnCategory, itemsPerPage: number): Promise<CompleteArticleDTO[]> {
        const aiSuggestions = await articleService.getAISuggestions(columnCategory, itemsPerPage);
        const selectors = getSelectorsForBrowser(columnCategory)['articlePage'];

        return this.processArticlesWithDetails<AiArticleSuggestionDTO>(
            aiSuggestions,
            selectors,
            (suggestion: AiArticleSuggestionDTO) => suggestion.content.url,
            this.articleService.scrapeDetailsForListAsync.bind(this.articleService),
            this.mapAiSuggestionsToCompleteArticles.bind(this)
        );
    }

    private async getMainArticleList(selectorsBrowser: ReturnType<typeof getSelectorsForBrowser>): Promise<MainArticleContentDTO[]> {
        const browser = await this.browserService.startBrowser();
        const articleList = await this.articleService.scrapeArticleList(browser, 'https://globo.com', selectorsBrowser['mainPage']);
        await this.browserService.closeBrowser();
                
        const blockedUrlPrefixes = [
            'https://g1.globo.com/previsao-do-tempo',
            'https://g1.globo.com/guia/guia-de-compras'
        ];
        
        return articleList.filter(article => {
            const url = article.url!.toLowerCase();
            return !blockedUrlPrefixes.some((blockedUrl) => url.startsWith(blockedUrl));
        });
    }

    private async processArticlesWithDetails<T>(
        items: T[],
        selectors: JournalSelector['articlePage'],
        urlExtractor: (item: T) => string | null,
        detailsFetcher: (browser: Browser, items: T[], selectors: JournalSelector['articlePage'], urlExtractor: (item: T) => string | null) => Promise<{ item: T; details: DetailArticleContentDTO | null }[]>,
        mapper: (processedList: { item: T; details: DetailArticleContentDTO | null }[]) => CompleteArticleDTO[]
    ): Promise<CompleteArticleDTO[]> {
        const browser = await this.browserService.startBrowser();

        console.log('Chegou aqui:');
        try {
            const processedList = await detailsFetcher(browser, items, selectors, urlExtractor);
            return mapper(processedList);
        } finally {
            await this.browserService.closeBrowser();
        }
    }

    private mapProcessedListToCompleteArticles(
        processedList: { item: MainArticleContentDTO; details: DetailArticleContentDTO | null }[]
    ): CompleteArticleDTO[] {
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

    private mapAiSuggestionsToCompleteArticles(
        processedList: { item: AiArticleSuggestionDTO; details: DetailArticleContentDTO | null }[]
    ): CompleteArticleDTO[] {
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