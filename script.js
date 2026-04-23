/**
 * @typedef {import('easymde')} EasyMDE
 */

// EasyMDE Initialisierung
const easyMDE = new EasyMDE({
    element: document.getElementById('my-text-editor'),
    spellChecker: false,
    autosave: {
        enabled: true,
        uniqueId: "notepademd-save-1",
        delay: 1000,
    },
    toolbar: [
        "bold", "italic", "heading", "|", 
        "quote", "unordered-list", "ordered-list", "|", 
        "link", "image", "table", "|", 
        "preview", "side-by-side", "fullscreen", "|", 
        "guide"
    ],
    placeholder: "Schreibe hier dein Markdown...",
    status: false,
    renderingConfig: {
        singleLineBreaks: false,
        codeSyntaxHighlighting: true,
    },
    previewRender: function(plainText) {
        // Standard Markdown Rendering
        const html = easyMDE.markdown(plainText);
        
        // Mermaid Rendering nach einem kurzen Delay (damit das HTML im DOM ist)
        setTimeout(async () => {
            const previewEl = document.querySelector('.editor-preview-active');
            if (previewEl) {
                const mermaidBlocks = previewEl.querySelectorAll('pre code.language-mermaid');
                for (let i = 0; i < mermaidBlocks.length; i++) {
                    const block = mermaidBlocks[i];
                    const content = block.textContent;
                    const id = `mermaid-svg-${i}-${Math.random().toString(36).substr(2, 9)}`;
                    try {
                        const { svg } = await mermaid.render(id, content);
                        block.parentElement.outerHTML = `<div class="mermaid">${svg}</div>`;
                    } catch (err) {
                        console.error('Mermaid error:', err);
                    }
                }
            }
        }, 50);
        
        return html;
    }
});

// Datei-Handhabung
const fileInput = /** @type {HTMLInputElement} */ (document.getElementById('file-input'));
const fileTitle = document.getElementById('file-title');
const cursorEl = document.getElementById('cursor-pos');

// Datei öffnen
document.getElementById('menu-open').addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = /** @type {HTMLInputElement} */(e.target).files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            easyMDE.value(event.target.result);
            fileTitle.textContent = `Notepad MD - ${file.name}`;
        };
        reader.readAsText(file);
    }
});

// Datei speichern
document.getElementById('menu-save').addEventListener('click', () => {
    const content = easyMDE.value();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dokument.md';
    a.click();
    URL.revokeObjectURL(url);
});

// Neu
document.getElementById('menu-new').addEventListener('click', () => {
    if (confirm('Möchtest du ein neues Dokument erstellen? Nicht gespeicherte Änderungen gehen verloren.')) {
        easyMDE.value('');
        fileTitle.textContent = 'Notepad MD - Unbenannt';
    }
});

// Bearbeiten Funktionen
document.getElementById('menu-undo').addEventListener('click', () => easyMDE.codemirror.undo());
document.getElementById('menu-redo').addEventListener('click', () => easyMDE.codemirror.redo());
document.getElementById('menu-clear').addEventListener('click', () => easyMDE.value(''));

// Ansicht Funktionen
document.getElementById('menu-toggle-theme').addEventListener('click', toggleTheme);
document.getElementById('menu-fullscreen').addEventListener('click', () => {
    easyMDE.toggleFullScreen();
});

// PDF Export (vom Menü aus)
document.getElementById('menu-export-pdf').addEventListener('click', exportToPDF);

async function exportToPDF() {
    const content = easyMDE.value();
    const renderArea = document.getElementById('pdf-render-area');
    
    // @ts-ignore
    renderArea.innerHTML = easyMDE.markdown(content);
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
}

// Cursor Position Update
easyMDE.codemirror.on('cursorActivity', () => {
    const pos = easyMDE.codemirror.getCursor();
    cursorEl.textContent = `Zeile ${pos.line + 1}, Spalte ${pos.ch + 1}`;
});

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

// Initialisierung
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('md-notepad-theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
});
