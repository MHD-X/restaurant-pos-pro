import { useEffect, useState } from 'react';
import type { View } from '@/pos/types';
import { useSettings } from '@/pos/context/SettingsContext';
import {
  ShoppingCart,
  UtensilsCrossed,
  Store,
  Truck,
  Printer,
  Clock,
  FileBarChart,
  ChefHat,
  Calculator,
  Tag,
  SlidersHorizontal,
  Users,
  Shield,
  DatabaseBackup,
  PanelRightClose,
  PanelRightOpen,
  Receipt,
  X,
  ChevronDown,
  KeyRound,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  view: View;
  onNavigate: (v: View) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onChangeMyPin: () => void;
  onResetCashierPin: () => void;
  onLogout: () => void;
}

interface NavGroup {
  label: string;
  icon: typeof ShoppingCart;
  items: { id: View; label: string; icon: typeof ShoppingCart }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'نقطة البيع',
    icon: ShoppingCart,
    items: [
      { id: 'pos', label: 'نقطة البيع', icon: ShoppingCart },
      { id: 'products', label: 'المنتجات', icon: UtensilsCrossed },
      { id: 'modifiers', label: 'الإضافات', icon: SlidersHorizontal },
    ],
  },
  {
    label: 'إعدادات النظام',
    icon: Store,
    items: [
      { id: 'branding', label: 'هوية الفاتورة', icon: Store },
      { id: 'delivery', label: 'مناطق التوصيل', icon: Truck },
      { id: 'printers', label: 'إعدادات الطباعة', icon: Printer },
      { id: 'receipt-settings', label: 'إعدادات الفاتورة', icon: Receipt },
      { id: 'finance', label: 'التحكم المالي', icon: Calculator },
      { id: 'tags', label: 'الوسوم', icon: Tag },
    ],
  },
  {
    label: 'الإدارة',
    icon: Users,
    items: [
      { id: 'users', label: 'المستخدمون', icon: Users },
      { id: 'shifts', label: 'الورديات', icon: Clock },
      { id: 'reports', label: 'التقارير', icon: FileBarChart },
      { id: 'audit', label: 'سجل التدقيق', icon: Shield },
      { id: 'backup', label: 'نسخ احتياطي', icon: DatabaseBackup },
    ],
  },
];

const NavItem = ({ 
  item, 
  active, 
  collapsed, 
  onClick 
}: { 
  item: { id: View; label: string; icon: typeof ShoppingCart };
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) => {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 group relative rounded-xl ${
        active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
          : 'text-gray-300 hover:bg-slate-800 hover:text-white'
      }`}
      title={collapsed ? item.label : undefined}
    >
      {active && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-l-full" />
      )}
      <Icon size={22} className="flex-shrink-0" />
      <span className={`text-sm font-semibold transition-all duration-200 ${
        collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
      }`}>
        {item.label}
      </span>
    </button>
  );
};

const NavGroupItem = ({ 
  group, 
  view, 
  collapsed, 
  onNavigate 
}: { 
  group: NavGroup;
  view: View;
  collapsed: boolean;
  onNavigate: (v: View) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const Icon = group.icon;
  const hasActive = group.items.some(item => item.id === view);

  if (collapsed) {
    return (
      <div className="relative group">
        <button
          onClick={() => {
            const firstItem = group.items[0];
            if (firstItem) onNavigate(firstItem.id);
          }}
          className="w-full flex items-center justify-center px-4 py-3 transition-all duration-150 rounded-xl text-gray-300 hover:bg-slate-800 hover:text-white"
          title={group.label}
        >
          <Icon size={22} className="flex-shrink-0" />
        </button>
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {group.label}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 rounded-xl ${
          hasActive
            ? 'text-blue-400 bg-blue-600/10'
            : 'text-gray-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon size={22} className="flex-shrink-0" />
        <span className="text-sm font-semibold flex-1 text-right">{group.label}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <div className={`mr-4 overflow-hidden transition-all duration-200 ${
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        {group.items.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            active={view === item.id}
            collapsed={false}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

export function Sidebar({
  view,
  onNavigate,
  mobileOpen,
  onMobileOpenChange,
  onChangeMyPin,
  onResetCashierPin,
  onLogout,
}: SidebarProps) {
  const { settings } = useSettings();
  const [collapsed, setCollapsed] = useState(false);

  // استرجاع حالة طي القائمة الجانبية
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('pos.sidebarCollapsed') === '1');
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('pos.sidebarCollapsed', collapsed ? '1' : '0');
    } catch { /* ignore */ }
  }, [collapsed]);

  const handleNavigate = (v: View) => {
    onNavigate(v);
    onMobileOpenChange(false);
  };

  return (
    <>
      {/* قائمة الجوال (Drawer) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => onMobileOpenChange(false)}
          />
          <aside className="relative w-[280px] bg-slate-900 text-white flex flex-col flex-shrink-0 h-full animate-slide-up shadow-2xl mx-2 rounded-2xl">
            {/* رأس القائمة */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <ChefHat size={22} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight">
                    {settings.branding.name || 'نظام الكاشير'}
                  </p>
                  <p className="text-xs text-slate-400">نظام نقاط البيع</p>
                </div>
              </div>
              <button
                onClick={() => onMobileOpenChange(false)}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* محتوى القائمة */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navGroups.map((group) => (
                <NavGroupItem
                  key={group.label}
                  group={group}
                  view={view}
                  collapsed={false}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>

            {/* تذييل القائمة */}
            <SidebarFooterActions
              collapsed={false}
              cashierName={settings.cashierName}
              onChangeMyPin={onChangeMyPin}
              onResetCashierPin={onResetCashierPin}
              onLogout={onLogout}
            />
          </aside>
        </div>
      )}

      {/* القائمة الجانبية لسطح المكتب */}
      <aside
        className={`${
          collapsed ? 'w-[72px]' : 'w-[280px]'
        } hidden md:flex bg-slate-900 text-white flex-col flex-shrink-0 h-full transition-all duration-300 ease-in-out border-l border-slate-800`}
      >
        {/* رأس القائمة */}
        <div className={`flex items-center gap-3 px-4 py-4 border-b border-slate-800 ${
          collapsed ? 'justify-center' : ''
        }`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
            <ChefHat size={22} className="text-white" />
          </div>
          <div className={`flex-1 min-w-0 transition-all duration-200 ${
            collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
          }`}>
            <p className="font-bold text-sm leading-tight truncate">
              {settings.branding.name || 'نظام الكاشير'}
            </p>
            <p className="text-xs text-slate-400 truncate">نظام نقاط البيع</p>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
            title={collapsed ? 'توسيع' : 'طي'}
          >
            {collapsed ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
          </button>
        </div>

        {/* محتوى القائمة */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navGroups.map((group) => (
            <NavGroupItem
              key={group.label}
              group={group}
              view={view}
              collapsed={collapsed}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        <SidebarFooterActions
          collapsed={collapsed}
          cashierName={settings.cashierName}
          onChangeMyPin={onChangeMyPin}
          onResetCashierPin={onResetCashierPin}
          onLogout={onLogout}
        />
      </aside>
    </>
  );
}

function SidebarFooterActions({
  collapsed,
  cashierName,
  onChangeMyPin,
  onResetCashierPin,
  onLogout,
}: {
  collapsed: boolean;
  cashierName?: string;
  onChangeMyPin: () => void;
  onResetCashierPin: () => void;
  onLogout: () => void;
}) {
  if (collapsed) {
    return (
      <div className="px-2 py-3 border-t border-slate-800 flex flex-col items-center gap-2">
        <button
          onClick={onChangeMyPin}
          title="تغيير رمز المدير"
          className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
        >
          <KeyRound size={18} />
        </button>
        <button
          onClick={onLogout}
          title="تسجيل الخروج"
          className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 border-t border-slate-800 space-y-2">
      <p className="text-xs text-slate-500 px-1">
        الكاشير: <span className="text-slate-300 font-semibold">{cashierName || 'غير محدد'}</span>
      </p>
      <button
        onClick={onChangeMyPin}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/60 hover:bg-slate-800"
      >
        <KeyRound size={16} /> تغيير رمز المدير
      </button>
      <button
        onClick={onResetCashierPin}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/60 hover:bg-slate-800"
      >
        <ShieldCheck size={16} /> تعيين رمز الكاشير
      </button>
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-300 bg-red-500/10 hover:bg-red-500/20"
      >
        <LogOut size={16} /> تسجيل الخروج
      </button>
    </div>
  );
}
