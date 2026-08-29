import { useState, useRef } from 'react';
import { useSettings } from '@/pos/context/SettingsContext';
import { fileToDataUrl } from '@/pos/utils/storage';
import { Button, Input, Field, TextArea } from '@/pos/components/ui/Modal';
import { Store, ImagePlus, Save, Check, User, Lock } from 'lucide-react';

export function BrandingScreen() {
  const { settings, update } = useSettings();
  const [name, setName] = useState(settings.branding.name);
  const [address, setAddress] = useState(settings.branding.address);
  const [phones, setPhones] = useState(settings.branding.phones);
  const [logo, setLogo] = useState<string | undefined>(settings.branding.logo);
  const [cashierName, setCashierName] = useState(settings.cashierName);
  const [managerPin, setManagerPin] = useState(settings.managerPin);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogo = async (file: File | undefined) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setLogo(dataUrl);
  };

  const handleSave = () => {
    update((prev) => ({
      ...prev,
      branding: { name, address, phones, logo },
      cashierName,
      managerPin,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50" dir="rtl">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Store className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">إعدادات الفاتورة والهوية</h1>
            <p className="text-sm text-gray-500 mt-1">تظهر هذه البيانات في رأس فاتورة العميل فقط</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          {/* Logo upload */}
          <div className="flex flex-col items-center pb-4 border-b border-gray-100">
            <div className="w-28 h-28 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 mb-2">
              {logo ? (
                <img src={logo} alt="logo" className="w-full h-full object-contain" />
              ) : (
                <Store size={36} className="text-gray-300" />
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0])} />
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <ImagePlus size={16} className="inline ml-1" />
              {logo ? 'تغيير الشعار' : 'رفع شعار المطعم'}
            </Button>
            {logo && (
              <button onClick={() => setLogo(undefined)} className="text-xs text-red-500 mt-1">
                إزالة الشعار
              </button>
            )}
          </div>

          <Field label="اسم المطعم">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: مطعم أصيل للمشويات" />
          </Field>

          <Field label="العنوان">
            <TextArea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="المدينة، الحي، الشارع" />
          </Field>

          <Field label="أرقام الهاتف">
            <Input value={phones} onChange={(e) => setPhones(e.target.value)} placeholder="0555-123456, 0555-789012" />
          </Field>
        </div>

        {/* Cashier & PIN settings */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-4 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <User className="text-gray-500" size={20} />
            <h2 className="text-lg font-bold text-gray-800">إعدادات الكاشير</h2>
          </div>
          <Field label="اسم الكاشير الحالي">
            <Input value={cashierName} onChange={(e) => setCashierName(e.target.value)} placeholder="اسم الكاشير" />
          </Field>
          <Field label="رمز المدير (Manager PIN)">
            <div className="relative">
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="pr-10"
                placeholder="7070"
              />
            </div>
          </Field>
        </div>

        <div className="flex justify-end mt-6">
          <Button size="lg" onClick={handleSave}>
            {saved ? <><Check size={20} className="inline ml-1" /> تم الحفظ</> : <><Save size={20} className="inline ml-1" /> حفظ الإعدادات</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
