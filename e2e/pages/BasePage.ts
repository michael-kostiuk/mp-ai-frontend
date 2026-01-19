import { Page, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async waitForElement(selector: string) {
    await this.page.waitForSelector(selector, { state: 'visible' });
  }

  async clickElement(selector: string) {
    await this.page.click(selector);
  }

  async fillInput(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  async waitForText(text: string) {
    await this.page.waitForSelector(`text=${text}`);
  }

  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  async screenshotOnFailure(testName: string) {
    const timestamp = Date.now();
    await this.page.screenshot({
      path: `test-results/screenshots/${testName}_${timestamp}.png`,
      fullPage: true
    });
  }
}
