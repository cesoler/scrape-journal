import puppeteer, { Browser, Page } from "puppeteer";
import { IBrowserService } from "./IBrowserService";

class BrowserService implements IBrowserService {
  private browser: Browser | null = null;

  public async startBrowser(): Promise<Browser> {
    this.browser = await puppeteer.launch({ headless: true });
    return this.browser;
  }

  public async startPage(url: string): Promise<Page> {
    if (!this.browser) {
      await this.startBrowser();
    }
    const mainPage = await this.browser!.newPage();
    await mainPage.goto(url, { waitUntil: 'networkidle2' });
    return mainPage;
  }

  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const browserService = new BrowserService();
