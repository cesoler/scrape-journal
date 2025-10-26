import { Browser } from "puppeteer";

export interface IBrowserService {
    startBrowser(): Promise<Browser>;
    closeBrowser(): Promise<void>;
    getBrowserInstance(): Browser | null;
}