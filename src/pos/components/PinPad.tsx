import { useState } from 'react';
import { Delete, Lock } from 'lucide-react';
import { Button } from '@/pos/components/ui/Modal';

interface PinPadProps {
  expectedPin: string;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
}

export function PinPad({ expectedPin, onSuccess, onCancel, title = 'رمز المرور' }: PinPadProps) {
  const [entry, setEntry] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (d: string) => {
    if (entry.length >= 6) return;
    const next = entry + d;
    setEntry(next);
    setError(false);
    if (next.length === expectedPin.length) {
      setTimeout(() => {
        if (next === expectedPin) {
          onSuccess();
        } else {
          setError(true);
          setEntry('');
        }
      }, 150);
    }
  };

  const handleDelete = () => {
    setEntry(entry.slice(0, -1));
    setError(false);
  };

  return (
    <div className="flex flex-col items-center" dir="ltr">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <Lock className="text-red-600" size={28} />
      </div>
      <p className="text-sm font-semibold text-gray-600 mb-4" dir="rtl">{title} - أدخل الرمز</p>
      <div className={`flex gap-3 mb-6 ${error ? 'animate-shake' : ''}`}>
        {Array.from({ length: expectedPin.length }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-colors ${
              error
                ? 'bg-red-500'
                : i < entry.length
                ? 'bg-blue-600'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      {error && (
        <p className="text-red-600 text-sm font-semibold mb-4">رمز خاطئ، حاول مرة أخرى</p>
      )}
      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="w-16 h-16 rounded-2xl bg-gray-50 text-2xl font-bold text-gray-800 hover:bg-gray-100 active:scale-95 transition-all"
          >
            {d}
          </button>
        ))}
        <button
          onClick={handleDelete}
          className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center"
        >
          <Delete size={24} />
        </button>
        <button
          onClick={() => handleDigit('0')}
          className="w-16 h-16 rounded-2xl bg-gray-50 text-2xl font-bold text-gray-800 hover:bg-gray-100 active:scale-95 transition-all"
        >
          0
        </button>
        <button
          onClick={onCancel}
          className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center text-sm font-bold"
        >
          ✕
        </button>
      </div>
      <Button variant="secondary" size="sm" className="mt-6" onClick={onCancel}>
        إلغاء
      </Button>
    </div>
  );
}
