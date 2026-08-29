import type { Order } from '@/pos/types';
import { ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/pos/types';
import { formatMoney, formatDateTime } from '@/pos/utils/storage';
import { useSettings } from '@/pos/context/SettingsContext';
import { Modal, Button } from '@/pos/components/ui/Modal';
import { Printer, X } from 'lucide-react';
import { printHtml, buildReceiptHtml } from '@/pos/utils/print';

interface ReceiptProps {
  order: Order;
  onClose: () => void;
  onPrint?: () => void;
  isPreview?: boolean;
}

const ORDER_TYPE_EN: Record<string, string> = {
  'dine-in': 'Dine In',
  takeaway: 'Takeaway',
  delivery: 'Delivery',
  talabat: 'Talabat',
};

// ⚠️ NOTE: This on-screen preview and the actual printed ticket built in
// PosScreen.printReceiptFor() are two separate templates. If you change the
// receipt layout, branding, or fields shown here, mirror the change in
// PosScreen.tsx's printReceiptFor() HTML string too, or the printed paper
// receipt will silently drift out of sync with this preview.
export function Receipt({ order, onClose, onPrint, isPreview = false }: ReceiptProps) {
  const { settings } = useSettings();
  const r = settings.receiptSettings;
  const branding = settings.branding;
  const itemCount = order.items.reduce((s, i) => s + i.qty, 0);

  // ✅ حساب طول الورق تلقائياً حسب عدد الأصناف
  const itemsCount = order.items.length;
  const lineHeight = 24;
  const headerHeight = 180;
  const footerHeight = 120;
  const totalHeight = headerHeight + (itemsCount * lineHeight) + footerHeight;
  const paperHeight = Math.max(350, totalHeight);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    const res = printHtml(buildReceiptHtml(order, settings));
    if (!res.success) alert(res.error);
  };

  const restaurantName = r.restaurantName || branding.name || 'مطعم أسايل';
  const logo = branding.logo;

  return (
    <Modal open onClose={onClose} title={isPreview ? 'معاينة الفاتورة (غير مدفوعة)' : 'معاينة الفاتورة'} size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            <X size={18} className="inline ml-1" />
            إلغاء
          </Button>
          <Button onClick={handlePrint}>
            <Printer size={18} className="inline ml-2" />
            {isPreview ? 'طباعة معاينة' : 'تأكيد وطباعة'}
          </Button>
        </>
      }
    >
      <div className="flex justify-center print-wrapper">
        <div
          className="print-area thermal-receipt bg-white font-mono text-gray-900"
          dir="rtl"
          style={{ 
            width: '80mm', 
            height: `${paperHeight}px`,
            padding: '2mm 3mm' 
          }}
        >
          <div className="text-center mb-2">
            {logo && (
              <img 
                src={logo} 
                alt="شعار المطعم" 
                style={{ 
                  maxWidth: '60mm', 
                  height: 'auto', 
                  margin: '0 auto 4px auto',
                  display: 'block'
                }} 
              />
            )}
            {restaurantName && (
              <p className="font-bold text-base leading-tight">{restaurantName}</p>
            )}
            {r.subtitle && (
              <p className="text-xs text-gray-600 mt-0.5">{r.subtitle}</p>
            )}
            {r.address && (
              <p className="text-xs text-gray-500 mt-1">{r.address}</p>
            )}
            {r.phones && (
              <p className="text-xs text-gray-500">{r.phones}</p>
            )}
            {r.taxId && (
              <p className="text-xs text-gray-500 mt-0.5">الرقم الضريبي: {r.taxId}</p>
            )}
          </div>

          <div className="border-t border-dashed border-gray-400 pt-1.5 mb-1.5 space-y-0.5 text-xs">
            {r.showCashierName && (
              <div className="flex justify-between">
                <span>Name:</span>
                <span className="font-semibold">{order.cashierName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Check#:</span>
              <span className="font-semibold">{order.number}</span>
            </div>
            {r.showOrderType && (
              <div className="flex justify-between">
                <span>Order Type:</span>
                <span className="font-semibold">
                  {ORDER_TYPE_EN[order.type] ?? order.type} / {ORDER_TYPE_LABELS[order.type]}
                </span>
              </div>
            )}
          </div>

          {order.customer && (order.customer.name || order.customer.phone || order.customer.address) && (
            <div className="border-t border-dashed border-gray-400 pt-1.5 mb-1.5 space-y-0.5 text-xs">
              {order.customer.name && (
                <div className="flex justify-between">
                  <span>العميل / Customer:</span>
                  <span className="font-semibold">{order.customer.name}</span>
                </div>
              )}
              {order.customer.phone && (
                <div className="flex justify-between">
                  <span>الهاتف / Phone:</span>
                  <span className="font-semibold">{order.customer.phone}</span>
                </div>
              )}
              {order.customer.address && (
                <div className="flex justify-between">
                  <span>العنوان / Address:</span>
                  <span className="font-semibold text-left">{order.customer.address}</span>
                </div>
              )}
            </div>
          )}

          <div className="border-2 border-gray-800 rounded my-2 text-center py-1.5">
            <p className="font-bold text-lg tracking-wide">Order# {order.number}</p>
            {isPreview && (
              <p className="text-xs text-amber-600 font-bold">⚠️ معاينة - غير مدفوعة</p>
            )}
          </div>

          {r.showTimestamps && (
            <div className="space-y-0.5 text-xs mb-1.5">
              <div className="flex justify-between">
                <span>Printed At:</span>
                <span>{formatDateTime(new Date().toISOString())}</span>
              </div>
              <div className="flex justify-between">
                <span>Check In:</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
            </div>
          )}

          <div className="border-t border-dashed border-gray-400 pt-1.5 mb-1.5">
            <div className="flex font-bold text-xs pb-1 border-b border-gray-300">
              <span className="flex-1">Item</span>
              <span className="w-10 text-center">Qty</span>
              <span className="w-16 text-left">Price</span>
            </div>
            {order.items.map((item, i) => (
              <div key={i} className="py-1 border-b border-dotted border-gray-200">
                <div className="flex text-xs">
                  <span className="flex-1 font-semibold">{item.name}</span>
                  <span className="w-10 text-center">{item.qty}</span>
                  <span className="w-16 text-left">{formatMoney(item.price * item.qty)}</span>
                </div>
                {item.note && (
                  <p className="text-xs text-gray-500 pr-2">* {item.note}</p>
                )}
                {item.modifiers?.map((mod, mi) => (
                  <div key={mi} className="flex text-xs text-gray-500 pr-2">
                    <span className="flex-1">+ {mod.optionName}</span>
                    {mod.price > 0 && (
                      <span className="w-16 text-left">{formatMoney(mod.price)}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="space-y-0.5 text-xs mb-1.5">
            <div className="flex justify-between">
              <span>المجموع الفرعي / Subtotal</span>
              <span>{formatMoney(order.subtotal)} {r.currency}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>الخصم / Discount</span>
                <span>-{formatMoney(order.discount)} {r.currency}</span>
              </div>
            )}
            {order.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>التوصيل / Delivery</span>
                <span>{formatMoney(order.deliveryFee)} {r.currency}</span>
              </div>
            )}
            {order.serviceCharge > 0 && (
              <div className="flex justify-between">
                <span>الخدمة / Service</span>
                <span>{formatMoney(order.serviceCharge)} {r.currency}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between">
                <span>القيمة المضافة {r.vatPercent}% / VAT</span>
                <span>{formatMoney(order.tax)} {r.currency}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm border-t border-gray-800 pt-1 mt-1">
              <span>الإجمالي / Total</span>
              <span>{formatMoney(order.total)} {r.currency}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-400 pt-1.5 mb-1.5 text-xs">
            <div className="flex justify-between">
              <span>طريقة الدفع / Payment:</span>
              <span className="font-bold">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
            </div>
          </div>

          <div className="text-center border-t border-dashed border-gray-400 pt-2 mt-1">
            <p className="text-xs text-gray-500">Items: {itemCount}</p>
            {r.footer && (
              <p className="text-xs font-semibold mt-1">{r.footer}</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
