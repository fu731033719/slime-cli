import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { EventEmitter } from 'events';

export interface ServiceInfo {
  name: string;
  label: string;
  command: string;
  args: string[];
  status: 'stopped' | 'running' | 'error';
  pid?: number;
  startedAt?: number;
  uptime?: number;
  lastError?: string;
}

interface ManagedService {
  info: ServiceInfo;
  process?: ChildProcess;
  logs: string[];
}

const MAX_LOG_LINES = 500;

export class ServiceManager extends EventEmitter {
  private readonly services = new Map<string, ManagedService>();

  constructor(private readonly projectRoot: string) {
    super();
    this.registerBuiltinServices();
  }

  private registerBuiltinServices(): void {
    const nodeCommand = process.execPath;
    const distEntry = path.join(this.projectRoot, 'dist', 'index.js');
    const srcEntry = path.join(this.projectRoot, 'src', 'index.ts');
    const tsxBin = path.join(
      this.projectRoot,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'tsx.cmd' : 'tsx',
    );
    const hasDist = fs.existsSync(distEntry);
    const hasTsx = fs.existsSync(tsxBin);
    const command = hasDist ? nodeCommand : hasTsx ? tsxBin : nodeCommand;
    const buildArgs = (name: string) => hasDist ? [distEntry, name] : [srcEntry, name];

    this.addService('feishu', 'Feishu Bot', command, buildArgs('feishu'));
    this.addService('weixin', 'Weixin Bot', command, buildArgs('weixin'));
    this.addService('catscompany', 'CatsCompany Bot', command, buildArgs('catscompany'));
  }

  private addService(name: string, label: string, command: string, args: string[]): void {
    this.services.set(name, {
      info: { name, label, command, args, status: 'stopped' },
      logs: [],
    });
  }

  private getEnv(): NodeJS.ProcessEnv {
    const envPath = path.join(this.projectRoot, '.env');
    const env = { ...process.env };
    if (fs.existsSync(envPath)) {
      Object.assign(env, dotenv.parse(fs.readFileSync(envPath, 'utf-8')));
    }
    return env;
  }

  getAll(): ServiceInfo[] {
    return Array.from(this.services.values()).map(service => this.decorateInfo(service.info));
  }

  getLogs(name: string, lines = 100): string[] {
    return this.services.get(name)?.logs.slice(-lines) || [];
  }

  start(name: string): ServiceInfo {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Unknown service: ${name}`);
    }
    if (service.info.status === 'running') {
      return this.decorateInfo(service.info);
    }

    const child = spawn(service.info.command, service.info.args, {
      cwd: this.projectRoot,
      env: this.getEnv(),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    service.process = child;
    service.info.status = 'running';
    service.info.pid = child.pid;
    service.info.startedAt = Date.now();
    service.info.lastError = undefined;
    service.logs = [];

    const append = (chunk: Buffer): void => {
      const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
      service.logs.push(...lines);
      if (service.logs.length > MAX_LOG_LINES) {
        service.logs = service.logs.slice(-MAX_LOG_LINES);
      }
    };

    child.stdout?.on('data', append);
    child.stderr?.on('data', append);
    child.on('error', error => {
      service.info.status = 'error';
      service.info.lastError = error.message;
    });
    child.on('exit', code => {
      service.process = undefined;
      service.info.pid = undefined;
      service.info.status = code === 0 ? 'stopped' : 'error';
      service.info.lastError = code && code !== 0 ? `Exited with code ${code}` : undefined;
    });

    return this.decorateInfo(service.info);
  }

  stop(name: string): ServiceInfo {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Unknown service: ${name}`);
    }

    service.process?.kill();
    service.process = undefined;
    service.info.status = 'stopped';
    service.info.pid = undefined;
    return this.decorateInfo(service.info);
  }

  restart(name: string): ServiceInfo {
    this.stop(name);
    return this.start(name);
  }

  stopAll(): void {
    for (const name of this.services.keys()) {
      try {
        this.stop(name);
      } catch {
        // ignore
      }
    }
  }

  private decorateInfo(info: ServiceInfo): ServiceInfo {
    if (info.status === 'running' && info.startedAt) {
      return {
        ...info,
        uptime: (Date.now() - info.startedAt) / 1000,
      };
    }
    return { ...info };
  }
}
