import { enable, initialize } from '@electron/remote/main';
import { app, BrowserWindow, ipcMain } from 'electron';
import electronDebug from 'electron-debug';
import electronReloader from 'electron-reloader';
import Store from 'electron-store';
import * as fs from 'fs';
import * as path from 'path';

let win: BrowserWindow | null = null;
const store = new Store();
const args = process.argv.slice(1),
  serve = args.some((val) => val === '--serve');
const windowConfig: Electron.BrowserWindowConstructorOptions = {
  width: 1280,
  height: 680,
  frame: false,
  backgroundColor: '#212529',
  webPreferences: {
    // webSecurity: false,
    webviewTag: true,
    nodeIntegration: true,
    // allowRunningInsecureContent: (serve),
    contextIsolation: false,
  },
};

function createWindow(): BrowserWindow {
  initialize();

  // Create the browser window.
  Object.assign(windowConfig, store.get('winBounds'));
  win = new BrowserWindow(windowConfig);

  if ((windowConfig as any).isMaximized) {
    win.maximize();
  }

  enable(win.webContents);

  if (serve) {
    const debug = require('electron-debug') as typeof electronDebug;
    debug();

    debug.openDevTools(win);

    (require('electron-reloader') as typeof electronReloader)(module);
    win.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
      // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    const url = new URL(path.join('file:', __dirname, pathIndex));
    win.loadURL(url.href);
  }

  win.on('close', () => {
    // Saves window's properties using electron-store
    Object.assign(windowConfig, win?.getNormalBounds());

    store.set('winBounds', {
      width: windowConfig.width,
      height: windowConfig.height,
      x: windowConfig.x,
      y: windowConfig.y,
      isMaximized: win?.isMaximized(),
    });
  });

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

  ipcMain.handle('getStoreValue', (event, key: string, defaultValue) => {
    return store.get(key, defaultValue);
  });

  ipcMain.handle('setStoreValue', (event, key: string, value) => {
    return store.set(key, value);
  });
} catch (e) {
  // Catch Error
  // throw e;
}
