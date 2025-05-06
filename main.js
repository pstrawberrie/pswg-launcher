const path = require('node:path');
const settings = require('./settings.js');
const {
  app,
  ipcMain,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  dialog,
} = require('electron');

const appIcon = nativeImage.createFromPath('assets/icon.png');
let mainWindow;
let tray;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    title: settings.constants.TITLE,
    width: 800,
    height: 450,
    resizable: false,
    fullscreenable: false,
    maximizable: false,
    minimizable: true,
    backgroundColor: '#000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.removeMenu();// removes the default menu bar
  mainWindow.setIcon(appIcon);
  mainWindow.webContents.openDevTools(); // @TODO: FIND A WAY TO DETERMINE IF IT IS DEV OR PROD
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  // Tray Icon + Menu
  tray = new Tray(appIcon);
  const trayMenu = Menu.buildFromTemplate([
    { label: 'Item1', type: 'radio' },
    { label: 'Item2', type: 'radio' },
    { label: 'Item3', type: 'radio', checked: true },
    { label: 'Item4', type: 'radio' }
  ]);
  tray.setContextMenu(trayMenu);
  tray.setToolTip('pSWG tooltip');
  tray.setTitle('pSWG title');

  // IPC
  ipcMain.handle('ping', () => 'pong');
  ipcMain.handle('getSettings', () => settings);
  ipcMain.handle('selectInstallDir', () => dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'openDirectory']
  }).then(result => {
    console.log(`result.canceled: ${result.canceled}`);
    console.log(`result.filePaths: ${result.filePaths[0]}`);
    return result.canceled ? null : result.filePaths[0];
  }).catch(err => {
    console.log(err)
  }));

  // Create Window
  createWindow();
});

// Exit when all windows closed
// - currently windows only
app.on('window-all-closed', () => app.quit());