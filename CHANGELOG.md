# Changelog

All notable changes to this project will be documented in this file.

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
