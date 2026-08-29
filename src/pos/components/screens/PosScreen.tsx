import { useState, useMemo } from 'react';
import { useSettings } from '@/pos/context/SettingsContext';
import type { CartItem, OrderType, PaymentMethod, Order, ActiveOrder, CustomerInfo } from '@/pos/types';
import { ORDER_TYPE_LABELS } from '@/pos/types';
import { uid, formatMoney, getProductPrice, addAuditEntry } from '@/pos/utils/storage';
import {
  Printer, ChefHat, XCircle, Percent, StickyNote, Tag, MoreHorizontal,
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard,
  Bike, Store, Utensils, ShoppingBag, FilePlus, Layers,
  AlertCircle, CheckCircle2, User,
} from 'lucide-react';
import { Modal, Button, Input, TextArea, Select } from '@/pos/components/ui/Modal';
import { PinPad } from '@/pos/components/PinPad';
import { ConfirmDialog } from '@/pos/components/ui/ConfirmDialog';
import { CheckoutModal } from '@/pos/components/CheckoutModal';
import { Receipt } from '@/pos/components/Receipt';
import { KitchenTicket } from '@/pos/components/KitchenTicket';
import { printHtml, buildReceiptHtml } from '@/pos/utils/print';

export function PosScreen() {
  const { settings, update } = useSettings();
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    settings.categories[0]?.id ?? ''
  );
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteItemIndex, setNoteItemIndex] = useState<number>(-1);
  const [noteText, setNoteText] = useState('');
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountValue, setDiscountValue] = useState('');
  const [pinPadOpen, setPinPadOpen] = useState(false);
  const [pinAction, setPinAction] = useState<'void' | 'refund' | null>(null);
  const [confirmVoidOpen, setConfirmVoidOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [moreModalOpen, setMoreModalOpen] = useState(false);
  const [ordersListOpen, setOrdersListOpen] = useState(false);
  const [printError, setPrintError] = useState('');
  const [printSuccess, setPrintSuccess] = useState(false);
  const [kitchenError, setKitchenError] = useState('');
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [kitchenPreviewOrder, setKitchenPreviewOrder] = useState<Order | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const currentOrder = useMemo(
    () => settings.activeOrders.find((o) => o.id === currentOrderId) ?? null,
    [settings.activeOrders, currentOrderId]
  );

  const cart = currentOrder?.items ?? [];
  const orderType = currentOrder?.type ?? 'dine-in';
  const tableLabel = currentOrder?.tableLabel ?? '';
  const deliveryZoneId = currentOrder?.deliveryZoneId ?? '';
  const orderDiscount = currentOrder?.discount ?? 0;
  const orderTagIds = currentOrder?.tagIds ?? [];

  const products = useMemo(
    () => settings.products.filter((p) => p.available),
    [settings.products]
  );

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCategoryId) list = list.filter((p) => p.categoryId === activeCategoryId);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, activeCategoryId, search]);

  const deliveryFee = useMemo(() => {
    if (orderType !== 'delivery' || !deliveryZoneId) return 0;
    return settings.deliveryZones.find((z) => z.id === deliveryZoneId)?.fee ?? 0;
  }, [orderType, deliveryZoneId, settings.deliveryZones]);

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.price * i.qty, 0),
    [cart]
  );
  const total = Math.max(0, subtotal - orderDiscount + deliveryFee);

  const estimatedVat = useMemo(
    () => Math.round((subtotal - orderDiscount) * (settings.financials?.vatValue || 15)) / 100,
    [subtotal, orderDiscount, settings.financials?.vatValue]
  );

  const currentCustomer: CustomerInfo | undefined = (customerName || customerPhone || customerAddress)
    ? { name: customerName || undefined, phone: customerPhone || undefined, address: customerAddress || undefined }
    : undefined;

  const showCustomerForm = orderType === 'delivery' || orderType === 'talabat';

  const updateCurrentOrder = (patch: Partial<ActiveOrder>) => {
    if (!currentOrderId) return;
    update((prev) => ({
      ...prev,
      activeOrders: prev.activeOrders.map((o) =>
        o.id === currentOrderId ? { ...o, ...patch } : o
      ),
    }));
  };

  const updateCart = (updater: (prev: CartItem[]) => CartItem[]) => {
    if (!currentOrderId) return;
    update((prev) => ({
      ...prev,
      activeOrders: prev.activeOrders.map((o) =>
        o.id === currentOrderId ? { ...o, items: updater(o.items) } : o
      ),
    }));
  };

  const newOrder = (type: OrderType = 'dine-in') => {
    const order: ActiveOrder = {
      id: uid('active'),
      type,
      items: [],
      discount: 0,
      tagIds: [],
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    update((prev) => ({ ...prev, activeOrders: [...prev.activeOrders, order] }));
    setCurrentOrderId(order.id);
    setActiveCategoryId(settings.categories[0]?.id ?? '');
  };

  const switchOrder = (id: string) => {
    setCurrentOrderId(id);
    setOrdersListOpen(false);
  };

  const deleteActiveOrder = (id: string) => {
    update((prev) => ({
      ...prev,
      activeOrders: prev.activeOrders.filter((o) => o.id !== id),
    }));
    if (currentOrderId === id) {
      const remaining = settings.activeOrders.filter((o) => o.id !== id);
      setCurrentOrderId(remaining[0]?.id ?? '');
    }
  };

  const setOrderType = (type: OrderType) => {
    if (!currentOrderId) {
      newOrder(type);
      return;
    }
    updateCurrentOrder({ type });
  };

  const addToCart = (productId: string) => {
    const product = settings.products.find((p) => p.id === productId);
    if (!product) return;
    const price = getProductPrice(product.prices, orderType);
    updateCart((prev) => {
      const existing = prev.findIndex((i) => i.productId === productId && !i.note && !i.modifiers);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], qty: next[existing].qty + 1 };
        return next;
      }
      return [...prev, { productId: product.id, name: product.name, price, qty: 1 }];
    });
  };

  const changeQty = (index: number, delta: number) => {
    updateCart((prev) => {
      const next = [...prev];
      const item = next[index];
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        next.splice(index, 1);
      } else {
        next[index] = { ...item, qty: newQty };
      }
      return next;
    });
  };

  const removeItem = (index: number) => {
    updateCart((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const openNoteForItem = (index: number) => {
    setNoteItemIndex(index);
    setNoteText(cart[index]?.note ?? '');
    setNoteModalOpen(true);
  };

  const saveNote = () => {
    updateCart((prev) => {
      const next = [...prev];
      if (next[noteItemIndex]) {
        next[noteItemIndex] = { ...next[noteItemIndex], note: noteText || undefined };
      }
      return next;
    });
    setNoteModalOpen(false);
  };

  const applyDiscount = () => {
    const val = parseFloat(discountValue) || 0;
    updateCurrentOrder({ discount: Math.min(val, subtotal) });
    setDiscountModalOpen(false);
    setDiscountValue('');
  };

  const voidOrder = () => {
    setPinAction('void');
    setPinPadOpen(true);
  };

  const onPinSuccess = () => {
    setPinPadOpen(false);
    if (pinAction === 'void') {
      if (currentOrderId) {
        update((prev) => {
          const withoutOrder = {
            ...prev,
            activeOrders: prev.activeOrders.filter((o) => o.id !== currentOrderId),
          };
          return addAuditEntry(withoutOrder, settings.cashierName || 'كاشير', 'manager', 'إلغاء طلب');
        });
        const remaining = settings.activeOrders.filter((o) => o.id !== currentOrderId);
        setCurrentOrderId(remaining[0]?.id ?? '');
      }
      setConfirmVoidOpen(false);
    }
    if (pinAction === 'refund' && refundOrder) {
      setRefundModalOpen(true);
    }
    setPinAction(null);
  };

  const completeOrder = (paymentMethod: PaymentMethod, serviceCharge: number, tax: number, closerName: string) => {
    if (cart.length === 0) return;

    const orderCustomer: CustomerInfo | undefined = (customerName || customerPhone || customerAddress)
      ? { name: customerName || undefined, phone: customerPhone || undefined, address: customerAddress || undefined }
      : undefined;

    const nextOrderNumber = (settings.orderCounter || 0) + 1;

    const finalTotal = Math.max(0, subtotal - orderDiscount + deliveryFee + serviceCharge + tax);
    const order: Order = {
      id: uid('order'),
      number: nextOrderNumber,
      type: orderType,
      tableLabel: orderType === 'dine-in' ? tableLabel : undefined,
      deliveryZoneId: orderType === 'delivery' ? deliveryZoneId : undefined,
      deliveryFee,
      items: [...cart],
      subtotal,
      serviceCharge,
      tax,
      discount: orderDiscount,
      total: finalTotal,
      paymentMethod,
      cashierName: settings.cashierName || 'كاشير',
      closerName: closerName || undefined,
      customer: orderCustomer,
      createdAt: new Date().toISOString(),
      tagIds: orderTagIds,
      status: 'completed',
    };

    update((prev) => {
      const orders = [...prev.orders, order];
      const shifts = prev.shifts.map((s) =>
        s.id === prev.currentShiftId
          ? { ...s, orders: [...s.orders, order.id] }
          : s
      );
      return {
        ...prev,
        orders,
        shifts,
        orderCounter: nextOrderNumber,
        activeOrders: prev.activeOrders.filter((o) => o.id !== currentOrderId),
      };
    });

    setLastOrder(order);
    setCheckoutOpen(false);
    setReceiptOpen(true);
    const remaining = settings.activeOrders.filter((o) => o.id !== currentOrderId);
    setCurrentOrderId(remaining[0]?.id ?? '');
  };

  // ============================================
  // ✅ رقم مؤقت وفريد لأي طلب لم يُدفع بعد
  // ============================================
  const getPreviewNumber = (activeOrder: { createdAt: string }) => {
    return Number(new Date(activeOrder.createdAt).getTime().toString().slice(-4));
  };

  // ============================================
  // ✅ معالج فتح معاينة تذكرة المطبخ
  // ============================================
  const handlePrintKitchen = () => {
    const orderToPreview: Order | null = lastOrder ?? (currentOrder && cart.length > 0 ? {
      id: 'temp',
      number: getPreviewNumber(currentOrder),
      type: orderType,
      tableLabel: tableLabel || undefined,
      deliveryZoneId: deliveryZoneId || undefined,
      deliveryFee: deliveryFee || 0,
      items: cart.map(item => ({ ...item })),
      subtotal: subtotal || 0,
      serviceCharge: 0,
      tax: 0,
      discount: orderDiscount || 0,
      total: 0,
      paymentMethod: 'cash' as PaymentMethod,
      cashierName: settings.cashierName || 'كاشير',
      createdAt: currentOrder.createdAt,
      tagIds: orderTagIds || [],
      status: 'open' as const,
    } : null);

    if (!orderToPreview) {
      setKitchenError('لا توجد طلبات للطباعة');
      return;
    }

    setKitchenPreviewOrder(orderToPreview);
  };

  // ============================================
  // ✅ يُستدعى من KitchenTicket بعد الضغط على "طباعة"
  // ============================================
  const onKitchenTicketPrinted = () => {
    if (currentOrderId) updateCurrentOrder({ status: 'sent' });
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 3000);
    setKitchenPreviewOrder(null);
  };

  const processRefund = () => {
    if (!refundOrder || !refundAmount) return;
    const amount = parseFloat(refundAmount) || 0;
    update((prev) => {
      let s = {
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === refundOrder.id
            ? { ...o, refunded: true, refundAmount: amount, refundReason }
            : o
        ),
      };
      s = addAuditEntry(s, settings.cashierName || 'كاشير', 'manager', 'استرداد', {
        orderId: refundOrder.id, amount, reason: refundReason,
      });
      return s;
    });
    setRefundOrder(null);
    setRefundModalOpen(false);
    setRefundAmount('');
    setRefundReason('');
  };

  // ============================================
  // ✅ طباعة مباشرة بدون مودال (الحل الجديد)
  // ============================================
  const printReceiptDirect = (order: Order) => {
    setPrintError('');
    const res = printHtml(buildReceiptHtml(order, settings), () => {
      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 2500);
    });
    if (!res.success) setPrintError(res.error ?? 'تعذر تنفيذ الطباعة');
  };

  return (
    <div className="flex h-full" dir="rtl">
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* ✅ شريط الأدوات العلوي - متجاوب */}
        <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-1 sm:gap-2 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            <div className="relative flex-1 max-w-[120px] sm:max-w-xs">
              <Search size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-7 text-sm h-8 sm:h-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <TopButton icon={FilePlus} label="طلب جديد" variant="primary" onClick={() => newOrder()} />
            <TopButton
              icon={Layers}
              label={`الطلبات النشطة (${settings.activeOrders.length})`}
              onClick={() => setOrdersListOpen(true)}
            />
            {/* ✅ زر الطباعة المعدل - يستخدم الطباعة المباشرة */}
            <TopButton 
              icon={Printer} 
              label="طباعة" 
              onClick={() => {
                if (lastOrder) {
                  printReceiptDirect(lastOrder);
                } else if (cart.length > 0) {
                  const tempOrder: Order = {
                    id: 'temp',
                    number: 0,
                    type: orderType,
                    tableLabel: orderType === 'dine-in' ? tableLabel : undefined,
                    deliveryZoneId: orderType === 'delivery' ? deliveryZoneId : undefined,
                    deliveryFee,
                    items: [...cart],
                    subtotal,
                    serviceCharge: 0,
                    tax: estimatedVat,
                    discount: orderDiscount,
                    total: total + estimatedVat,
                    paymentMethod: 'cash',
                    cashierName: settings.cashierName || 'كاشير',
                    createdAt: new Date().toISOString(),
                    tagIds: orderTagIds,
                    status: 'preview',
                  };
                  setLastOrder(tempOrder);
                  printReceiptDirect(tempOrder);
                } else {
                  setPrintError('لا توجد منتجات للطباعة');
                }
              }} 
            />
            <TopButton icon={ChefHat} label="مطبخ" onClick={handlePrintKitchen} />
            <TopButton icon={XCircle} label="إلغاء" variant="danger" onClick={() => cart.length > 0 ? setConfirmVoidOpen(true) : voidOrder()} disabled={!currentOrderId} />
            <TopButton icon={Percent} label="خصم" onClick={() => { setDiscountValue(String(orderDiscount || '')); setDiscountModalOpen(true); }} disabled={!currentOrderId} />
            <TopButton icon={StickyNote} label="ملاحظات" onClick={() => { if (cart.length > 0) { setNoteItemIndex(cart.length - 1); setNoteText(''); setNoteModalOpen(true); } }} disabled={!currentOrderId} />
            <TopButton icon={Tag} label="وسوم" onClick={() => setTagsModalOpen(true)} disabled={!currentOrderId} />
            <TopButton icon={MoreHorizontal} label="المزيد" onClick={() => setMoreModalOpen(true)} />
          </div>
        </div>

        {printError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle size={16} />
            {printError}
          </div>
        )}
        {kitchenError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle size={16} />
            {kitchenError}
          </div>
        )}
        {printSuccess && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 size={16} />
            تمت الطباعة بنجاح
          </div>
        )}

        {/* ✅ أزرار نوع الطلب - متجاوبة */}
        <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-1.5 sm:py-2.5 flex items-center gap-1 sm:gap-2 flex-wrap">
          <OrderTypeButton active={orderType === 'dine-in'} icon={Utensils} label={ORDER_TYPE_LABELS['dine-in']} onClick={() => setOrderType('dine-in')} />
          <OrderTypeButton active={orderType === 'takeaway'} icon={Store} label={ORDER_TYPE_LABELS['takeaway']} onClick={() => setOrderType('takeaway')} />
          <OrderTypeButton active={orderType === 'delivery'} icon={Bike} label={ORDER_TYPE_LABELS['delivery']} onClick={() => setOrderType('delivery')} />
          <OrderTypeButton active={orderType === 'talabat'} icon={ShoppingBag} label={ORDER_TYPE_LABELS['talabat']} onClick={() => setOrderType('talabat')} />
          {orderType === 'dine-in' && (
            <Select
              value={tableLabel}
              onChange={(e) => updateCurrentOrder({ tableLabel: e.target.value })}
              className="w-28 sm:w-40 text-sm"
            >
              <option value="">اختر الطاولة</option>
              {settings.dineInAreas.map((a) => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </Select>
          )}
          {orderType === 'delivery' && (
            <Select
              value={deliveryZoneId}
              onChange={(e) => updateCurrentOrder({ deliveryZoneId: e.target.value })}
              className="w-32 sm:w-48 text-sm"
            >
              <option value="">اختر منطقة التوصيل</option>
              {settings.deliveryZones.map((z) => (
                <option key={z.id} value={z.id}>{z.name} ({formatMoney(z.fee)})</option>
              ))}
            </Select>
          )}
        </div>

        {/* ✅ تبويبات الفئات - متجاوبة */}
        <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-1.5 sm:py-2 flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {settings.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                activeCategoryId === cat.id
                  ? 'text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={activeCategoryId === cat.id ? { backgroundColor: cat.color } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ✅ شبكة المنتجات - متجاوبة */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {!currentOrderId ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart size={36} className="mb-3" />
              <p className="text-xs sm:text-sm mb-3">لا يوجد طلب نشط. اضغط "طلب جديد" للبدء.</p>
              <Button onClick={() => newOrder()}>
                <FilePlus size={16} className="inline ml-1" />
                طلب جديد
              </Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart size={36} className="mb-3" />
              <p className="text-xs sm:text-sm">لا توجد منتجات. أضف منتجات من شاشة المنتجات.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 sm:gap-3">
              {filteredProducts.map((product) => {
                const price = getProductPrice(product.prices, orderType);
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product.id)}
                    className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-2 sm:p-3 flex flex-col items-center gap-1 sm:gap-2 hover:shadow-lg hover:border-blue-300 active:scale-95 transition-all"
                  >
                    <div className="w-full aspect-square rounded-lg sm:rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Utensils size={20} className="text-gray-300" />
                      )}
                    </div>
                    <p className="text-[10px] sm:text-sm font-semibold text-gray-700 text-center leading-tight line-clamp-2">{product.name}</p>
                    <p className="text-[10px] sm:text-sm font-bold text-blue-600">{formatMoney(price)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ✅ السلة الجانبية - متجاوبة */}
      <div className={`w-64 sm:w-72 md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 ${
        cart.length === 0 ? 'hidden sm:flex' : 'flex'
      }`}>
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <ShoppingCart size={18} className="text-blue-600" />
            <h3 className="font-bold text-sm sm:text-base text-gray-800">السلة</h3>
            <span className="text-[10px] sm:text-xs bg-blue-100 text-blue-700 px-1.5 sm:px-2 py-0.5 rounded-full font-bold">
              {cart.reduce((s, i) => s + i.qty, 0)}
            </span>
            {currentOrder && (
              <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-semibold ${
                currentOrder.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {currentOrder.status === 'sent' ? 'أُرسل' : 'مفتوح'}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => voidOrder()}
              className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors"
              title="إلغاء الطلب"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <ShoppingCart size={32} className="mb-2" />
              <p className="text-xs sm:text-sm">السلة فارغة</p>
            </div>
          ) : (
            <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
              {cart.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 animate-fade-in">
                  <div className="flex items-start justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <p className="text-xs sm:text-sm font-semibold text-gray-800 flex-1">{item.name}</p>
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 p-0.5">
                      <XCircle size={14} />
                    </button>
                  </div>
                  {item.note && (
                    <p className="text-[10px] sm:text-xs text-orange-600 bg-orange-50 rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 mb-1 sm:mb-2">
                      {item.note}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button onClick={() => changeQty(i, -1)} className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 active:scale-90 transition-all">
                        <Minus size={12} className="text-gray-600" />
                      </button>
                      <span className="text-xs sm:text-sm font-bold w-6 sm:w-8 text-center">{item.qty}</span>
                      <button onClick={() => changeQty(i, 1)} className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all">
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button onClick={() => openNoteForItem(i)} className="text-gray-400 hover:text-orange-500 p-0.5">
                        <StickyNote size={14} />
                      </button>
                      <span className="text-xs sm:text-sm font-bold text-gray-700">{formatMoney(item.price * item.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showCustomerForm && currentOrderId && (
          <div className="border-t border-gray-100 px-3 sm:px-4 py-2 sm:py-3 space-y-1.5 sm:space-y-2 bg-orange-50/50">
            <p className="text-[10px] sm:text-xs font-bold text-orange-700 flex items-center gap-1">
              <User size={12} className="inline" />
              بيانات العميل
            </p>
            <Input
              placeholder="اسم العميل"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="text-xs sm:text-sm h-7 sm:h-9"
            />
            <Input
              type="tel"
              placeholder="رقم الهاتف"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="text-xs sm:text-sm h-7 sm:h-9"
            />
            <Input
              placeholder="المنطقة / العنوان"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="text-xs sm:text-sm h-7 sm:h-9"
            />
          </div>
        )}

        <div className="border-t border-gray-100 p-2 sm:p-4 space-y-1 sm:space-y-2">
          <div className="flex justify-between text-[10px] sm:text-sm text-gray-500">
            <span>المجموع الفرعي</span>
            <span className="font-semibold">{formatMoney(subtotal)}</span>
          </div>
          {orderDiscount > 0 && (
            <div className="flex justify-between text-[10px] sm:text-sm text-red-500">
              <span>الخصم</span>
              <span className="font-semibold">-{formatMoney(orderDiscount)}</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="flex justify-between text-[10px] sm:text-sm text-gray-500">
              <span>رسوم التوصيل</span>
              <span className="font-semibold">{formatMoney(deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1 sm:pt-2 border-t border-gray-100">
            <span className="text-xs sm:text-base font-bold text-gray-800">الإجمالي</span>
            <span className="text-base sm:text-2xl font-bold text-blue-600">{formatMoney(total)}</span>
          </div>
          <Button size="lg" className="w-full text-sm sm:text-base py-1.5 sm:py-2" disabled={cart.length === 0} onClick={() => setCheckoutOpen(true)}>
            <CreditCard size={16} className="inline ml-1 sm:ml-2" />
            الدفع
          </Button>
        </div>
      </div>

      <Modal open={noteModalOpen} onClose={() => setNoteModalOpen(false)} title="ملاحظات الصنف" size="sm"
        footer={<><Button variant="secondary" onClick={() => setNoteModalOpen(false)}>إلغاء</Button><Button onClick={saveNote}>حفظ</Button></>}
      >
        <TextArea rows={4} placeholder="أضف ملاحظة للصنف..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
      </Modal>

      <Modal open={discountModalOpen} onClose={() => setDiscountModalOpen(false)} title="خصم على الفاتورة" size="sm"
        footer={<><Button variant="secondary" onClick={() => setDiscountModalOpen(false)}>إلغاء</Button><Button onClick={applyDiscount}>تطبيق</Button></>}
      >
        <Input type="number" placeholder="قيمة الخصم" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} autoFocus />
        {orderDiscount > 0 && (
          <button onClick={() => { updateCurrentOrder({ discount: 0 }); setDiscountModalOpen(false); }} className="text-sm text-red-500 mt-3">
            إزالة الخصم الحالي ({formatMoney(orderDiscount)})
          </button>
        )}
      </Modal>

      <Modal open={tagsModalOpen} onClose={() => setTagsModalOpen(false)} title="وسوم الطلب" size="sm">
        {settings.tags.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">لا توجد وسوم. أضف وسوماً من شاشة الوسوم.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {settings.tags.map((tag) => {
              const active = orderTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => updateCurrentOrder({ tagIds: active ? orderTagIds.filter((id) => id !== tag.id) : [...orderTagIds, tag.id] })}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                    active ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={active ? { backgroundColor: tag.color } : {}}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}
        {orderTagIds.length > 0 && (
          <button onClick={() => updateCurrentOrder({ tagIds: [] })} className="text-xs text-red-500 mt-3">
            مسح جميع الوسوم
          </button>
        )}
      </Modal>

      <Modal open={ordersListOpen} onClose={() => setOrdersListOpen(false)} title="الطلبات النشطة" size="md"
        footer={<Button variant="secondary" onClick={() => setOrdersListOpen(false)}>إغلاق</Button>}
      >
        {settings.activeOrders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">لا توجد طلبات نشطة</p>
        ) : (
          <div className="space-y-2">
            {settings.activeOrders.map((o) => (
              <div key={o.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                o.id === currentOrderId ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}>
                <button onClick={() => switchOrder(o.id)} className="flex-1 text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-800">{ORDER_TYPE_LABELS[o.type]}</span>
                    {o.tableLabel && <span className="text-xs text-gray-500">طاولة: {o.tableLabel}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      o.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {o.status === 'sent' ? 'أُرسل' : 'مفتوح'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{o.items.length} صنف · {formatMoney(o.items.reduce((s, i) => s + i.price * i.qty, 0))}</p>
                </button>
                <button onClick={() => deleteActiveOrder(o.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        <Button className="w-full mt-3" onClick={() => { newOrder(); setOrdersListOpen(false); }}>
          <FilePlus size={18} className="inline ml-1" />
          طلب جديد
        </Button>
      </Modal>

      <Modal open={moreModalOpen} onClose={() => setMoreModalOpen(false)} title="المزيد" size="sm">
        <div className="space-y-2">
          <MoreItem icon={Tag} label="إدارة الوسوم" onClick={() => { setMoreModalOpen(false); setTagsModalOpen(true); }} />
          <MoreItem icon={CreditCard} label="استرداد (Refund)" onClick={() => { setMoreModalOpen(false); setPinAction('refund'); setPinPadOpen(true); }} />
        </div>
      </Modal>

      <Modal open={refundModalOpen} onClose={() => setRefundModalOpen(false)} title="استرداد المبلغ" size="sm"
        footer={<><Button variant="secondary" onClick={() => setRefundModalOpen(false)}>إلغاء</Button><Button variant="danger" onClick={processRefund} disabled={!refundAmount}>تأكيد الاسترداد</Button></>}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">أدخل رقم الطلب للاسترداد:</p>
          <Input
            placeholder="رقم الطلب"
            value={refundOrder?.number.toString() ?? ''}
            onChange={() => {}} 
          />
          <Input
            type="number"
            placeholder="مبلغ الاسترداد"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
          />
          <Input
            placeholder="سبب الاسترداد"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
          />
        </div>
      </Modal>

      {pinPadOpen && (
        <Modal open={pinPadOpen} onClose={() => setPinPadOpen(false)} title="صلاحية المدير" size="sm">
          <PinPad
            expectedPin={settings.managerPin}
            onSuccess={onPinSuccess}
            onCancel={() => { setPinPadOpen(false); setPinAction(null); setConfirmVoidOpen(false); }}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={confirmVoidOpen}
        title="إلغاء الطلب"
        message="هل أنت متأكد من إلغاء هذا الطلب؟ يتطلب رمز المدير."
        confirmLabel="متابعة"
        onConfirm={() => voidOrder()}
        onCancel={() => setConfirmVoidOpen(false)}
      />

      {checkoutOpen && currentOrder && (
        <CheckoutModal
          subtotal={subtotal}
          discount={orderDiscount}
          deliveryFee={deliveryFee}
          financials={settings.financials}
          onClose={() => setCheckoutOpen(false)}
          onComplete={completeOrder}
        />
      )}

      {receiptOpen && lastOrder && (
        <Receipt
          order={lastOrder}
          onClose={() => setReceiptOpen(false)}
          isPreview={lastOrder.status === 'preview'}
        />
      )}

      {kitchenPreviewOrder && (
        <KitchenTicket
          order={kitchenPreviewOrder}
          onClose={() => setKitchenPreviewOrder(null)}
          onPrinted={onKitchenTicketPrinted}
        />
      )}
    </div>
  );
}

// ✅ TopButton - متجاوب
function TopButton({ icon: Icon, label, onClick, variant, disabled }: {
  icon: typeof Printer;
  label: string;
  onClick: () => void;
  variant?: 'danger' | 'primary';
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${
        variant === 'danger'
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : variant === 'primary'
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon size={14} className="sm:w-4 sm:h-4" />
      <span className="hidden xs:inline">{label}</span>
    </button>
  );
}

// ✅ OrderTypeButton - متجاوب
function OrderTypeButton({ active, icon: Icon, label, onClick }: {
  active: boolean;
  icon: typeof Utensils;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold transition-all active:scale-95 whitespace-nowrap ${
        active ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon size={14} className="sm:w-[18px] sm:h-[18px]" />
      <span className="hidden xs:inline">{label}</span>
    </button>
  );
}

function MoreItem({ icon: Icon, label, onClick }: {
  icon: typeof User;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 transition-colors text-right"
    >
      <Icon size={20} className="text-gray-500" />
      <span className="text-sm font-semibold text-gray-700">{label}</span>
    </button>
  );
}
