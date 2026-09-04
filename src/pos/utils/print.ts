import type { Order, ReceiptDesign, Settings } from '@/pos/types';
import { DEFAULT_RECEIPT_DESIGN } from '@/pos/types';

export interface PrintResult {
  success: boolean;
  error?: string;
}

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * الطباعة الموثوقة: نستخدم iframe مخفي بدل النوافذ المنبثقة.
 * هذا يتجنب حاصرات النوافذ المنبثقة، وينتظر تحميل الصور والخطوط
 * قبل استدعاء print() حتى لا تخرج ورقة فارغة.
 */
export function printHtml(html: string, onDone?: () => void): PrintResult {
  if (typeof window === 'undefined') return { success: false, error: 'الطباعة متاحة في المتصفح فقط' };

  try {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
      'position:fixed;right:0;bottom:0;width:80mm;height:0;border:0;visibility:hidden;';
    document.body.appendChild(iframe);

    const cleanup = () => {
      setTimeout(() => {
        iframe.remove();
        onDone?.();
      }, 1000);
    };

    iframe.onload = async () => {
      const win = iframe.contentWindow;
      const doc = iframe.contentDocument;
      if (!win || !doc) {
        cleanup();
        return;
      }
      try {
        // انتظار الخطوط والصور
        const images = Array.from(doc.images);
        await Promise.all([
          (doc as Document & { fonts?: FontFaceSet }).fonts?.ready ?? Promise.resolve(),
          ...images.map(
            (img) =>
              img.complete
                ? Promise.resolve()
                : new Promise<void>((res) => {
                    img.onload = () => res();
                    img.onerror = () => res();
                  }),
          ),
        ]);
      } catch {
        /* تجاهل */
      }
      // مهلة قصيرة لضمان اكتمال التخطيط قبل الطباعة
      setTimeout(() => {
        try {
          win.focus();
          win.print();
        } catch {
          /* تجاهل */
        }
        cleanup();
      }, 350);
    };

    iframe.srcdoc = html;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `فشل الطباعة: ${msg}` };
  }
}

const baseStyles = (widthMm: number, d: ReceiptDesign = DEFAULT_RECEIPT_DESIGN) => `
  @page { size: ${widthMm}mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { width: ${widthMm}mm; background: #fff; }
  body {
    padding: ${d.marginTop}mm ${d.marginX}mm ${d.marginBottom}mm;
    font-family: 'Courier New', 'Tahoma', monospace;
    font-size: ${d.baseFontSize}px;
    line-height: ${d.lineHeight};
    color: #000;
    direction: rtl;
  }
  /* منع قص النصوص الطويلة على الطابعة الحرارية */
  body, td, div, span { word-wrap: break-word; overflow-wrap: anywhere; white-space: normal; }
`;



const PAYMENT_LABELS: Record<string, string> = {
  cash: 'نقدي / Cash',
  visa: 'فيزا / Visa',
  'talabat-cash': 'كاش طلبات',
  'talabat-visa': 'فيزا طلبات',
  rappit: 'رابيت',
  'petrol-card': 'بطاقة بنزين',
};

const ORDER_TYPE_AR: Record<string, string> = {
  'dine-in': 'صالة / Dine In',
  takeaway: 'سفري / Takeaway',
  delivery: 'توصيل / Delivery',
  talabat: 'طلبات / Talabat',
};

/** فاتورة العميل — قالب واحد للمعاينة والطباعة */
export function buildReceiptHtml(order: Order, settings: Settings, widthMm = 80): string {
  const r = settings.receiptSettings;
  const d: ReceiptDesign = { ...DEFAULT_RECEIPT_DESIGN, ...settings.receiptDesign };
  const branding = settings.branding;
  const name = r.restaurantName || branding.name || 'مطعم أسايل';
  const currency = r.currency || 'ر.س';
  const isPreview = order.status === 'preview';
  const money = (n: number) => `${Number(n || 0).toFixed(2)} ${currency}`;
  const itemCount = order.items.reduce((s, i) => s + i.qty, 0);

  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td class="right">${esc(item.name)}</td>
        <td class="center">${item.qty}</td>
        <td class="left">${money(item.price * item.qty)}</td>
      </tr>
      ${
        item.modifiers?.length
          ? item.modifiers
              .map(
                (m) =>
                  `<tr class="mod"><td class="right" colspan="2">+ ${esc(m.optionName)}</td><td class="left">${
                    m.price > 0 ? money(m.price) : ''
                  }</td></tr>`,
              )
              .join('')
          : ''
      }
      ${item.note ? `<tr class="note"><td colspan="3">📝 ${esc(item.note)}</td></tr>` : ''}`,
    )
    .join('');

  const line = (label: string, value: string, cls = '') =>
    `<div class="total-line ${cls}"><span>${label}</span><span>${value}</span></div>`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>فاتورة #${order.number}</title>
<style>
${baseStyles(widthMm, d)}
.header { text-align:center; border-bottom:2px solid #000; padding-bottom:6px; margin-bottom:6px; }
.logo { max-width:${widthMm - 25}mm; height:auto; display:block; margin:0 auto 4px; }
.title { font-size:${d.titleFontSize}px; font-weight:bold; }
.sub { font-size:10px; color:#333; margin-top:2px; }
.badge { border:2px solid #000; border-radius:4px; text-align:center; font-weight:bold; font-size:15px; padding:4px; margin:6px 0; }
.preview { margin:6px 0; text-align:center; font-weight:bold; font-size:12px; border:2px dashed #000; padding:4px; }
.info-line { display:flex; justify-content:space-between; font-size:10px; padding:1px 0; }
table { width:100%; border-collapse:collapse; margin:6px 0; }
td { padding:3px 0; font-size:${d.baseFontSize}px; border-bottom:1px dotted #bbb; }
tr.th td { font-weight:bold; border-bottom:2px solid #000; }
tr.mod td { font-size:10px; color:#444; border-bottom:none; }
tr.note td { font-size:10px; border-bottom:none; }
.right{text-align:right}.center{text-align:center}.left{text-align:left}
.totals { border-top:2px solid #000; padding-top:4px; }
.total-line { display:flex; justify-content:space-between; font-size:${d.baseFontSize}px; padding:1px 0; }
.total-line.bold { font-size:${d.totalFontSize}px; font-weight:bold; border-top:1px solid #000; margin-top:3px; padding-top:3px; }
.payment { text-align:center; font-weight:bold; font-size:12px; border:1px solid #000; border-radius:4px; padding:4px; margin:6px 0; }
.footer { text-align:center; border-top:2px dashed #000; padding-top:6px; margin-top:6px; font-size:10px; }
</style></head>
<body>
  <div class="header">
    ${d.showLogo && branding.logo ? `<img class="logo" src="${esc(branding.logo)}" alt="logo" />` : ''}
    ${d.showRestaurantName ? `<div class="title">${esc(name)}</div>` : ''}
    ${d.showSubtitle && r.subtitle ? `<div class="sub">${esc(r.subtitle)}</div>` : ''}
    ${r.address ? `<div class="sub">${esc(r.address)}</div>` : ''}
    ${r.phones ? `<div class="sub">${esc(r.phones)}</div>` : ''}
    ${r.taxId ? `<div class="sub">الرقم الضريبي: ${esc(r.taxId)}</div>` : ''}
  </div>

  ${isPreview ? '<div class="preview">⚠️ معاينة — غير مدفوعة</div>' : ''}
  <div class="badge">Order # ${order.number}</div>

  ${r.showCashierName !== false ? `<div class="info-line"><span>الكاشير / Cashier</span><span>${esc(order.cashierName || 'كاشير')}</span></div>` : ''}
  ${r.showOrderType !== false ? `<div class="info-line"><span>نوع الطلب</span><span>${esc(ORDER_TYPE_AR[order.type] ?? order.type)}</span></div>` : ''}
  ${order.tableLabel ? `<div class="info-line"><span>طاولة / Table</span><span>${esc(order.tableLabel)}</span></div>` : ''}
  ${r.showTimestamps !== false ? `
    <div class="info-line"><span>وقت الطلب</span><span>${new Date(order.createdAt).toLocaleString('ar-EG')}</span></div>
    <div class="info-line"><span>وقت الطباعة</span><span>${new Date().toLocaleString('ar-EG')}</span></div>` : ''}
  ${
    order.customer && (order.customer.name || order.customer.phone || order.customer.address)
      ? `<div class="info-line"><span>العميل</span><span>${esc(order.customer.name || '')}</span></div>
         ${order.customer.phone ? `<div class="info-line"><span>الهاتف</span><span>${esc(order.customer.phone)}</span></div>` : ''}
         ${order.customer.address ? `<div class="info-line"><span>العنوان</span><span>${esc(order.customer.address)}</span></div>` : ''}`
      : ''
  }

  <table>
    <tr class="th"><td class="right">المنتج</td><td class="center">الكمية</td><td class="left">السعر</td></tr>
    ${rows}
  </table>

  <div class="totals">
    ${line('المجموع الفرعي / Subtotal', money(order.subtotal))}
    ${order.discount > 0 ? line('الخصم / Discount', `-${money(order.discount)}`) : ''}
    ${order.deliveryFee > 0 ? line('التوصيل / Delivery', money(order.deliveryFee)) : ''}
    ${order.serviceCharge > 0 ? line('الخدمة / Service', money(order.serviceCharge)) : ''}
    ${order.tax > 0 ? line(`القيمة المضافة ${r.vatPercent ?? 15}% / VAT`, money(order.tax)) : ''}
    ${line('الإجمالي / Total', money(order.total), 'bold')}
  </div>

  ${d.showPaymentMethod && order.paymentMethod ? `<div class="payment">طريقة الدفع: ${esc(PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod)}</div>` : ''}
  <div class="footer">
    ${d.showItemsCount ? `<div>عدد الأصناف / Items: ${itemCount}</div>` : ''}
    ${!d.showFooter ? '' : r.footer ? `<div style="margin-top:4px;font-weight:bold;">${esc(r.footer)}</div>` : '<div style="margin-top:4px;font-weight:bold;">شكراً لزيارتكم 🤍</div>'}
  </div>
</body></html>`;
}

/** تذكرة المطبخ */
export function buildKitchenTicketHtml(order: Order, widthMm = 80): string {
  const typeLabel: Record<string, string> = {
    'dine-in': '🏠 صالة',
    takeaway: '🛍️ سفري',
    delivery: '📍 توصيل',
    talabat: '📱 طلبات',
  };

  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td class="right">${esc(item.name)}</td>
        <td class="center qty">${item.qty}</td>
      </tr>
      ${
        item.modifiers?.length
          ? `<tr><td class="mods" colspan="2">${item.modifiers.map((m) => `+ ${esc(m.optionName)}`).join(' • ')}</td></tr>`
          : ''
      }
      ${item.note ? `<tr><td class="note" colspan="2">📝 ${esc(item.note)}</td></tr>` : ''}`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>تذكرة مطبخ #${order.number}</title>
<style>
${baseStyles(widthMm)}
body { font-size:14px; }
.header { text-align:center; border-bottom:3px solid #000; padding-bottom:8px; margin-bottom:8px; }
.title { font-size:20px; font-weight:bold; }
.sub { font-size:13px; margin-top:3px; }
table { width:100%; border-collapse:collapse; }
td { padding:6px 0; border-bottom:1px dotted #999; font-size:15px; font-weight:bold; }
td.qty { font-size:18px; }
td.mods { font-size:12px; font-weight:normal; border-bottom:none; padding-top:0; }
td.note { font-size:12px; font-weight:normal; border:1px dashed #000; padding:4px; }
.right{text-align:right}.center{text-align:center}
.footer { border-top:3px solid #000; margin-top:10px; padding-top:8px; text-align:center; font-size:13px; }
</style></head>
<body>
  <div class="header">
    <div class="title">🍽️ تذكرة مطبخ</div>
    <div class="sub">طلب #${order.number}</div>
    <div class="sub">${new Date(order.createdAt).toLocaleString('ar-EG')}</div>
    <div class="sub">${typeLabel[order.type] ?? order.type}${order.tableLabel ? ` — طاولة ${esc(order.tableLabel)}` : ''}</div>
  </div>
  <table>
    <tr><td class="right">المنتج</td><td class="center">الكمية</td></tr>
    ${rows}
  </table>
  <div class="footer">
    <div>إجمالي الأصناف: ${order.items.reduce((s, i) => s + i.qty, 0)}</div>
    <div>وقت التجهيز المتوقع: 15 دقيقة</div>
  </div>
</body></html>`;
}
