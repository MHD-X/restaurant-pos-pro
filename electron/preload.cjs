/* eslint-disable */
/** جسر آمن بين واجهة الويب وعمليات النظام (طباعة USB / شبكة). */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('posDesktop', {
  isDesktop: true,
  /** طباعة HTML صامتة على طابعة مثبّتة (USB أو مشتركة على ويندوز) */
  printHtml: (html, printerName, silent = true) =>
    ipcRenderer.invoke('pos:print-html', { html, printerName, silent }),
  /** قائمة الطابعات المتاحة */
  listPrinters: () => ipcRenderer.invoke('pos:list-printers'),
  /** إرسال أوامر ESC/POS خام لطابعة شبكية (Base64) */
  printRawNetwork: (host, port, dataBase64) =>
    ipcRenderer.invoke('pos:print-raw-network', { host, port, dataBase64 }),
});
