/* eslint-disable */
/**
 * نقطة تشغيل نسخة سطح المكتب (Electron) لنظام الكاشير.
 * التشغيل محليًا:
 *   npm i -D electron @electron/packager
 *   npm run build            # يبني نسخة الويب
 *   POS_URL=http://localhost:8080 npx electron .   (وضع التطوير)
 *   npx electron .           (يفتح ملف dist المبني)
 */
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const net = require('net');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: '#f3f4f6',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.POS_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    // ملف الويب المبني (عدّل المسار إن اختلف مجلد البناء لديك)
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'client', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* ============ طباعة صامتة على طابعة النظام (USB / مثبّتة في ويندوز) ============ */
ipcMain.handle('pos:print-html', async (_e, { html, printerName, silent = true }) => {
  const win = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
  try {
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    await new Promise((resolve, reject) => {
      win.webContents.print(
        { silent, printBackground: true, deviceName: printerName || undefined, margins: { marginType: 'none' } },
        (ok, err) => (ok ? resolve() : reject(new Error(err || 'فشل الطباعة'))),
      );
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err && err.message ? err.message : err) };
  } finally {
    win.destroy();
  }
});

/** قائمة الطابعات المثبّتة على الجهاز */
ipcMain.handle('pos:list-printers', async () => {
  if (!mainWindow) return [];
  const printers = await mainWindow.webContents.getPrintersAsync();
  return printers.map((p) => ({ name: p.name, isDefault: p.isDefault, status: p.status }));
});

/** طباعة أوامر ESC/POS الخام على طابعة شبكية (TCP/IP، المنفذ 9100 غالبًا) */
ipcMain.handle('pos:print-raw-network', async (_e, { host, port = 9100, dataBase64 }) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const buffer = Buffer.from(dataBase64, 'base64');
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(5000);
    socket.on('timeout', () => done({ success: false, error: 'انتهت مهلة الاتصال بالطابعة' }));
    socket.on('error', (err) => done({ success: false, error: err.message }));
    socket.connect(port, host, () => {
      socket.write(buffer, () => done({ success: true }));
    });
  });
});
