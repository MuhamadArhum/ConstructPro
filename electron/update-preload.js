const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('updateBridge', {
  restart: () => ipcRenderer.send('update-action', 'restart'),
  later: () => ipcRenderer.send('update-action', 'later'),
});
