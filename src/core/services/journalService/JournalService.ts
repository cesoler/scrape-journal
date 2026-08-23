import { CompleteArticleDTO, AvailableColumnCategory, DetailArticleContentDTO, AiArticleSuggestionDTO, MainArticleContentDTO, ArticleOrigin } from "../../models/JournalModel";
import { IJournalService } from "./IJournalService";
import { getSelectorsForBrowser, JournalSelector } from "../../constants/Selectors";
import { IBrowserService } from "../browserService/IBrowserService";
import { browserService } from "../browserService/BrowserService";
import { articleService } from "../articleService/ArticleService";
import { parseIsoDate } from "../../utils/Parser";
import { normalizeUrl } from "../../utils/UrlNormalizer";
import { toCompleteArticleDTO } from "../../utils/ArticleMapper";
import { IArticleService } from "../articleService/IArticleService";
import { ArticleUpsertInput, IArticleRepository } from "../../repositories/IArticleRepository";
import { articleRepository } from "../../../infra/repositories/ArticleRepository";
import { Browser } from "puppeteer";


class JournalService implements IJournalService {
    constructor(
        private browserService: IBrowserService = browserService,
        private articleService: IArticleService = articleService,
        private articleRepository: IArticleRepository = articleRepository
    ) {}

    async scrapeJournalColumnSync(columnCategory: AvailableColumnCategory): Promise<CompleteArticleDTO[]> {
        const selectorsBrowser = getSelectorsForBrowser(columnCategory);
        const articleList = await this.getMainArticleList(selectorsBrowser);

        return this.processArticlesWithDetails<MainArticleContentDTO>(
            articleList,
            selectorsBrowser['articlePage'],
            (article) => article.url,
            this.articleService.scrapeDetailsForListSync.bind(this.articleService),
            (article) => article.title,
            (article) => article.featured,
            columnCategory,
            'main-page'
        );
    }

    async scrapeJournalColumnAsync(columnCategory: AvailableColumnCategory): Promise<CompleteArticleDTO[]> {
        const selectorsBrowser = getSelectorsForBrowser(columnCategory);
        const articleList = await this.getMainArticleList(selectorsBrowser);
        console.log('Filtered article list size for async scrape:', articleList.length);

        return this.processArticlesWithDetails<MainArticleContentDTO>(
            articleList,
            selectorsBrowser['articlePage'],
            (article) => article.url,
            this.articleService.scrapeDetailsForListAsync.bind(this.articleService),
            (article) => article.title,
            (article) => article.featured,
            columnCategory,
            'main-page'
        );
    }

    async getAISuggestionsSync(columnCategory: AvailableColumnCategory, itemsPerPage: number): Promise<CompleteArticleDTO[]> {
        const aiSuggestions = await this.articleService.getAISuggestions(columnCategory, itemsPerPage);
        const selectors = getSelectorsForBrowser(columnCategory)['articlePage'];

        return this.processArticlesWithDetails<AiArticleSuggestionDTO>(
            aiSuggestions,
            selectors,
            (suggestion) => suggestion.content.url,
            this.articleService.scrapeDetailsForListSync.bind(this.articleService),
            (suggestion) => suggestion.content.title,
            () => false,
            columnCategory,
            'ai-suggestion'
        );
    }

    async getAISuggestionsAsync(columnCategory: AvailableColumnCategory, itemsPerPage: number): Promise<CompleteArticleDTO[]> {
        const aiSuggestions = await this.articleService.getAISuggestions(columnCategory, itemsPerPage);
        const selectors = getSelectorsForBrowser(columnCategory)['articlePage'];

        return this.processArticlesWithDetails<AiArticleSuggestionDTO>(
            aiSuggestions,
            selectors,
            (suggestion) => suggestion.content.url,
            this.articleService.scrapeDetailsForListAsync.bind(this.articleService),
            (suggestion) => suggestion.content.title,
            () => false,
            columnCategory,
            'ai-suggestion'
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
            const url = article.url?.toLowerCase() ?? '';
            return !blockedUrlPrefixes.some((blockedUrl) => url.startsWith(blockedUrl));
        });
    }

    private async processArticlesWithDetails<T>(
        items: T[],
        selectors: JournalSelector['articlePage'],
        urlExtractor: (item: T) => string | null,
        detailsFetcher: (browser: Browser, items: T[], selectors: JournalSelector['articlePage'], urlExtractor: (item: T) => string | null) => Promise<{ item: T; details: DetailArticleContentDTO | null }[]>,
        titleExtractor: (item: T) => string,
        featuredExtractor: (item: T) => boolean,
        category: AvailableColumnCategory,
        origin: ArticleOrigin
    ): Promise<CompleteArticleDTO[]> {
        const browser = await this.browserService.startBrowser();

        let processedList: { item: T; details: DetailArticleContentDTO | null }[];
        try {
            processedList = await detailsFetcher(browser, items, selectors, urlExtractor);
        } finally {
            await this.browserService.closeBrowser();
        }

        const upsertInputs = this.toUpsertInputs(
            processedList,
            urlExtractor,
            titleExtractor,
            featuredExtractor,
            category,
            origin
        );

        const saved = await this.articleRepository.saveMany(upsertInputs);
        return saved.map(toCompleteArticleDTO);
    }

    private toUpsertInputs<T>(
        processedList: { item: T; details: DetailArticleContentDTO | null }[],
        urlExtractor: (item: T) => string | null,
        titleExtractor: (item: T) => string,
        featuredExtractor: (item: T) => boolean,
        category: AvailableColumnCategory,
        origin: ArticleOrigin
    ): ArticleUpsertInput[] {
        const inputs: ArticleUpsertInput[] = [];

        for (const { item, details } of processedList) {
            if (!details) {
                continue;
            }

            const sourceUrl = urlExtractor(item);
            const canonicalUrl = normalizeUrl(sourceUrl, details.canonicalUrl);
            if (!sourceUrl || !canonicalUrl) {
                console.warn('Skipping article without a usable url:', titleExtractor(item));
                continue;
            }

            inputs.push({
                canonicalUrl,
                sourceUrl,
                title: titleExtractor(item),
                subtitle: details.subtitle,
                featured: featuredExtractor(item),
                imageUrl: details.imageUrl,
                sections: details.sections,
                authors: details.authors,
                publishedAt: parseIsoDate(details.publishedAt),
                modifiedAt: parseIsoDate(details.modifiedAt),
                category,
                origin
            });
        }

        return inputs;
    }
}

export const journalService = new JournalService(browserService, articleService, articleRepository);
