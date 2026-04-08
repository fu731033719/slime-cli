import Anthropic from '@anthropic-ai/sdk';
import { Message, ChatConfig, ChatResponse, ContentBlock } from '../types';
import { ToolDefinition } from '../types/tool';
import { AIProvider, StreamCallbacks } from './provider';
import { ContextDebugLogger } from '../utils/context-debug-logger';

/**
 * Anthropic Provider
 * Uses the official SDK instead of manual axios calls and supports streaming.
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
      timeout: 10 * 60 * 1000, // Allow long-running model responses.
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
   * Normalize the base URL by stripping trailing endpoint paths such as `/v1/messages`.
   */
  private normalizeBaseURL(url: string): string {
    return url.replace(/\/v1\/messages\/?$/, '').replace(/\/v1\/?$/, '');
  }

  /**
   * Convert the shared message format into Anthropic's message schema.
   */
  private transformMessages(messages: Message[]): { system?: string; messages: Anthropic.MessageParam[] } {
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const systemPrompt = systemMessages.map(msg => typeof msg.content === 'string' ? msg.content : '').join('\n\n');

    const nonSystemMessages = messages.filter(msg => msg.role !== 'system');
    const transformedMessages: Anthropic.MessageParam[] = [];
    let pendingToolResults: Anthropic.ToolResultBlockParam[] = [];

    const flushToolResults = () => {
      if (pendingToolResults.length === 0) return;
      
      // Collect tool results first, then append image blocks.
      // Anthropic expects tool_result blocks before images.
      const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];
      const imageBlocks: Anthropic.ImageBlockParam[] = [];
      
      for (const toolResult of pendingToolResults) {
        if (Array.isArray(toolResult.content)) {
          // Split text and image blocks.
          const textBlocks = toolResult.content.filter((b: any) => b.type === 'text') as Anthropic.TextBlockParam[];
          const images = toolResult.content.filter((b: any) => b.type === 'image') as Anthropic.ImageBlockParam[];
          
          // Keep only text inside tool_result content.
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
          
          // Collect images and append them after all tool_result blocks.
          imageBlocks.push(...images);
        } else {
          toolResultBlocks.push(toolResult);
        }
      }
      
      // Important ordering fix: tool_result blocks must come before images.
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
          // Handle plain text or ContentBlock[] assistant content.
          if (typeof msg.content === 'string' && msg.content.trim()) {
            transformedMessages.push({ role: 'assistant', content: msg.content });
          } else if (Array.isArray(msg.content) && msg.content.length > 0) {
            // Handle ContentBlock[] responses, including image blocks.
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
   * Convert tool definitions into Anthropic's tool schema.
   */
  private transformTools(tools: ToolDefinition[]): Anthropic.Tool[] {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters as Anthropic.Tool.InputSchema
    }));
  }

  /**
   * Convert the Anthropic response into the shared response shape.
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

    // Normalize token usage.
    const usage = response.usage ? {
      promptTokens: response.usage.input_tokens ?? 0,
      completionTokens: response.usage.output_tokens ?? 0,
      totalTokens: (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0),
    } : undefined;

    return { content: textContent, toolCalls, usage };
  }

  /**
   * Non-streaming call.
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
   * Streaming call.
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
      // [CONTEXT_DEBUG] Capture the full request before the SDK call.
      ContextDebugLogger.dumpSdkBoundary('before', undefined, {
        baseURL: this.client.baseURL,
        params
      });

      const stream = this.client.messages.stream(params);

      // Forward streamed text tokens.
      stream.on('text', (text) => {
        callbacks?.onText?.(text);
      });

      // Wait for the final assembled response.
      const finalMessage = await stream.finalMessage();

      // [CONTEXT_DEBUG] Capture the final SDK response.
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

