import { useState } from 'react';
import { useSettings } from '@/pos/context/SettingsContext';
import type { Permissions, User, UserRole } from '@/pos/types';
import { uid } from '@/pos/utils/storage';
import { Modal, Button, Input, Field, Select } from '@/pos/components/ui/Modal';
import { ConfirmDialog } from '@/pos/components/ui/ConfirmDialog';
import {
  Users as UsersIcon, Plus, Pencil, Trash2, Shield, UserCheck, UserX,
} from 'lucide-react';

const ROLE_LABELS: Record<UserRole, string> = {
  cashier: 'كاشير',
  manager: 'مدير',
  admin: 'مدير عام',
};

const ROLE_COLORS: Record<UserRole, string> = {
  cashier: 'bg-blue-50 text-blue-700',
  manager: 'bg-orange-50 text-orange-700',
  admin: 'bg-red-50 text-red-700',
};

export function UsersScreen() {
  const { settings, update } = useSettings();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const saveUser = (user: User) => {
    update((prev) => {
      const exists = prev.users.some((u) => u.id === user.id);
      return {
        ...prev,
        users: exists
          ? prev.users.map((u) => (u.id === user.id ? user : u))
          : [...prev.users, user],
      };
    });
    setUserModalOpen(false);
  };

  const removeUser = () => {
    if (!deleteUser) return;
    update((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== deleteUser.id),
    }));
    setDeleteUser(null);
  };

  const togglePerm = (key: keyof Permissions) => {
    update((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));
  };

  const toggleActive = (user: User) => {
    update((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === user.id ? { ...u, active: !u.active } : u
      ),
    }));
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <UsersIcon className="text-indigo-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
            <p className="text-sm text-gray-500 mt-1">المستخدمون والأدوار ورموز PIN</p>
          </div>
        </div>

        {/* صلاحيات الكاشير */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-800">صلاحيات الكاشير</h2>
          </div>
          <div className="space-y-3">
            <PermRow
              label="إلغاء طلب مفتوح"
              hint="عند الإيقاف لن يظهر زر الإلغاء في واجهة الكاشير"
              enabled={settings.permissions.cashierCanVoidOrder}
              onToggle={() => togglePerm('cashierCanVoidOrder')}
            />
            <PermRow
              label="حذف طلب من الطلبات النشطة"
              hint="حذف الطلبات يبقى للمدير فقط افتراضيًا"
              enabled={settings.permissions.cashierCanDeleteOrder}
              onToggle={() => togglePerm('cashierCanDeleteOrder')}
            />
            <PermRow
              label="منح خصم"
              hint="التحكم في من يستطيع تخفيض قيمة الفاتورة"
              enabled={settings.permissions.cashierCanDiscount}
              onToggle={() => togglePerm('cashierCanDiscount')}
            />
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <Button onClick={() => { setEditUser(null); setUserModalOpen(true); }}>
            <Plus size={18} className="inline ml-1" />
            مستخدم جديد
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {settings.users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <UsersIcon size={48} className="mb-3" />
              <p className="text-sm">لا يوجد مستخدمون</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">اسم المستخدم</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">الرقم السري</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">رمز PIN</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">الدور</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">الحالة</th>
                    <th className="text-center text-xs font-bold text-gray-500 px-4 py-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">{u.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">••••••</td>
                      <td className="px-4 py-3 text-sm font-mono font-bold text-gray-600">{u.pin}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${ROLE_COLORS[u.role]}`}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(u)} className="flex items-center gap-1">
                          {u.active ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                              <UserCheck size={14} /> نشط
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                              <UserX size={14} /> معطل
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setEditUser(u); setUserModalOpen(true); }}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteUser(u)}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            disabled={u.username === 'admin'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-orange-50 rounded-2xl p-4 mt-4 flex items-start gap-3">
          <Shield className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-orange-700">
            الإجراءات الحساسة (إلغاء الطلبات، حذف الأصناف، الاسترداد، إغلاق الورديات) تتطلب رمز PIN مدير.
            المستخدمون المعطلون لا يمكنهم تسجيل الدخول.
          </p>
        </div>
      </div>

      {userModalOpen && (
        <UserEditModal user={editUser} onClose={() => setUserModalOpen(false)} onSave={saveUser} />
      )}

      <ConfirmDialog
        open={!!deleteUser}
        title="حذف المستخدم"
        message={`حذف المستخدم "${deleteUser?.username}"؟ لا يمكن التراجع.`}
        confirmLabel="حذف"
        onConfirm={removeUser}
        onCancel={() => setDeleteUser(null)}
      />
    </div>
  );
}

function UserEditModal({ user, onClose, onSave }: {
  user: User | null;
  onClose: () => void;
  onSave: (u: User) => void;
}) {
  const [username, setUsername] = useState(user?.username ?? '');
  const [password, setPassword] = useState(user?.password ?? '');
  const [pin, setPin] = useState(user?.pin ?? '');
  const [role, setRole] = useState<UserRole>(user?.role ?? 'cashier');
  const [active, setActive] = useState(user?.active ?? true);

  const handleSave = () => {
    if (!username.trim() || !pin.trim()) return;
    onSave({
      id: user?.id ?? uid('user'),
      username: username.trim(),
      password: password || username,
      pin: pin.replace(/\D/g, '').slice(0, 6),
      role,
      active,
    });
  };

  return (
    <Modal open onClose={onClose} title={user ? 'تعديل المستخدم' : 'مستخدم جديد'} size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={!username.trim() || !pin.trim()}>حفظ</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="اسم المستخدم">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" autoFocus />
        </Field>
        <Field label="الرقم السري">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
        </Field>
        <Field label="رمز PIN (4-6 أرقام)">
          <Input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="7070"
            className="font-mono"
          />
        </Field>
        <Field label="الدور">
          <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="cashier">كاشير</option>
            <option value="manager">مدير</option>
            <option value="admin">مدير عام</option>
          </Select>
        </Field>
        <label className="flex items-center gap-3 cursor-pointer">
          <button
            onClick={() => setActive(!active)}
            className={`w-12 h-6 rounded-full transition-colors relative ${active ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${active ? 'right-0.5' : 'right-6'}`} />
          </button>
          <span className="text-sm font-semibold text-gray-700">{active ? 'نشط' : 'معطل'}</span>
        </label>
      </div>
    </Modal>
  );
}

function PermRow({ label, hint, enabled, onToggle }: {
  label: string;
  hint: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl">
      <div>
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
      </div>
      <button
        onClick={onToggle}
        aria-label={label}
        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${enabled ? 'right-0.5' : 'right-6'}`} />
      </button>
    </div>
  );
}
