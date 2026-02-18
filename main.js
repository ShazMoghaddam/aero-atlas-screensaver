/**
 * Aero Atlas — Terminal Time Screensaver
 * Electron main process
 */

const { app, BrowserWindow, screen, globalShortcut, ipcMain } = require('electron');
const path = require('path');

// ── Screensaver mode detection ──────────────────────────────────────────────
// On macOS, the system passes /s, /S, or -s flags when launching as screensaver
const args = process.argv.slice(1);
const isScreensaverMode = args.some(a =>
  ['/s', '-s', '/S', '-S', '--screensaver'].includes(a.toLowerCase())
);

// Preview mode (Windows taskbar preview pane) — just show a small preview
const isPreviewMode = args.some(a => a.toLowerCase().startsWith('/p'));

let windows = [];
let mouseCheckInterval = null;
let lastMousePos = null;
let idleTimer = null;

// ── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  if (isPreviewMode) {
    // Tiny preview — do nothing meaningful
    createPreviewWindow();
    return;
  }

  const displays = screen.getAllDisplays();

  if (isScreensaverMode) {
    // Open on every connected display
    displays.forEach((display, i) => {
      createScreensaverWindow(display, i === 0);
    });
    startMouseWatcher();
  } else {
    // Standalone / manual launch — open on primary display, fullscreen
    createScreensaverWindow(screen.getPrimaryDisplay(), true);
    startMouseWatcher();
  }

  // Block all keyboard shortcuts from leaking through
  globalShortcut.register('Escape', quitScreensaver);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (mouseCheckInterval) clearInterval(mouseCheckInterval);
  if (idleTimer) clearTimeout(idleTimer);
});

app.on('window-all-closed', () => app.quit());

// ── Window factories ─────────────────────────────────────────────────────────
function createScreensaverWindow(display, isPrimary) {
  const { x, y, width, height } = display.bounds;

  const win = new BrowserWindow({
    x, y, width, height,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    fullscreen: true,
    kiosk: false,
    backgroundColor: '#080808',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
    // Pass display info so the screensaver can adapt layout
    win.webContents.send('screensaver-info', {
      isPrimary,
      displayWidth: width,
      displayHeight: height,
      isScreensaverMode,
    });
  });

  // Prevent right-click context menus in screensaver mode
  win.webContents.on('context-menu', (e) => e.preventDefault());

  windows.push(win);
  return win;
}

function createPreviewWindow() {
  const win = new BrowserWindow({
    width: 320,
    height: 240,
    frame: false,
    show: false,
    backgroundColor: '#080808',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.once('ready-to-show', () => win.show());
  windows.push(win);
}

// ── Screensaver exit logic ───────────────────────────────────────────────────
function quitScreensaver() {
  windows.forEach(w => { try { w.close(); } catch (_) {} });
  app.quit();
}

// Watch for any mouse movement or click → exit screensaver
function startMouseWatcher() {
  lastMousePos = screen.getCursorScreenPoint();

  // Give the screensaver 1 second to settle before watching mouse
  idleTimer = setTimeout(() => {
    mouseCheckInterval = setInterval(() => {
      const pos = screen.getCursorScreenPoint();
      if (
        Math.abs(pos.x - lastMousePos.x) > 8 ||
        Math.abs(pos.y - lastMousePos.y) > 8
      ) {
        // Only exit if we're in actual screensaver mode (not manual launch)
        if (isScreensaverMode) quitScreensaver();
        else lastMousePos = pos; // In manual mode just update, don't quit
      }
    }, 150);
  }, 1000);
}

// Listen for quit signal from renderer (e.g. if user clicks a close button)
ipcMain.on('quit-screensaver', quitScreensaver);
