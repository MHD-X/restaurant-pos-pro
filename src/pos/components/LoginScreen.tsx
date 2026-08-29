import { useState } from 'react';
import { ChefHat, Delete, LogIn } from 'lucide-react';
import { useAuth } from '@/pos/context/AuthContext';
import { useSettings } from '@/pos/context/SettingsContext';

export function LoginScreen() {
  const { login } = useAuth();
  const { settings } = useSettings();
  const [entry, setEntry] = useState('');
  const [error, setError] = useState('');

  const push = (d: string) => {
    if (entry.length >= 6) return;
    setError('');
    setEntry(entry + d);
  };

  const submit = (value = entry) => {
    if (value.length < 4) {
      setError('أدخل رمزًا من 4 أرقام على الأقل');
      return;
    }
    const role = login(value);
    if (!role) {
      setError('الرمز غير صحيح');
      setEntry('');
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-slate-900 px-4 py-8"
      dir="rtl"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-6 sm:p-8 animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-3">
            <ChefHat size={28} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-slate-800">
            {settings.branding.name || 'نظام الكاشير'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">أدخل الرقم السري للدخول</p>
        </div>

        <div className="flex justify-center gap-3 mb-4" dir="ltr">
          {Array.from({ length: Math.max(4, entry.length) }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-colors ${
                error ? 'bg-red-500' : i < entry.length ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm font-semibold text-red-600 mb-3 animate-shake">
            {error}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 sm:gap-3" dir="ltr">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => push(d)}
              className="h-14 rounded-2xl bg-slate-50 text-2xl font-bold text-slate-800 hover:bg-slate-100 active:scale-95 transition-all"
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => {
              setEntry(entry.slice(0, -1));
              setError('');
            }}
            className="h-14 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center"
            aria-label="حذف"
          >
            <Delete size={22} />
          </button>
          <button
            onClick={() => push('0')}
            className="h-14 rounded-2xl bg-slate-50 text-2xl font-bold text-slate-800 hover:bg-slate-100 active:scale-95 transition-all"
          >
            0
          </button>
          <button
            onClick={() => submit()}
            className="h-14 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center"
            aria-label="دخول"
          >
            <LogIn size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
