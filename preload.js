/**
 * Preload script — runs in renderer with Node access, exposes safe APIs
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('screensaver', {
  // Renderer can call this to close the screensaver
  quit: () => ipcRenderer.send('quit-screensaver'),

  // Listen for info sent from main process
  onInfo: (callback) => ipcRenderer.on('screensaver-info', (_, data) => callback(data)),
});
