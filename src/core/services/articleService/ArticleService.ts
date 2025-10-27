import { Browser, Page } from "puppeteer";
import { JournalSelector } from "../../constants/Selectors";
import { AiArticleSuggestionDTO, AvailableColumnCategory, CompleteArticleDTO, DetailArticleContentDTO, MainArticleContentDTO } from "../../models/JournalModel";
import { IPageService } from "../pageService/IPageService";
import { pageService } from "../pageService/PageService";
import { parseJsonToAiArticleSuggestionDTO } from "../../utils/Parser";
import { IArticleService } from "./IArticleService";

class ArticleService implements IArticleService {
    constructor(private pageService: IPageService = pageService) {}

    async scrapeArticleList(browser: Browser, url: string, selectors: JournalSelector['mainPage']): Promise<MainArticleContentDTO[]> {
        const page = await this.pageService.setupPage(browser, url, selectors.contentColumnSelector);
        const articles = await this.extractArticlesFromPage(page, selectors);
        await this.pageService.closePage(page);
        return articles;
    }

    async scrapeArticleDetails(browser: Browser, url: string, selectors: JournalSelector['articlePage']): Promise<DetailArticleContentDTO> {
        const page = await this.pageService.setupPage(browser, url, selectors.subtitleSelector);
        const articleDetails = await this.extractArticleDetails(page, selectors);
        await this.pageService.closePage(page);
        return articleDetails;
    }

    async scrapeDetailsForListAsync<T>(
        browser: Browser,
        baseList: T[],
        selectors: JournalSelector['articlePage'],
        urlExtractor: (item: T) => string | null
    ): Promise<({ item: T; details: DetailArticleContentDTO | null })[]> {
        console.log('Starting async scrape of article details for list of size:', baseList.length);
        const detailPromises = baseList.map(item => {
            const url = urlExtractor(item);
            if (!url) {
                return Promise.resolve(null); 
            }
            return articleService.scrapeArticleDetails(browser, url, selectors);
        });

        const detailResults = await Promise.allSettled(detailPromises);

        return baseList.map((item, index) => {
            const result = detailResults[index];
            if (result.status === 'fulfilled' && result.value) {
                return { item, details: result.value };
            }
            return { item, details: null };
        });
    }

    async scrapeDetailsForListSync<T>(
        browser: Browser,
        baseList: T[],
        selectors: JournalSelector['articlePage'],
        urlExtractor: (item: T) => string | null
    ): Promise<({ item: T; details: DetailArticleContentDTO | null })[]> {
        console.log('Starting sync scrape of article details for list of size:', baseList.length);
        const results: ({ item: T; details: DetailArticleContentDTO | null })[] = [];
        
        const detailsPage = await this.pageService.setupPage(browser, 'about:blank');

        try {
            for (const item of baseList) {
                const url = urlExtractor(item);
                if (!url) {
                    results.push({ item, details: null });
                    continue;
                }
                try {
                    console.log('Scraping details for URL:', url);
                    await this.pageService.pageGoto(detailsPage, url, 15000, selectors.subtitleSelector);
                    const articleDetails = await this.extractArticleDetails(detailsPage, selectors);
                    results.push({ item, details: articleDetails });
                } catch (err) {
                    results.push({ item, details: null });
                }
            }
        } finally {
            await this.pageService.closePage(detailsPage);
        }

        return results;
    }

    async getAISuggestions(column: AvailableColumnCategory, itemsPerPage: number): Promise<AiArticleSuggestionDTO[]> {
        const response = await fetch(`https://recomendacao.globo.com/v3/globocom/ab/HOME-AREA-COLUNA-${column.toUpperCase()}-user?responseFormat=legacyPublishing&registerImpression=false&deduplicationGroup=homeGloboCom&perPage=${itemsPerPage}`, {
            "method": "GET"
        });

        const data = await response.json();
        const suggestions: AiArticleSuggestionDTO[] = data.map((item: any) => parseJsonToAiArticleSuggestionDTO(item));

        return suggestions;
    }

    private async extractArticlesFromPage(page: Page, selectors: JournalSelector['mainPage']): Promise<MainArticleContentDTO[]> {
        return page.evaluate((selector) => {
            const getMainArticleContent = (node: Element, sel: JournalSelector['mainPage']) => {
                const linkElement = node.querySelector<HTMLAnchorElement>(sel.postLinkSelector)?.href || null;
                const articleTitle = node.querySelector(sel.postTitleSelector)?.textContent?.trim() || 'No Title';
                const isFeatured = node.matches(sel.featuredSelector);

                return {
                    title: articleTitle,
                    url: linkElement,
                    featured: isFeatured
                };
            };

            const columnElement = document.querySelector(selector.columnSelector);
            if (!columnElement) throw new Error('Column element not found');

            const contentElement = columnElement.querySelector(selector.contentColumnSelector);
            if (!contentElement) throw new Error('Content element not found');

            const articleElements = contentElement.querySelectorAll(selector.articlesSelector);
            const mainArticlesContents: MainArticleContentDTO[] = [];

            articleElements.forEach(node => {
                const article = getMainArticleContent(node, selector);
                mainArticlesContents.push(article);
            });

            return mainArticlesContents;
        }, selectors);
    }

    private async extractArticleDetails(page: Page, selectors: JournalSelector['articlePage']): Promise<DetailArticleContentDTO> {
        const articleDetails = await page.evaluate((selector) => {
            console.log('Chegou na extração de detalhes do artigo');
            const subtitle = document.querySelector(selector.subtitleSelector)?.textContent || 'No Subtitle';
            const createdAt = document.querySelector(selector.createdAtSelector)?.textContent || 'No Creation Date';
            return { subtitle, createdAt };
        }, selectors);
        return articleDetails;
    }
}

export const articleService = new ArticleService(pageService);