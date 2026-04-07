import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config';
import { CatsCompanyBot } from '../catscompany';
import { CatsCompanyConfig } from '../catscompany/types';

export async function catscompanyCommand(): Promise<void> {
  const config = ConfigManager.getConfig();
  const serverUrl = process.env.CATSCOMPANY_SERVER_URL || config.catscompany?.serverUrl;
  const apiKey = process.env.CATSCOMPANY_API_KEY || config.catscompany?.apiKey;
  const httpBaseUrl = process.env.CATSCOMPANY_HTTP_BASE_URL || config.catscompany?.httpBaseUrl;

  if (!serverUrl || !apiKey) {
    Logger.error('Missing CATSCOMPANY_SERVER_URL or CATSCOMPANY_API_KEY.');
    process.exit(1);
  }

  const bot = new CatsCompanyBot({
    serverUrl,
    apiKey,
    httpBaseUrl,
    sessionTTL: config.catscompany?.sessionTTL,
  } satisfies CatsCompanyConfig);

  await bot.start();
}
