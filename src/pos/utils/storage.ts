import type { Settings, OrderType, AuditEntry, UserRole } from '@/types';
import { DEFAULT_PER_ORDER_TYPE } from '@/types';

export const STORAGE_KEY = 'foodics_pos_settings_v2';

export const defaultSettings: Settings = {
  managerPin: '7070',
  branding: {
    name: '',
    address: '',
    phones: '',
    logo: undefined,
  },
  printers: {
    paperWidth: 80,
    printMode: 'preview',
  },
  receiptSettings: {
    restaurantName: '',
    subtitle: '',
    address: '',
    phones: '',
    taxId: '',
    footer: 'شكراً لزيارتكم - نتمنى لكم يوماً سعيداً',
    showCashierName: true,
    showTimestamps: true,
    showOrderType: true,
    currency: 'EGP',
    vatPercent: 14,
  },
  financials: {
    serviceChargeType: 'percent',
    serviceChargeValue: 10,
    vatType: 'percent',
    vatValue: 15,
    applyServiceByDefault: true,
    applyVatByDefault: true,
    perOrderType: { ...DEFAULT_PER_ORDER_TYPE },
  },
  categories: [],
  products: [],
  modifierGroups: [],
  deliveryZones: [],
  dineInAreas: [],
  tags: [],
  paymentMethods: [
    'cash', 'visa', 'talabat-cash', 'talabat-visa', 'rappit', 'petrol-card',
  ],
  orders: [],
  shifts: [],
  currentShiftId: undefined,
  cashierName: '',
  users: [
    { id: 'user-admin', username: 'admin', password: 'admin', pin: '7070', role: 'admin', active: true },
  ],
  auditLog: [],
  activeOrders: [],
  orderCounter: 0, // ✅ عداد الطلبات التلقائي
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const merged: Settings = {
      ...defaultSettings,
      ...parsed,
      branding: { ...defaultSettings.branding, ...parsed.branding },
      printers: { ...defaultSettings.printers, ...parsed.printers },
      receiptSettings: { ...defaultSettings.receiptSettings, ...parsed.receiptSettings },
      financials: {
        ...defaultSettings.financials,
        ...parsed.financials,
        perOrderType: parsed.financials?.perOrderType
          ? { ...DEFAULT_PER_ORDER_TYPE, ...parsed.financials.perOrderType }
          : { ...DEFAULT_PER_ORDER_TYPE },
      },
      users: parsed.users ?? defaultSettings.users,
      auditLog: parsed.auditLog ?? [],
      activeOrders: parsed.activeOrders ?? [],
      modifierGroups: parsed.modifierGroups ?? [],
      orderCounter: parsed.orderCounter ?? 0, // ✅ قراءة العداد
    };
    return merged;
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatMoney(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB');
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB');
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function computeServiceCharge(subtotal: number, fin: { serviceChargeType: 'fixed' | 'percent'; serviceChargeValue: number }): number {
  if (fin.serviceChargeType === 'percent') {
    return Math.round(subtotal * fin.serviceChargeValue) / 100;
  }
  return fin.serviceChargeValue;
}

export function computeVat(subtotal: number, fin: { vatType: 'fixed' | 'percent'; vatValue: number }): number {
  if (fin.vatType === 'percent') {
    return Math.round(subtotal * fin.vatValue) / 100;
  }
  return fin.vatValue;
}

export function getProductPrice(prices: { dineIn: number; takeaway: number; delivery: number; talabat: number }, orderType: OrderType): number {
  switch (orderType) {
    case 'dine-in': return prices.dineIn;
    case 'takeaway': return prices.takeaway;
    case 'delivery': return prices.delivery;
    case 'talabat': return prices.talabat;
  }
}

export function addAuditEntry(
  settings: Settings,
  user: string,
  role: UserRole,
  action: string,
  extra?: { orderId?: string; amount?: number; reason?: string }
): Settings {
  const entry: AuditEntry = {
    id: uid('audit'),
    user,
    role,
    action,
    ...extra,
    createdAt: new Date().toISOString(),
  };
  return { ...settings, auditLog: [...settings.auditLog, entry] };
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSettingsJSON(settings: Settings): void {
  downloadFile(`pos-backup-${todayISODate()}.json`, JSON.stringify(settings, null, 2), 'application/json');
}

export function exportCSV(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  downloadFile(filename, csv, 'text/csv');
}
