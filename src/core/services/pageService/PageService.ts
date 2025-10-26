import { Browser, Page } from "puppeteer";
import { IPageService } from "./IPageService";

class PageService implements IPageService {
    public async startPage(browser: Browser, url: string): Promise<Page> {
        if (!browser) {
            throw new Error("Browser instance is not available");
        }
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        return page;
    }

    public async setupPage(browser: Browser, url: string, selector: string): Promise<Page> {
        const page = await this.startPage(browser, url);
        await this.interceptRequests(page);
        await this.waitForSelector(page, selector);
        return page;
    }

    public async interceptRequests(page: Page): Promise<void> {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
        if (['image', 'stylesheet', 'font', 'script'].includes(req.resourceType())) {
            req.abort();
        }
        });
    }

    public async waitForSelector(page: Page, selector: string, timeout: number = 5000): Promise<void> {
        await page.waitForSelector(selector, { timeout });
    }

    public async closePage(page: Page): Promise<void> {
        await page.close();
    }
}

export const pageService = new PageService();