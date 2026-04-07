import axios from 'axios';
import { Message, ChatConfig, ChatResponse } from '../types';
import { ToolDefinition } from '../types/tool';
import { AIProvider, StreamCallbacks } from './provider';
import { ContextDebugLogger } from '../utils/context-debug-logger';

export class OpenAIProvider implements AIProvider {
  private apiUrl: string;
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: ChatConfig) {
    this.apiUrl = this.normalizeApiUrl(config.apiUrl!);
    this.apiKey = config.apiKey!;
    this.model = config.model || 'gpt-4o';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 8192;
  }

  private normalizeApiUrl(apiUrl: string): string {
    const trimmed = apiUrl.trim().replace(/\/+$/, '');
    if (trimmed.endsWith('/chat/completions') || trimmed.endsWith('/v1/messages')) {
      return trimmed;
    }
    if (trimmed.endsWith('/v1')) {
      return `${trimmed}/chat/completions`;
    }
    return `${trimmed}/chat/completions`;
  }

  private buildRequestBody(messages: Message[], tools?: ToolDefinition[], stream = false): any {
    const sanitizedMessages = messages.map(message => {
      if (Array.isArray(message.content)) {
        return {
          ...message,
          content: message.content.map(block =>
            block.type === 'text'
              ? { type: 'text', text: block.text }
              : { type: 'image_url', image_url: { url: `data:${block.source.media_type};base64,${block.source.data}` } }
          ),
        };
      }
      return { ...message, content: message.content ?? '' };
    });

    const body: any = {
      model: this.model,
      messages: sanitizedMessages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      stream,
    };

    if (stream) {
      body.stream_options = { include_usage: true };
    }

    if (tools && tools.length > 0) {
      body.tools = tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));
    }

    return body;
  }

  private extractTextContent(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map(item => {
          if (typeof item === 'string') {
            return item;
          }

          if (item && typeof item === 'object' && 'text' in item) {
            const text = (item as { text?: unknown }).text;
            return typeof text === 'string' ? text : '';
          }

          return '';
        })
        .filter(Boolean)
        .join('');
    }

    return '';
  }

  private sanitizeVisibleContent(content: unknown, reasoningContent?: unknown): string {
    let text = this.extractTextContent(content);

    if (!text && typeof reasoningContent === 'string') {
      return '';
    }

    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async chat(messages: Message[], tools?: ToolDefinition[]): Promise<ChatResponse> {
    const body = this.buildRequestBody(messages, tools, false);
    ContextDebugLogger.dumpSdkBoundary('before', undefined, {
      apiUrl: this.apiUrl,
      body,
    });

    const response = await axios.post(this.apiUrl, body, { headers: this.headers });
    const message = response.data.choices[0].message;
    const usage = response.data.usage;
    const visibleContent = this.sanitizeVisibleContent(message.content, message.reasoning_content);

    ContextDebugLogger.dumpSdkBoundary('after', undefined, {
      response: response.data,
    });

    return {
      content: visibleContent || null,
      toolCalls: message.tool_calls,
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens ?? 0,
            completionTokens: usage.completion_tokens ?? 0,
            totalTokens: usage.total_tokens ?? 0,
          }
        : undefined,
    };
  }

  async chatStream(
    messages: Message[],
    tools?: ToolDefinition[],
    callbacks?: StreamCallbacks,
  ): Promise<ChatResponse> {
    const body = this.buildRequestBody(messages, tools, true);

    ContextDebugLogger.dumpSdkBoundary('before', undefined, {
      apiUrl: this.apiUrl,
      body,
    });

    const response = await axios.post(this.apiUrl, body, {
      headers: this.headers,
      responseType: 'stream',
    });

    return new Promise<ChatResponse>((resolve, reject) => {
      let fullContent = '';
      const toolCallsMap = new Map<number, { id: string; type: 'function'; function: { name: string; arguments: string } }>();
      let buffer = '';
      let streamUsage: ChatResponse['usage'] = undefined;

      const stream = response.data;

      stream.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) {
            continue;
          }

          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.usage) {
              streamUsage = {
                promptTokens: parsed.usage.prompt_tokens ?? 0,
                completionTokens: parsed.usage.completion_tokens ?? 0,
                totalTokens: parsed.usage.total_tokens ?? 0,
              };
            }

            const delta = parsed.choices?.[0]?.delta;
            if (!delta) {
              continue;
            }

            const visibleChunk = this.sanitizeVisibleContent(delta.content, delta.reasoning_content);
            if (visibleChunk) {
              fullContent += visibleChunk;
              callbacks?.onText?.(visibleChunk);
            }

            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!toolCallsMap.has(idx)) {
                  toolCallsMap.set(idx, {
                    id: tc.id || '',
                    type: 'function',
                    function: { name: '', arguments: '' },
                  });
                }

                const existing = toolCallsMap.get(idx)!;
                if (tc.id) {
                  existing.id = tc.id;
                }
                if (tc.function?.name) {
                  existing.function.name += tc.function.name;
                }
                if (tc.function?.arguments) {
                  existing.function.arguments += tc.function.arguments;
                }
              }
            }
          } catch {
            // Ignore malformed SSE frames from upstream providers.
          }
        }
      });

      stream.on('end', () => {
        const toolCalls = toolCallsMap.size > 0 ? Array.from(toolCallsMap.values()) : undefined;

        const result: ChatResponse = {
          content: fullContent || null,
          toolCalls,
          usage: streamUsage,
        };

        ContextDebugLogger.dumpSdkBoundary('after', undefined, {
          response: result,
        });

        callbacks?.onComplete?.(result);
        resolve(result);
      });

      stream.on('error', (err: Error) => {
        callbacks?.onError?.(err);
        reject(err);
      });
    });
  }
}
