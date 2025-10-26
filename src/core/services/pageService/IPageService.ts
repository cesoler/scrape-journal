import { Browser, Page } from "puppeteer";

export interface IPageService {
    startPage(browser: Browser, url: string): Promise<Page>;
    interceptRequests(page: Page): Promise<void>;
    setupPage(browser: Browser, url: string, selector: string): Promise<Page>;

    /*
    * Waits for a specific selector to appear on the page within the given timeout.
    * @param page - The Puppeteer Page instance.
    * @param selector - The CSS selector to wait for.
    * @param timeout - Maximum time to wait for the selector in milliseconds (default is 5000ms).
    */
    waitForSelector(page: Page, selector: string, timeout?: number): Promise<void>;
    closePage(page: Page): Promise<void>;
}