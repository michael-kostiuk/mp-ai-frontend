import { chromium, FullConfig } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const STORAGE_STATE_PATH = fileURLToPath(new URL('./storage-state.json', import.meta.url));
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8800';
const API_CONFIG_KEY = 'apiConfig';
const API_TIMEOUT = 15000;

async function globalSetup(config: FullConfig) {
  const frontendBaseUrl = (config.projects[0]?.use?.baseURL as string | undefined) ?? 'http://localhost:8111';
  if (/mealplanner-eu\.onrender\.com/i.test(frontendBaseUrl)) {
    throw new Error('Refusing to run tests against production frontend URL');
  }

  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: frontendBaseUrl });
  const page = await context.newPage();

  await page.goto(frontendBaseUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ backendUrl, storageKey, timeoutMs }) => {
      localStorage.setItem(storageKey, JSON.stringify({ baseUrl: backendUrl, timeout: timeoutMs }));
    },
    { backendUrl: BACKEND_URL, storageKey: API_CONFIG_KEY, timeoutMs: API_TIMEOUT }
  );
  await context.storageState({ path: STORAGE_STATE_PATH });
  await browser.close();

  console.log(`Global setup complete. Frontend base: ${frontendBaseUrl}. Backend forced to: ${BACKEND_URL}`);
}

export default globalSetup;
