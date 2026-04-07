import { ChatConfig, ChatResponse, Message } from '../types';
import { ToolDefinition } from '../types/tool';
import { AIProvider, StreamCallbacks } from '../providers/provider';
import { AnthropicProvider } from '../providers/anthropic-provider';
import { OpenAIProvider } from '../providers/openai-provider';
import { ConfigManager } from './config';

type ProviderKind = 'openai' | 'anthropic';

export class AIService {
  private readonly config: ChatConfig;
  private readonly provider: AIProvider;

  constructor(overrides?: Partial<ChatConfig>) {
    this.config = this.resolveConfig({
      ...ConfigManager.getConfig(),
      ...(overrides || {}),
    });
    this.provider = this.createProvider(this.config);
  }

  async chat(messages: Message[], tools?: ToolDefinition[]): Promise<ChatResponse> {
    if (!this.config.apiKey) {
      throw new Error('API key is not configured. Run `slime config` first.');
    }
    return this.provider.chat(messages, tools);
  }

  async chatStream(
    messages: Message[],
    tools?: ToolDefinition[],
    callbacks?: StreamCallbacks,
  ): Promise<ChatResponse> {
    if (!this.config.apiKey) {
      throw new Error('API key is not configured. Run `slime config` first.');
    }
    return this.provider.chatStream(messages, tools, callbacks);
  }

  private createProvider(config: ChatConfig): AIProvider {
    return config.provider === 'anthropic'
      ? new AnthropicProvider(config)
      : new OpenAIProvider(config);
  }

  private resolveConfig(config: ChatConfig): ChatConfig {
    const provider = this.resolveProvider(config);
    return {
      ...config,
      provider,
      apiUrl: config.apiUrl || this.defaultApiUrl(provider),
      model: config.model || this.defaultModel(provider),
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 8192,
    };
  }

  private resolveProvider(config: Partial<ChatConfig>): ProviderKind {
    if (config.provider === 'anthropic' || config.provider === 'openai') {
      return config.provider;
    }

    const apiUrl = (config.apiUrl || '').toLowerCase();
    const model = (config.model || '').toLowerCase();
    if (apiUrl.includes('anthropic') || apiUrl.includes('claude') || model.includes('claude')) {
      return 'anthropic';
    }
    return 'openai';
  }

  private defaultApiUrl(provider: ProviderKind): string {
    return provider === 'anthropic'
      ? 'https://api.anthropic.com/v1/messages'
      : 'https://api.openai.com/v1/chat/completions';
  }

  private defaultModel(provider: ProviderKind): string {
    return provider === 'anthropic' ? 'claude-3-5-sonnet-latest' : 'gpt-4o-mini';
  }
}
