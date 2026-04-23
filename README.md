# 📝 NotepadMD

A minimalist, high-performance Markdown editor with a **WYSIWYG** (Wordpad-like) experience. Built with Electron, it offers a native desktop feel with all the power of Markdown.

![NotepadMD Logo](public/logo.png)

## ✨ Features

- **WYSIWYG Editing**: Write Markdown like you're using Wordpad. No more confusing symbols unless you want them!
- **Native Windows Integration**: Associate `.md` and `.txt` files directly with NotepadMD. Double-click to open!
- **Multi-Language Support**: Easily switch between **German** and **English** interfaces.
- **Modern UI**: Custom window controls and a sleek, responsive design with **Dark Mode** support.
- **Color Picker**: Highlight your text with custom colors using the built-in color syntax plugin.
- **PDF Export**: Export your notes into professionally formatted PDF documents.
- **Live Stats**: Real-time word and character count in the status bar.
- **Keyboard Shortcuts**: Power user features like `Ctrl+S` (Save), `Ctrl+O` (Open), and `Ctrl+N` (New).

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (latest LTS recommended)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Lassandriel/MD-Editor.git
   cd MD-Editor
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
To run the editor in development mode:
```bash
npm start
```

### Building the Executable
To create a standalone `.exe` for Windows:
1. Open your terminal as **Administrator** (required for symbolic links).
2. Run the build command:
   ```bash
   npm run dist
   ```
The installer will be available in the `dist/` folder.

## 🛠️ Built With
- [Electron](https://www.electronjs.org/) - Desktop framework
- [Toast UI Editor](https://ui.toast.com/tui-editor) - The WYSIWYG Markdown engine
- [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) - PDF generation

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---
Developed with ❤️ by [Lassandriel](https://github.com/Lassandriel)
