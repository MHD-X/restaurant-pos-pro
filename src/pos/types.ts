export type View =
  | 'pos'
  | 'products'
  | 'modifiers'
  | 'branding'
  | 'delivery'
  | 'printers'
  | 'receipt-settings'
  | 'finance'
  | 'tags'
  | 'users'
  | 'shifts'
  | 'reports'
  | 'audit'
  | 'backup';

export interface ReceiptSettings {
  restaurantName: string;
  subtitle: string;
  address: string;
  phones: string;
  taxId: string;
  footer: string;
  showCashierName: boolean;
  showTimestamps: boolean;
  showOrderType: boolean;
  currency: string;
  vatPercent: number;
}

export type OrderType = 'dine-in' | 'takeaway' | 'delivery' | 'talabat';

export type PaymentMethod =
  | 'cash'
  | 'visa'
  | 'talabat-cash'
  | 'talabat-visa'
  | 'rappit'
  | 'petrol-card';

export type UserRole = 'cashier' | 'manager' | 'admin';

export interface Category {
  id: string;
  name: string;
  color: string;
  image?: string;
}

export interface ProductPrice {
  dineIn: number;
  takeaway: number;
  delivery: number;
  talabat: number;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  min: number;
  max: number;
  options: ModifierOption[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  prices: ProductPrice;
  categoryId: string;
  image?: string;
  available: boolean;
  tagIds: string[];
  modifierGroupIds: string[];
}

export interface CartItemModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
  modifiers?: CartItemModifier[];
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
}

export interface DineInArea {
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface OrderTypeFinancials {
  discountEnabled: boolean;
  defaultDiscount: number;
  taxEnabled: boolean;
  defaultTax: number;
  serviceEnabled: boolean;
  defaultService: number;
}

export interface CustomerInfo {
  name?: string;
  phone?: string;
  address?: string;
}

export interface Order {
  id: string;
  number: number;
  type: OrderType;
  tableLabel?: string;
  deliveryZoneId?: string;
  deliveryFee: number;
  items: CartItem[];
  subtotal: number;
  serviceCharge: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashierName: string;
  closerName?: string;
  customer?: CustomerInfo;
  createdAt: string;
  voided?: boolean;
  voidReason?: string;
  voidedBy?: string;
  tagIds: string[];
  refunded?: boolean;
  refundAmount?: number;
  refundReason?: string;
  status: 'open' | 'sent' | 'completed';
}

export interface CashEntry {
  id: string;
  shiftId: string;
  type: 'in' | 'out' | 'expense';
  amount: number;
  reason: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  cashierName: string;
  startedAt: string;
  endedAt?: string;
  openingFloat: number;
  orders: string[];
  cashEntries: CashEntry[];
  actualCash?: number;
  variance?: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
  pin: string;
  role: UserRole;
  active: boolean;
}

export interface AuditEntry {
  id: string;
  user: string;
  role: UserRole;
  action: string;
  orderId?: string;
  amount?: number;
  reason?: string;
  createdAt: string;
}

export interface Branding {
  logo?: string;
  name: string;
  address: string;
  phones: string;
}

export type PrintMode = 'preview' | 'direct';

export interface PrinterSettings {
  paperWidth: 80 | 58;
  printMode: PrintMode;
}

export interface FinancialSettings {
  serviceChargeType: 'fixed' | 'percent';
  serviceChargeValue: number;
  vatType: 'fixed' | 'percent';
  vatValue: number;
  applyServiceByDefault: boolean;
  applyVatByDefault: boolean;
  perOrderType: Record<OrderType, OrderTypeFinancials>;
}

export interface ActiveOrder {
  id: string;
  type: OrderType;
  tableLabel?: string;
  deliveryZoneId?: string;
  items: CartItem[];
  discount: number;
  tagIds: string[];
  status: 'open' | 'sent';
  customer?: CustomerInfo;
  createdAt: string;
}

export interface Settings {
  managerPin: string;
  branding: Branding;
  printers: PrinterSettings;
  receiptSettings: ReceiptSettings;
  financials: FinancialSettings;
  categories: Category[];
  products: Product[];
  modifierGroups: ModifierGroup[];
  deliveryZones: DeliveryZone[];
  dineInAreas: DineInArea[];
  tags: Tag[];
  paymentMethods: PaymentMethod[];
  orders: Order[];
  shifts: Shift[];
  currentShiftId?: string;
  cashierName: string;
  users: User[];
  auditLog: AuditEntry[];
  activeOrders: ActiveOrder[];
  orderCounter?: number;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'كاش',
  visa: 'فيزا',
  'talabat-cash': 'كاش طلبات',
  'talabat-visa': 'فيزا طلبات',
  rappit: 'رابيت',
  'petrol-card': 'بطاقة بنزين',
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  'dine-in': 'صالة',
  takeaway: 'سفري',
  delivery: 'توصيل',
  talabat: 'طلبات',
};

export const ORDER_TYPE_ICONS: Record<OrderType, string> = {
  'dine-in': 'Utensils',
  takeaway: 'Store',
  delivery: 'Bike',
  talabat: 'ShoppingBag',
};

export const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

export const TAG_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
];

export const DEFAULT_PER_ORDER_TYPE: Record<OrderType, OrderTypeFinancials> = {
  'dine-in': { discountEnabled: true, defaultDiscount: 0, taxEnabled: true, defaultTax: 15, serviceEnabled: true, defaultService: 10 },
  takeaway: { discountEnabled: true, defaultDiscount: 0, taxEnabled: true, defaultTax: 15, serviceEnabled: false, defaultService: 0 },
  delivery: { discountEnabled: true, defaultDiscount: 0, taxEnabled: true, defaultTax: 15, serviceEnabled: false, defaultService: 0 },
  talabat: { discountEnabled: false, defaultDiscount: 0, taxEnabled: true, defaultTax: 15, serviceEnabled: false, defaultService: 0 },
};
