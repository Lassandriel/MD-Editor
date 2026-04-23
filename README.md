# 📝 MD Editor

A minimalist, high-performance Markdown editor with a **WYSIWYG** (Wordpad-like) experience. 

[![Live Demo](https://img.shields.io/badge/Demo-Live_on_GitHub_Pages-brightgreen?style=for-the-badge&logo=github)](https://Lassandriel.github.io/MD-Editor/)
[![Platform](https://img.shields.io/badge/Platform-Windows_%7C_Web-blue?style=for-the-badge)](https://github.com/Lassandriel/MD-Editor/releases)

![MD Editor Screenshot](public/MD%20Editor.png)

## ✨ Features

- **🚀 Dual Mode**: Use it as a native **Windows Desktop App** for full system integration or directly in your **Web Browser** via GitHub Pages.
- **✍️ WYSIWYG Editing**: Write Markdown like you're using Wordpad. No more confusing symbols unless you want them!
- **🪟 Native Windows Integration**: Associate `.md` and `.txt` files directly with MD Editor. Double-click to open! (Desktop only)
- **🌍 Multi-Language Support**: Easily switch between **German** and **English** interfaces.
- **🎨 Modern UI**: Sleek, responsive design with **Dark Mode** support and custom window controls.
- **📄 PDF Export**: Export your notes into professionally formatted PDF documents.
- **📊 Live Stats**: Real-time word and character count in the status bar.
- **⌨️ Keyboard Shortcuts**: `Ctrl+S` (Save), `Ctrl+O` (Open), and `Ctrl+N` (New).

## 🚀 Getting Started

### 🌐 Web Version
Simply visit the [Live Demo](https://Lassandriel.github.io/MD-Editor/) to start writing immediately. No installation required!

### 💻 Desktop Version (Windows)
1. Download the latest `.exe` from the [Releases](https://github.com/Lassandriel/MD-Editor/releases) page.
2. Run the installer.
3. (Optional) Associate `.md` files with MD Editor to open them with a double-click.

---

### 🛠️ Development & Building

#### Prerequisites
- [Node.js](https://nodejs.org/) (latest LTS recommended)

#### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Lassandriel/MD-Editor.git
   cd MD-Editor
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

#### Local Run
```bash
npm start
```

#### Build Installer
To create a optimized standalone `.exe`:
```bash
npm run dist
```

## 🛠️ Built With
- [Electron](https://www.electronjs.org/) - Desktop framework
- [Toast UI Editor](https://ui.toast.com/tui-editor) - WYSIWYG Markdown engine
- [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) - PDF generation
- [GitHub Pages](https://pages.github.com/) - Web hosting

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---
Developed with ❤️ by [Lassandriel](https://github.com/Lassandriel)
