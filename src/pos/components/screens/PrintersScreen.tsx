import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Button, Select } from '@/components/ui/Modal';
import { Printer, Save, Check, Receipt, Monitor, Info } from 'lucide-react';
import type { PrintMode } from '@/types';

export function PrintersScreen() {
  const { settings, update } = useSettings();
  const [paperWidth, setPaperWidth] = useState<80 | 58>(settings.printers.paperWidth);
  const [printMode, setPrintMode] = useState<PrintMode>(settings.printers.printMode);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    update((prev) => ({
      ...prev,
      printers: { paperWidth, printMode },
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50" dir="rtl">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Printer className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">إعدادات الطباعة</h1>
            <p className="text-sm text-gray-500 mt-1">إعداد الطابعة الحرارية ونظام الطباعة</p>
          </div>
        </div>

        {/* Print mode */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Monitor className="text-violet-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">نظام الطباعة</h2>
              <p className="text-xs text-gray-500">طباعة عبر المتصفح / النظام - متوافق مع الطابعات الحرارية SPRT</p>
            </div>
          </div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">سلوك الطباعة</label>
          <Select
            value={printMode}
            onChange={(e) => setPrintMode(e.target.value as PrintMode)}
            className="w-full"
          >
            <option value="preview">فتح نافذة المعاينة والطباعة (Print Preview & System Dialog)</option>
            <option value="direct">طباعة مباشرة صامتة (Direct Silent Print)</option>
          </Select>
          <div className="mt-3 bg-blue-50 rounded-xl p-3 flex items-start gap-2">
            <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-blue-700 leading-relaxed">
              {printMode === 'preview'
                ? 'يفتح نافذة معاينة الفاتورة ثم يستدعي مربع حوار الطباعة الخاص بالنظام لاختيار الطابعة الحرارية SPRT وإعداداتها.'
                : 'يستدعي الطباعة مباشرة دون نافذة معاينة. يتطلب تفعيل الطباعة الصامتة في إعدادات المتصفح أو استخدام متصفح Kiosk.'}
            </p>
          </div>
        </div>

        {/* Paper size */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">حجم الورق الحراري</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPaperWidth(80)}
              className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all active:scale-95 ${
                paperWidth === 80
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Receipt size={32} />
              <span className="text-lg font-bold">80mm</span>
              <span className="text-xs">العرض القياسي</span>
            </button>
            <button
              onClick={() => setPaperWidth(58)}
              className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all active:scale-95 ${
                paperWidth === 58
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Receipt size={28} />
              <span className="text-lg font-bold">58mm</span>
              <span className="text-xs">العرض المضيق</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button size="lg" onClick={handleSave}>
            {saved ? <><Check size={20} className="inline ml-1" /> تم الحفظ</> : <><Save size={20} className="inline ml-1" /> حفظ الإعدادات</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
