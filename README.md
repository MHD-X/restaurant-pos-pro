# Restaurant POS Pro

أهلاً! 

أنا مطور أعمل على نظام نقاط بيع (POS) متكامل للمطاعم، وأريد تحويله إلى نظام احترافي وجاهز للإنتاج. سأرفع لك جميع ملفات المشروع، وأريد منك تحليلها وتطويرها بشكل شامل.

---

## 📂 هيكل المشروع الحالي:

project/
├── src/
│ ├── components/
│ │ ├── screens/
│ │ │ ├── PosScreen.tsx # شاشة نقاط البيع الرئيسية
│ │ │ ├── ProductsScreen.tsx # إدارة المنتجات
│ │ │ ├── ModifiersScreen.tsx # إدارة الإضافات
│ │ │ ├── BrandingScreen.tsx # هوية الفاتورة
│ │ │ ├── DeliveryScreen.tsx # مناطق التوصيل
│ │ │ ├── PrintersScreen.tsx # إعدادات الطباعة
│ │ │ ├── ReceiptSettingsScreen.tsx # إعدادات الفاتورة
│ │ │ ├── FinanceScreen.tsx # التحكم المالي
│ │ │ ├── TagsScreen.tsx # إدارة الوسوم
│ │ │ ├── UsersScreen.tsx # إدارة المستخدمين
│ │ │ ├── ShiftsScreen.tsx # إدارة الورديات
│ │ │ ├── ReportsScreen.tsx # التقارير
│ │ │ ├── AuditLogScreen.tsx # سجل التدقيق
│ │ │ └── BackupScreen.tsx # النسخ الاحتياطي
│ │ ├── ui/
│ │ │ ├── Modal.tsx # مكون المودال العام
│ │ │ ├── ConfirmDialog.tsx # مربع تأكيد
│ │ │ └── Toast.tsx # إشعارات
│ │ ├── CheckoutModal.tsx # نافذة الدفع
│ │ ├── KitchenTicket.tsx # معاينة تذكرة المطبخ
│ │ ├── PinPad.tsx # إدخال PIN
│ │ ├── Receipt.tsx # معاينة الفاتورة
│ │ └── Sidebar.tsx # القائمة الجانبية
│ ├── context/
│ │ └── SettingsContext.tsx # إدارة حالة الإعدادات
│ ├── utils/
│ │ ├── storage.ts # دوال التخزين
│ │ └── printer.ts # دوال الطباعة
│ ├── App.tsx # الملف الرئيسي
│ ├── index.css # الأنماط العامة
│ ├── main.tsx # نقطة الدخول
│ └── types.ts # تعريفات الأنواع
├── tailwind.config.js
├── package.json
└── index.html
و اصلح لى ااي مشكلة في الملفات و اذا عندك اي اضافات او تحسينات اعملها اريد نسخة جبارة من النظام و الشكل العام يكون جميل

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c1c9755d-0ada-4ae0-a7dc-24fd51df103b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
