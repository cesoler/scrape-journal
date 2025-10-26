import { Browser } from "puppeteer";
import { JournalSelector } from "../../constants/Selectors";
import { DetailArticleContentDTO, MainArticleContentDTO } from "../../models/JournalModel";

export interface IArticleService {
    scrapeArticleList(browser: Browser, url: string, selectors: JournalSelector['mainPage']): Promise<MainArticleContentDTO[]>;
    scrapeArticleDetails(browser: Browser, url: string, selectors: JournalSelector['articlePage']): Promise<DetailArticleContentDTO>;
    scrapeDetailsForList<T>(
        browser: Browser,
        baseList: T[],
        selectors: JournalSelector['articlePage'],
        urlExtractor: (item: T) => string | null
    ): Promise<({ item: T; details: DetailArticleContentDTO | null })[]>;
}