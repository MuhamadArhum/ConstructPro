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

  const resourcesDir = context.appOutDir;
  const src = path.join(__dirname, '..', 'backend-bundle', 'node_modules');
  const dest = path.join(resourcesDir, 'resources', 'backend', 'node_modules');

  if (!fs.existsSync(src)) {
    console.warn('[afterPack] backend-bundle/node_modules not found, skipping');
    return;
  }

  console.log('[afterPack] Copying backend node_modules...');
  fs.mkdirSync(dest, { recursive: true });
  copyDirSync(src, dest);
  console.log('[afterPack] backend node_modules copied successfully');
};

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    try {
      const stat = fs.lstatSync(srcPath);
      if (stat.isSymbolicLink()) {
        const target = fs.readlinkSync(srcPath);
        try { fs.unlinkSync(destPath); } catch {}
        fs.symlinkSync(target, destPath);
      } else if (stat.isDirectory()) {
        copyDirSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    } catch (e) {
      // skip locked files
    }
  }
}
