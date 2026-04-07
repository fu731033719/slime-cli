import * as readline from 'readline';
import { AIService } from '../utils/ai-service';
import { Logger } from '../utils/logger';
import { CommandOptions, Message } from '../types';
import { SkillManager } from '../skills/skill-manager';
import { PromptManager } from '../utils/prompt-manager';

async function buildInitialMessages(skillName?: string): Promise<Message[]> {
  const messages: Message[] = [];
  const systemPrompt = await PromptManager.buildSystemPrompt();

  if (systemPrompt.trim()) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  if (!skillName) {
    return messages;
  }

  const skillManager = new SkillManager();
  await skillManager.loadSkills();
  const skill = skillManager.getSkill(skillName);

  if (skill) {
    messages.push({
      role: 'system',
      content: `Active skill: ${skill.metadata.name}\n\n${skill.content}`,
    });
    Logger.info(`Bound skill: ${skill.metadata.name}`);
  } else {
    Logger.warning(`Skill "${skillName}" was not found. Continuing without it.`);
  }

  return messages;
}

async function requestAssistantReply(aiService: AIService, messages: Message[]): Promise<string> {
  const response = await aiService.chat(messages);
  return response.content || '';
}

async function runSingleMessage(options: CommandOptions): Promise<void> {
  const aiService = new AIService();
  const messages = await buildInitialMessages(options.skill);
  const userMessage = options.message?.trim() || '';

  if (!userMessage) {
    Logger.warning('No message provided.');
    return;
  }

  messages.push({ role: 'user', content: userMessage });
  const reply = await requestAssistantReply(aiService, messages);
  messages.push({ role: 'assistant', content: reply });
  console.log(`\n${reply}\n`);
}

async function runInteractiveChat(options: CommandOptions): Promise<void> {
  const aiService = new AIService();
  const messages = await buildInitialMessages(options.skill);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });
  let pendingReply = false;
  let exitAfterReply = false;

  const finishSession = () => {
    console.log('');
    process.exit(0);
  };

  const promptNext = () => {
    if (!exitAfterReply) {
      rl.prompt();
    }
  };

  const handleUserInput = async (line: string) => {
    const input = line.trim();
    if (!input) {
      promptNext();
      return;
    }

    if (pendingReply) {
      Logger.warning('Still waiting for the previous reply. Please give it a second.');
      promptNext();
      return;
    }

    if (input === '/exit' || input === 'exit' || input === 'quit') {
      if (pendingReply) {
        exitAfterReply = true;
        return;
      }
      rl.close();
      return;
    }

    if (input === '/clear') {
      const preserved = messages.filter(message => message.role === 'system');
      messages.length = 0;
      messages.push(...preserved);
      Logger.info('Conversation history cleared.');
      promptNext();
      return;
    }

    if (input === '/history') {
      const visible = messages.filter(message => message.role !== 'system');
      console.log(`\n${JSON.stringify(visible, null, 2)}\n`);
      promptNext();
      return;
    }

    pendingReply = true;
    rl.pause();
    Logger.startProgress('Waiting for Slime to reply...');

    try {
      messages.push({ role: 'user', content: input });
      const reply = await requestAssistantReply(aiService, messages);
      messages.push({ role: 'assistant', content: reply });
      Logger.stopProgress();
      console.log(`\n${reply}\n`);
    } catch (error: any) {
      Logger.stopProgress(false, `Chat failed: ${error.message}`);
    } finally {
      pendingReply = false;
      rl.resume();
    }

    if (exitAfterReply) {
      rl.close();
      return;
    }

    promptNext();
  };

  Logger.info('Interactive chat started. Use /exit to quit, /clear to reset history, /history to inspect messages.');
  rl.prompt();

  rl.on('line', (line: string) => {
    void handleUserInput(line);
  });

  rl.on('close', () => {
    if (pendingReply) {
      exitAfterReply = true;
      return;
    }
    finishSession();
  });
}

export async function chatCommand(options: CommandOptions): Promise<void> {
  if (options.message) {
    await runSingleMessage(options);
    return;
  }

  await runInteractiveChat(options);
}
