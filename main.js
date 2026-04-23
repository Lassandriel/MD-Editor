const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false, // Custom frame for Windows-look
        icon: path.join(__dirname, 'public/logo.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile('index.html');

    // Handle command line arguments (for file association)
    const filePath = process.argv.find(arg => arg.endsWith('.md') || arg.endsWith('.txt'));
    if (filePath) {
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.webContents.send('open-file', filePath);
        });
    }

    // Window control IPCs
    ipcMain.on('window-min', () => mainWindow.minimize());
    ipcMain.on('window-max', () => {
        if (mainWindow.isMaximized()) mainWindow.unmaximize();
        else mainWindow.maximize();
    });
    ipcMain.on('window-close', () => mainWindow.close());
    ipcMain.on('open-external', (event, url) => {
        const { shell } = require('electron');
        shell.openExternal(url);
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC File operations
ipcMain.handle('read-file', async (event, filePath) => {
    return fs.readFileSync(filePath, 'utf-8');
});

ipcMain.handle('write-file', async (event, filePath, content) => {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
});

ipcMain.handle('show-save-dialog', async () => {
    return dialog.showSaveDialog({
        filters: [{ name: 'Markdown', extensions: ['md'] }, { name: 'Text', extensions: ['txt'] }]
    });
});

ipcMain.handle('show-open-dialog', async () => {
    return dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Markdown', extensions: ['md'] }, { name: 'Text', extensions: ['txt'] }]
    });
});
