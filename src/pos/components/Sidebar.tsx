import { useState } from 'react';
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
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

interface SidebarProps {
  view: View;
  onNavigate: (v: View) => void;
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

export function Sidebar({ view, onNavigate }: SidebarProps) {
  const { settings } = useSettings();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (v: View) => {
    onNavigate(v);
    setMobileOpen(false);
  };

  return (
    <>
      {/* زر القائمة للجوال - يظهر على الشاشات الصغيرة */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl hover:bg-slate-800 active:scale-95 transition-all duration-200 border border-slate-700"
        aria-label="فتح القائمة"
      >
        <Menu size={24} />
      </button>

      {/* قائمة الجوال (Drawer) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
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
                onClick={() => setMobileOpen(false)}
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
            <div className="px-4 py-3 border-t border-slate-800">
              <p className="text-xs text-slate-500">
                الكاشير: <span className="text-slate-300 font-semibold">{settings.cashierName || 'غير محدد'}</span>
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* القائمة الجانبية لسطح المكتب */}
      <aside
        className={`${
          collapsed ? 'w-[72px]' : 'w-[280px]'
        } hidden lg:flex bg-slate-900 text-white flex-col flex-shrink-0 h-full transition-all duration-300 ease-in-out border-l border-slate-800`}
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

        {/* تذييل القائمة */}
        <div className={`px-4 py-3 border-t border-slate-800 transition-all duration-200 ${
          collapsed ? 'text-center' : ''
        }`}>
          <p className={`text-xs text-slate-500 ${collapsed ? 'hidden' : 'block'}`}>
            الكاشير: <span className="text-slate-300 font-semibold">{settings.cashierName || 'غير محدد'}</span>
          </p>
          {collapsed && (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 mx-auto flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/30">
              {settings.cashierName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
