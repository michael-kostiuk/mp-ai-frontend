import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Global setup: Configuring test environment');
  console.log('Backend URL: http://be:8000');
  console.log('Base URL:', config.projects[0].use.baseURL);
}

export default globalSetup;
