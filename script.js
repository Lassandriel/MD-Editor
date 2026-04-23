// Globaler Editor-Scope
let editor;
let currentFilePath = null;

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
        'menu-about': 'Über MD Editor',
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
        'menu-about': 'About MD Editor',
        'untitled': 'Untitled'
    }
};

function setLanguage(lang) {
    localStorage.setItem('md-editor-lang', lang);
    const t = translations[lang] || translations.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });
}

function updateStatusBar() {
    if (!editor) return;
    const text = editor.getMarkdown();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    document.getElementById('word-count').textContent = `${words} Wörter, ${chars} Zeichen`;
}

// Initialisierung erst wenn DOM bereit
window.addEventListener('DOMContentLoaded', () => {
    // 1. Sicherheits-Check für Bibliotheken
    if (typeof toastui === 'undefined' || !toastui.Editor) {
        console.error("ToastUI konnte nicht geladen werden. CDN eventuell blockiert?");
        alert("Kritischer Fehler: Die Editor-Bibliothek konnte nicht geladen werden. Bitte prüfe deine Internetverbindung oder schalte Ad-Blocker/Tracking-Schutz kurzzeitig aus.");
        return;
    }

    // 2. Editor Initialisierung
    try {
        editor = new toastui.Editor({
            el: document.querySelector('#editor-widget'),
            height: '100%',
            initialEditType: 'wysiwyg',
            previewStyle: 'tab',
            hideModeSwitch: true,
            usageStatistics: false,
            toolbarItems: [
                ['heading', 'bold', 'italic', 'strike'],
                ['hr', 'quote'],
                ['ul', 'ol', 'task', 'indent', 'outdent'],
                ['table', 'image', 'link'],
                ['code', 'codeblock']
            ],
            plugins: [toastui.Editor.plugin.colorSyntax],
            theme: localStorage.getItem('md-editor-theme') === 'dark' ? 'dark' : 'light',
            language: localStorage.getItem('md-editor-lang') === 'en' ? 'en-US' : 'de-DE',
            events: {
                change: () => updateStatusBar()
            }
        });
    } catch (e) {
        console.error("Editor konnte nicht geladen werden:", e);
        alert("Fehler: Der Editor konnte nicht geladen werden. Bitte Seite neu laden.");
        return;
    }

    // 2. UI Status Setup
    const savedTheme = localStorage.getItem('md-editor-theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
        document.querySelector('#editor-widget').classList.add('toastui-editor-dark');
    }
    const savedLang = localStorage.getItem('md-editor-lang') || 'de';
    setLanguage(savedLang);

    // 3. Electron vs Web Check
    if (window.electronAPI) {
        document.body.classList.add('is-electron');
        window.electronAPI.onOpenFile((filePath) => loadFile(filePath));
        
        document.querySelector('.win-btn.minify').addEventListener('click', () => window.electronAPI.minimize());
        document.querySelector('.win-btn.expand').addEventListener('click', () => window.electronAPI.maximize());
        document.querySelector('.win-btn.close').addEventListener('click', () => window.electronAPI.close());
    }

    // 4. Datei-Logik
    const fileTitle = document.getElementById('file-title');

    async function loadFile(filePath) {
        try {
            const content = await window.electronAPI.readFile(filePath);
            editor.setMarkdown(content);
            currentFilePath = filePath;
            const fileName = filePath.split(/[\\/]/).pop();
            fileTitle.textContent = `MD Editor - ${fileName}`;
        } catch (err) {
            console.error('Fehler beim Laden:', err);
        }
    }

    // Menü-Events
    document.getElementById('menu-open').addEventListener('click', async () => {
        if (window.electronAPI) {
            const result = await window.electronAPI.showOpenDialog();
            if (!result.canceled && result.filePaths.length > 0) {
                loadFile(result.filePaths[0]);
            }
        } else {
            document.getElementById('web-file-input').click();
        }
    });

    document.getElementById('web-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                editor.setMarkdown(ev.target.result);
                fileTitle.textContent = `MD Editor - ${file.name}`;
            };
            reader.readAsText(file);
        }
    });

    document.getElementById('menu-save').addEventListener('click', async () => {
        if (window.electronAPI) {
            if (!currentFilePath) {
                const result = await window.electronAPI.showSaveDialog();
                if (!result.canceled && result.filePath) currentFilePath = result.filePath;
                else return;
            }
            await window.electronAPI.writeFile(currentFilePath, editor.getMarkdown());
            fileTitle.textContent = `MD Editor - ${currentFilePath.split(/[\\/]/).pop()}`;
        } else {
            const blob = new Blob([editor.getMarkdown()], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'notiz.md';
            a.click();
            URL.revokeObjectURL(url);
        }
    });

    document.getElementById('menu-new').addEventListener('click', () => {
        if (confirm('Neues Dokument erstellen?')) {
            editor.setMarkdown('');
            fileTitle.textContent = 'MD Editor - Unbenannt';
            currentFilePath = null;
        }
    });

    // Menü-Dropdowns
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasActive = item.classList.contains('active');
            closeAllMenus();
            if (!wasActive) item.classList.add('active');
        });
    });

    function closeAllMenus() {
        document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    }
    window.addEventListener('click', closeAllMenus);

    // Sonstige UI Events
    document.getElementById('menu-undo').addEventListener('click', () => document.execCommand('undo'));
    document.getElementById('menu-redo').addEventListener('click', () => document.execCommand('redo'));
    document.getElementById('menu-clear').addEventListener('click', () => editor.setMarkdown(''));
    document.getElementById('menu-toggle-theme').addEventListener('click', toggleTheme);
    document.getElementById('menu-fullscreen').addEventListener('click', toggleFullscreen);
    document.getElementById('menu-export-pdf').addEventListener('click', exportToPDF);
    
    document.getElementById('lang-de').addEventListener('click', () => { setLanguage('de'); alert('Sprache geändert.'); });
    document.getElementById('lang-en').addEventListener('click', () => { setLanguage('en'); alert('Language changed.'); });

    document.getElementById('menu-github').addEventListener('click', () => {
        const url = 'https://github.com/Lassandriel/MD-Editor';
        if (window.electronAPI) window.electronAPI.openExternal(url);
        else window.open(url, '_blank');
    });

    const aboutModal = document.getElementById('about-modal');
    document.getElementById('menu-about').addEventListener('click', () => aboutModal.style.display = 'block');
    document.getElementById('close-about').addEventListener('click', () => aboutModal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === aboutModal) aboutModal.style.display = 'none'; });

    function toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('md-editor-theme', newTheme);
        const editorEl = document.querySelector('#editor-widget');
        if (newTheme === 'dark') editorEl.classList.add('toastui-editor-dark');
        else editorEl.classList.remove('toastui-editor-dark');
    }

    function toggleFullscreen() {
        const el = document.querySelector('.editor-container');
        if (!document.fullscreenElement) el.requestFullscreen();
        else document.exitFullscreen();
    }

    async function exportToPDF() {
        const renderArea = document.getElementById('pdf-render-area');
        renderArea.innerHTML = editor.getHTML();
        renderArea.style.display = 'block';
        const opt = { margin: 10, filename: 'notiz.pdf', jsPDF: { unit: 'mm', format: 'a4' } };
        // @ts-ignore
        html2pdf().set(opt).from(renderArea).save().then(() => renderArea.style.display = 'none');
    }
});
