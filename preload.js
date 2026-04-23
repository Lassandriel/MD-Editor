const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    readFile: (path) => ipcRenderer.invoke('read-file', path),
    writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),
    showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
    showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
    onOpenFile: (callback) => ipcRenderer.on('open-file', (event, path) => callback(path)),
    minimize: () => ipcRenderer.send('window-min'),
    maximize: () => ipcRenderer.send('window-max'),
    close: () => ipcRenderer.send('window-close'),
    openExternal: (url) => ipcRenderer.send('open-external', url)
});
