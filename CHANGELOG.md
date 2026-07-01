# Changelog

All notable changes to this project will be documented in this file.

## [1.2.1] - 2026-07-01

### Fixed
- **About Modal invisible**: CSS variables `--win-accent` and `--win-text` were never defined, making the About text and "Close" button transparent. Replaced with `var(--accent-color)` and `var(--text-primary)`.
- **Cursor position off-by-one**: In Markdown mode, the status bar showed `Line 0, Col 0` instead of `Line 1, Col 1` due to a missing `+1` offset in the array-branch of `updateCursorPos()`.
- **Dirty-state lost on language switch**: Switching language called `markSaved()` unconditionally, clearing the unsaved-changes indicator (`•` in title) and disabling the close-warning dialog. The dirty state is now preserved across the editor rebuild.
- **Dirty-state lost on theme toggle**: Same issue as above — toggling the theme no longer clears unsaved-changes tracking.
- **About Modal hidden behind dropdowns**: Modal `z-index` was `1000`, below the dropdown `z-index` of `5000`. Raised to `6000`.
- **Web file input missing `.markdown` extension**: The hidden file input now accepts `.md`, `.txt`, and `.markdown`, consistent with Electron's save/load dialogs.

---

## [1.2.0] - 2026-05-30

### Added
- **Keyboard Shortcuts**: Ctrl+S (Save), Ctrl+O (Open), Ctrl+N (New), Ctrl+P (Export PDF), F11 (Fullscreen). Shortcuts are also shown next to menu entries.
- **Hover Menus**: File / Edit / View / Help dropdowns now open on hover, not only on click.
- **Unsaved Changes Protection**: Confirms before discarding edits via New / Open / Clear / Close. Title shows a `•` marker when there are unsaved changes; Electron's window close (Alt+F4, taskbar, OS shutdown) also triggers the prompt.
- **Cursor Position**: Status bar now updates `Line / Col` while typing.
- **Single-Instance Lock (Electron)**: Opening a second `.md` file from Explorer now forwards the path to the existing window instead of spawning a new app instance.
- **Save Dialog Extension Enforcement**: Auto-appends `.md` when the user saves without an extension.

### Fixed
- **Undo / Redo**: Replaced deprecated `document.execCommand` with `editor.exec('undo'/'redo')` so the menu entries actually work.
- **Theme Toggle**: Full rebuild of the editor on theme switch — previously the Toast UI toolbar stayed in the old theme. Also fixed missing CSS variables (`--win-header-bg`, `--win-hover`) that caused transparent/broken toolbar backgrounds.
- **Language Switch**: Editor now actually reinitializes with the new language; dynamic strings (status bar, confirms, title) are now translated too.
- **Transparent Dropdowns**: Menu dropdowns were clashing with Toast UI's own `.dropdown` class. Scoped to `.menu-bar .dropdown` and made opaque.
- **Submenu Closing Parent**: Language submenu no longer closes the parent View menu on click.
- **Menu Stays Open After Action**: Clicking a dropdown item now properly closes the menu.
- **Web File Input Repeat-Open**: Reset input value so the same file can be re-opened.
- **PDF Export**: Adds a missing `html2pdf` check, off-screen rendering (no more flicker), proper error handling, filename derived from the current document.
- **Save / Load Error Feedback**: Failures in Electron's file IO now surface as alerts instead of silent console errors. Switched to async `fs/promises`.
- **IPC Handler Duplication**: Window-control handlers no longer get re-registered when the window is recreated; they operate on the sender's window.
- **File Association Robustness**: `.md`/`.txt` argument detection ignores flags and verifies the file actually exists.
- **Hardcoded Web Download Name**: Uses the current document name instead of always saving as `notiz.md`.
- **Cursor Status Bar**: Was previously hardcoded text that never updated.
- **Tooltip Position**: Toolbar tooltips moved below the toolbar (with a gap) so the cursor no longer blocks them.

### Security
- **External Link Validation**: `open-external` IPC now only accepts `http(s)://` URLs.

### Changed
- **Loading Overlay**: Hidden immediately after the editor is ready instead of a hardcoded 300 ms delay.

---

## [1.1.0] - 2026-04-23

### Added
- **Hybrid Web Support**: The editor now works natively in the browser via GitHub Pages.
- **Web File Fallback**: Implemented a fallback system for opening and saving (downloading) files when running in non-Electron environments.
- **GitHub Pages Optimization**: Added `.nojekyll` file to bypass Jekyll processing for faster and more reliable deployments.
- **Theme Persistence**: Theme and language settings are now saved in `localStorage`.

### Fixed
- **Theme Color Fix**: Resolved an issue with invisible text (white-on-white) when switching themes.
- **Toolbar Theme Consistency**: Forced the editor toolbar to match the application's light/dark theme.
- **Code Block Readability**: Ensured code blocks remain legible regardless of the active theme.
- **Initialization Stability**: Improved script loading to ensure all components are ready before the editor starts.

### Changed
- **Build Optimization**: Enabled maximum compression and excluded unnecessary files from the installer (reduced size to ~95MB).
- **UI Polishing**: Refined toolbar buttons with a cleaner, borderless look and smooth hover effects.

---

## [1.0.0] - Initial Release
- Initial version of MD Editor with ToastUI integration.
- Windows window integration (Minimize, Close).
- PDF export functionality.
- Basic Dark/Light theme support.
