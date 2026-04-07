import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { ServiceManager } from '../service-manager';
import { SkillManager } from '../../skills/skill-manager';
import { PathResolver } from '../../utils/path-resolver';

function readEnvFile(envPath: string): Record<string, string> {
  if (!fs.existsSync(envPath)) {
    return {};
  }
  return dotenv.parse(fs.readFileSync(envPath, 'utf-8'));
}

function writeEnvFile(envPath: string, values: Record<string, string>): void {
  const content = Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  fs.writeFileSync(envPath, content);
}

function readStoreRegistry(): any[] {
  const registryPath = path.resolve('skill-registry.json');
  if (!fs.existsSync(registryPath)) {
    return [];
  }

  try {
    return JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
  } catch {
    return [];
  }
}

export function createApiRouter(serviceManager: ServiceManager): Router {
  const router = Router();

  router.get('/status', (_req, res) => {
    res.json({
      version: '0.1.0',
      platform: process.platform,
      nodeVersion: process.version,
      hostname: require('os').hostname(),
      skillsPath: PathResolver.getSkillsPath(),
      services: serviceManager.getAll(),
    });
  });

  router.get('/services', (_req, res) => {
    res.json(serviceManager.getAll());
  });

  router.post('/services/:name/start', (req, res) => {
    try {
      res.json(serviceManager.start(req.params.name));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/services/:name/stop', (req, res) => {
    try {
      res.json(serviceManager.stop(req.params.name));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/services/:name/restart', (req, res) => {
    try {
      res.json(serviceManager.restart(req.params.name));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/services/:name/logs', (req, res) => {
    const lines = Number(req.query.lines || 100);
    res.json(serviceManager.getLogs(req.params.name, lines));
  });

  router.get('/config', (_req, res) => {
    const envPath = path.resolve('.env');
    res.json(readEnvFile(envPath));
  });

  router.put('/config', (req, res) => {
    const envPath = path.resolve('.env');
    const current = readEnvFile(envPath);
    const updates = req.body || {};

    for (const [key, value] of Object.entries(updates)) {
      current[key] = String(value ?? '');
    }

    writeEnvFile(envPath, current);
    res.json({ ok: true });
  });

  router.get('/skills-all', async (_req, res) => {
    const manager = new SkillManager();
    await manager.loadSkills();
    const skills = manager.getAllSkills().map(skill => ({
      name: skill.metadata.name,
      description: skill.metadata.description,
      enabled: true,
      userInvocable: skill.metadata.userInvocable !== false,
      autoInvocable: skill.metadata.autoInvocable !== false,
      maxTurns: skill.metadata.maxTurns,
      files: [skill.filePath],
    }));
    res.json(skills);
  });

  router.post('/skills/:name/disable', (_req, res) => {
    res.json({ ok: true });
  });

  router.post('/skills/:name/enable', (_req, res) => {
    res.json({ ok: true });
  });

  router.delete('/skills/:name', (req, res) => {
    const skillDir = path.join(PathResolver.getSkillsPath(), req.params.name);
    if (fs.existsSync(skillDir)) {
      fs.rmSync(skillDir, { recursive: true, force: true });
    }
    res.json({ ok: true });
  });

  router.get('/store', async (_req, res) => {
    res.json(readStoreRegistry());
  });

  router.post('/store/install', (_req, res) => {
    res.json({ ok: false, error: 'Store install is not available in repair mode yet.' });
  });

  router.post('/store/install-github', (_req, res) => {
    res.json({ ok: false, error: 'GitHub install is not available from the dashboard yet.' });
  });

  router.get('/weixin/qrcode', (_req, res) => {
    res.json({ error: 'Weixin QR login is not available in repair mode.' });
  });

  router.get('/weixin/qrcode-status', (_req, res) => {
    res.json({ status: 'expired' });
  });

  return router;
}
