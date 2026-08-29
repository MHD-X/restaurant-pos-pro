import { useState, useMemo } from 'react';
import type { PaymentMethod, FinancialSettings } from '@/types';
import { PAYMENT_METHOD_LABELS } from '@/types';
import { formatMoney, computeServiceCharge, computeVat } from '@/utils/storage';
import { Modal, Button, Input } from '@/components/ui/Modal';
import {
  Banknote, CreditCard, Fuel, Truck,
  CheckCircle2, RefreshCw,
} from 'lucide-react';

interface CheckoutModalProps {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  financials: FinancialSettings;
  onClose: () => void;
  onComplete: (paymentMethod: PaymentMethod, serviceCharge: number, tax: number, closerName: string) => void;
}

const paymentMethods: { id: PaymentMethod; icon: typeof Banknote; color: string }[] = [
  { id: 'cash', icon: Banknote, color: 'green' },
  { id: 'visa', icon: CreditCard, color: 'blue' },
  { id: 'talabat-cash', icon: Banknote, color: 'orange' },
  { id: 'talabat-visa', icon: CreditCard, color: 'orange' },
  { id: 'rappit', icon: Truck, color: 'pink' },
  { id: 'petrol-card', icon: Fuel, color: 'red' },
];

const colorMap: Record<string, string> = {
  green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
  blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
  orange: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
  pink: 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100',
  red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
};

const activeColorMap: Record<string, string> = {
  green: 'bg-green-600 border-green-600 text-white',
  blue: 'bg-blue-600 border-blue-600 text-white',
  orange: 'bg-orange-600 border-orange-600 text-white',
  pink: 'bg-pink-600 border-pink-600 text-white',
  red: 'bg-red-600 border-red-600 text-white',
};

export function CheckoutModal({ subtotal, discount, deliveryFee, financials, onClose, onComplete }: CheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [useDefaultService, setUseDefaultService] = useState(financials.applyServiceByDefault);
  const [serviceStr, setServiceStr] = useState(
    financials.applyServiceByDefault ? String(computeServiceCharge(subtotal, financials)) : ''
  );
  const [useDefaultVat, setUseDefaultVat] = useState(financials.applyVatByDefault);
  const [taxStr, setTaxStr] = useState(
    financials.applyVatByDefault ? String(computeVat(subtotal, financials)) : ''
  );
  const [closerName, setCloserName] = useState('');

  const serviceCharge = parseFloat(serviceStr) || 0;
  const tax = parseFloat(taxStr) || 0;
  const total = useMemo(
    () => Math.max(0, subtotal - discount + deliveryFee + serviceCharge + tax),
    [subtotal, discount, deliveryFee, serviceCharge, tax]
  );

  const recalcService = () => {
    setServiceStr(String(computeServiceCharge(subtotal, financials)));
  };

  const recalcVat = () => {
    setTaxStr(String(computeVat(subtotal, financials)));
  };

  const handleComplete = () => {
    onComplete(selectedMethod, serviceCharge, tax, closerName);
  };

  return (
    <Modal open onClose={onClose} title="الدفع" size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button variant="success" size="lg" onClick={handleComplete}>
            <CheckCircle2 size={20} className="inline ml-2" />
            تأكيد الدفع - {formatMoney(total)}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Payment methods */}
        <div>
          <p className="text-sm font-bold text-gray-700 mb-3">طريقة الدفع</p>
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map((pm) => {
              const Icon = pm.icon;
              const active = selectedMethod === pm.id;
              return (
                <button
                  key={pm.id}
                  onClick={() => setSelectedMethod(pm.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all active:scale-95 ${
                    active ? activeColorMap[pm.color] : colorMap[pm.color]
                  }`}
                >
                  <Icon size={28} />
                  <span className="text-xs font-bold text-center">{PAYMENT_METHOD_LABELS[pm.id]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual inputs with auto-fill */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-700">رسوم الخدمة</label>
              <button
                onClick={recalcService}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                title="إعادة حساب من الإعدادات"
              >
                <RefreshCw size={12} />
                تلقائي ({financials.serviceChargeType === 'percent' ? `${financials.serviceChargeValue}%` : formatMoney(financials.serviceChargeValue)})
              </button>
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={serviceStr}
              onChange={(e) => { setServiceStr(e.target.value); setUseDefaultService(false); }}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-700">الضريبة (VAT)</label>
              <button
                onClick={recalcVat}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                title="إعادة حساب من الإعدادات"
              >
                <RefreshCw size={12} />
                تلقائي ({financials.vatType === 'percent' ? `${financials.vatValue}%` : formatMoney(financials.vatValue)})
              </button>
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={taxStr}
              onChange={(e) => { setTaxStr(e.target.value); setUseDefaultVat(false); }}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 mb-2 block">المغلق باسم (Closer)</label>
          <Input
            placeholder="اسم الشخص الذي أغلق الطلب"
            value={closerName}
            onChange={(e) => setCloserName(e.target.value)}
          />
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>المجموع الفرعي</span>
            <span className="font-semibold">{formatMoney(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>الخصم</span>
              <span className="font-semibold">-{formatMoney(discount)}</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>التوصيل</span>
              <span className="font-semibold">{formatMoney(deliveryFee)}</span>
            </div>
          )}
          {serviceCharge > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>رسوم الخدمة</span>
              <span className="font-semibold">{formatMoney(serviceCharge)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>الضريبة</span>
              <span className="font-semibold">{formatMoney(tax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-base font-bold text-gray-800">الإجمالي</span>
            <span className="text-2xl font-bold text-blue-600">{formatMoney(total)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
