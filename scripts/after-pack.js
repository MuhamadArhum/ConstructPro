const fs = require('fs');
const path = require('path');
const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses');

exports.default = async function afterPack(context) {
  // Enable RunAsNode fuse so the packaged Electron binary can spawn the backend
  // with ELECTRON_RUN_AS_NODE=1 (newer Electron disables this fuse by default)
  const ext = process.platform === 'win32' ? '.exe' : '';
  const productName = context.packager.appInfo.productFilename || context.packager.appInfo.productName || 'ConstructPro';
  const exePath = path.join(context.appOutDir, productName + ext);
  console.log('[afterPack] Looking for exe at:', exePath, '— exists:', fs.existsSync(exePath));
  if (fs.existsSync(exePath)) {
    console.log('[afterPack] Enabling RunAsNode fuse...');
    await flipFuses(exePath, {
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: true,
    });
    console.log('[afterPack] RunAsNode fuse enabled');
  }

  // Manually copy backend-bundle/node_modules into packaged resources/backend
  // electron-builder ignores node_modules in extraResources by default
  const srcNm = path.join(__dirname, '..', 'backend-bundle', 'node_modules');
  const destNm = path.join(context.appOutDir, 'resources', 'backend', 'node_modules');
  if (fs.existsSync(srcNm)) {
    console.log('[afterPack] Copying backend node_modules...');
    copyDir(srcNm, destNm);
    console.log('[afterPack] backend node_modules copied');
  } else {
    console.warn('[afterPack] WARNING: backend-bundle/node_modules not found!');
  }
};

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.lstatSync(s);
    if (stat.isSymbolicLink()) {
      try { fs.unlinkSync(d); } catch {}
      fs.symlinkSync(fs.readlinkSync(s), d);
    } else if (stat.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}
