import { ChatConfig, ChatResponse, Message } from '../types';
import { ToolDefinition } from '../types/tool';
import { AIProvider, StreamCallbacks } from '../providers/provider';
import { AnthropicProvider } from '../providers/anthropic-provider';
import { OpenAIProvider } from '../providers/openai-provider';
import { ConfigManager } from './config';

type ProviderKind = 'openai' | 'anthropic' | 'deepseek' | 'minimax';

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
    if (
      config.provider === 'anthropic' ||
      config.provider === 'openai' ||
      config.provider === 'deepseek' ||
      config.provider === 'minimax'
    ) {
      return config.provider;
    }

    const apiUrl = (config.apiUrl || '').toLowerCase();
    const model = (config.model || '').toLowerCase();
    if (apiUrl.includes('anthropic') || apiUrl.includes('claude') || model.includes('claude')) {
      return 'anthropic';
    }
    if (apiUrl.includes('deepseek') || model.includes('deepseek')) {
      return 'deepseek';
    }
    if (apiUrl.includes('minimax') || apiUrl.includes('minimaxi') || model.includes('minimax')) {
      return 'minimax';
    }
    return 'openai';
  }

  private defaultApiUrl(provider: ProviderKind): string {
    switch (provider) {
      case 'anthropic':
        return 'https://api.anthropic.com/v1/messages';
      case 'deepseek':
        return 'https://api.deepseek.com/v1';
      case 'minimax':
        return 'https://api.minimaxi.com/v1';
      default:
        return 'https://api.openai.com/v1/chat/completions';
    }
  }

  private defaultModel(provider: ProviderKind): string {
    switch (provider) {
      case 'anthropic':
        return 'claude-3-5-sonnet-latest';
      case 'deepseek':
        return 'deepseek-chat';
      case 'minimax':
        return 'MiniMax-M2.7';
      default:
        return 'gpt-4o-mini';
    }
  }
}
