import * as fs from 'fs';
import * as path from 'path';

export class PromptManager {
  private static promptsDir = path.join(__dirname, '../../prompts');

  static getBaseSystemPrompt(): string {
    try {
      return fs.readFileSync(path.join(this.promptsDir, 'system-prompt.md'), 'utf-8');
    } catch {
      return this.getDefaultSystemPrompt();
    }
  }

  static getBehaviorPrompt(): string {
    try {
      const content = fs.readFileSync(path.join(this.promptsDir, 'behavior.md'), 'utf-8').trim();
      return content.includes('在下方添加你的个性化设置') ? '' : content;
    } catch {
      return '';
    }
  }

  static async buildSystemPrompt(): Promise<string> {
    const basePrompt = this.getBaseSystemPrompt().trim();
    const behaviorPrompt = this.getBehaviorPrompt().trim();
    const displayName = (
      process.env.CURRENT_AGENT_DISPLAY_NAME
      || process.env.BOT_BRIDGE_NAME
      || ''
    ).trim();
    const platform = process.env.CURRENT_PLATFORM || '';
    const today = new Date().toISOString().slice(0, 10);
    const workspaceName = displayName || 'default';
    const workspacePath = `~/slime-workspace/${workspaceName}`;

    const runtimeInfo = [
      displayName ? `你在这个平台上的名字是：${displayName}` : '',
      platform ? `当前平台：${platform}` : '',
      `当前日期：${today}`,
      `你的默认工作目录是：\`${workspacePath}\``,
    ].filter(Boolean).join('\n');

    return [basePrompt, behaviorPrompt, runtimeInfo].filter(Boolean).join('\n\n');
  }

  private static getDefaultSystemPrompt(): string {
    return `你是史莱姆小助手。

你和用户交流时，保持自然、直接、可靠。

工作原则：
1. 只根据当前对话、真实上下文和当前运行时提供的能力行动。
2. 不编造自己拥有的工具、技能、记忆或已经完成的工作。
3. 先理解问题，再决定是回答、澄清还是动手处理。
4. 当前这一轮没有新信息时，不要为了显得热情而额外寒暄。`;
  }
}
