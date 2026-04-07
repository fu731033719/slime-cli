import { Logger } from '../utils/logger';
import { WeixinConfig } from './types';

export class WeixinBot {
  constructor(private readonly config: WeixinConfig) {}

  async start(): Promise<void> {
    Logger.warning('Weixin bot support is in a lightweight repair mode.');
    Logger.info(`Configured baseUrl: ${this.config.baseUrl}`);
  }

  destroy(): void {
    Logger.info('Weixin bot stopped.');
  }
}
