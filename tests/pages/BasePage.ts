import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

export abstract class BasePage {
    readonly page: Page;
    readonly url: string;

    constructor(page: Page, url: string) {
        this.page = page;
        this.url = url;
    }

    async navigate() {
        await this.page.goto(this.url);
    }
}
