// ToastUI Editor Initialisierung (WYSIWYG Fokus)
const editor = new toastui.Editor({
    el: document.querySelector('#editor-widget'),
    height: '100%',
    initialEditType: 'wysiwyg',
    previewStyle: 'tab',
    hideModeSwitch: true, // Versteckt den Code-Modus für ein sauberes Wordpad-Gefühl
    usageStatistics: false,
    toolbarItems: [
        ['heading', 'bold', 'italic', 'strike'],
        ['hr', 'quote'],
        ['ul', 'ol', 'task', 'indent', 'outdent'],
        ['table', 'image', 'link'],
        ['code', 'codeblock']
    ],
    plugins: [toastui.Editor.plugin.colorSyntax],
    theme: localStorage.getItem('md-notepad-theme') === 'dark' ? 'dark' : 'light',
    language: localStorage.getItem('md-notepad-lang') === 'en' ? 'en-US' : 'de-DE',
    events: {
        change: () => updateStatusBar()
    }
});

const translations = {
    de: {
        'menu-file': 'Datei',
        'menu-new': 'Neu',
        'menu-open': 'Öffnen...',
        'menu-save': 'Speichern',
        'menu-export-pdf': 'Als PDF exportieren',
        'menu-edit': 'Bearbeiten',
        'menu-undo': 'Rückgängig',
        'menu-redo': 'Wiederholen',
        'menu-clear': 'Alles löschen',
        'menu-view': 'Ansicht',
        'menu-toggle-theme': 'Theme umschalten',
        'menu-fullscreen': 'Vollbild',
        'menu-language': 'Sprache',
        'menu-help': 'Hilfe',
        'menu-about': 'Über NotepadMD',
        'untitled': 'Unbenannt'
    },
    en: {
        'menu-file': 'File',
        'menu-new': 'New',
        'menu-open': 'Open...',
        'menu-save': 'Save',
        'menu-export-pdf': 'Export to PDF',
        'menu-edit': 'Edit',
        'menu-undo': 'Undo',
        'menu-redo': 'Redo',
        'menu-clear': 'Clear all',
        'menu-view': 'View',
        'menu-toggle-theme': 'Toggle Theme',
        'menu-fullscreen': 'Fullscreen',
        'menu-language': 'Language',
        'menu-help': 'Help',
        'menu-about': 'About NotepadMD',
        'untitled': 'Untitled'
    }
};

function setLanguage(lang) {
    localStorage.setItem('md-notepad-lang', lang);
    const t = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });
    // Hinweis: ToastUI Sprache erfordert aktuell einen Neustart der App für volle Toolbar-Übersetzung.
}

function updateStatusBar() {
    const text = editor.getMarkdown();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    document.getElementById('word-count').textContent = `${words} Wörter, ${chars} Zeichen`;
}

// Datei-Handhabung
const fileTitle = document.getElementById('file-title');
const cursorEl = document.getElementById('cursor-pos');

// Globaler Pfad für die aktuelle Datei
let currentFilePath = null;

// Funktion zum Laden einer Datei
async function loadFile(filePath) {
    try {
        const content = await window.electronAPI.readFile(filePath);
        editor.setMarkdown(content);
        currentFilePath = filePath;
        const fileName = filePath.split(/[\\/]/).pop();
        fileTitle.textContent = `Notepad MD - ${fileName}`;
    } catch (err) {
        console.error('Fehler beim Laden:', err);
    }
}

// IPC Listener für Dateien vom System (z.B. Doppelklick)
if (window.electronAPI) {
    window.electronAPI.onOpenFile((filePath) => {
        loadFile(filePath);
    });
}

// Datei öffnen
document.getElementById('menu-open').addEventListener('click', async () => {
    if (window.electronAPI) {
        const result = await window.electronAPI.showOpenDialog();
        if (!result.canceled && result.filePaths.length > 0) {
            loadFile(result.filePaths[0]);
        }
    }
});

// Datei speichern
document.getElementById('menu-save').addEventListener('click', async () => {
    if (window.electronAPI) {
        if (!currentFilePath) {
            const result = await window.electronAPI.showSaveDialog();
            if (!result.canceled && result.filePath) {
                currentFilePath = result.filePath;
            } else {
                return;
            }
        }
        
        try {
            await window.electronAPI.writeFile(currentFilePath, editor.getMarkdown());
            const fileName = currentFilePath.split(/[\\/]/).pop();
            fileTitle.textContent = `Notepad MD - ${fileName}`;
        } catch (err) {
            console.error('Fehler beim Speichern:', err);
        }
    }
});

// Neu
document.getElementById('menu-new').addEventListener('click', () => {
    if (confirm('Möchtest du ein neues Dokument erstellen? Nicht gespeicherte Änderungen gehen verloren.')) {
        editor.setMarkdown('');
        fileTitle.textContent = 'Notepad MD - Unbenannt';
        currentFilePath = null;
    }
});

// Bearbeiten Funktionen
document.getElementById('menu-undo').addEventListener('click', () => {
    // ToastUI hat kein direktes Undo-API im Public Scope, wir nutzen native Commands
    document.execCommand('undo');
});
document.getElementById('menu-redo').addEventListener('click', () => {
    document.execCommand('redo');
});
document.getElementById('menu-clear').addEventListener('click', () => editor.setMarkdown(''));

// Ansicht Funktionen
document.getElementById('menu-toggle-theme').addEventListener('click', toggleTheme);
document.getElementById('menu-fullscreen').addEventListener('click', () => {
    const el = document.querySelector('.editor-container');
    if (!document.fullscreenElement) {
        el.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

// PDF Export (vom Menü aus)
document.getElementById('menu-export-pdf').addEventListener('click', exportToPDF);

async function exportToPDF() {
    const content = editor.getHTML();
    const renderArea = document.getElementById('pdf-render-area');
    
    renderArea.innerHTML = content;
    renderArea.style.display = 'block';
    renderArea.style.padding = '40px';
    renderArea.style.backgroundColor = 'white';
    renderArea.style.color = 'black';

    const opt = {
        margin: 10,
        filename: 'notiz.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // @ts-ignore
    html2pdf().set(opt).from(renderArea).save().then(() => {
        renderArea.style.display = 'none';
    });
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('md-notepad-theme', newTheme);
    
    // ToastUI Theme wechseln
    const editorEl = document.querySelector('#editor-widget');
    if (newTheme === 'dark') {
        editorEl.classList.add('toastui-editor-dark');
    } else {
        editorEl.classList.remove('toastui-editor-dark');
    }
}

// Cursor Position (ToastUI hat kein direktes Event dafür wie CodeMirror)
// Wir lassen es für den Moment weg oder nutzen ein Klick-Event.

// Menü-Dropdown Logik (Klick statt nur Hover)
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasActive = item.classList.contains('active');
        closeAllMenus();
        if (!wasActive) item.classList.add('active');
    });
});

function closeAllMenus() {
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
}

window.addEventListener('click', closeAllMenus);

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
            case 's':
                e.preventDefault();
                document.getElementById('menu-save').click();
                break;
            case 'o':
                e.preventDefault();
                document.getElementById('menu-open').click();
                break;
            case 'n':
                e.preventDefault();
                document.getElementById('menu-new').click();
                break;
        }
    }
});

// Initialisierung
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('md-notepad-theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
        document.querySelector('#editor-widget').classList.add('toastui-editor-dark');
    }

    // Window Controls
    if (window.electronAPI) {
        document.querySelector('.win-btn.minify').addEventListener('click', () => window.electronAPI.minimize());
        document.querySelector('.win-btn.expand').addEventListener('click', () => window.electronAPI.maximize());
        document.querySelector('.win-btn.close').addEventListener('click', () => window.electronAPI.close());
    }

    // Language Initialisierung
    const savedLang = localStorage.getItem('md-notepad-lang') || 'de';
    setLanguage(savedLang);

    document.getElementById('lang-de').addEventListener('click', () => {
        setLanguage('de');
        alert('Sprache auf Deutsch gestellt. Bitte starte die App neu für volle Toolbar-Übersetzung.');
    });
    document.getElementById('lang-en').addEventListener('click', () => {
        setLanguage('en');
        alert('Language set to English. Please restart the app for full toolbar translation.');
    });

    // Hilfe Menü
    document.getElementById('menu-github').addEventListener('click', () => {
        window.electronAPI.openExternal('https://github.com/Lassandriel/MD-Editor');
    });
    document.getElementById('menu-about').addEventListener('click', () => {
        alert('NotepadMD v1.0.0\nEin minimalistischer Markdown-Editor.\nErstellt von Lassandriel.');
    });
});
