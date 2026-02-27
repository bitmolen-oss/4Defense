// Główny proces Electrona
const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = true; // Zawsze tryb deweloperski dla developmentu

// Zmienne globalne
let mainWindow = null;
let gameWindow = null;

// Funkcja tworząca główne okno
function createWindow() {
  // Konfiguracja okna
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    resizable: true,
    icon: path.join(__dirname, '../public/assets/icon.png'), // Ikona aplikacji
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'default', // Można zmienić na 'hidden' dla custom UI
    show: false, // Ukryj okno do czasu załadowania contentu
  });

  // Ładowanie aplikacji
  const startUrl = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Pokaż okno po załadowaniu
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // W trybie deweloperskim otwórz DevTools
    if (isDev) {
      // mainWindow.webContents.openDevTools();
    }
  });

  // Obsługa zamykania okna
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Obsługa nawigacji zewnętrznej (otwieranie linków w przeglądarce)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent new window creation
  mainWindow.webContents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
}

// Funkcja tworząca menu aplikacji
function createMenu() {
  const template = [
    {
      label: 'Plik',
      submenu: [
        {
          label: 'Nowy profil',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-profile');
          },
        },
        {
          label: 'Wyjście',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edycja',
      submenu: [
        { label: 'Cofnij', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Ponów', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Wytnij', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Kopiuj', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Wklej', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Zaznacz wszystko', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
      ],
    },
    {
      label: 'Widok',
      submenu: [
        { label: 'Przełącz pełny ekran', accelerator: 'F11', role: 'togglefullscreen' },
        { label: 'Przełącz narzędzia deweloperskie', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Powiększenie', role: 'zoomIn' },
        { label: 'Pomniejszenie', role: 'zoomOut' },
        { label: 'Rozmiar oryginalny', role: 'resetZoom' },
      ],
    },
    {
      label: 'Gra',
      submenu: [
        {
          label: 'Szybki start',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('menu-quick-start');
          },
        },
        {
          label: 'Ostatni poziom',
          accelerator: 'CmdOrCtrl+Shift+L',
          click: () => {
            mainWindow.webContents.send('menu-last-level');
          },
        },
        { type: 'separator' },
        {
          label: 'Zapisz stan',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-state');
          },
        },
      ],
    },
    {
      label: 'Pomoc',
      submenu: [
        {
          label: 'Strona gry',
          click: () => {
            shell.openExternal('https://your-game-website.com');
          },
        },
        {
          label: 'Discord',
          click: () => {
            shell.openExternal('https://discord.gg/your-server');
          },
        },
        {
          label: 'GitHub',
          click: () => {
            shell.openExternal('https://github.com/your-repo');
          },
        },
        { type: 'separator' },
        {
          label: 'O grze',
          click: async () => {
            await dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '4 Defense',
              message: '4 Defense',
              detail: 'Hybryda Tower Defense i MOBA\\nWersja: 1.0.0\\n\\n© 2026 Twoja Nazwa',
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];

  // Specjalne menu dla macOS
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: 'O ' + app.getName(), role: 'about' },
        { type: 'separator' },
        { label: 'Preferencje...', accelerator: 'Cmd+,', click: () => {
          mainWindow.webContents.send('menu-preferences');
        }},
        { type: 'separator' },
        { label: 'Usługi', role: 'services' },
        { type: 'separator' },
        { label: 'Ukryj ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
        { label: 'Ukryj inne', accelerator: 'Command+Shift+H', role: 'hideOthers' },
        { label: 'Pokaż wszystkie', role: 'unhide' },
        { type: 'separator' },
        { label: 'Wyjście', accelerator: 'Command+Q', click: () => app.quit() },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('app-name', () => {
  return app.getName();
});

// Game launching
ipcMain.on('launch-game', () => {
  if (gameWindow) {
    gameWindow.focus();
    return;
  }
  
  gameWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    show: false,
  });
  
  const gameUrl = isDev 
    ? 'http://localhost:5173/game.html'
    : `file://${path.join(__dirname, '../public/game.html')}`;
  
  gameWindow.loadURL(gameUrl);
  
  gameWindow.once('ready-to-show', () => {
    gameWindow.show();
  });
  
  gameWindow.on('closed', () => {
    gameWindow = null;
  });
});

// Game closing
ipcMain.on('close-game', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
});

ipcMain.handle('show-save-dialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: '4d-save.json',
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result;
});

ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    defaultPath: '.',
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });
  return result;
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Event handlers aplikacji
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle certificate errors (for development with self-signed certs)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    // Ignore certificate errors in development
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
