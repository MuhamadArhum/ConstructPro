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

  // node_modules are now handled by extraResources in electron-builder config
  // (backend-bundle/node_modules is included via extraResources)
};
