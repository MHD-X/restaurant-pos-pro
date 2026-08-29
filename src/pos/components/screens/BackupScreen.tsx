import { useRef, useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import type { Settings } from '@/types';
import { exportSettingsJSON, exportCSV, formatDateTime, formatMoney } from '@/utils/storage';
import { Button } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DatabaseBackup, Download, Upload, FileSpreadsheet, AlertTriangle } from 'lucide-react';

export function BackupScreen() {
  const { settings, set } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [importedData, setImportedData] = useState<Settings | null>(null);
  const [error, setError] = useState('');

  const handleExportJSON = () => {
    exportSettingsJSON(settings);
  };

  const handleExportOrdersCSV = () => {
    exportCSV(`orders-${new Date().toISOString().slice(0, 10)}.csv`,
      settings.orders.map((o) => ({
        number: o.number,
        type: o.type,
        total: o.total,
        paymentMethod: o.paymentMethod,
        cashier: o.cashierName,
        createdAt: formatDateTime(o.createdAt),
        voided: o.voided ? 'نعم' : 'لا',
      }))
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as Settings;
        if (!data.products || !data.orders) {
          setError('ملف غير صالح: بنية البيانات غير صحيحة');
          return;
        }
        setImportedData(data);
        setConfirmRestore(true);
        setError('');
      } catch {
        setError('تعذر قراءة الملف. تأكد من أنه ملف JSON صالح.');
      }
    };
    reader.readAsText(file);
  };

  const confirmRestoreData = () => {
    if (!importedData) return;
    set(importedData);
    setConfirmRestore(false);
    setImportedData(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50" dir="rtl">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center">
            <DatabaseBackup className="text-cyan-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">النسخ الاحتياطي والاستعادة</h1>
            <p className="text-sm text-gray-500 mt-1">تصدير واستيراد بيانات النظام</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <Download className="text-blue-600" size={24} />
            </div>
            <h3 className="font-bold text-gray-800 mb-1">تصدير نسخة كاملة (JSON)</h3>
            <p className="text-sm text-gray-500 mb-4">حفظ جميع البيانات (منتجات، طلبات، ورديات، إعدادات)</p>
            <Button onClick={handleExportJSON} className="w-full">
              <Download size={18} className="inline ml-1" />
              تصدير JSON
            </Button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-3">
              <FileSpreadsheet className="text-green-600" size={24} />
            </div>
            <h3 className="font-bold text-gray-800 mb-1">تصدير الطلبات (CSV)</h3>
            <p className="text-sm text-gray-500 mb-4">تصدير جدول الطلبات للتحليل المحاسبي</p>
            <Button variant="secondary" onClick={handleExportOrdersCSV} className="w-full">
              <FileSpreadsheet size={18} className="inline ml-1" />
              تصدير CSV
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
            <Upload className="text-orange-600" size={24} />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">استعادة من نسخة احتياطية</h3>
          <p className="text-sm text-gray-500 mb-4">استيراد ملف JSON لاستعادة جميع البيانات</p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="secondary" onClick={() => fileRef.current?.click()} className="w-full">
            <Upload size={18} className="inline ml-1" />
            اختيار ملف للاستعادة
          </Button>
          {error && (
            <div className="flex items-center gap-2 mt-3 text-sm text-red-600">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="bg-amber-50 rounded-2xl p-4 mt-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-amber-700">
            <p className="font-bold mb-1">تحذير</p>
            <p>الاستعادة تستبدل جميع البيانات الحالية. تأكد من عمل نسخة احتياطية قبل الاستعادة.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
          <h3 className="font-bold text-gray-800 mb-3">إحصائيات النظام</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox label="المنتجات" value={String(settings.products.length)} />
            <StatBox label="الطلبات" value={String(settings.orders.length)} />
            <StatBox label="الورديات" value={String(settings.shifts.length)} />
            <StatBox label="سجل التدقيق" value={String(settings.auditLog.length)} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmRestore}
        title="تأكيد الاستعادة"
        message="سيتم استبدال جميع البيانات الحالية بالبيانات من الملف. هل أنت متأكد؟"
        confirmLabel="استعادة"
        onConfirm={confirmRestoreData}
        onCancel={() => { setConfirmRestore(false); setImportedData(null); }}
      />
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
