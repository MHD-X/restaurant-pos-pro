import { useState } from 'react';
import type { View } from '@/pos/types';
import { SettingsProvider } from '@/pos/context/SettingsContext';
import { ToastProvider } from '@/pos/components/ui/Toast';
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

export function PosApp() {
  const [view, setView] = useState<View>(() => {
    if (typeof window === 'undefined') return 'pos';
    return (localStorage.getItem(VIEW_KEY) as View) || 'pos';
  });

  const navigate = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* تجاهل */
    }
  };

  return (
    <SettingsProvider>
      <ToastProvider>
        <div className="pos-root flex h-screen overflow-hidden bg-gray-100" dir="rtl">
          <Sidebar view={view} onNavigate={navigate} />
          <main className="flex-1 overflow-hidden min-w-0">
            {view === 'pos' && <PosScreen />}
            {view === 'products' && <ProductsScreen />}
            {view === 'modifiers' && <ModifiersScreen />}
            {view === 'branding' && <BrandingScreen />}
            {view === 'delivery' && <DeliveryScreen />}
            {view === 'printers' && <PrintersScreen />}
            {view === 'receipt-settings' && <ReceiptSettingsScreen />}
            {view === 'finance' && <FinanceScreen />}
            {view === 'tags' && <TagsScreen />}
            {view === 'users' && <UsersScreen />}
            {view === 'shifts' && <ShiftsScreen />}
            {view === 'reports' && <ReportsScreen />}
            {view === 'audit' && <AuditLogScreen />}
            {view === 'backup' && <BackupScreen />}
          </main>
        </div>
      </ToastProvider>
    </SettingsProvider>
  );
}
