const { app, BrowserWindow, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');

const DASHBOARD_PORT = 3800;
let mainWindow = null;
let tray = null;
let autoUpdater = null;

// 灏濊瘯鍔犺浇 electron-updater锛堝彲閫夛級
try {
  autoUpdater = require('electron-updater').autoUpdater;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
} catch (err) {
  console.log('electron-updater not available, auto-update disabled');
}

function getAppRoot() {
  // asar 宸插叧闂?
  // 鎵撳寘鍚? Resources/app/electron/main.js -> Resources/app/
  // 寮€鍙戞椂: electron/main.js -> ./
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app');
  }
  return path.join(__dirname, '..');
}

/**
 * 鑾峰彇鍐呭祵鐨?node.exe 璺緞锛堟墦鍖呯増锛夋垨绯荤粺 node锛堝紑鍙戠増锛?
 */
function getNodeExePath() {
  if (app.isPackaged) {
    // extraFiles 灏?build-resources/node/ 澶嶅埗鍒?Contents/node/
    const nodeFileName = process.platform === 'win32' ? 'node.exe' : 'node';
    // macOS: process.execPath = Contents/MacOS/Slime, 闇€瑕?../node/node
    // Windows: process.execPath = Slime.exe, 闇€瑕?./node/node.exe
    const contentsDir = process.platform === 'darwin'
      ? path.join(path.dirname(process.execPath), '..')
      : path.dirname(process.execPath);
    const embeddedNode = path.join(contentsDir, 'node', nodeFileName);
    const fs = require('fs');
    if (fs.existsSync(embeddedNode)) {
      return embeddedNode;
    }
    console.warn('Embedded node not found at', embeddedNode, ', falling back to system node');
  }
  return 'node';
}

/**
 * 鑾峰彇 node_modules 璺緞锛堟墦鍖呯増鍦?extraResources 涓級
 */
function getNodeModulesPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'node_modules');
  }
  return path.join(__dirname, '..', 'node_modules');
}

async function startServer() {
  const appRoot = getAppRoot();

  // 璁剧疆宸ヤ綔鐩綍锛堟墦鍖呭悗鐢╱serData瀛樻斁鐢ㄦ埛鏁版嵁锛?
  const userDataPath = app.getPath('userData');
  process.chdir(userDataPath);

  // 濡傛灉userData閲屾病鏈?env锛屼粠app閲屽鍒?env.example
  const fs = require('fs');
  const envPath = path.join(userDataPath, '.env');
  if (!fs.existsSync(envPath)) {
    const examplePath = path.join(appRoot, '.env.example');
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
    }
  }

  // 鍚屾鍐呯疆 skills 鍒?userData锛堜繚鐣欑敤鎴峰畨瑁呯殑 skills锛?
  const skillsPath = path.join(userDataPath, 'skills');
  const bundledSkills = path.join(appRoot, 'skills');

  if (fs.existsSync(bundledSkills)) {
    fs.mkdirSync(skillsPath, { recursive: true });

    // 澶嶅埗姣忎釜鍐呯疆 skill锛堜笉瑕嗙洊宸插瓨鍦ㄧ殑锛?
    const bundledSkillDirs = fs.readdirSync(bundledSkills, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const dir of bundledSkillDirs) {
      const src = path.join(bundledSkills, dir.name);
      const dest = path.join(skillsPath, dir.name);

      // 鍙鍒朵笉瀛樺湪鐨?skill
      if (!fs.existsSync(dest)) {
        fs.cpSync(src, dest, { recursive: true });
      }
    }

    // 澶嶅埗 README
    const readmeSrc = path.join(bundledSkills, 'README.md');
    const readmeDest = path.join(skillsPath, 'README.md');
    if (fs.existsSync(readmeSrc)) {
      fs.copyFileSync(readmeSrc, readmeDest);
    }
  }

  // 姣忔鍚姩閮芥洿鏂?skill-registry.json锛堢‘淇濈敤鎴疯幏寰楁渶鏂扮殑鏈湴绱㈠紩锛?
  const registryDest = path.join(userDataPath, 'skill-registry.json');
  const registrySrc = path.join(appRoot, 'skill-registry.json');
  if (fs.existsSync(registrySrc)) {
    fs.copyFileSync(registrySrc, registryDest);
  }

  // 澶嶅埗 prompts 鐩綍
  const promptsDest = path.join(userDataPath, 'prompts');
  const promptsSrc = path.join(appRoot, 'prompts');
  if (!fs.existsSync(promptsDest) && fs.existsSync(promptsSrc)) {
    fs.cpSync(promptsSrc, promptsDest, { recursive: true });
  }

  // 鍔犺浇dotenv
  require('dotenv').config({ path: envPath, quiet: true });

  // 鍛婅瘔 dashboard server app 鐨勫疄闄呬綅缃紙asar 鍐咃級
  process.env.SLIME_APP_ROOT = appRoot;

  // 鎵撳寘鐗堬細璁剧疆 NODE_PATH 璁╁瓙杩涚▼鑳芥壘鍒?node_modules
  const nodeModulesPath = getNodeModulesPath();
  process.env.SLIME_NODE_MODULES = nodeModulesPath;
  if (app.isPackaged) {
    process.env.NODE_PATH = nodeModulesPath;
    require('module').Module._initPaths();
  }

  // 璁剧疆鍐呭祵 node.exe 璺緞渚?service-manager 浣跨敤
  process.env.SLIME_NODE_EXE = getNodeExePath();

  // 鐩存帴鍦ㄤ富杩涚▼鍚姩dashboard server
  const { startDashboard } = require(path.join(appRoot, 'dist', 'dashboard', 'server'));
  await startDashboard(DASHBOARD_PORT);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Slime Dashboard',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f1117',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${DASHBOARD_PORT}`);

  mainWindow.on('close', (e) => {
    if (process.platform === 'darwin' && !app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABhSURBVFhH7c6xDQAgDASwkP2XZgEqCgrZwJ+u8Ov1vt+RM0EHHXTQQQcddNBBBx100EEHHXTQQQcddNBBBx100EEHHXTQQQcddNBBBx100EEHHXTQQQcddNBBBx3834kDK+kAIRUXPjcAAAAASUVORK5CYII='
  );
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    { label: '鎵撳紑 Dashboard', click: () => {
      if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
      else createWindow();
    }},
    { type: 'separator' },
    { label: '閫€鍑?, click: () => { app.isQuitting = true; app.quit(); }},
  ]);

  tray.setToolTip('Slime Dashboard');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
    else createWindow();
  });
}

// 鏇存柊浜嬩欢鐩戝惉
if (autoUpdater) {
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: '鍙戠幇鏂扮増鏈?,
      message: `鍙戠幇鏂扮増鏈?${info.version}锛屾槸鍚︿笅杞斤紵`,
      buttons: ['涓嬭浇', '绋嶅悗'],
    }).then((result) => {
      if (result.response === 0) autoUpdater.downloadUpdate();
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: '鏇存柊宸蹭笅杞?,
      message: '鏇存柊宸蹭笅杞藉畬鎴愶紝閲嶅惎搴旂敤鍚庣敓鏁?,
      buttons: ['绔嬪嵆閲嶅惎', '绋嶅悗'],
    }).then((result) => {
      if (result.response === 0) autoUpdater.quitAndInstall();
    });
  });
}

app.whenReady().then(async () => {
  try {
    await startServer();
    createWindow();
    createTray();
    
    // 鍚姩鍚庢鏌ユ洿鏂?
    if (app.isPackaged && autoUpdater) {
      setTimeout(() => autoUpdater.checkForUpdates(), 3000);
    }
  } catch (err) {
    console.error('鍚姩澶辫触:', err);
    app.quit();
  }

  app.on('activate', () => {
    if (mainWindow) mainWindow.show();
    else createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

