const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');

let mainWindow;
let closeApproved = false;

function findFileArg(argv) {
    return argv.slice(1).find(arg => {
        if (arg.startsWith('-')) return false;
        const lower = arg.toLowerCase();
        if (!lower.endsWith('.md') && !lower.endsWith('.txt')) return false;
        try { return fsSync.statSync(arg).isFile(); } catch { return false; }
    });
}

// Single-Instance: zweiter Start (z. B. Doppelklick auf .md im Explorer)
// reicht den Pfad an das bestehende Fenster weiter, statt eine neue App-Instanz zu öffnen.
if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', (_event, argv) => {
        if (!mainWindow) return;
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        const filePath = findFileArg(argv);
        if (filePath) mainWindow.webContents.send('open-file', filePath);
    });

    app.whenReady().then(createWindow);
}

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

    const filePath = findFileArg(process.argv);
    if (filePath) {
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.webContents.send('open-file', filePath);
        });
    }

    // Schließen abfangen (Alt+F4, Taskbar, OS-Shutdown) und Dirty-Check durchführen.
    mainWindow.on('close', async (e) => {
        if (closeApproved) return;
        e.preventDefault();
        let dirty = false;
        try {
            dirty = await mainWindow.webContents.executeJavaScript('window.mdEditorIsDirty === true');
        } catch { /* Renderer schon weg → einfach zumachen */ }
        if (!dirty) { closeApproved = true; mainWindow.close(); return; }
        const choice = await dialog.showMessageBox(mainWindow, {
            type: 'question',
            buttons: ['Verwerfen', 'Abbrechen'],
            defaultId: 1,
            cancelId: 1,
            title: 'MD Editor',
            message: 'Ungespeicherte Änderungen verwerfen?'
        });
        if (choice.response === 0) { closeApproved = true; mainWindow.close(); }
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Window control IPCs (einmalig registriert, operieren auf BrowserWindow vom Sender)
ipcMain.on('window-min', (event) => BrowserWindow.fromWebContents(event.sender)?.minimize());
ipcMain.on('window-max', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
});
ipcMain.on('window-close', (event) => BrowserWindow.fromWebContents(event.sender)?.close());
ipcMain.on('open-external', (event, url) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) shell.openExternal(url);
});

// IPC File operations
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        return { ok: true, content: await fs.readFile(filePath, 'utf-8') };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
        await fs.writeFile(filePath, content, 'utf-8');
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
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
