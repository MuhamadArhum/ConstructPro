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
  // Prisma CLI is no longer bundled (pruned for size). Use @prisma/client db push instead.
  // For the bundled production build, schema is already applied at build time — skip migrations.
  const bundlePath = path.join(backendPath, 'bundle.js');
  if (fs.existsSync(bundlePath)) {
    console.log('[migrations] esbuild bundle detected — schema applied at build time, skipping');
    return;
  }

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
  // Use esbuild bundle in production (single file, no node_modules traversal)
  // Fall back to dist/main.js in development
  const bundlePath = path.join(backendPath, 'bundle.js');
  const scriptPath = (app.isPackaged && fs.existsSync(bundlePath))
    ? bundlePath
    : path.join(backendPath, 'dist', 'main.js');

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
    // Silently log update errors — don't interrupt user with dialog
    console.error('[updater] Error:', err.message);
  });

  // Check for updates 10 seconds after window shows
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[updater] Check failed:', err.message);
    });
  }, 10000);
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
    backgroundColor: '#f5f7fa',
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
    if (app.isPackaged) setupAutoUpdater();
  });

  mainWindow.loadURL(`data:text/html;charset=utf-8,<!DOCTYPE html><html><head><meta charset="utf-8"><title>ConstructPro</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#f5f7fa;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}.card{background:#fff;border-radius:16px;padding:48px 56px;box-shadow:0 4px 24px rgba(0,0,0,0.08);display:flex;flex-direction:column;align-items:center;min-width:280px}.icon{width:56px;height:56px;background:#1565c0;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:20px}.icon svg{width:32px;height:32px;fill:none;stroke:white;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}.logo{font-size:1.5rem;font-weight:700;color:#1a1a2e;letter-spacing:.5px;margin-bottom:6px}.tagline{font-size:0.8rem;color:#9e9e9e;margin-bottom:32px;letter-spacing:.3px}.spinner-wrap{position:relative;width:36px;height:36px}.spinner{position:absolute;inset:0;border:3px solid #e3eaf5;border-top-color:#1565c0;border-radius:50%;animation:spin .75s linear infinite}.dots{margin-top:20px;display:flex;gap:6px}.dot{width:6px;height:6px;border-radius:50%;background:#1565c0;animation:bounce 1.2s ease-in-out infinite}.dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}@keyframes spin{to{transform:rotate(360deg)}}@keyframes bounce{0%,80%,100%{opacity:.25}40%{opacity:1}}</style></head><body><div class="card"><div class="icon"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div><div class="logo">ConstructPro</div><div class="tagline">Construction Management System</div><div class="spinner-wrap"><div class="spinner"></div></div><div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div></body></html>`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow about:blank popups (used by print utility to render HTML)
    if (!url || url === 'about:blank' || url.startsWith('about:')) {
      return { action: 'allow' };
    }
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
