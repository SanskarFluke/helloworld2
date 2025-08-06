console.log('[PRELOAD] Running preload.js');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
    once: (channel, callback) => ipcRenderer.once(channel, (event, ...args) => callback(...args)),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args), // ✅ ADD THIS LINE

  },

  // ✅ Storage Checker (already working)
  getAndroidStorage: () => ipcRenderer.invoke('get-android-storage'),

  // ✅ SSH-related APIs
  generateSSHKey: () => ipcRenderer.invoke('generate-ssh-key'),
  getPublicKey: () => ipcRenderer.invoke('get-public-key'),
  scpDownload: (options) => ipcRenderer.invoke('scp-download', options),

  // ✅ USB
  scanUsbDevices: () => ipcRenderer.invoke('scan-usb-devices'),

  // ✅ Versiv Auto Connect IPC Handler (NEW)
  scanVersiv: () => ipcRenderer.invoke('scan-versiv'),
});


