import type { Order } from '@/types';
import { ORDER_TYPE_LABELS } from '@/types';
import { formatMoney } from '@/utils/storage';
import { Modal, Button } from '@/components/ui/Modal';
import { Printer, X } from 'lucide-react';

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

  // ✅ بناء HTML التذكرة
  const buildTicketHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>تذكرة مطبخ #${order.number}</title>
          <style>
            @page {
              size: 80mm ${paperHeight}px;
              margin: 0;
              padding: 0;
              orientation: portrait;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              width: 80mm;
              height: ${paperHeight}px;
              margin: 0;
              padding: 0;
              background: white;
            }
            body {
              width: 80mm;
              height: ${paperHeight}px;
              margin: 0;
              padding: 5mm 4mm;
              font-family: 'Courier New', monospace;
              font-size: 13px;
              line-height: 1.5;
              direction: rtl;
              background: white;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #000;
              padding-bottom: 8px;
              margin-bottom: 10px;
            }
            .title {
              font-size: 22px;
              font-weight: bold;
            }
            .sub {
              font-size: 13px;
              margin: 3px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 6px 0;
            }
            td {
              padding: 6px 0;
              border-bottom: 1px dotted #999;
              font-size: 14px;
            }
            .right { text-align: right; }
            .center { text-align: center; }
            .footer {
              border-top: 3px solid #000;
              margin-top: 10px;
              padding-top: 10px;
              text-align: center;
              font-size: 13px;
            }
            .note {
              color: #e67e22;
              font-size: 12px;
              margin: 4px 0;
              padding: 4px;
              border: 1px dashed #e67e22;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div>
            <div class="header">
              <div class="title">🍽️ تذكرة مطبخ</div>
              <div class="sub">طلب #${order.number}</div>
              <div class="sub">${new Date(order.createdAt).toLocaleTimeString('ar-EG')}</div>
              ${order.tableLabel ? `<div class="sub">طاولة: ${order.tableLabel}</div>` : ''}
              ${order.type === 'delivery' ? `<div class="sub">📍 توصيل</div>` : ''}
              ${order.type === 'dine-in' ? `<div class="sub">🏠 صالة</div>` : ''}
              ${order.type === 'takeaway' ? `<div class="sub">🛍️ سفري</div>` : ''}
            </div>

            <table>
              <tr>
                <td class="right"><strong>المنتج</strong></td>
                <td class="center"><strong>الكمية</strong></td>
              </tr>
              ${order.items.map(item => `
                <tr>
                  <td class="right">${item.name}</td>
                  <td class="center">${item.qty}</td>
                </tr>
                ${item.note ? `<tr><td colspan="2" class="note">📝 ${item.note}</td></tr>` : ''}
              `).join('')}
            </table>
          </div>

          <div class="footer">
            ${order.deliveryFee > 0 ? `رسوم التوصيل: ${order.deliveryFee.toFixed(2)} ر.س<br>` : ''}
            وقت التجهيز: 15 دقيقة
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              }, 300);
            };
          </script>
        </body>
      </html>
    `;
  };

  // ✅ طباعة مباشرة
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600,menubar=no,toolbar=no,location=no,status=no');
    if (printWindow) {
      printWindow.document.write(buildTicketHTML());
      printWindow.document.close();
      printWindow.focus();
      
      // ✅ إغلاق نافذة المعاينة بعد الطباعة
      if (onPrinted) onPrinted();
      onClose();
    } else {
      alert('الرجاء السماح للنوافذ المنبثقة');
    }
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
