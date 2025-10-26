import { CompleteArticleDTO, AvailableColumnCategory, InsideArticleContentDTO } from "../../models/JournalModel";
import { IJournalService } from "./IJournalService";
import { getSelectorsForBrowser } from "../../constants/Selectors";
import { IBrowserService } from "../browserService/IBrowserService";
import { browserService } from "../browserService/BrowserService";
import { articleService } from "../atricleService/ArticleService";


class JournalService implements IJournalService {
    constructor(private browserService: IBrowserService = browserService) {}

    async scrapeJournalColumn(columnCategory: AvailableColumnCategory): Promise<CompleteArticleDTO[]> {
        const browser = await this.browserService.startBrowser();
        const selectorsBrowser = getSelectorsForBrowser(columnCategory);

        const articleList = await articleService.scrapeArticleList(browser, 'https://globo.com', selectorsBrowser['mainPage']);

        const articleDetails: Promise<InsideArticleContentDTO>[] = articleList.map((article) => articleService.scrapeArticleDetails(browser, article.url!, selectorsBrowser['articlePage']));

        const detailResults = await Promise.allSettled(articleDetails);
        await this.browserService.closeBrowser();
        const completedArticles: CompleteArticleDTO[] = [];

        articleList.map((article, index) => {
            const result = detailResults[index];
                if (result.status === 'fulfilled' && result.value) {
                    completedArticles.push( {
                        id: index + 1,
                        title: article.title,
                        url: article.url,
                        featured: article.featured,
                        subtitle: result.value.subtitle,
                        createdAt: result.value.createdAt
                    });
                }
        });

        return completedArticles;
    }
}

export const journalService = new JournalService(browserService);