const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;
let backendProcess = null;
const PORT = 3000;

function getBackendPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend');
  }
  return path.join(__dirname, '..', 'backend');
}

function ensureDatabase() {
  const userDataPath = app.getPath('userData');
  const dbDest = path.join(userDataPath, 'constructpro.db');

  if (!fs.existsSync(dbDest)) {
    const backendPath = getBackendPath();
    const dbSrc = path.join(backendPath, 'constructpro.db');
    if (fs.existsSync(dbSrc)) {
      fs.mkdirSync(userDataPath, { recursive: true });
      fs.copyFileSync(dbSrc, dbDest);
      console.log('[startup] Fresh database copied to', dbDest);
    } else {
      console.log('[startup] No template DB found, backend will create fresh database');
    }
  } else {
    console.log('[startup] Using existing database at', dbDest);
  }

  return dbDest;
}

function runMigrations(dbPath) {
  if (!app.isPackaged) return; // dev mein skip karo

  const backendPath = getBackendPath();
  const prismaEntry = path.join(backendPath, 'node_modules', 'prisma', 'build', 'index.js');

  if (!fs.existsSync(prismaEntry)) {
    console.warn('[migrations] Prisma CLI not found, skipping migrations');
    return;
  }

  console.log('[migrations] Syncing database schema...');
  const result = spawnSync(process.execPath, [prismaEntry, 'db', 'push'], {
    cwd: backendPath,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      DATABASE_URL: `file:${dbPath}`,
    },
    stdio: 'pipe',
    timeout: 30000,
  });

  if (result.status === 0) {
    console.log('[migrations] Completed successfully');
  } else {
    console.error('[migrations] Failed:', result.stderr?.toString()?.trim());
  }
}

function waitForBackend(url, retries = 40, delay = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    function attempt() {
      http.get(url, (res) => {
        resolve();
      }).on('error', () => {
        attempts++;
        if (attempts >= retries) {
          reject(new Error('Backend did not start in time'));
        } else {
          setTimeout(attempt, delay);
        }
      });
    }

    attempt();
  });
}

function startBackend(dbPath) {
  const backendPath = getBackendPath();

  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    DATABASE_URL: `file:${dbPath}`,
    PORT: String(PORT),
    NODE_ENV: 'production',
    JWT_SECRET: 'ConstructPro-JWT-Secret-Key-2024-SuperSecure-32chars!',
    JWT_EXPIRES_IN: '8h',
    JWT_REFRESH_DAYS: '7',
    CORS_ORIGINS: `http://localhost:${PORT}`,
    ADMIN_EMAIL: 'admin@constructpro.com',
    ADMIN_PASSWORD: 'Admin@123456',
  };

  const nodeExe = process.execPath;
  const scriptPath = path.join(backendPath, 'dist', 'main.js');

  backendProcess = spawn(nodeExe, [scriptPath], {
    cwd: backendPath,
    env,
    stdio: 'pipe',
  });

  backendProcess.stdout?.on('data', (data) => {
    console.log('[backend]', data.toString().trim());
  });

  backendProcess.stderr?.on('data', (data) => {
    console.error('[backend err]', data.toString().trim());
  });

  backendProcess.on('exit', (code) => {
    console.log('[backend] exited with code', code);
  });
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('[updater] Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[updater] Update available:', info.version);
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[updater] App is up to date');
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[updater] Downloading: ${Math.round(progress.percent)}%`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[updater] Update downloaded:', info.version);
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `ConstructPro v${info.version} is ready to install.`,
      detail: 'The update will be applied the next time you restart the application.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('[updater] Error:', err.message);
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Update Error',
      message: err.message,
    });
  });

  // Window show hone ke 5 second baad check karo
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[updater] Check failed:', err.message);
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'Update Check Failed',
        message: err.message,
      });
    });
  }, 5000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'ConstructPro',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
    backgroundColor: '#1565c0',
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
    if (app.isPackaged) setupAutoUpdater();
  });

  mainWindow.loadURL(`data:text/html;charset=utf-8,<!DOCTYPE html><html><head><meta charset="utf-8"><title>ConstructPro</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#1565c0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:white}.logo{font-size:2rem;font-weight:700;letter-spacing:2px;margin-bottom:16px}.msg{font-size:1rem;opacity:0.8;margin-bottom:32px}.spinner{width:40px;height:40px;border:4px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="logo">ConstructPro</div><div class="msg">Starting up, please wait…</div><div class="spinner"></div></body></html>`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (!mainWindow) return;
    const ctrl = input.control || input.meta;
    if (input.type !== 'keyDown') return;

    if (input.key === 'F5') {
      event.preventDefault();
      mainWindow.webContents.reload();
    } else if (ctrl && input.key === 'r' && !input.shift) {
      event.preventDefault();
      mainWindow.webContents.reload();
    } else if (ctrl && input.key === 'R' && input.shift) {
      event.preventDefault();
      mainWindow.webContents.reloadIgnoringCache();
    }
  });
}

app.whenReady().then(async () => {
  const dbPath = ensureDatabase();
  runMigrations(dbPath);
  startBackend(dbPath);

  createWindow();

  try {
    await waitForBackend(`http://localhost:${PORT}/api`);
    mainWindow.loadURL(`http://localhost:${PORT}`);
  } catch (err) {
    console.error('Backend failed to start:', err.message);
    mainWindow.loadURL(`data:text/html;charset=utf-8,<!DOCTYPE html><html><head><style>body{background:#c62828;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:white;text-align:center}</style></head><body><div><h2>ConstructPro could not start</h2><p style="margin-top:12px;opacity:0.85">Backend failed to start. Please restart the app.</p></div></body></html>`);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});
