import puppeteer from "puppeteer";
import { ArticleDTO, AvailableJournalTypes } from "../models/JournalModel";
import { IJournalService } from "./IJournalService";
import { JOURNAL_SELECTORS } from "../../application/constants/Selectors";

class JournalismService implements IJournalService {

    async scrapeJournals(type: AvailableJournalTypes): Promise<ArticleDTO[]> {
        const browser = await puppeteer.launch({ headless: true });
        const mainPage = await browser.newPage();
        await mainPage.goto('https://globo.com', { waitUntil: 'networkidle2' });
        await mainPage.waitForSelector(JOURNAL_SELECTORS.mainPage.columnSelector(type));
        mainPage.on('console', msg => console.log('[LOG DO NAVEGADOR]:', msg.text()));
        
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
                    createdAt: new Date()
                });
            }
            return articles;
        }, JOURNAL_SELECTORS);

        await browser.close();
        return articlesFromMain;
    }
}

export const journalService = new JournalismService();