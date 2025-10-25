import { Browser, Page } from "puppeteer";

export interface IBrowserService {
    startBrowser(): Promise<Browser>;
    startPage(url: string): Promise<Page>;
    closeBrowser(): Promise<void>;
}