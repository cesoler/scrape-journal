import { Browser, Page } from "puppeteer";
import { IPageService } from "./IPageService";

class PageService implements IPageService {
    private DEFAULT_TIMEOUT_THREE_HALF_SECONDS: number = 3500;

    public async startPage(browser: Browser, url: string): Promise<Page> {
        if (!browser) {
            throw new Error("Browser instance is not available");
        }
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        return page;
    }

    public async setupPage(browser: Browser, url: string, selector?: string): Promise<Page> {
        const page = await this.startPage(browser, url);
        await this.interceptRequests(page);
        if (selector) {
            await this.waitForSelector(page, selector);
        }
        page.on('console', msg => console.log('[PAGE LOG]:', msg.text()));
        return page;
    }

    public async interceptRequests(page: Page): Promise<void> {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'script'].includes(req.resourceType())) {
                req.abort();
                return;
            } 
            req.continue();
        });
    }

    public async waitForSelector(page: Page, selector: string, timeout: number = this.DEFAULT_TIMEOUT_THREE_HALF_SECONDS): Promise<void> {
        await page.waitForSelector(selector, { timeout });
    }

    public async closePage(page: Page): Promise<void> {
        await page.close();
    }

    public async pageGoto(page: Page, url: string, timeout: number = this.DEFAULT_TIMEOUT_THREE_HALF_SECONDS, waitForSelector?: string): Promise<void> {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
        if (waitForSelector) {
            await this.waitForSelector(page, waitForSelector, timeout);
        }
    }
}

export const pageService = new PageService();