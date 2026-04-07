#!/usr/bin/env node

import { Command } from 'commander';
import { Logger } from './utils/logger';
import { chatCommand } from './commands/chat';
import { configCommand } from './commands/config';
import { registerSkillCommand } from './commands/skill';
import { feishuCommand } from './commands/feishu';

async function main(): Promise<void> {
  const program = new Command();

  Logger.brand();

  program
    .name('slime')
    .description('Slime CLI - your slime coding assistant')
    .version('0.1.0')
    .option('-s, --skill <name>', 'bind a skill before entering chat');

  program
    .command('chat')
    .description('start a chat session with Slime')
    .option('-i, --interactive', 'use interactive chat mode')
    .option('-m, --message <message>', 'send a single message')
    .option('-s, --skill <name>', 'bind a skill for this session')
    .action(chatCommand);

  program
    .command('config')
    .description('configure Slime model settings')
    .action(configCommand);

  program
    .command('feishu')
    .description('start the Feishu bot bridge')
    .action(feishuCommand);

  program
    .command('catscompany')
    .description('start the CatsCompany bot bridge')
    .action(async () => {
      const { catscompanyCommand } = await import('./commands/catscompany');
      await catscompanyCommand();
    });

  program
    .command('weixin')
    .description('start the Weixin bot bridge')
    .action(async () => {
      const { weixinCommand } = await import('./commands/weixin');
      await weixinCommand();
    });

  program
    .command('dashboard')
    .description('start Slime Dashboard')
    .option('-p, --port <port>', 'dashboard port', '3800')
    .action(async (options: { port?: string }) => {
      const { dashboardCommand } = await import('./commands/dashboard');
      await dashboardCommand(options);
    });

  registerSkillCommand(program);

  program.action(() => {
    const opts = program.opts<{ skill?: string }>();
    void chatCommand({ interactive: true, skill: opts.skill });
  });

  await program.parseAsync(process.argv);
}

void main();
