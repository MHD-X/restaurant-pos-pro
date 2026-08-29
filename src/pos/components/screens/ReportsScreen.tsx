import { useState, useMemo } from 'react';
import { useSettings } from '@/pos/context/SettingsContext';
import type { Order } from '@/pos/types';
import { PAYMENT_METHOD_LABELS, ORDER_TYPE_LABELS } from '@/pos/types';
import { formatMoney, formatDateTime, todayISODate, formatDate } from '@/pos/utils/storage';
import { Button, Input } from '@/pos/components/ui/Modal';
import {
  FileBarChart, Calendar, Printer, TrendingUp, Wallet,
  Bike, XCircle, ShoppingBag, Receipt,
} from 'lucide-react';

export function ReportsScreen() {
  const { settings } = useSettings();
  const [dateFilter, setDateFilter] = useState(todayISODate());

  const dayOrders = useMemo(() => {
    return settings.orders.filter((o) => o.createdAt.slice(0, 10) === dateFilter);
  }, [settings.orders, dateFilter]);

  const validOrders = useMemo(() => dayOrders.filter((o) => !o.voided), [dayOrders]);
  const voidedOrders = useMemo(() => dayOrders.filter((o) => o.voided), [dayOrders]);

  const stats = useMemo(() => {
    const totalRevenue = validOrders.reduce((s, o) => s + o.total, 0);
    const byMethod: Record<string, number> = {};
    const byType: Record<string, number> = { count: 0 } as unknown as Record<string, number>;
    const typeCount: Record<string, number> = {};
    validOrders.forEach((o) => {
      byMethod[o.paymentMethod] = (byMethod[o.paymentMethod] ?? 0) + o.total;
      typeCount[o.type] = (typeCount[o.type] ?? 0) + 1;
    });

    // Delivery breakdown
    const deliveryOrders = validOrders.filter((o) => o.type === 'delivery');
    const byZone: Record<string, { count: number; fees: number; name: string }> = {};
    deliveryOrders.forEach((o) => {
      const zone = settings.deliveryZones.find((z) => z.id === o.deliveryZoneId);
      const key = o.deliveryZoneId ?? 'unknown';
      if (!byZone[key]) {
        byZone[key] = { count: 0, fees: 0, name: zone?.name ?? 'غير محدد' };
      }
      byZone[key].count += 1;
      byZone[key].fees += o.deliveryFee;
    });

    const totalTax = validOrders.reduce((s, o) => s + o.tax, 0);
    const totalService = validOrders.reduce((s, o) => s + o.serviceCharge, 0);
    const totalDiscount = validOrders.reduce((s, o) => s + o.discount, 0);
    const totalDeliveryFees = deliveryOrders.reduce((s, o) => s + o.deliveryFee, 0);

    return {
      totalRevenue,
      byMethod,
      typeCount,
      byZone,
      totalTax,
      totalService,
      totalDiscount,
      totalDeliveryFees,
      orderCount: validOrders.length,
    };
  }, [validOrders, settings.deliveryZones]);

  const printZReport = () => {
    window.print();
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
            <FileBarChart className="text-green-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ملخص ونهاية اليوم</h1>
            <p className="text-sm text-gray-500 mt-1">تقرير Z-Report ومراجعة العمليات اليومية</p>
          </div>
        </div>

        {/* Date filter */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 flex items-center gap-3">
          <Calendar className="text-gray-400" size={20} />
          <label className="text-sm font-semibold text-gray-600">تاريخ التقرير:</label>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-48"
          />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard icon={ShoppingBag} label="عدد الطلبات" value={String(stats.orderCount)} color="blue" />
          <StatCard icon={TrendingUp} label="إجمالي الإيرادات" value={formatMoney(stats.totalRevenue)} color="green" />
          <StatCard icon={Wallet} label="الضرائب المحصلة" value={formatMoney(stats.totalTax)} color="orange" />
          <StatCard icon={Receipt} label="رسوم الخدمة" value={formatMoney(stats.totalService)} color="purple" />
        </div>

        <div className="print-area">
          {/* Z-Report content */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <div className="flex items-center justify-between mb-4 no-print">
              <h2 className="text-lg font-bold text-gray-800">تقرير Z - {formatDate(dateFilter)}</h2>
              <Button variant="secondary" onClick={printZReport}>
                <Printer size={18} className="inline ml-1" />
                طباعة Z-Report
              </Button>
            </div>

            {/* Print-only header */}
            <div className="hidden print:block text-center mb-4">
              <p className="font-bold text-lg">{settings.branding.name || 'تقرير نهاية اليوم'}</p>
              <p>Z-Report - {formatDate(dateFilter)}</p>
            </div>

            {/* Revenue by payment method */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-600 mb-3">الإيرادات حسب طريقة الدفع</h3>
              <div className="space-y-2">
                {Object.entries(stats.byMethod).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-semibold text-gray-700">
                      {PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] ?? method}
                    </span>
                    <span className="text-sm font-bold text-blue-600">{formatMoney(amount)}</span>
                  </div>
                ))}
                {Object.keys(stats.byMethod).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">لا توجد مبيعات</p>
                )}
              </div>
              <div className="flex justify-between p-3 mt-2 bg-blue-50 rounded-xl">
                <span className="text-sm font-bold text-blue-700">الإجمالي</span>
                <span className="text-sm font-bold text-blue-700">{formatMoney(stats.totalRevenue)}</span>
              </div>
            </div>

            {/* Order types breakdown */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-600 mb-3">توزيع الطلبات حسب النوع</h3>
              <div className="grid grid-cols-3 gap-3">
                {(['dine-in', 'takeaway', 'delivery'] as const).map((type) => (
                  <div key={type} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">{ORDER_TYPE_LABELS[type]}</p>
                    <p className="text-lg font-bold text-gray-700">{stats.typeCount[type] ?? 0}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery breakdown */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
                <Bike size={18} className="text-orange-500" />
                تفصيل التوصيل حسب المنطقة
              </h3>
              <div className="space-y-2">
                {Object.values(stats.byZone).map((zone) => (
                  <div key={zone.name} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                    <div>
                      <span className="text-sm font-semibold text-gray-700">{zone.name}</span>
                      <span className="text-xs text-gray-500 mr-2">({zone.count} طلب)</span>
                    </div>
                    <span className="text-sm font-bold text-orange-600">{formatMoney(zone.fees)}</span>
                  </div>
                ))}
                {Object.keys(stats.byZone).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">لا توجد طلبات توصيل</p>
                )}
              </div>
              {stats.totalDeliveryFees > 0 && (
                <div className="flex justify-between p-3 mt-2 bg-orange-100 rounded-xl">
                  <span className="text-sm font-bold text-orange-700">إجمالي رسوم التوصيل</span>
                  <span className="text-sm font-bold text-orange-700">{formatMoney(stats.totalDeliveryFees)}</span>
                </div>
              )}
            </div>

            {/* Additional totals */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-red-50 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-red-700">إجمالي الخصومات</span>
                <span className="text-sm font-bold text-red-600">{formatMoney(stats.totalDiscount)}</span>
              </div>
              <div className="bg-gray-100 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">عدد الإلغاءات</span>
                <span className="text-sm font-bold text-gray-700">{voidedOrders.length}</span>
              </div>
            </div>
          </div>
        </div>

          {/* Void/Cancellations log */}
          <div className="bg-white rounded-2xl shadow-sm p-6 no-print">
            <h3 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
              <XCircle size={18} className="text-red-500" />
              سجل الإلغاءات
            </h3>
            {voidedOrders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">لا توجد إلغاءات</p>
            ) : (
              <div className="space-y-2">
                {voidedOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                    <div>
                      <span className="text-sm font-semibold text-gray-700">#{order.number}</span>
                      <span className="text-xs text-gray-500 mr-2">{formatDateTime(order.createdAt)}</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">{formatMoney(order.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        {/* All orders for the day */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-4 no-print">
          <h3 className="text-sm font-bold text-gray-600 mb-3">جميع طلبات اليوم ({validOrders.length})</h3>
          {validOrders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">لا توجد طلبات</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-right text-xs font-bold text-gray-500 px-3 py-2">رقم</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-3 py-2">الوقت</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-3 py-2">النوع</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-3 py-2">الدفع</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-3 py-2">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {validOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50">
                      <td className="px-3 py-2 text-sm font-semibold text-gray-700">#{order.number}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{formatDateTime(order.createdAt)}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{ORDER_TYPE_LABELS[order.type]}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</td>
                      <td className="px-3 py-2 text-sm font-bold text-blue-600">{formatMoney(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${colorClasses[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-800">{value}</p>
    </div>
  );
}
