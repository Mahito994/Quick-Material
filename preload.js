const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    runCommand: (cmd) => ipcRenderer.invoke('run-system-command', cmd)
});