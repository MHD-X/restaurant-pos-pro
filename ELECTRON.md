# نسخة سطح المكتب (Electron) + الطباعة المباشرة

هذه الملفات جاهزة للبناء على جهازك (لا يمكن بناؤها داخل Lovable لأنه بيئة ويب).

## 1) التثبيت

```bash
npm i -D electron @electron/packager
```

أضف إلى `package.json`:

```json
{
  "main": "electron/main.cjs",
  "scripts": {
    "electron:dev": "POS_URL=http://localhost:8080 electron .",
    "electron:build": "vite build && electron-packager . \"AsayelPOS\" --overwrite --out=electron-release"
  }
}
```

> على ويندوز استخدم: `set POS_URL=http://localhost:8080 && electron .`

## 2) التشغيل

- وضع التطوير: شغّل خادم الويب ثم `npm run electron:dev`.
- نسخة مستقلة: `npm run electron:build` ثم افتح المجلد داخل `electron-release`.

## 3) الطباعة

داخل Electron يتوفر الكائن `window.posDesktop`:

| الدالة | الوظيفة |
| --- | --- |
| `printHtml(html, printerName, silent)` | طباعة صامتة على طابعة USB/مثبّتة بدون نافذة معاينة |
| `listPrinters()` | قائمة الطابعات المتاحة على الجهاز |
| `printRawNetwork(host, port, base64)` | إرسال أوامر ESC/POS خام لطابعة شبكية (المنفذ 9100) |

النظام يكتشف هذا الكائن تلقائيًا: إذا كنت داخل تطبيق سطح المكتب تتم الطباعة
صامتة مباشرة، وإلا يستخدم طباعة المتصفح العادية.

لأوامر ESC/POS الخام يمكنك استخدام `esc-pos-encoder`:

```bash
npm i esc-pos-encoder
```

```ts
import EscPosEncoder from 'esc-pos-encoder';
const data = new EscPosEncoder().initialize().align('center').text('مطعم أسايل').newline().cut().encode();
const b64 = btoa(String.fromCharCode(...data));
await window.posDesktop.printRawNetwork('192.168.1.50', 9100, b64);
```
