import express from 'express';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { createApiRouter } from './routes/api';
import { ServiceManager } from './service-manager';

const DEFAULT_PORT = 3800;

export async function startDashboard(port: number = DEFAULT_PORT): Promise<void> {
  const app = express();
  const projectRoot = process.cwd();
  const serviceManager = new ServiceManager(projectRoot);
  const frontendPath = path.join(__dirname, '../../dashboard');

  app.use(express.json());
  app.use('/api', createApiRouter(serviceManager));
  app.use(express.static(frontendPath));
  app.use((_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  app.listen(port, '127.0.0.1', () => {
    Logger.success(`Slime Dashboard started on http://localhost:${port}`);
  });
}
