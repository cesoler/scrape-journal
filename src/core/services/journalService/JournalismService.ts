import { ArticleDTO, AvailableColumnCategory } from "../../models/JournalModel";
import { IJournalService } from "./IJournalService";
import { getSelectorsForBrowser, JournalSelector } from "../../constants/Selectors";
import { IBrowserService } from "../browserService/IBrowserService";
import { browserService } from "../browserService/BrowserService";


class JournalService implements IJournalService {
    constructor(private browserService: IBrowserService) {}

    async scrapeJournalColumn(columnCategory: AvailableColumnCategory): Promise<ArticleDTO[]> {
        const mainPage = await this.browserService.startPage('https://globo.com');

        const selectorsBrowser: JournalSelector = getSelectorsForBrowser(columnCategory);

        const articlesFromMain: ArticleDTO[] = await mainPage.evaluate((selectors) => {
            const columnArticle = document.querySelector(selectors.mainPage.contentColumnSelector);
            if (!columnArticle) return [];

            const articles: ArticleDTO[] = [];
            const articleNodes = columnArticle.querySelectorAll(selectors.mainPage.individualSelector);
            for (const article of articleNodes) {
                const linkElement = article.querySelector<HTMLAnchorElement>(selectors.mainPage.postLinkSelector)?.href || 'No Link';
                const featured = article.matches(selectors.mainPage.featuredSelector);
                const postTitle = article.querySelector(selectors.mainPage.postTitleSelector)?.textContent?.trim() || 'No Title';
                articles.push({
                    id: articles.length + 1,
                    title: postTitle,
                    url: linkElement,
                    featured: featured,
                    subtitle: 'No Subtitle',
                    createdAt: new Date().toISOString(),
                });
            }
            return articles;
        }, selectorsBrowser);

        await this.browserService.closeBrowser();
        return articlesFromMain;
    }
}

export const journalService = new JournalService(browserService);