import { useState, useMemo } from 'react';
import { useSettings } from '@/pos/context/SettingsContext';
import type { Shift, Order, CashEntry, Settings } from '@/pos/types';
import { PAYMENT_METHOD_LABELS } from '@/pos/types';
import { uid, formatMoney, formatDateTime, addAuditEntry } from '@/pos/utils/storage';
import { Button, Input, Field, Select, Modal } from '@/pos/components/ui/Modal';
import { ConfirmDialog } from '@/pos/components/ui/ConfirmDialog';
import { PinPad } from '@/pos/components/PinPad';
import {
  Clock, Play, Square, User, Wallet,
  ArrowRightLeft, ArrowDownCircle, ArrowUpCircle, Receipt,
  AlertTriangle, CheckCircle2,
} from 'lucide-react';

export function ShiftsScreen() {
  const { settings, update } = useSettings();
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [cashierName, setCashierName] = useState('');
  const [openingFloat, setOpeningFloat] = useState('');
  const [endShift, setEndShift] = useState<Shift | null>(null);
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [cashType, setCashType] = useState<'in' | 'out' | 'expense'>('in');
  const [cashAmount, setCashAmount] = useState('');
  const [cashReason, setCashReason] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [pinPadOpen, setPinPadOpen] = useState(false);
  const [pinAction, setPinAction] = useState<'close' | 'cashout' | null>(null);

  const currentShift = settings.shifts.find((s) => s.id === settings.currentShiftId);
  const activeOrders = useMemo(() => {
    if (!currentShift) return [];
    return settings.orders.filter((o) => currentShift.orders.includes(o.id) && !o.voided);
  }, [currentShift, settings.orders]);

  const shiftStats = useMemo(() => {
    const totalSales = activeOrders.reduce((s, o) => s + o.total, 0);
    const cashCollected = activeOrders
      .filter((o) => o.paymentMethod === 'cash' || o.paymentMethod === 'talabat-cash')
      .reduce((s, o) => s + o.total, 0);
    const byMethod: Record<string, number> = {};
    activeOrders.forEach((o) => {
      byMethod[o.paymentMethod] = (byMethod[o.paymentMethod] ?? 0) + o.total;
    });
    const cashInEntries = currentShift?.cashEntries.filter((e) => e.type === 'in').reduce((s, e) => s + e.amount, 0) ?? 0;
    const cashOutEntries = currentShift?.cashEntries.filter((e) => e.type === 'out').reduce((s, e) => s + e.amount, 0) ?? 0;
    const expenses = currentShift?.cashEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0) ?? 0;
    const expectedCash = (currentShift?.openingFloat ?? 0) + cashCollected + cashInEntries - cashOutEntries - expenses;
    return { totalSales, cashCollected, byMethod, orderCount: activeOrders.length, cashInEntries, cashOutEntries, expenses, expectedCash };
  }, [activeOrders, currentShift]);

  const startShift = () => {
    if (!cashierName.trim()) return;
    const shift: Shift = {
      id: uid('shift'),
      cashierName: cashierName.trim(),
      startedAt: new Date().toISOString(),
      openingFloat: parseFloat(openingFloat) || 0,
      orders: [],
      cashEntries: [],
    };
    update((prev) => ({
      ...prev,
      shifts: [...prev.shifts, shift],
      currentShiftId: shift.id,
      cashierName: cashierName.trim(),
    }));
    setCashierName('');
    setOpeningFloat('');
    setStartModalOpen(false);
  };

  const addCashEntry = () => {
    if (!currentShift || !cashAmount) return;
    const entry: CashEntry = {
      id: uid('cash'),
      shiftId: currentShift.id,
      type: cashType,
      amount: parseFloat(cashAmount) || 0,
      reason: cashReason,
      createdAt: new Date().toISOString(),
    };
    update((prev) => ({
      ...prev,
      shifts: prev.shifts.map((s) =>
        s.id === currentShift.id ? { ...s, cashEntries: [...s.cashEntries, entry] } : s
      ),
    }));
    setCashModalOpen(false);
    setCashAmount('');
    setCashReason('');
  };

  const closeShift = () => {
    if (!endShift) return;
    const actual = parseFloat(actualCash) || 0;
    const variance = actual - shiftStats.expectedCash;
    update((prev) => {
      let s: Settings = {
        ...prev,
        shifts: prev.shifts.map((sh) =>
          sh.id === endShift.id
            ? { ...sh, endedAt: new Date().toISOString(), actualCash: actual, variance }
            : sh
        ),
        currentShiftId: prev.currentShiftId === endShift.id ? undefined : prev.currentShiftId,
      };
      s = addAuditEntry(s, endShift.cashierName, 'manager', 'إغلاق وردية', {
        orderId: endShift.id, amount: actual, reason: `الفرق: ${variance.toFixed(2)}`,
      });
      return s;
    });
    setEndShift(null);
    setHandoverModalOpen(false);
    setActualCash('');
  };

  const onPinSuccess = () => {
    setPinPadOpen(false);
    if (pinAction === 'close') {
      setEndShift(currentShift ?? null);
      setHandoverModalOpen(true);
    }
    setPinAction(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
            <Clock className="text-purple-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">إدارة الورديات</h1>
            <p className="text-sm text-gray-500 mt-1">متابعة وتسليم ورديات الكاشير وإدارة النقدية</p>
          </div>
        </div>

        {currentShift ? (
          <>
            <div className="bg-gradient-to-l from-blue-600 to-blue-500 rounded-2xl p-6 text-white mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-blue-100">وردية نشطة</p>
                    <p className="text-lg font-bold">{currentShift.cashierName}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-xs text-blue-100">بدأت في</p>
                  <p className="text-sm font-semibold">{formatDateTime(currentShift.startedAt)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs text-blue-100">الطلبات</p>
                  <p className="text-xl font-bold">{shiftStats.orderCount}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs text-blue-100">المبيعات</p>
                  <p className="text-xl font-bold">{formatMoney(shiftStats.totalSales)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs text-blue-100">الكاش المتوقع</p>
                  <p className="text-xl font-bold">{formatMoney(shiftStats.expectedCash)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs text-blue-100">المصاريف</p>
                  <p className="text-xl font-bold">{formatMoney(shiftStats.expenses)}</p>
                </div>
              </div>
            </div>

            {/* Cash Management */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <Button variant="secondary" onClick={() => { setCashType('in'); setCashModalOpen(true); }}>
                <ArrowDownCircle size={18} className="inline ml-1 text-green-600" />
                إيداع نقد (Cash In)
              </Button>
              <Button variant="secondary" onClick={() => { setCashType('out'); setCashModalOpen(true); }}>
                <ArrowUpCircle size={18} className="inline ml-1 text-orange-600" />
                سحب نقد (Cash Out)
              </Button>
              <Button variant="secondary" onClick={() => { setCashType('expense'); setCashModalOpen(true); }}>
                <Receipt size={18} className="inline ml-1 text-red-600" />
                مصروف
              </Button>
            </div>

            {/* Cash entries log */}
            {currentShift.cashEntries.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                <h3 className="text-sm font-bold text-gray-600 mb-3">حركات النقدية</h3>
                <div className="space-y-2">
                  {currentShift.cashEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          entry.type === 'in' ? 'bg-green-100 text-green-700' :
                          entry.type === 'out' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {entry.type === 'in' ? 'إيداع' : entry.type === 'out' ? 'سحب' : 'مصروف'}
                        </span>
                        {entry.reason && <span className="text-xs text-gray-500">{entry.reason}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{formatDateTime(entry.createdAt)}</span>
                        <span className={`text-sm font-bold ${
                          entry.type === 'in' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {entry.type === 'in' ? '+' : '-'}{formatMoney(entry.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="danger" className="w-full" onClick={() => { setPinAction('close'); setPinPadOpen(true); }}>
              <ArrowRightLeft size={18} className="inline ml-1" />
              تسليم الوردية (يتطلب رمز المدير)
            </Button>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Clock size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">لا توجد وردية نشطة حالياً</p>
            <Button onClick={() => setStartModalOpen(true)}>
              <Play size={18} className="inline ml-1" />
              بدء وردية جديدة
            </Button>
          </div>
        )}

        {/* Shift history */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">سجل الورديات</h2>
          {settings.shifts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">لا توجد ورديات سابقة</p>
          ) : (
            <div className="space-y-2">
              {[...settings.shifts].reverse().map((shift) => {
                const orders = settings.orders.filter((o) => shift.orders.includes(o.id) && !o.voided);
                const total = orders.reduce((s, o) => s + o.total, 0);
                const isActive = shift.id === settings.currentShiftId;
                return (
                  <div key={shift.id} className={`p-4 rounded-xl border ${isActive ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-green-100' : 'bg-gray-200'}`}>
                          {isActive ? <Play className="text-green-600" size={16} /> : <Square className="text-gray-500" size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-700">{shift.cashierName}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(shift.startedAt)}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-blue-600">{formatMoney(total)}</p>
                        <p className="text-xs text-gray-500">{orders.length} طلب</p>
                      </div>
                    </div>
                    {shift.endedAt && (
                      <div className="text-xs text-gray-400 mt-2 space-y-1">
                        <p>انتهت: {formatDateTime(shift.endedAt)}</p>
                        {shift.actualCash != null && (
                          <p>الكاش الفعلي: {formatMoney(shift.actualCash)} · الفرق: <span className={shift.variance! < 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>{formatMoney(shift.variance!)}</span></p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Start shift modal */}
      <Modal open={startModalOpen} onClose={() => setStartModalOpen(false)} title="بدء وردية جديدة" size="sm"
        footer={<><Button variant="secondary" onClick={() => setStartModalOpen(false)}>إلغاء</Button><Button onClick={startShift} disabled={!cashierName.trim()}>بدء</Button></>}
      >
        <div className="space-y-4">
          <Field label="اسم الكاشير">
            <Input value={cashierName} onChange={(e) => setCashierName(e.target.value)} placeholder="اسم الكاشير" autoFocus />
          </Field>
          <Field label="رصيد بداية الوردية">
            <Input type="number" step="0.01" value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)} placeholder="0.00" />
          </Field>
        </div>
      </Modal>

      {/* Cash entry modal */}
      <Modal open={cashModalOpen} onClose={() => setCashModalOpen(false)} title={cashType === 'in' ? 'إيداع نقد' : cashType === 'out' ? 'سحب نقد' : 'تسجيل مصروف'} size="sm"
        footer={<><Button variant="secondary" onClick={() => setCashModalOpen(false)}>إلغاء</Button><Button onClick={addCashEntry} disabled={!cashAmount}>تأكيد</Button></>}
      >
        <div className="space-y-4">
          <Field label="المبلغ">
            <Input type="number" step="0.01" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="0.00" autoFocus />
          </Field>
          <Field label="السبب / ملاحظة">
            <Input value={cashReason} onChange={(e) => setCashReason(e.target.value)} placeholder="سبب الحركة" />
          </Field>
        </div>
      </Modal>

      {/* Handover modal */}
      {handoverModalOpen && currentShift && (
        <Modal open onClose={() => setHandoverModalOpen(false)} title="تسليم الوردية - تسوية النقدية" size="md"
          footer={<><Button variant="secondary" onClick={() => setHandoverModalOpen(false)}>إلغاء</Button><Button variant="danger" onClick={() => setEndShift(currentShift)}>تأكيد التسليم</Button></>}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <User className="text-gray-500" size={20} />
                <span className="font-bold text-gray-700">{currentShift.cashierName}</span>
              </div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">رصيد البداية</span><span className="font-bold">{formatMoney(currentShift.openingFloat)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">الكاش المحصل</span><span className="font-bold text-green-600">{formatMoney(shiftStats.cashCollected)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">إيداعات</span><span className="font-bold">+{formatMoney(shiftStats.cashInEntries)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">سحوبات</span><span className="font-bold">-{formatMoney(shiftStats.cashOutEntries)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">مصاريف</span><span className="font-bold text-red-600">-{formatMoney(shiftStats.expenses)}</span></div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                <span className="font-bold text-gray-700">الكاش المتوقع</span>
                <span className="font-bold text-blue-600">{formatMoney(shiftStats.expectedCash)}</span>
              </div>
            </div>
            <Field label="الكاش الفعلي (Actual Cash)">
              <Input type="number" step="0.01" value={actualCash} onChange={(e) => setActualCash(e.target.value)} placeholder="0.00" />
            </Field>
            {actualCash && (
              <div className={`rounded-xl p-3 flex items-center gap-2 ${
                parseFloat(actualCash) - shiftStats.expectedCash === 0 ? 'bg-green-50 text-green-700' :
                parseFloat(actualCash) - shiftStats.expectedCash < 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {parseFloat(actualCash) - shiftStats.expectedCash === 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span className="text-sm font-bold">
                  الفرق: {formatMoney(parseFloat(actualCash) - shiftStats.expectedCash)}
                </span>
              </div>
            )}
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!endShift}
        title="تأكيد تسليم الوردية"
        message="سيتم إنهاء الوردية الحالية وتسجيل التسوية. تأكد من تسليم الكاش قبل المتابعة."
        confirmLabel="تأكيد التسليم"
        onConfirm={closeShift}
        onCancel={() => setEndShift(null)}
      />

      {pinPadOpen && (
        <Modal open={pinPadOpen} onClose={() => setPinPadOpen(false)} title="صلاحية المدير" size="sm">
          <PinPad
            expectedPin={settings.managerPin}
            onSuccess={onPinSuccess}
            onCancel={() => { setPinPadOpen(false); setPinAction(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
