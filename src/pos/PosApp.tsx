import { useState } from 'react';
import { Menu, KeyRound, LogOut, Clock, ShoppingCart, ChefHat } from 'lucide-react';
import type { View } from '@/pos/types';
import { SettingsProvider, useSettings } from '@/pos/context/SettingsContext';
import { AuthProvider, useAuth } from '@/pos/context/AuthContext';
import { ToastProvider } from '@/pos/components/ui/Toast';
import { LoginScreen } from '@/pos/components/LoginScreen';
import { ChangePinModal } from '@/pos/components/ChangePinModal';
import { Sidebar } from '@/pos/components/Sidebar';
import { PosScreen } from '@/pos/components/screens/PosScreen';
import { ProductsScreen } from '@/pos/components/screens/ProductsScreen';
import { ModifiersScreen } from '@/pos/components/screens/ModifiersScreen';
import { BrandingScreen } from '@/pos/components/screens/BrandingScreen';
import { DeliveryScreen } from '@/pos/components/screens/DeliveryScreen';
import { PrintersScreen } from '@/pos/components/screens/PrintersScreen';
import { ReceiptSettingsScreen } from '@/pos/components/screens/ReceiptSettingsScreen';
import { FinanceScreen } from '@/pos/components/screens/FinanceScreen';
import { TagsScreen } from '@/pos/components/screens/TagsScreen';
import { UsersScreen } from '@/pos/components/screens/UsersScreen';
import { ShiftsScreen } from '@/pos/components/screens/ShiftsScreen';
import { ReportsScreen } from '@/pos/components/screens/ReportsScreen';
import { AuditLogScreen } from '@/pos/components/screens/AuditLogScreen';
import { BackupScreen } from '@/pos/components/screens/BackupScreen';

const VIEW_KEY = 'pos.view';

/** تنبيه ظاهر عند فشل حفظ البيانات محليًا (امتلاء التخزين). */
function StorageBanner() {
  const { storageError } = useSettings();
  if (!storageError) return null;
  return (
    <div className="bg-red-600 text-white text-xs sm:text-sm px-3 py-2 flex-shrink-0">
      {storageError}
    </div>
  );
}

function ScreenSwitch({ view }: { view: View }) {
  switch (view) {
    case 'products':
      return <ProductsScreen />;
    case 'modifiers':
      return <ModifiersScreen />;
    case 'branding':
      return <BrandingScreen />;
    case 'delivery':
      return <DeliveryScreen />;
    case 'printers':
      return <PrintersScreen />;
    case 'receipt-settings':
      return <ReceiptSettingsScreen />;
    case 'finance':
      return <FinanceScreen />;
    case 'tags':
      return <TagsScreen />;
    case 'users':
      return <UsersScreen />;
    case 'shifts':
      return <ShiftsScreen />;
    case 'reports':
      return <ReportsScreen />;
    case 'audit':
      return <AuditLogScreen />;
    case 'backup':
      return <BackupScreen />;
    default:
      return <PosScreen />;
  }
}

/* ============ لوحة المدير ============ */
function AdminLayout() {
  const { logout } = useAuth();
  const [view, setView] = useState<View>(() => {
    if (typeof window === 'undefined') return 'pos';
    return (localStorage.getItem(VIEW_KEY) as View) || 'pos';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pinModal, setPinModal] = useState<null | 'admin' | 'cashier'>(null);

  const navigate = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* تجاهل */
    }
  };

  return (
    <div className="pos-root flex h-screen w-full overflow-hidden bg-gray-100" dir="rtl">
      <Sidebar
        view={view}
        onNavigate={navigate}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        onChangeMyPin={() => setPinModal('admin')}
        onResetCashierPin={() => setPinModal('cashier')}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* شريط علوي للجوال */}
        <header className="md:hidden flex items-center gap-2 bg-slate-900 text-white px-3 py-2 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="فتح القائمة"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-bold">لوحة المدير</span>
        </header>

        <StorageBanner />

        <main className="flex-1 min-h-0 overflow-hidden">
          <ScreenSwitch view={view} />
        </main>
      </div>

      <ChangePinModal
        open={pinModal !== null}
        onClose={() => setPinModal(null)}
        target={pinModal ?? 'admin'}
        skipCurrent={pinModal === 'cashier'}
      />
    </div>
  );
}

/* ============ واجهة الكاشير المبسطة ============ */
function CashierLayout() {
  const { logout } = useAuth();
  const { settings } = useSettings();
  const [view, setView] = useState<'pos' | 'shifts'>('pos');
  const [pinOpen, setPinOpen] = useState(false);

  const tabClass = (active: boolean) =>
    `flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
      active ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
    }`;

  return (
    <div className="pos-root flex flex-col h-screen w-full overflow-hidden bg-gray-100" dir="rtl">
      <header className="flex items-center gap-2 bg-slate-900 text-white px-3 py-2 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
          <ChefHat size={18} />
        </div>
        <span className="text-sm font-bold hidden sm:block truncate">
          {settings.branding.name || 'نظام الكاشير'}
        </span>

        <div className="flex items-center gap-2 mr-auto">
          <button onClick={() => setView('pos')} className={tabClass(view === 'pos')}>
            <ShoppingCart size={16} /> نقطة البيع
          </button>
          <button onClick={() => setView('shifts')} className={tabClass(view === 'shifts')}>
            <Clock size={16} /> الوردية
          </button>
          <button
            onClick={() => setPinOpen(true)}
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
            title="تغيير رمزي السري"
          >
            <KeyRound size={16} />
          </button>
          <button
            onClick={logout}
            className="w-9 h-9 rounded-xl bg-red-500/15 text-red-300 hover:bg-red-500/25 flex items-center justify-center"
            title="تسجيل الخروج"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden">
        {view === 'pos' ? <PosScreen /> : <ShiftsScreen />}
      </main>

      <ChangePinModal open={pinOpen} onClose={() => setPinOpen(false)} target="cashier" />
    </div>
  );
}

function AuthedApp() {
  const { role } = useAuth();
  if (!role) return <LoginScreen />;
  return role === 'admin' ? <AdminLayout /> : <CashierLayout />;
}

export function PosApp() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <AuthProvider>
          <AuthedApp />
        </AuthProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}
