import { Logger } from '../utils/logger';
import { FeishuConfig } from './types';

export class FeishuBot {
  constructor(private readonly config: FeishuConfig) {}

  async start(): Promise<void> {
    Logger.warning('Feishu bot support is in a lightweight repair mode.');
    Logger.info(`Configured appId: ${this.config.appId}`);
    Logger.info(`Aliases: ${(this.config.botAliases || []).join(', ') || '(none)'}`);
  }

  async destroy(): Promise<void> {
    Logger.info('Feishu bot stopped.');
  }
}
