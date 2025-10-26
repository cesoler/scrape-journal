import { Browser, Page } from "puppeteer";
import { JournalSelector } from "../../constants/Selectors";
import { AiArticleSuggestionDTO, AvailableColumnCategory, CompleteArticleDTO, DetailArticleContentDTO, MainArticleContentDTO } from "../../models/JournalModel";
import { IPageService } from "../pageService/IPageService";
import { pageService } from "../pageService/PageService";
import { parseJsonToAiArticleSuggestionDTO } from "../../utils/Parser";

class ArticleService {
    constructor(private pageService: IPageService = pageService) {}

    async scrapeArticleList(browser: Browser, url: string, selectors: JournalSelector['mainPage']): Promise<MainArticleContentDTO[]> {
        const page = await this.pageService.setupPage(browser, url, selectors.contentColumnSelector);
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        const articles = await this.extractArticlesFromPage(page, selectors);
        await this.pageService.closePage(page);
        return articles;
    }

    async scrapeArticleDetails(browser: Browser, url: string, selectors: JournalSelector['articlePage']): Promise<DetailArticleContentDTO> {
        const page = await this.pageService.setupPage(browser, url, selectors.subtitleSelector);
        const articleDetails = await page.evaluate((selector) => {
            const subtitle = document.querySelector(selector.subtitleSelector)?.textContent || 'No Subtitle';
            const createdAt = document.querySelector(selector.createdAtSelector)?.textContent || 'No Creation Date';

            return {
                subtitle,
                createdAt
            };
        }, selectors);
        await this.pageService.closePage(page);
        return articleDetails;
    }

    async scrapeDetailsForList<T>(
        browser: Browser,
        baseList: T[],
        selectors: JournalSelector['articlePage'],
        urlExtractor: (item: T) => string | null
    ): Promise<({ item: T; details: DetailArticleContentDTO | null })[]> {
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
}
export const articleService = new ArticleService(pageService);