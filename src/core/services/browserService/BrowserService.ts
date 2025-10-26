import puppeteer, { Browser, Page } from "puppeteer";
import { IBrowserService } from "./IBrowserService";

class BrowserService implements IBrowserService {
  private browser: Browser | null = null;

  public async startBrowser(): Promise<Browser> {
    this.browser = await puppeteer.launch({ headless: true });
    return this.browser;
  }

  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  public getBrowserInstance(): Browser | null {
    return this.browser;
  }
}
export const browserService = new BrowserService();
