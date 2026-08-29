import { useState, useMemo } from 'react';
import { useSettings } from '@/pos/context/SettingsContext';
import type { UserRole } from '@/pos/types';
import { formatDateTime, exportCSV } from '@/pos/utils/storage';
import { Button, Input, Select } from '@/pos/components/ui/Modal';
import { Shield, Download, Search } from 'lucide-react';

const ROLE_LABELS: Record<UserRole, string> = {
  cashier: 'كاشير',
  manager: 'مدير',
  admin: 'مدير عام',
};

export function AuditLogScreen() {
  const { settings } = useSettings();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const filtered = useMemo(() => {
    let list = [...settings.auditLog].reverse();
    if (filterRole) list = list.filter((e) => e.role === filterRole);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.action.toLowerCase().includes(q) ||
          e.user.toLowerCase().includes(q) ||
          (e.orderId?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [settings.auditLog, search, filterRole]);

  const handleExport = () => {
    exportCSV(`audit-log-${new Date().toISOString().slice(0, 10)}.csv`, filtered.map((e) => ({
      user: e.user,
      role: ROLE_LABELS[e.role],
      action: e.action,
      orderId: e.orderId ?? '',
      amount: e.amount ?? '',
      reason: e.reason ?? '',
      timestamp: formatDateTime(e.createdAt),
    })));
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50" dir="rtl">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
            <Shield className="text-red-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">سجل التدقيق</h1>
            <p className="text-sm text-gray-500 mt-1">سجل غير قابل للحذف لجميع الإجراءات الحساسة</p>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="بحث في السجل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-40">
            <option value="">كل الأدوار</option>
            <option value="cashier">كاشير</option>
            <option value="manager">مدير</option>
            <option value="admin">مدير عام</option>
          </Select>
          <Button variant="secondary" onClick={handleExport}>
            <Download size={18} className="inline ml-1" />
            تصدير CSV
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Shield size={48} className="mb-3" />
              <p className="text-sm">لا توجد سجلات بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">المستخدم</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">الدور</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">الإجراء</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">الطلب</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">المبلغ</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">السبب</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">الوقت</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">{entry.user}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{ROLE_LABELS[entry.role]}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{entry.action}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{entry.orderId ? `#${entry.orderId}` : '-'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                        {entry.amount != null ? entry.amount.toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{entry.reason ?? '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(entry.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          إجمالي السجلات: {settings.auditLog.length} — هذا السجل غير قابل للحذف
        </p>
      </div>
    </div>
  );
}
