import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface CatsClientConfig {
  serverUrl: string;
  apiKey: string;
  httpBaseUrl?: string;
}

export interface MessageContext {
  topic: string;
  senderId: string;
  text: string;
  content?: unknown;
  isGroup: boolean;
  from?: string;
  seq?: number;
}

export interface UploadResult {
  url: string;
  name: string;
  size: number;
}

export class CatsClient extends EventEmitter {
  public uid = 'slime-bot';
  public name = 'Slime';
  private sequence = 0;

  constructor(private readonly config: CatsClientConfig) {
    super();
  }

  connect(): void {
    setTimeout(() => {
      this.emit('ready', { uid: this.uid, name: this.name });
    }, 10);
  }

  disconnect(): void {
    this.emit('close');
  }

  async sendMessage(_topic: string, _text: string): Promise<number> {
    this.sequence += 1;
    return this.sequence;
  }

  sendTyping(_topic: string): void {}

  sendInfo(_topic: string, _what: string, _payload?: unknown): void {}

  async uploadFile(filePath: string, _type: 'image' | 'file' = 'file'): Promise<UploadResult> {
    const stat = fs.statSync(filePath);
    return {
      url: `file://${path.resolve(filePath)}`,
      name: path.basename(filePath),
      size: stat.size,
    };
  }

  async sendImage(topic: string, upload: UploadResult): Promise<number> {
    return this.sendMessage(topic, upload.url);
  }

  async sendFile(topic: string, upload: UploadResult): Promise<number> {
    return this.sendMessage(topic, upload.url);
  }
}
