const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 1200,
    icon: path.join(__dirname, 'assets/icon.ico'), 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 如果需要 IPC，否則可省略
      nodeIntegration: true, // 啟用 Node.js 在 renderer 中
      contextIsolation: false // 為了簡單，關閉隔離（生產環境建議啟用）
    }
  });

  win.loadFile('index.html');
    // 關鍵：啟用內建縮放功能
  win.webContents.setVisualZoomLevelLimits(1, 5); // 允許縮放到 300%
  
  // 或者更完整的設定（推薦）
  win.webContents.on('did-finish-load', () => {
    win.webContents.setZoomFactor(1.0); // 初始縮放 100%
  });
  // 初始化完成的次數，如果沒有就設為 0
  if (!store.has('completedSessions')) {
    store.set('completedSessions', 0);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC 處理選擇音樂檔案
ipcMain.handle('select-music', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Music', extensions: ['mp3', 'wav', 'ogg'] }]
  });
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

// IPC 處理儲存和取得完成的次數
ipcMain.handle('get-completed-sessions', () => {
  return store.get('completedSessions', 0);
});

ipcMain.on('increment-completed-sessions', () => {
  const current = store.get('completedSessions', 0);
  store.set('completedSessions', current + 1);
});

// 取得音量（預設 0.7）
ipcMain.handle('get-volume', () => {
  return store.get('volume', 0.7);
});

// 設定音量
ipcMain.on('set-volume', (event, vol) => {
  store.set('volume', vol);
});