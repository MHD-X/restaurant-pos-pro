import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import type { ModifierGroup, ModifierOption } from '@/types';
import { uid } from '@/utils/storage';
import { Modal, Button, Input, Field } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  SlidersHorizontal, Plus, Pencil, Trash2, X, Settings2,
} from 'lucide-react';

export function ModifiersScreen() {
  const { settings, update } = useSettings();
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<ModifierGroup | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<ModifierGroup | null>(null);

  const saveGroup = (group: ModifierGroup) => {
    update((prev) => {
      const exists = prev.modifierGroups.some((g) => g.id === group.id);
      return {
        ...prev,
        modifierGroups: exists
          ? prev.modifierGroups.map((g) => (g.id === group.id ? group : g))
          : [...prev.modifierGroups, group],
      };
    });
    setGroupModalOpen(false);
  };

  const removeGroup = () => {
    if (!deleteGroup) return;
    update((prev) => ({
      ...prev,
      modifierGroups: prev.modifierGroups.filter((g) => g.id !== deleteGroup.id),
      products: prev.products.map((p) => ({
        ...p,
        modifierGroupIds: p.modifierGroupIds.filter((id) => id !== deleteGroup.id),
      })),
    }));
    setDeleteGroup(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
            <SlidersHorizontal className="text-teal-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">إدارة الإضافات والمعدلات</h1>
            <p className="text-sm text-gray-500 mt-1">مجموعات الخيارات الإضافية للمنتجات</p>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <Button onClick={() => { setEditGroup(null); setGroupModalOpen(true); }}>
            <Plus size={18} className="inline ml-1" />
            مجموعة جديدة
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          {settings.modifierGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Settings2 size={48} className="mb-3" />
              <p className="text-sm mb-3">لا توجد مجموعات إضافات بعد</p>
              <Button onClick={() => { setEditGroup(null); setGroupModalOpen(true); }}>
                <Plus size={18} className="inline ml-1" />
                إضافة أول مجموعة
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {settings.modifierGroups.map((group) => {
                const linkedCount = settings.products.filter((p) =>
                  p.modifierGroupIds.includes(group.id)
                ).length;
                return (
                  <div key={group.id} className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800">{group.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {group.options.length} خيار · مرتبط بـ {linkedCount} منتج
                          {group.min > 0 && ` · إلزامي: ${group.min}`}
                          {group.max > 0 && ` · حد أقصى: ${group.max}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditGroup(group); setGroupModalOpen(true); }}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteGroup(group)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {group.options.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {group.options.map((opt) => (
                          <span
                            key={opt.id}
                            className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700"
                          >
                            {opt.name}
                            {opt.price > 0 && (
                              <span className="text-blue-600 mr-1">+{opt.price.toFixed(2)}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {groupModalOpen && (
        <ModifierGroupModal
          group={editGroup}
          onClose={() => setGroupModalOpen(false)}
          onSave={saveGroup}
        />
      )}

      <ConfirmDialog
        open={!!deleteGroup}
        title="حذف المجموعة"
        message={`حذف "${deleteGroup?.name}"؟ سيتم إزالتها من جميع المنتجات المرتبطة.`}
        confirmLabel="حذف"
        onConfirm={removeGroup}
        onCancel={() => setDeleteGroup(null)}
      />
    </div>
  );
}

function ModifierGroupModal({ group, onClose, onSave }: {
  group: ModifierGroup | null;
  onClose: () => void;
  onSave: (g: ModifierGroup) => void;
}) {
  const [name, setName] = useState(group?.name ?? '');
  const [minStr, setMinStr] = useState(group ? String(group.min) : '0');
  const [maxStr, setMaxStr] = useState(group ? String(group.max) : '0');
  const [options, setOptions] = useState<ModifierOption[]>(group?.options ?? []);
  const [optName, setOptName] = useState('');
  const [optPrice, setOptPrice] = useState('');

  const addOption = () => {
    if (!optName.trim()) return;
    setOptions([...options, {
      id: uid('opt'),
      name: optName.trim(),
      price: parseFloat(optPrice) || 0,
    }]);
    setOptName('');
    setOptPrice('');
  };

  const removeOption = (id: string) => {
    setOptions(options.filter((o) => o.id !== id));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: group?.id ?? uid('grp'),
      name: name.trim(),
      min: parseInt(minStr) || 0,
      max: parseInt(maxStr) || 0,
      options,
    });
  };

  return (
    <Modal open onClose={onClose} title={group ? 'تعديل المجموعة' : 'مجموعة جديدة'} size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>حفظ</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="اسم المجموعة">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: إضافات البرجر" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="حد أدنى (إلزامي)">
            <Input type="number" value={minStr} onChange={(e) => setMinStr(e.target.value)} placeholder="0" />
          </Field>
          <Field label="حد أقصى">
            <Input type="number" value={maxStr} onChange={(e) => setMaxStr(e.target.value)} placeholder="0 = بلا حد" />
          </Field>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 mb-2 block">الخيارات</label>
          <div className="flex gap-2 mb-3">
            <Input
              value={optName}
              onChange={(e) => setOptName(e.target.value)}
              placeholder="اسم الخيار"
              className="flex-1"
            />
            <Input
              type="number"
              value={optPrice}
              onChange={(e) => setOptPrice(e.target.value)}
              placeholder="سعر"
              className="w-24"
            />
            <Button variant="secondary" onClick={addOption} disabled={!optName.trim()}>
              <Plus size={18} />
            </Button>
          </div>
          {options.length > 0 && (
            <div className="space-y-2">
              {options.map((opt) => (
                <div key={opt.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                  <span className="text-sm font-semibold text-gray-700 flex-1">{opt.name}</span>
                  {opt.price > 0 && (
                    <span className="text-sm text-blue-600 font-bold">+{opt.price.toFixed(2)}</span>
                  )}
                  <button
                    onClick={() => removeOption(opt.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
