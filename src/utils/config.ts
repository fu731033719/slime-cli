import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';
import { ChatConfig } from '../types';

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '.env', quiet: true });

type SupportedProvider = 'openai' | 'anthropic' | 'deepseek' | 'minimax';

const PROVIDER_DEFAULTS: Record<SupportedProvider, { apiUrl: string; model: string }> = {
  openai: {
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
  },
  anthropic: {
    apiUrl: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-sonnet-latest',
  },
  deepseek: {
    apiUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  },
  minimax: {
    apiUrl: 'https://api.minimaxi.com/v1',
    model: 'MiniMax-M2.7',
  },
};

export class ConfigManager {
  private static resolvedDir: string | null = null;

  private static mergeConfig(base: ChatConfig, override?: Partial<ChatConfig>): ChatConfig {
    if (!override) {
      return base;
    }

    return {
      ...base,
      ...override,
      feishu: {
        ...(base.feishu || {}),
        ...(override.feishu || {}),
      },
      catscompany: {
        ...(base.catscompany || {}),
        ...(override.catscompany || {}),
      },
      weixin: {
        ...(base.weixin || {}),
        ...(override.weixin || {}),
      },
    };
  }

  private static resolveConfigDir(): string {
    if (this.resolvedDir) {
      return this.resolvedDir;
    }

    const preferred = process.env.SLIME_CONFIG_DIR || path.join(os.homedir(), '.slime');
    const fallback = path.resolve('.slime');

    for (const candidate of [preferred, fallback]) {
      try {
        fs.mkdirSync(candidate, { recursive: true });
        this.resolvedDir = candidate;
        return candidate;
      } catch {
        // try next candidate
      }
    }

    throw new Error('Unable to create a writable Slime config directory.');
  }

  private static getConfigFilePath(): string {
    return path.join(this.resolveConfigDir(), 'config.json');
  }

  private static loadUserConfigFile(): Partial<ChatConfig> {
    const filePath = this.getConfigFilePath();
    if (!fs.existsSync(filePath)) {
      return {};
    }

    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return {};
    }
  }

  static getConfig(): ChatConfig {
    return this.mergeConfig(this.getDefaultConfig(), this.loadUserConfigFile());
  }

  static saveConfig(config: ChatConfig): void {
    const filePath = this.getConfigFilePath();
    const merged = this.mergeConfig(this.loadUserConfigFile() as ChatConfig, config);
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
  }

  static getDefaultConfig(): ChatConfig {
    const envProvider = (process.env.GAUZ_LLM_PROVIDER || '').trim().toLowerCase();
    const rawApiUrl = process.env.GAUZ_LLM_API_BASE;
    const rawModel = process.env.GAUZ_LLM_MODEL;

    let provider: SupportedProvider = 'openai';
    if (envProvider === 'openai' || envProvider === 'anthropic' || envProvider === 'deepseek' || envProvider === 'minimax') {
      provider = envProvider;
    } else {
      const apiUrlHint = (rawApiUrl || '').toLowerCase();
      const modelHint = (rawModel || '').toLowerCase();
      if (apiUrlHint.includes('anthropic') || apiUrlHint.includes('claude') || modelHint.includes('claude')) {
        provider = 'anthropic';
      } else if (apiUrlHint.includes('deepseek') || modelHint.includes('deepseek')) {
        provider = 'deepseek';
      } else if (apiUrlHint.includes('minimax') || apiUrlHint.includes('minimaxi') || modelHint.includes('minimax')) {
        provider = 'minimax';
      }
    }

    const defaults = PROVIDER_DEFAULTS[provider];
    const apiUrl = rawApiUrl || defaults.apiUrl;
    const model = rawModel || defaults.model;

    return {
      apiUrl,
      apiKey: process.env.GAUZ_LLM_API_KEY,
      model,
      temperature: 0.7,
      provider,
      feishu: {
        appId: process.env.FEISHU_APP_ID,
        appSecret: process.env.FEISHU_APP_SECRET,
        botOpenId: process.env.FEISHU_BOT_OPEN_ID,
        botAliases: (process.env.FEISHU_BOT_ALIASES || '史莱姆,slime')
          .split(',')
          .map(item => item.trim())
          .filter(Boolean),
      },
      catscompany: {
        serverUrl: process.env.CATSCOMPANY_SERVER_URL,
        apiKey: process.env.CATSCOMPANY_API_KEY,
        httpBaseUrl: process.env.CATSCOMPANY_HTTP_BASE_URL,
      },
      weixin: {
        token: process.env.WEIXIN_TOKEN,
        baseUrl: process.env.WEIXIN_BASE_URL,
        cdnBaseUrl: process.env.WEIXIN_CDN_BASE_URL,
      },
      logUpload: {
        enabled: process.env.LOG_UPLOAD_ENABLED === 'true',
        serverUrl: process.env.LOG_UPLOAD_SERVER_URL,
        intervalMinutes: parseInt(process.env.LOG_UPLOAD_INTERVAL_MINUTES || '30', 10),
      },
    };
  }
}
