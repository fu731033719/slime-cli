import { Command } from 'commander';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { SkillManager } from '../skills/skill-manager';
import { PathResolver } from '../utils/path-resolver';

export function registerSkillCommand(program: Command): void {
  const skillCmd = program.command('skill').description('manage Slime skills');

  skillCmd.command('list').description('list available skills').action(async () => {
    await listSkills();
  });

  skillCmd.command('info <name>').description('show skill details').action(async (name: string) => {
    await showSkillInfo(name);
  });

  skillCmd
    .command('install <package>')
    .description('install a skill package from npm')
    .option('-g, --global', 'install globally')
    .action(async (packageName: string, options: { global?: boolean }) => {
      await installSkill(packageName, options.global);
    });

  skillCmd
    .command('install-github <repo>')
    .description('clone a skill from GitHub in owner/repo form')
    .action(async (repo: string) => {
      await installGithubSkill(repo);
    });

  skillCmd
    .command('remove <name>')
    .description('remove an installed local skill')
    .option('-f, --force', 'remove without prompt')
    .option('--npm', 'remove an npm skill package')
    .action(async (name: string, options: { force?: boolean; npm?: boolean }) => {
      await removeSkill(name, options);
    });
}

async function listSkills(): Promise<void> {
  const manager = new SkillManager();
  await manager.loadSkills();
  const skills = manager.getAllSkills();

  if (skills.length === 0) {
    Logger.info(`No skills found in ${PathResolver.getSkillsPath()}`);
    return;
  }

  Logger.title('Available Skills');
  for (const skill of skills) {
    Logger.info(`${skill.metadata.name} - ${skill.metadata.description}`);
  }
}

async function showSkillInfo(name: string): Promise<void> {
  const manager = new SkillManager();
  await manager.loadSkills();
  const skill = manager.getSkill(name);

  if (!skill) {
    Logger.error(`Skill "${name}" not found.`);
    process.exit(1);
  }

  Logger.title(`Skill: ${skill.metadata.name}`);
  Logger.info(`Description: ${skill.metadata.description}`);
  if (skill.metadata.argumentHint) {
    Logger.info(`Arguments: ${skill.metadata.argumentHint}`);
  }
  Logger.info(`File: ${skill.filePath}`);
  Logger.info('');
  console.log(skill.content);
}

async function installSkill(packageName: string, global?: boolean): Promise<void> {
  const normalized = !packageName.includes('/') && !packageName.startsWith('@slime-skills/')
    ? `@slime-skills/${packageName}`
    : packageName;
  const command = global ? `npm install -g ${normalized}` : `npm install ${normalized}`;

  Logger.info(`Running: ${command}`);
  execSync(command, { stdio: 'inherit', cwd: process.cwd() });
  Logger.success(`Installed ${normalized}`);
}

async function installGithubSkill(repo: string): Promise<void> {
  const match = repo.match(/^([^/]+)\/([^/]+)$/);
  if (!match) {
    Logger.error('Expected GitHub repo in owner/repo format.');
    process.exit(1);
  }

  const [, owner, repoName] = match;
  const skillsPath = PathResolver.getSkillsPath();
  PathResolver.ensureDir(skillsPath);
  const target = path.join(skillsPath, repoName);

  if (fs.existsSync(target)) {
    Logger.error(`Target already exists: ${target}`);
    process.exit(1);
  }

  execSync(`git clone https://github.com/${owner}/${repoName}.git "${target}"`, {
    stdio: 'inherit',
    cwd: skillsPath,
  });
  Logger.success(`Installed skill repo into ${target}`);
}

async function removeSkill(name: string, options: { force?: boolean; npm?: boolean }): Promise<void> {
  if (options.npm) {
    const normalized = !name.includes('/') && !name.startsWith('@slime-skills/')
      ? `@slime-skills/${name}`
      : name;
    execSync(`npm uninstall ${normalized}`, { stdio: 'inherit', cwd: process.cwd() });
    Logger.success(`Removed npm package ${normalized}`);
    return;
  }

  const manager = new SkillManager();
  await manager.loadSkills();
  const skill = manager.getSkill(name);
  if (!skill) {
    Logger.error(`Skill "${name}" not found.`);
    process.exit(1);
  }

  const skillDir = path.dirname(skill.filePath);
  if (!options.force) {
    Logger.info(`Removing ${skillDir}`);
  }
  fs.rmSync(skillDir, { recursive: true, force: true });
  Logger.success(`Removed skill ${name}`);
}
