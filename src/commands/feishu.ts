import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config';
import { FeishuBot } from '../feishu';
import { FeishuConfig } from '../feishu/types';

export async function feishuCommand(): Promise<void> {
  const config = ConfigManager.getConfig();
  const appId = process.env.FEISHU_APP_ID || config.feishu?.appId;
  const appSecret = process.env.FEISHU_APP_SECRET || config.feishu?.appSecret;
  const botOpenId = process.env.FEISHU_BOT_OPEN_ID || config.feishu?.botOpenId;
  const botAliases = (process.env.FEISHU_BOT_ALIASES || config.feishu?.botAliases?.join(',') || '史莱姆,slime')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

  if (!appId || !appSecret) {
    Logger.error('Missing FEISHU_APP_ID or FEISHU_APP_SECRET.');
    process.exit(1);
  }

  const bot = new FeishuBot({
    appId,
    appSecret,
    botOpenId,
    botAliases,
    sessionTTL: config.feishu?.sessionTTL,
  } satisfies FeishuConfig);

  await bot.start();
}
