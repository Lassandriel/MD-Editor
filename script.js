// Globaler Editor-Scope
let editor;
let currentFilePath = null;
let isDirty = false;
let savedSnapshot = '';
let currentLang = 'en';

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
        'untitled': 'Unbenannt',
        'status-counts': (w, c) => `${w} Wörter, ${c} Zeichen`,
        'status-cursor': (l, col) => `Zeile ${l}, Spalte ${col}`,
        'confirm-new': 'Neues Dokument erstellen? Ungespeicherte Änderungen gehen verloren.',
        'confirm-discard': 'Ungespeicherte Änderungen verwerfen?',
        'lang-changed': 'Sprache geändert.',
        'save-error': 'Fehler beim Speichern: ',
        'load-error': 'Fehler beim Laden: ',
        'pdf-missing': 'PDF-Export nicht verfügbar (html2pdf nicht geladen).'
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
        'untitled': 'Untitled',
        'status-counts': (w, c) => `${w} words, ${c} chars`,
        'status-cursor': (l, col) => `Line ${l}, Col ${col}`,
        'confirm-new': 'Create new document? Unsaved changes will be lost.',
        'confirm-discard': 'Discard unsaved changes?',
        'lang-changed': 'Language changed.',
        'save-error': 'Save failed: ',
        'load-error': 'Load failed: ',
        'pdf-missing': 'PDF export unavailable (html2pdf not loaded).'
    }
};

function t(key) {
    return (translations[currentLang] || translations.en)[key];
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('md-editor-lang', lang);
    const tbl = translations[lang] || translations.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (typeof tbl[key] === 'string') el.textContent = tbl[key];
    });
    updateStatusBar();
    updateTitle();
}

function updateStatusBar() {
    if (!editor) return;
    const text = editor.getMarkdown();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    document.getElementById('word-count').textContent = t('status-counts')(words, chars);
}

function updateTitle() {
    const fileTitle = document.getElementById('file-title');
    if (!fileTitle) return;
    const name = currentFilePath ? currentFilePath.split(/[\\/]/).pop() : t('untitled');
    fileTitle.textContent = `MD Editor - ${name}${isDirty ? ' •' : ''}`;
}

function markDirty() {
    if (!editor) return;
    const dirty = editor.getMarkdown() !== savedSnapshot;
    if (dirty !== isDirty) {
        isDirty = dirty;
        window.mdEditorIsDirty = dirty; // für Electron-Close-Handler im Main-Prozess lesbar
        updateTitle();
    }
}

function markSaved() {
    savedSnapshot = editor ? editor.getMarkdown() : '';
    isDirty = false;
    window.mdEditorIsDirty = false;
    updateTitle();
}

function confirmDiscardIfDirty() {
    if (!isDirty) return true;
    return confirm(t('confirm-discard'));
}

// Initialisierung erst wenn DOM bereit
window.addEventListener('DOMContentLoaded', () => {
    // 1. Sicherheits-Check für Bibliotheken
    if (typeof toastui === 'undefined' || !toastui.Editor) {
        alert("Kritischer Fehler: Die Editor-Bibliothek wurde nicht geladen.");
        return;
    }

    // 2. UI Status Setup (Vor dem Editor, damit die Sprache stimmt)
    const savedTheme = localStorage.getItem('md-editor-theme') || 'dark';
    const savedLang = localStorage.getItem('md-editor-lang') || 'en';

    function buildEditor(theme, lang, initialMarkdown) {
        const el = document.querySelector('#editor-widget');
        el.innerHTML = '';
        const inst = new toastui.Editor({
            el,
            height: '100%',
            initialEditType: 'wysiwyg',
            previewStyle: 'vertical',
            hideModeSwitch: false,
            usageStatistics: false,
            initialValue: initialMarkdown || '',
            toolbarItems: [
                ['heading', 'bold', 'italic', 'strike'],
                ['hr', 'quote'],
                ['ul', 'ol', 'task', 'indent', 'outdent'],
                ['table', 'image', 'link'],
                ['code', 'codeblock']
            ],
            theme,
            language: lang === 'de' ? 'de-DE' : 'en-US',
            events: {
                change: () => { updateStatusBar(); markDirty(); updateCursorPos(); },
                caretChange: () => updateCursorPos(),
                focus: () => updateCursorPos()
            }
        });
        if (theme === 'dark') el.classList.add('toastui-editor-dark');
        else el.classList.remove('toastui-editor-dark');
        return inst;
    }

    // 3. Editor Initialisierung
    try {
        editor = buildEditor(savedTheme, savedLang, '');
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.add('hidden');
    } catch (e) {
        console.error("Detaillierter Fehler:", e);
        alert("Fehler bei der Konfiguration: " + e.message);
        return;
    }

    document.body.setAttribute('data-theme', savedTheme);
    setLanguage(savedLang);
    markSaved();

    // 3. Electron vs Web Check
    if (window.electronAPI) {
        document.body.classList.add('is-electron');
        window.electronAPI.onOpenFile((filePath) => loadFile(filePath));

        document.querySelector('.win-btn.minify').addEventListener('click', () => window.electronAPI.minimize());
        document.querySelector('.win-btn.expand').addEventListener('click', () => window.electronAPI.maximize());
        document.querySelector('.win-btn.close').addEventListener('click', () => {
            if (confirmDiscardIfDirty()) window.electronAPI.close();
        });
    }

    // Browser/Tab-Schließen-Warnung
    window.addEventListener('beforeunload', (e) => {
        if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    });

    function updateCursorPos() {
        const el = document.getElementById('cursor-pos');
        if (!el || !editor) return;
        try {
            const md = editor.getMarkdown();
            // Toast UI: getSelection() liefert je nach Modus [start, end] mit {line,ch} oder Offsets
            const sel = editor.getSelection();
            let line = 1, col = 1;
            if (Array.isArray(sel) && sel.length) {
                const s = sel[0];
                if (typeof s === 'number') {
                    const upto = md.slice(0, s);
                    const lines = upto.split('\n');
                    line = lines.length;
                    col = lines[lines.length - 1].length + 1;
                } else if (Array.isArray(s)) {
                    line = s[0] + 1; col = s[1] + 1;
                } else if (s && typeof s === 'object') {
                    line = (s.line || 0) + 1;
                    col = (s.ch || 0) + 1;
                }
            }
            el.textContent = t('status-cursor')(line, col);
        } catch { /* Toast UI API-Varianten — still bleiben statt fehlschlagen */ }
    }

    async function loadFile(filePath) {
        if (!confirmDiscardIfDirty()) return;
        try {
            const res = await window.electronAPI.readFile(filePath);
            if (!res.ok) { alert(t('load-error') + res.error); return; }
            editor.setMarkdown(res.content);
            currentFilePath = filePath;
            markSaved();
        } catch (err) {
            alert(t('load-error') + err.message);
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
            if (!confirmDiscardIfDirty()) return;
            const input = document.getElementById('web-file-input');
            input.value = '';
            input.click();
        }
    });

    document.getElementById('web-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                editor.setMarkdown(ev.target.result);
                currentFilePath = file.name;
                markSaved();
            };
            reader.readAsText(file);
        }
    });

    document.getElementById('menu-save').addEventListener('click', async () => {
        if (window.electronAPI) {
            if (!currentFilePath) {
                const result = await window.electronAPI.showSaveDialog();
                if (!result.canceled && result.filePath) {
                    let p = result.filePath;
                    // Fehlende Endung ergänzen (Dialog-Filter sind nur visuelle Suggestion)
                    if (!/\.(md|txt|markdown)$/i.test(p)) p += '.md';
                    currentFilePath = p;
                } else return;
            }
            const res = await window.electronAPI.writeFile(currentFilePath, editor.getMarkdown());
            if (!res.ok) { alert(t('save-error') + res.error); return; }
            markSaved();
        } else {
            const blob = new Blob([editor.getMarkdown()], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const base = (currentFilePath && currentFilePath.replace(/\.[^.]+$/, '')) || t('untitled');
            a.download = `${base}.md`;
            a.click();
            URL.revokeObjectURL(url);
            // Optimistisch: Browser meldet nicht zurück, ob der Download tatsächlich gespeichert wurde.
            markSaved();
        }
    });

    document.getElementById('menu-new').addEventListener('click', () => {
        if (!isDirty || confirm(t('confirm-new'))) {
            editor.setMarkdown('');
            currentFilePath = null;
            markSaved();
        }
    });

    // Menü-Dropdowns:
    //  - Hover öffnet (CSS),
    //  - Klick aufs Label togglet `.active` für „angepinnt offen halten",
    //  - Klicks aus dem Dropdown selbst togglen NICHT erneut (sonst bleibt es offen nach Action).
    document.querySelectorAll('.menu-bar > .menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Klick stammt aus einem Dropdown-Eintrag (Action) → nicht togglen
            if (e.target.closest('.dropdown')) return;
            e.stopPropagation();
            const wasActive = item.classList.contains('active');
            closeAllMenus();
            if (!wasActive) item.classList.add('active');
        });
    });
    // Submenü-Klicks dürfen das Eltern-Menü NICHT schließen
    document.querySelectorAll('.menu-item.submenu').forEach(sub => {
        sub.addEventListener('click', (e) => e.stopPropagation());
    });
    // Action-Klick aus einem Dropdown → Menü schließen (außer Submenü-Container)
    document.querySelectorAll('.menu-bar .dropdown > div').forEach(item => {
        if (item.classList.contains('divider') || item.classList.contains('menu-item')) return;
        item.addEventListener('click', () => closeAllMenus());
    });

    function closeAllMenus() {
        document.querySelectorAll('.menu-bar .menu-item').forEach(el => el.classList.remove('active'));
    }

    // Sonstige UI Events
    document.getElementById('menu-undo').addEventListener('click', () => editor.exec('undo'));
    document.getElementById('menu-redo').addEventListener('click', () => editor.exec('redo'));

    // Tastatur-Shortcuts
    window.addEventListener('keydown', (e) => {
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && !e.shiftKey && !e.altKey) {
            const key = e.key.toLowerCase();
            const map = { s: 'menu-save', o: 'menu-open', n: 'menu-new', p: 'menu-export-pdf' };
            if (map[key]) {
                e.preventDefault();
                document.getElementById(map[key]).click();
                return;
            }
        }
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
    });
    document.getElementById('menu-clear').addEventListener('click', () => {
        if (!isDirty || confirm(t('confirm-discard'))) {
            editor.setMarkdown('');
            currentFilePath = null;
            markSaved();
        }
    });
    document.getElementById('menu-toggle-theme').addEventListener('click', toggleTheme);
    document.getElementById('menu-fullscreen').addEventListener('click', toggleFullscreen);
    document.getElementById('menu-export-pdf').addEventListener('click', exportToPDF);
    
    function switchLanguage(lang) {
        if (lang === currentLang) return;
        const md = editor.getMarkdown();
        const theme = document.body.getAttribute('data-theme') || 'dark';
        const prevSnapshot = savedSnapshot; // letzter gespeicherter Stand sichern
        const wasDirty = isDirty;
        try { editor.destroy(); } catch {}
        setLanguage(lang);
        editor = buildEditor(theme, lang, md);
        markSaved(); // setzt savedSnapshot = aktueller Inhalt
        if (wasDirty) {
            savedSnapshot = prevSnapshot; // korrekten Snapshot wiederherstellen
            isDirty = true;
            window.mdEditorIsDirty = true;
            updateTitle();
        }
    }
    document.getElementById('lang-de').addEventListener('click', () => switchLanguage('de'));
    document.getElementById('lang-en').addEventListener('click', () => switchLanguage('en'));

    document.getElementById('menu-github').addEventListener('click', () => {
        const url = 'https://github.com/Lassandriel/MD-Editor';
        if (window.electronAPI) window.electronAPI.openExternal(url);
        else window.open(url, '_blank');
    });

    const aboutModal = document.getElementById('about-modal');
    document.getElementById('menu-about').addEventListener('click', () => aboutModal.style.display = 'block');
    document.getElementById('close-about').addEventListener('click', () => aboutModal.style.display = 'none');

    // Globaler Click: schließt Menüs und Modal bei Klick außerhalb
    window.addEventListener('click', (e) => {
        closeAllMenus();
        if (e.target === aboutModal) aboutModal.style.display = 'none';
    });

    function toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('md-editor-theme', newTheme);
        const md = editor.getMarkdown();
        const prevSnapshot = savedSnapshot; // letzter gespeicherter Stand sichern
        const wasDirty = isDirty;
        try { editor.destroy(); } catch {}
        editor = buildEditor(newTheme, currentLang, md);
        markSaved(); // setzt savedSnapshot = aktueller Inhalt
        if (wasDirty) {
            savedSnapshot = prevSnapshot; // korrekten Snapshot wiederherstellen
            isDirty = true;
            window.mdEditorIsDirty = true;
            updateTitle();
        }
    }

    function toggleFullscreen() {
        const el = document.querySelector('.editor-container');
        if (!document.fullscreenElement) el.requestFullscreen();
        else document.exitFullscreen();
    }

    async function exportToPDF() {
        if (typeof html2pdf === 'undefined') { alert(t('pdf-missing')); return; }
        const renderArea = document.getElementById('pdf-render-area');
        renderArea.innerHTML = editor.getHTML();
        // Off-screen rendern statt sichtbar zu flashen
        renderArea.style.cssText = 'position:fixed;left:-10000px;top:0;display:block;width:800px;';
        const base = (currentFilePath && currentFilePath.split(/[\\/]/).pop().replace(/\.[^.]+$/, '')) || t('untitled');
        const opt = { margin: 10, filename: `${base}.pdf`, jsPDF: { unit: 'mm', format: 'a4' } };
        try {
            await html2pdf().set(opt).from(renderArea).save();
        } catch (err) {
            console.error('PDF export failed:', err);
            alert('PDF: ' + err.message);
        } finally {
            renderArea.style.cssText = 'display:none;';
            renderArea.innerHTML = '';
        }
    }
});
