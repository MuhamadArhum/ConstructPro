const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;
let backendProcess = null;
const PORT = 3000;

// ─── File-based logging ───────────────────────────────────────────────────────
let logStream = null;
function initLog() {
  try {
    const logDir = app.getPath('logs');
    fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, 'main.log');
    logStream = fs.createWriteStream(logFile, { flags: 'a' });
    logStream.write(`\n\n--- ConstructPro started ${new Date().toISOString()} ---\n`);
  } catch {}
}
function log(...args) {
  const msg = args.join(' ');
  console.log(msg);
  try { logStream?.write(msg + '\n'); } catch {}
}
function logErr(...args) {
  const msg = args.join(' ');
  console.error(msg);
  try { logStream?.write('[ERR] ' + msg + '\n'); } catch {}
}

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
      log('[startup] Fresh database copied to', dbDest);
    } else {
      log('[startup] No template DB found, backend will create fresh database');
    }
  } else {
    log('[startup] Using existing database at', dbDest);
  }

  return dbDest;
}

function runMigrations(dbPath) {
  const backendPath = getBackendPath();
  const templateDbPath = path.join(backendPath, 'constructpro.db');
  const migrateScript = app.isPackaged
    ? path.join(backendPath, 'db-migrate.js')
    : path.join(__dirname, '..', 'scripts', 'db-migrate.js');

  if (!fs.existsSync(migrateScript)) {
    log('[migrations] Migration script not found, skipping');
    return;
  }

  log('[migrations] Running schema migration...');
  const result = spawnSync(process.execPath, [migrateScript, dbPath, templateDbPath], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: 'pipe',
    timeout: 30000,
  });

  const out = result.stdout?.toString().trim();
  const err = result.stderr?.toString().trim();
  if (out) log(out);
  if (err) logErr(err);
  if (result.status === 0) {
    log('[migrations] Migration complete');
  } else {
    logErr('[migrations] Migration exited with code', result.status);
  }
}

function waitForBackend(url, retries = 40, delay = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    function attempt() {
      http.get(url, (res) => {
        log('[startup] Backend responded on attempt', attempts + 1);
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

  const staticPath = path.join(backendPath, 'public');
  log('[startup] backendPath:', backendPath);
  log('[startup] STATIC_PATH:', staticPath);
  log('[startup] STATIC_PATH exists:', fs.existsSync(staticPath));
  log('[startup] index.html exists:', fs.existsSync(path.join(staticPath, 'index.html')));

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
    STATIC_PATH: staticPath,
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

  log('[startup] scriptPath:', scriptPath);
  log('[startup] scriptPath exists:', fs.existsSync(scriptPath));

  backendProcess = spawn(nodeExe, [scriptPath], {
    cwd: backendPath,
    env,
    stdio: 'pipe',
  });

  backendProcess.stdout?.on('data', (data) => {
    log('[backend]', data.toString().trim());
  });

  backendProcess.stderr?.on('data', (data) => {
    logErr('[backend err]', data.toString().trim());
  });

  backendProcess.on('exit', (code) => {
    log('[backend] exited with code', code);
  });
}

function showUpdatePopup(version) {
  const popup = new BrowserWindow({
    width: 440,
    height: 280,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    parent: mainWindow,
    modal: true,
    frame: false,
    transparent: false,
    backgroundColor: '#F5F2E8',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: #F5F2E8;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #D3CDBA;
  }
  .header {
    background: #0E2A47;
    padding: 18px 22px;
    display: flex;
    align-items: center;
    gap: 14px;
    -webkit-app-region: drag;
    flex-shrink: 0;
  }
  .icon-wrap {
    width: 40px; height: 40px;
    background: rgba(232,93,31,0.2);
    border: 1px solid rgba(232,93,31,0.4);
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .icon-wrap svg { width: 22px; height: 22px; }
  .header-text { flex: 1; }
  .header-text .app-name {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #ffffff;
    line-height: 1;
  }
  .header-text .sub {
    font-size: 11px;
    color: #9AC6E8;
    margin-top: 3px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .badge {
    background: #E85D1F;
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 11px;
    border-radius: 4px;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }
  .divider-line {
    height: 2px;
    background: #E85D1F;
    width: 100%;
    flex-shrink: 0;
  }
  .body {
    padding: 22px 24px 18px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
  }
  .update-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .update-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #E85D1F;
    flex-shrink: 0;
  }
  .body p {
    color: #14181B;
    font-size: 13.5px;
    line-height: 1.55;
  }
  .body p strong {
    color: #0E2A47;
    font-weight: 700;
  }
  .note {
    font-size: 11.5px;
    color: #6B7178;
    padding-left: 18px;
    border-left: 2px solid #D3CDBA;
    line-height: 1.5;
  }
  .footer {
    padding: 0 24px 20px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
  button {
    padding: 8px 20px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    transition: all 0.15s;
  }
  .btn-later {
    background: transparent;
    color: #6B7178;
    border: 1px solid #D3CDBA;
  }
  .btn-later:hover { background: #ECE8DB; color: #3B4147; border-color: #b8b0a0; }
  .btn-restart {
    background: #E85D1F;
    color: white;
  }
  .btn-restart:hover { background: #C24A16; }
</style>
</head>
<body>
  <div class="header">
    <div class="icon-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="#E85D1F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </div>
    <div class="header-text">
      <div class="app-name">ConstructPro</div>
      <div class="sub">Update Ready</div>
    </div>
    <div class="badge">v${version}</div>
  </div>
  <div class="divider-line"></div>
  <div class="body">
    <div class="update-row">
      <div class="update-dot"></div>
      <p>Version <strong>v${version}</strong> has been downloaded and is ready to install.</p>
    </div>
    <p class="note">The app will close and restart automatically to apply the update. Your data will not be affected.</p>
  </div>
  <div class="footer">
    <button class="btn-later" onclick="later()">Later</button>
    <button class="btn-restart" onclick="restart()">Restart &amp; Install</button>
  </div>
  <script>
    const { ipcRenderer } = require('electron');
    function restart() { ipcRenderer.send('update-action', 'restart'); }
    function later() { ipcRenderer.send('update-action', 'later'); }
  </script>
</body>
</html>`;

  popup.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  popup.setMenu(null);

  const { ipcMain } = require('electron');
  ipcMain.once('update-action', (_, action) => {
    popup.close();
    if (action === 'restart') autoUpdater.quitAndInstall();
  });
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    log('[updater] Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    log('[updater] Update available:', info.version);
  });

  autoUpdater.on('update-not-available', () => {
    log('[updater] App is up to date');
  });

  autoUpdater.on('download-progress', (progress) => {
    log(`[updater] Downloading: ${Math.round(progress.percent)}%`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    log('[updater] Update downloaded:', info.version);
    showUpdatePopup(info.version);
  });

  autoUpdater.on('error', (err) => {
    // Silently log update errors — don't interrupt user with dialog
    logErr('[updater] Error:', err.message);
  });

  // Check for updates 10 seconds after window shows
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      logErr('[updater] Check failed:', err.message);
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

    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
    } else if (input.key === 'F5') {
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
  initLog();
  log('[startup] app.isPackaged:', app.isPackaged);
  log('[startup] resourcesPath:', process.resourcesPath);

  const dbPath = ensureDatabase();
  runMigrations(dbPath);
  startBackend(dbPath);

  createWindow();

  // Collect backend stderr for error display
  let backendStderr = '';
  backendProcess?.stderr?.on('data', (d) => { backendStderr += d.toString(); });

  // Catch page load failures (e.g. backend crashed after waitForBackend resolved)
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    if (!url.startsWith('http://localhost')) return;
    logErr('[renderer] did-fail-load:', code, desc, url);
    const logPath = path.join(app.getPath('logs'), 'main.log');
    const errHtml = `data:text/html;charset=utf-8,<!DOCTYPE html><html><head><style>
      body{background:#b71c1c;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:white;text-align:center;padding:20px;flex-direction:column}
      h2{margin-bottom:12px}pre{background:rgba(0,0,0,.3);padding:12px;border-radius:8px;font-size:.75em;text-align:left;max-width:600px;white-space:pre-wrap;margin-top:12px;word-break:break-all}
    </style></head><body>
      <h2>ConstructPro could not load</h2>
      <p>Error ${code}: ${desc}</p>
      <pre>Log: ${logPath}\n\nBackend output:\n${backendStderr.slice(-800) || '(none)'}</pre>
    </body></html>`;
    mainWindow.loadURL(errHtml);
  });

  try {
    await waitForBackend(`http://localhost:${PORT}/api`);
    log('[startup] Backend ready, loading frontend...');
    mainWindow.loadURL(`http://localhost:${PORT}`);
  } catch (err) {
    logErr('Backend failed to start:', err.message);
    logErr('Backend stderr:', backendStderr.slice(-1000));
    const logPath = path.join(app.getPath('logs'), 'main.log');
    const errHtml = `data:text/html;charset=utf-8,<!DOCTYPE html><html><head><style>
      body{background:#b71c1c;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:white;text-align:center;padding:20px;flex-direction:column}
      h2{margin-bottom:12px}pre{background:rgba(0,0,0,.3);padding:12px;border-radius:8px;font-size:.75em;text-align:left;max-width:600px;white-space:pre-wrap;margin-top:12px;word-break:break-all}
    </style></head><body>
      <h2>ConstructPro could not start</h2>
      <p>Backend did not respond after 40 seconds.</p>
      <pre>Log: ${logPath}\n\nBackend output:\n${backendStderr.slice(-800) || '(none — backend may have crashed immediately)'}</pre>
    </body></html>`;
    mainWindow.loadURL(errHtml);
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
