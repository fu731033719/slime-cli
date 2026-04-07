import Anthropic from '@anthropic-ai/sdk';
import { Message, ChatConfig, ChatResponse, ContentBlock } from '../types';
import { ToolDefinition } from '../types/tool';
import { AIProvider, StreamCallbacks } from './provider';
import { ContextDebugLogger } from '../utils/context-debug-logger';

/**
 * Anthropic Provider
 * 浣跨敤瀹樻柟 SDK 鏇夸唬 axios 鎵嬪姩璋冪敤锛屾敮鎸?streaming
 */
export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: ChatConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey!,
      baseURL: this.normalizeBaseURL(config.apiUrl!),
      timeout: 10 * 60 * 1000, // 10 鍒嗛挓锛孫pus 闀胯緭鍑洪渶瑕佽冻澶熸椂闂?
      defaultHeaders: {
        'User-Agent': 'Slime/0.1.0',
        'x-stainless-lang': undefined as any,
        'x-stainless-package-version': undefined as any,
        'x-stainless-os': undefined as any,
        'x-stainless-arch': undefined as any,
        'x-stainless-runtime': undefined as any,
        'x-stainless-runtime-version': undefined as any,
      },
    });
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 8192;
  }

  /**
   * 鏍囧噯鍖?base URL锛堝幓鎺夋湯灏剧殑 /v1/messages 绛夎矾寰勶級
   */
  private normalizeBaseURL(url: string): string {
    return url.replace(/\/v1\/messages\/?$/, '').replace(/\/v1\/?$/, '');
  }

  /**
   * 杞崲娑堟伅涓?Anthropic 鏍煎紡
   */
  private transformMessages(messages: Message[]): { system?: string; messages: Anthropic.MessageParam[] } {
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const systemPrompt = systemMessages.map(msg => typeof msg.content === 'string' ? msg.content : '').join('\n\n');

    const nonSystemMessages = messages.filter(msg => msg.role !== 'system');
    const transformedMessages: Anthropic.MessageParam[] = [];
    let pendingToolResults: Anthropic.ToolResultBlockParam[] = [];

    const flushToolResults = () => {
      if (pendingToolResults.length === 0) return;
      
      // 鍏堟敹闆嗘墍鏈?tool_result blocks锛屽啀鏀堕泦鎵€鏈?image blocks
      // Anthropic API 瑕佹眰 tool_result 蹇呴』鍦ㄥ墠闈?
      const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];
      const imageBlocks: Anthropic.ImageBlockParam[] = [];
      
      for (const toolResult of pendingToolResults) {
        if (Array.isArray(toolResult.content)) {
          // 鍒嗙 text 鍜?image blocks
          const textBlocks = toolResult.content.filter((b: any) => b.type === 'text') as Anthropic.TextBlockParam[];
          const images = toolResult.content.filter((b: any) => b.type === 'image') as Anthropic.ImageBlockParam[];
          
          // tool_result 鍙繚鐣?text
          if (textBlocks.length > 0) {
            toolResultBlocks.push({
              type: 'tool_result',
              tool_use_id: toolResult.tool_use_id,
              content: textBlocks.length === 1 && typeof textBlocks[0].text === 'string' 
                ? textBlocks[0].text 
                : textBlocks as any
            });
          } else {
            toolResultBlocks.push({
              type: 'tool_result',
              tool_use_id: toolResult.tool_use_id,
              content: ''
            });
          }
          
          // 鏀堕泦鍥剧墖锛岀◢鍚庣粺涓€娣诲姞
          imageBlocks.push(...images);
        } else {
          toolResultBlocks.push(toolResult);
        }
      }
      
      // 鍏抽敭淇锛氬厛娣诲姞鎵€鏈?tool_result锛屽啀娣诲姞鎵€鏈?image
      const contentBlocks: (Anthropic.ToolResultBlockParam | Anthropic.ImageBlockParam)[] = [
        ...toolResultBlocks,
        ...imageBlocks
      ];
      
      transformedMessages.push({
        role: 'user',
        content: contentBlocks
      });
      pendingToolResults = [];
    };

    for (const msg of nonSystemMessages) {
      if (msg.role === 'tool') {
        if (!msg.tool_call_id) continue;
        
        const content = Array.isArray(msg.content)
          ? msg.content.map(block =>
              block.type === 'text'
                ? { type: 'text' as const, text: block.text }
                : { type: 'image' as const, source: block.source }
            )
          : msg.content || '';
        
        pendingToolResults.push({
          type: 'tool_result',
          tool_use_id: msg.tool_call_id,
          content
        });
        continue;
      }

      flushToolResults();

      if (msg.role === 'assistant') {
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          const blocks: (Anthropic.TextBlockParam | Anthropic.ToolUseBlockParam)[] = [];
          if (msg.content && typeof msg.content === 'string' && msg.content.trim()) {
            blocks.push({ type: 'text', text: msg.content });
          }
          for (const toolCall of msg.tool_calls) {
            let input: Record<string, unknown> = {};
            try {
              input = JSON.parse(toolCall.function.arguments || '{}');
            } catch {
              input = {};
            }
            blocks.push({
              type: 'tool_use',
              id: toolCall.id,
              name: toolCall.function.name,
              input
            });
          }
          transformedMessages.push({ role: 'assistant', content: blocks });
        } else {
          // 澶勭悊绾枃鏈垨 ContentBlock[] 鐨勬儏鍐?
          if (typeof msg.content === 'string' && msg.content.trim()) {
            transformedMessages.push({ role: 'assistant', content: msg.content });
          } else if (Array.isArray(msg.content) && msg.content.length > 0) {
            // 澶勭悊 ContentBlock[] 鐨勬儏鍐碉紙鍖呭惈鍥剧墖锛?
            const blocks = msg.content.map(block =>
              block.type === 'text'
                ? { type: 'text' as const, text: block.text }
                : { type: 'image' as const, source: block.source }
            );
            transformedMessages.push({ role: 'assistant', content: blocks });
          }
        }
      } else if (msg.role === 'user') {
        if (Array.isArray(msg.content)) {
          const blocks = msg.content.map(block =>
            block.type === 'text'
              ? { type: 'text' as const, text: block.text }
              : { type: 'image' as const, source: block.source }
          );
          transformedMessages.push({ role: 'user', content: blocks });
        } else {
          transformedMessages.push({ role: 'user', content: msg.content || '' });
        }
      }
    }

    flushToolResults();

    return {
      system: systemPrompt || undefined,
      messages: transformedMessages
    };
  }

  /**
   * 杞崲宸ュ叿瀹氫箟涓?Anthropic 鏍煎紡
   */
  private transformTools(tools: ToolDefinition[]): Anthropic.Tool[] {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters as Anthropic.Tool.InputSchema
    }));
  }

  /**
   * 浠?Anthropic 鍝嶅簲涓彁鍙栫粺涓€鏍煎紡
   */
  private parseResponse(response: Anthropic.Message): ChatResponse {
    let textContent: string | null = null;
    let toolCalls: ChatResponse['toolCalls'] = undefined;

    for (const block of response.content) {
      if (block.type === 'text') {
        textContent = block.text;
      } else if (block.type === 'tool_use') {
        if (!toolCalls) toolCalls = [];
        toolCalls.push({
          id: block.id,
          type: 'function',
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input)
          }
        });
      }
    }

    // 鎻愬彇 token 鐢ㄩ噺
    const usage = response.usage ? {
      promptTokens: response.usage.input_tokens ?? 0,
      completionTokens: response.usage.output_tokens ?? 0,
      totalTokens: (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0),
    } : undefined;

    return { content: textContent, toolCalls, usage };
  }

  /**
   * 鏅€氳皟鐢?
   */
  async chat(messages: Message[], tools?: ToolDefinition[]): Promise<ChatResponse> {
    const { system, messages: transformed } = this.transformMessages(messages);

    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: this.model,
      messages: transformed,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    };

    if (system) params.system = system;
    if (tools && tools.length > 0) params.tools = this.transformTools(tools);

    const response = await this.client.messages.create(params);
    return this.parseResponse(response);
  }

  /**
   * 娴佸紡璋冪敤
   */
  async chatStream(messages: Message[], tools?: ToolDefinition[], callbacks?: StreamCallbacks): Promise<ChatResponse> {
    const { system, messages: transformed } = this.transformMessages(messages);

    const params: Anthropic.MessageCreateParamsStreaming = {
      model: this.model,
      messages: transformed,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      stream: true,
    };

    if (system) params.system = system;
    if (tools && tools.length > 0) params.tools = this.transformTools(tools);

    try {
      // [CONTEXT_DEBUG] SDK 璋冪敤鍓嶏細璁板綍瀹屾暣鐨勮姹傚弬鏁?
      ContextDebugLogger.dumpSdkBoundary('before', undefined, {
        baseURL: this.client.baseURL,
        params
      });

      const stream = this.client.messages.stream(params);

      // 閫?token 鍥炶皟鏂囨湰
      stream.on('text', (text) => {
        callbacks?.onText?.(text);
      });

      // 绛夊緟瀹屾暣鍝嶅簲
      const finalMessage = await stream.finalMessage();

      // [CONTEXT_DEBUG] SDK 璋冪敤鍚庯細璁板綍瀹屾暣鐨勫搷搴?
      ContextDebugLogger.dumpSdkBoundary('after', undefined, { response: finalMessage });

      const result = this.parseResponse(finalMessage);
      callbacks?.onComplete?.(result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callbacks?.onError?.(err);
      throw err;
    }
  }
}

