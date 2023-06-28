const { app, BrowserWindow } = require('electron');
globalThis.__playwright = require('../../packages/playwright-core');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });
  win.loadURL('about:blank');
})
