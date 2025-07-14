const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
    },
  });

  console.log("ENV:", process.env.NODE_ENV);
  console.log("isDev:", isDev);

  if (isDev) {
    console.log("Loading from Vite dev server: http://localhost:5173");
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    console.log("Loading local file:", indexPath);
    win.loadFile(indexPath).catch(err => {
      console.error("Failed to load index.html:", err);
    });
    win.webContents.openDevTools(); // keep this open temporarily to inspect production issues
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
