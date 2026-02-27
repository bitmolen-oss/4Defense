// Skrypt preload (bezpieczne IPC)
const { contextBridge, ipcRenderer } = require('electron');

// Eksportuj bezpieczne API do procesu renderowania
contextBridge.exposeInMainWorld('electronAPI', {
  // Informacje o aplikacji
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  getAppName: () => ipcRenderer.invoke('app-name'),
  
  // Zarządzanie oknem
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // Dialogi plikowe
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  
  // Nasłuchiwanie na zdarzenia z menu
  onMenuAction: (callback) => {
    const menuEvents = [
      'menu-new-profile',
      'menu-quick-start',
      'menu-last-level',
      'menu-save-state',
      'menu-preferences',
    ];
    
    menuEvents.forEach(event => {
      ipcRenderer.on(event, callback);
    });
  },
  
  // Usuwanie listenerów
  removeAllMenuListeners: (callback) => {
    ipcRenderer.removeAllListeners('menu-new-profile');
    ipcRenderer.removeAllListeners('menu-quick-start');
    ipcRenderer.removeAllListeners('menu-last-level');
    ipcRenderer.removeAllListeners('menu-save-state');
    ipcRenderer.removeAllListeners('menu-preferences');
  },
  
  // Platform detection
  platform: process.platform,
  
  // Development mode detection
  isDev: process.env.NODE_ENV === 'development',
  
  // Game launching
  launchGame: () => ipcRenderer.send('launch-game'),
  
  // Game closing
  closeGame: () => ipcRenderer.send('close-game'),
});

// Eksportuj API do zapisywania/odczytywania plików
contextBridge.exposeInMainWorld('fileAPI', {
  saveFile: async (data, filename) => {
    try {
      const result = await ipcRenderer.invoke('show-save-dialog');
      if (!result.canceled) {
        const fs = require('fs');
        fs.writeFileSync(result.filePath, data);
        return { success: true, path: result.filePath };
      }
      return { success: false, canceled: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  openFile: async () => {
    try {
      const result = await ipcRenderer.invoke('show-open-dialog');
      if (!result.canceled && result.filePaths.length > 0) {
        const fs = require('fs');
        const data = fs.readFileSync(result.filePaths[0], 'utf8');
        return { success: true, data, path: result.filePaths[0] };
      }
      return { success: false, canceled: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});

// Eksportuj API do systemowych powiadomień
contextBridge.exposeInMainWorld('notificationAPI', {
  showNotification: (title, body) => {
    const { Notification } = require('electron');
    
    if (Notification.isSupported()) {
      const notification = new Notification({
        title,
        body,
        icon: './public/assets/icon.png',
        silent: false,
      });
      
      notification.show();
      return true;
    }
    
    return false;
  },
});

// Eksportuj API do kontroli nad aplikacją
contextBridge.exposeInMainWorld('appAPI', {
  quit: () => {
    const { app } = require('electron');
    app.quit();
  },
  
  relaunch: () => {
    const { app } = require('electron');
    app.relaunch();
    app.exit();
  },
  
  focus: () => {
    const { app } = require('electron');
    const window = app.getWindow();
    if (window) {
      window.focus();
    }
  },
});

// Debug API (tylko w trybie deweloperskim)
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('debugAPI', {
    openDevTools: () => {
      ipcRenderer.send('open-dev-tools');
    },
    
    log: (...args) => {
      console.log('[Renderer]', ...args);
    },
    
    clearCache: () => {
      ipcRenderer.send('clear-cache');
    },
  });
}

// Zabezpieczenia - usuń niebezpieczne API
delete window.require;
delete window.exports;
delete window.module;
