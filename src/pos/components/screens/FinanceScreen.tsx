import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import type { FinancialSettings, OrderType, OrderTypeFinancials } from '@/types';
import { ORDER_TYPE_LABELS } from '@/types';
import { formatMoney } from '@/utils/storage';
import { Button, Input, Field, Select } from '@/components/ui/Modal';
import {
  Wallet, Percent, Save, Check, Calculator, Truck,
  Utensils, Store, Bike, ShoppingBag,
} from 'lucide-react';

const ORDER_TYPE_ICONS: Record<OrderType, typeof Utensils> = {
  'dine-in': Utensils,
  takeaway: Store,
  delivery: Bike,
  talabat: ShoppingBag,
};

export function FinanceScreen() {
  const { settings, update } = useSettings();
  const [fin, setFin] = useState<FinancialSettings>(settings.financials);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    update((prev) => ({ ...prev, financials: fin }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateZoneFee = (zoneId: string, fee: number) => {
    update((prev) => ({
      ...prev,
      deliveryZones: prev.deliveryZones.map((z) =>
        z.id === zoneId ? { ...z, fee } : z
      ),
    }));
  };

  const updatePerType = (type: OrderType, patch: Partial<OrderTypeFinancials>) => {
    setFin({
      ...fin,
      perOrderType: {
        ...fin.perOrderType,
        [type]: { ...fin.perOrderType[type], ...patch },
      },
    });
  };

  const previewService = fin.serviceChargeType === 'percent'
    ? Math.round(100 * fin.serviceChargeValue) / 100
    : fin.serviceChargeValue;
  const previewVat = fin.vatType === 'percent'
    ? Math.round(100 * fin.vatValue) / 100
    : fin.vatValue;

  return (
    <div className="h-full overflow-y-auto bg-gray-50" dir="rtl">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Calculator className="text-emerald-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">التحكم المالي</h1>
            <p className="text-sm text-gray-500 mt-1">إعدادات رسوم الخدمة والضرائب ورسوم التوصيل</p>
          </div>
        </div>

        {/* Service Charge */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Wallet className="text-purple-600" size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">رسوم الخدمة (Service)</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="نوع الرسوم">
              <Select
                value={fin.serviceChargeType}
                onChange={(e) => setFin({ ...fin, serviceChargeType: e.target.value as 'fixed' | 'percent' })}
              >
                <option value="percent">نسبة مئوية %</option>
                <option value="fixed">مبلغ ثابت</option>
              </Select>
            </Field>
            <Field label={fin.serviceChargeType === 'percent' ? 'النسبة %' : 'المبلغ الثابت'}>
              <Input
                type="number"
                step="0.01"
                value={String(fin.serviceChargeValue)}
                onChange={(e) => setFin({ ...fin, serviceChargeValue: parseFloat(e.target.value) || 0 })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-3 cursor-pointer mb-2">
            <button
              onClick={() => setFin({ ...fin, applyServiceByDefault: !fin.applyServiceByDefault })}
              className={`w-12 h-6 rounded-full transition-colors relative ${fin.applyServiceByDefault ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${fin.applyServiceByDefault ? 'right-0.5' : 'right-6'}`} />
            </button>
            <span className="text-sm font-semibold text-gray-700">تطبيق رسوم الخدمة تلقائياً</span>
          </label>
          <div className="bg-purple-50 rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm text-purple-700">معاينة على 100.00:</span>
            <span className="text-sm font-bold text-purple-700">
              {fin.serviceChargeType === 'percent' ? `${fin.serviceChargeValue}%` : formatMoney(fin.serviceChargeValue)} = {formatMoney(previewService)}
            </span>
          </div>
        </div>

        {/* VAT */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Percent className="text-orange-600" size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">ضريبة القيمة المضافة (VAT)</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="نوع الضريبة">
              <Select
                value={fin.vatType}
                onChange={(e) => setFin({ ...fin, vatType: e.target.value as 'fixed' | 'percent' })}
              >
                <option value="percent">نسبة مئوية %</option>
                <option value="fixed">مبلغ ثابت</option>
              </Select>
            </Field>
            <Field label={fin.vatType === 'percent' ? 'النسبة %' : 'المبلغ الثابت'}>
              <Input
                type="number"
                step="0.01"
                value={String(fin.vatValue)}
                onChange={(e) => setFin({ ...fin, vatValue: parseFloat(e.target.value) || 0 })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-3 cursor-pointer mb-2">
            <button
              onClick={() => setFin({ ...fin, applyVatByDefault: !fin.applyVatByDefault })}
              className={`w-12 h-6 rounded-full transition-colors relative ${fin.applyVatByDefault ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${fin.applyVatByDefault ? 'right-0.5' : 'right-6'}`} />
            </button>
            <span className="text-sm font-semibold text-gray-700">تطبيق الضريبة تلقائياً</span>
          </label>
          <div className="bg-orange-50 rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm text-orange-700">معاينة على 100.00:</span>
            <span className="text-sm font-bold text-orange-700">
              {fin.vatType === 'percent' ? `${fin.vatValue}%` : formatMoney(fin.vatValue)} = {formatMoney(previewVat)}
            </span>
          </div>
        </div>

        {/* Per-Order-Type Financial Rules */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">قواعد مالية مستقلة لكل نوع طلب</h2>
          <div className="space-y-3">
            {(['dine-in', 'takeaway', 'delivery', 'talabat'] as OrderType[]).map((type) => {
              const Icon = ORDER_TYPE_ICONS[type];
              const cfg = fin.perOrderType[type];
              return (
                <div key={type} className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                      <Icon size={18} className="text-gray-600" />
                    </div>
                    <h3 className="font-bold text-gray-700">{ORDER_TYPE_LABELS[type]}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <ToggleField
                      label="الخصم"
                      enabled={cfg.discountEnabled}
                      onToggle={() => updatePerType(type, { discountEnabled: !cfg.discountEnabled })}
                      value={cfg.defaultDiscount}
                      onValueChange={(v) => updatePerType(type, { defaultDiscount: v })}
                    />
                    <ToggleField
                      label="الضريبة %"
                      enabled={cfg.taxEnabled}
                      onToggle={() => updatePerType(type, { taxEnabled: !cfg.taxEnabled })}
                      value={cfg.defaultTax}
                      onValueChange={(v) => updatePerType(type, { defaultTax: v })}
                    />
                    <ToggleField
                      label="الخدمة %"
                      enabled={cfg.serviceEnabled}
                      onToggle={() => updatePerType(type, { serviceEnabled: !cfg.serviceEnabled })}
                      value={cfg.defaultService}
                      onValueChange={(v) => updatePerType(type, { defaultService: v })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery fees per zone */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Truck className="text-blue-600" size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">رسوم التوصيل لكل منطقة</h2>
          </div>
          <div className="space-y-2">
            {settings.deliveryZones.map((zone) => (
              <div key={zone.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-semibold text-gray-700 flex-1">{zone.name}</span>
                <Input
                  type="number"
                  step="0.01"
                  value={String(zone.fee)}
                  onChange={(e) => updateZoneFee(zone.id, parseFloat(e.target.value) || 0)}
                  className="w-28 text-left"
                />
                <span className="text-xs text-gray-400">ر.س</span>
              </div>
            ))}
            {settings.deliveryZones.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">لا توجد مناطق توصيل. أضفها من شاشة مناطق التوصيل.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button size="lg" onClick={handleSave}>
            {saved ? <><Check size={20} className="inline ml-1" /> تم الحفظ</> : <><Save size={20} className="inline ml-1" /> حفظ الإعدادات المالية</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToggleField({ label, enabled, onToggle, value, onValueChange }: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  value: number;
  onValueChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <button
          onClick={onToggle}
          className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
        >
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${enabled ? 'right-0.5' : 'right-3.5'}`} />
        </button>
        <span className={`text-xs font-semibold ${enabled ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
      </div>
      <Input
        type="number"
        step="0.01"
        value={String(value)}
        onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)}
        disabled={!enabled}
        className="text-sm"
      />
    </div>
  );
}
