import { useState } from 'react';
import { Modal, Button, Field, Input } from '@/pos/components/ui/Modal';
import { useAuth, type AuthRole } from '@/pos/context/AuthContext';
import { useToast } from '@/pos/components/ui/Toast';

interface ChangePinModalProps {
  open: boolean;
  onClose: () => void;
  target: AuthRole;
  /** عند true لا يُطلب الرمز الحالي (المدير يعيد تعيين رمز الكاشير). */
  skipCurrent?: boolean;
}

const LABELS: Record<AuthRole, string> = {
  admin: 'المدير',
  cashier: 'الكاشير',
};

export function ChangePinModal({ open, onClose, target, skipCurrent = false }: ChangePinModalProps) {
  const { changePin } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError('');
  };

  const handleSave = () => {
    if (next !== confirm) {
      setError('الرمز الجديد وتأكيده غير متطابقين');
      return;
    }
    const res = changePin(target, next, skipCurrent ? undefined : current);
    if (!res.ok) {
      setError(res.error || 'تعذر تغيير الرمز');
      return;
    }
    toast?.show?.(`تم تغيير رمز ${LABELS[target]} بنجاح`, 'success');
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={`تغيير رمز ${LABELS[target]}`}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            إلغاء
          </Button>
          <Button onClick={handleSave}>حفظ</Button>
        </>
      }
    >
      <div className="space-y-3">
        {!skipCurrent && (
          <Field label="الرمز الحالي">
            <Input
              type="password"
              inputMode="numeric"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="••••"
            />
          </Field>
        )}
        <Field label="الرمز الجديد (4-6 أرقام)">
          <Input
            type="password"
            inputMode="numeric"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="••••"
          />
        </Field>
        <Field label="تأكيد الرمز الجديد">
          <Input
            type="password"
            inputMode="numeric"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••"
          />
        </Field>
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
