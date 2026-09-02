import { useState } from 'react';
import { useSettings } from '@/pos/context/SettingsContext';
import type { ReceiptDesign, ReceiptSettings } from '@/pos/types';
import { DEFAULT_RECEIPT_DESIGN } from '@/pos/types';
import { Button, Input, Field, TextArea } from '@/pos/components/ui/Modal';
import { Save, Check, Receipt as ReceiptIcon, Eye, EyeOff } from 'lucide-react';

export function ReceiptSettingsScreen() {
  const { settings, update } = useSettings();
  const [cfg, setCfg] = useState<ReceiptSettings>(settings.receiptSettings);
  const [design, setDesign] = useState<ReceiptDesign>({
    ...DEFAULT_RECEIPT_DESIGN,
    ...settings.receiptDesign,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    update((prev) => ({ ...prev, receiptSettings: cfg, receiptDesign: design }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggle = (key: keyof ReceiptSettings) => {
    setCfg({ ...cfg, [key]: !cfg[key] });
  };

  const toggleDesign = (key: keyof ReceiptDesign) => {
    setDesign({ ...design, [key]: !design[key] });
  };

  const num = (key: keyof ReceiptDesign, value: string) => {
    const v = Number(value);
    if (Number.isFinite(v)) setDesign({ ...design, [key]: v });
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50" dir="rtl">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center">
            <ReceiptIcon className="text-violet-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">إعدادات الفاتورة</h1>
            <p className="text-sm text-gray-500 mt-1">تخصيص محتوى وشكل الفاتورة الحرارية</p>
          </div>
        </div>

        {/* Header fields */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">بيانات الفاتورة</h2>
          <div className="space-y-4">
            <Field label="اسم المطعم">
              <Input value={cfg.restaurantName} onChange={(e) => setCfg({ ...cfg, restaurantName: e.target.value })} placeholder="مثال: مطعم الأصايل" />
            </Field>
            <Field label="العبارة الفرعية / الشعار">
              <Input value={cfg.subtitle} onChange={(e) => setCfg({ ...cfg, subtitle: e.target.value })} placeholder="مثال: أشهى الأكلات الخليجية" />
            </Field>
            <Field label="العنوان">
              <Input value={cfg.address} onChange={(e) => setCfg({ ...cfg, address: e.target.value })} placeholder="مثال: الرياض - حي العليا" />
            </Field>
            <Field label="أرقام الهاتف">
              <Input value={cfg.phones} onChange={(e) => setCfg({ ...cfg, phones: e.target.value })} placeholder="مثال: 0500000000" />
            </Field>
            <Field label="الرقم الضريبي (Tax ID)">
              <Input value={cfg.taxId} onChange={(e) => setCfg({ ...cfg, taxId: e.target.value })} placeholder="مثال: 300000000000003" />
            </Field>
            <Field label="رسالة التذييل (Footer)">
              <TextArea rows={2} value={cfg.footer} onChange={(e) => setCfg({ ...cfg, footer: e.target.value })} placeholder="شكراً لزيارتكم" />
            </Field>
          </div>
        </div>

        {/* Financial fields */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">الإعدادات المالية</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="العملة">
              <Input value={cfg.currency} onChange={(e) => setCfg({ ...cfg, currency: e.target.value })} placeholder="EGP" />
            </Field>
            <Field label="نسبة الضريبة %">
              <Input type="number" step="0.01" value={String(cfg.vatPercent)} onChange={(e) => setCfg({ ...cfg, vatPercent: parseFloat(e.target.value) || 0 })} placeholder="14" />
            </Field>
          </div>
        </div>

        {/* Toggle switches */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">إظهار / إخفاء العناصر</h2>
          <div className="space-y-3">
            <ToggleRow label="اسم الكاشير" enabled={cfg.showCashierName} onToggle={() => toggle('showCashierName')} />
            <ToggleRow label="الطوابع الزمنية (التاريخ والوقت)" enabled={cfg.showTimestamps} onToggle={() => toggle('showTimestamps')} />
            <ToggleRow label="نوع الطلب (صالة / سفري)" enabled={cfg.showOrderType} onToggle={() => toggle('showOrderType')} />
            <ToggleRow label="الشعار (اللوجو)" enabled={design.showLogo} onToggle={() => toggleDesign('showLogo')} />
            <ToggleRow label="اسم المطعم" enabled={design.showRestaurantName} onToggle={() => toggleDesign('showRestaurantName')} />
            <ToggleRow label="العبارة الفرعية" enabled={design.showSubtitle} onToggle={() => toggleDesign('showSubtitle')} />
            <ToggleRow label="طريقة الدفع" enabled={design.showPaymentMethod} onToggle={() => toggleDesign('showPaymentMethod')} />
            <ToggleRow label="عدد الأصناف" enabled={design.showItemsCount} onToggle={() => toggleDesign('showItemsCount')} />
            <ToggleRow label="رسالة التذييل" enabled={design.showFooter} onToggle={() => toggleDesign('showFooter')} />
          </div>
        </div>

        {/* مصمّم الفاتورة: الهوامش والخطوط */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">الهوامش وأحجام الخطوط</h2>
            <Button variant="secondary" onClick={() => setDesign({ ...DEFAULT_RECEIPT_DESIGN })}>
              استعادة الافتراضي
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="الهامش الجانبي (mm)">
              <Input type="number" min={0} max={10} step={0.5} value={design.marginX} onChange={(e) => num('marginX', e.target.value)} />
            </Field>
            <Field label="الهامش العلوي (mm)">
              <Input type="number" min={0} max={20} step={0.5} value={design.marginTop} onChange={(e) => num('marginTop', e.target.value)} />
            </Field>
            <Field label="الهامش السفلي (mm)">
              <Input type="number" min={0} max={30} step={0.5} value={design.marginBottom} onChange={(e) => num('marginBottom', e.target.value)} />
            </Field>
            <Field label="حجم الخط الأساسي (px)">
              <Input type="number" min={8} max={20} value={design.baseFontSize} onChange={(e) => num('baseFontSize', e.target.value)} />
            </Field>
            <Field label="حجم خط العنوان (px)">
              <Input type="number" min={10} max={30} value={design.titleFontSize} onChange={(e) => num('titleFontSize', e.target.value)} />
            </Field>
            <Field label="حجم خط الإجمالي (px)">
              <Input type="number" min={10} max={26} value={design.totalFontSize} onChange={(e) => num('totalFontSize', e.target.value)} />
            </Field>
            <Field label="تباعد الأسطر">
              <Input type="number" min={1} max={2.5} step={0.05} value={design.lineHeight} onChange={(e) => num('lineHeight', e.target.value)} />
            </Field>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            النصوص الطويلة تُلَف تلقائيًا على سطر جديد بدل قصّها على الطابعة الحرارية (80mm).
          </p>
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

function ToggleRow({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-2">
        {enabled ? <Eye size={18} className="text-gray-500" /> : <EyeOff size={18} className="text-gray-400" />}
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${enabled ? 'right-0.5' : 'right-6'}`} />
      </button>
    </div>
  );
}
