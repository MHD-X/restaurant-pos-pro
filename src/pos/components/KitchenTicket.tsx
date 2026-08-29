import type { Order } from '@/pos/types';
import { ORDER_TYPE_LABELS } from '@/pos/types';
import { formatMoney } from '@/pos/utils/storage';
import { Modal, Button } from '@/pos/components/ui/Modal';
import { Printer, X } from 'lucide-react';
import { printHtml, buildKitchenTicketHtml } from '@/pos/utils/print';

interface KitchenTicketProps {
  order: Order;
  onClose: () => void;
  onPrinted?: () => void;
}

export function KitchenTicket({ order, onClose, onPrinted }: KitchenTicketProps) {
  // ✅ حساب طول الورق تلقائياً
  const itemsCount = order.items.length;
  const lineHeight = 28;
  const headerHeight = 140;
  const footerHeight = 100;
  const totalHeight = headerHeight + (itemsCount * lineHeight) + footerHeight;
  const paperHeight = Math.max(300, totalHeight);

  const handlePrint = () => {
    const res = printHtml(buildKitchenTicketHtml(order));
    if (!res.success) {
      alert(res.error ?? 'تعذر فتح نافذة الطباعة');
      return;
    }
    onPrinted?.();
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="معاينة تذكرة المطبخ" size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            <X size={18} className="inline ml-1" />
            إلغاء
          </Button>
          <Button onClick={handlePrint}>
            <Printer size={18} className="inline ml-2" />
            طباعة
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
            padding: '5mm 4mm',
            margin: '0 auto',
            background: 'white',
            fontSize: '13px',
            lineHeight: '1.5',
            direction: 'rtl',
            fontFamily: "'Courier New', monospace",
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ textAlign: 'center', borderBottom: '3px solid #000', paddingBottom: '8px', marginBottom: '10px' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold' }}>🍽️ تذكرة مطبخ</div>
              <div style={{ fontSize: '13px', margin: '3px 0' }}>طلب #{order.number}</div>
              <div style={{ fontSize: '13px', margin: '3px 0' }}>{new Date(order.createdAt).toLocaleTimeString('ar-EG')}</div>
              {order.tableLabel && <div style={{ fontSize: '13px', margin: '3px 0' }}>طاولة: {order.tableLabel}</div>}
              {order.type === 'delivery' && <div style={{ fontSize: '13px', margin: '3px 0' }}>📍 توصيل</div>}
              {order.type === 'dine-in' && <div style={{ fontSize: '13px', margin: '3px 0' }}>🏠 صالة</div>}
              {order.type === 'takeaway' && <div style={{ fontSize: '13px', margin: '3px 0' }}>🛍️ سفري</div>}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '6px 0' }}>
              <tr>
                <td style={{ padding: '6px 0', borderBottom: '1px dotted #999', fontSize: '14px', textAlign: 'right' }}><strong>المنتج</strong></td>
                <td style={{ padding: '6px 0', borderBottom: '1px dotted #999', fontSize: '14px', textAlign: 'center' }}><strong>الكمية</strong></td>
              </tr>
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: '6px 0', borderBottom: '1px dotted #999', fontSize: '14px', textAlign: 'right' }}>{item.name}</td>
                  <td style={{ padding: '6px 0', borderBottom: '1px dotted #999', fontSize: '14px', textAlign: 'center' }}>{item.qty}</td>
                </tr>
              ))}
            </table>
          </div>

          <div style={{ borderTop: '3px solid #000', marginTop: '10px', paddingTop: '10px', textAlign: 'center', fontSize: '13px' }}>
            {order.deliveryFee > 0 ? `رسوم التوصيل: ${order.deliveryFee.toFixed(2)} ر.س<br>` : ''}
            وقت التجهيز: 15 دقيقة
          </div>
        </div>
      </div>
    </Modal>
  );
}
