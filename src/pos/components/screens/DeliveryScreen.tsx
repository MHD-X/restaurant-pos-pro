import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import type { DeliveryZone, DineInArea } from '@/types';
import { uid, formatMoney } from '@/utils/storage';
import { Button, Input, Field, Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Truck, Plus, Pencil, Trash2, MapPin, LayoutGrid } from 'lucide-react';

export function DeliveryScreen() {
  const { settings, update } = useSettings();
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editZone, setEditZone] = useState<DeliveryZone | null>(null);
  const [deleteZone, setDeleteZone] = useState<DeliveryZone | null>(null);
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [editArea, setEditArea] = useState<DineInArea | null>(null);
  const [deleteArea, setDeleteArea] = useState<DineInArea | null>(null);

  const saveZone = (zone: DeliveryZone) => {
    update((prev) => {
      const exists = prev.deliveryZones.some((z) => z.id === zone.id);
      return {
        ...prev,
        deliveryZones: exists
          ? prev.deliveryZones.map((z) => (z.id === zone.id ? zone : z))
          : [...prev.deliveryZones, zone],
      };
    });
    setZoneModalOpen(false);
  };

  const removeZone = () => {
    if (!deleteZone) return;
    update((prev) => ({
      ...prev,
      deliveryZones: prev.deliveryZones.filter((z) => z.id !== deleteZone.id),
    }));
    setDeleteZone(null);
  };

  const saveArea = (area: DineInArea) => {
    update((prev) => {
      const exists = prev.dineInAreas.some((a) => a.id === area.id);
      return {
        ...prev,
        dineInAreas: exists
          ? prev.dineInAreas.map((a) => (a.id === area.id ? area : a))
          : [...prev.dineInAreas, area],
      };
    });
    setAreaModalOpen(false);
  };

  const removeArea = () => {
    if (!deleteArea) return;
    update((prev) => ({
      ...prev,
      dineInAreas: prev.dineInAreas.filter((a) => a.id !== deleteArea.id),
    }));
    setDeleteArea(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
            <Truck className="text-orange-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">مناطق التوصيل والصالات</h1>
            <p className="text-sm text-gray-500 mt-1">إدارة مناطق التوصيل ورسومها وصالات المطعم</p>
          </div>
        </div>

        {/* Delivery Zones */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">مناطق التوصيل</h2>
            <Button size="sm" onClick={() => { setEditZone(null); setZoneModalOpen(true); }}>
              <Plus size={16} className="inline ml-1" />
              منطقة جديدة
            </Button>
          </div>
          <div className="space-y-2">
            {settings.deliveryZones.map((zone) => (
              <div key={zone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <MapPin className="text-orange-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">{zone.name}</p>
                    <p className="text-xs text-gray-500">رسوم التوصيل: {formatMoney(zone.fee)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditZone(zone); setZoneModalOpen(true); }}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteZone(zone)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {settings.deliveryZones.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">لا توجد مناطق توصيل</p>
            )}
          </div>
        </div>

        {/* Dine-in Areas */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">صالات المطعم</h2>
            <Button size="sm" onClick={() => { setEditArea(null); setAreaModalOpen(true); }}>
              <Plus size={16} className="inline ml-1" />
              صالة جديدة
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {settings.dineInAreas.map((area) => (
              <div key={area.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="text-gray-400" size={18} />
                  <span className="text-sm font-semibold text-gray-700">{area.name}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditArea(area); setAreaModalOpen(true); }}
                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteArea(area)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {settings.dineInAreas.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6 col-span-full">لا توجد صالات</p>
            )}
          </div>
        </div>
      </div>

      {/* Zone Modal */}
      {zoneModalOpen && (
        <ZoneEditModal zone={editZone} onClose={() => setZoneModalOpen(false)} onSave={saveZone} />
      )}

      {/* Area Modal */}
      {areaModalOpen && (
        <AreaEditModal area={editArea} onClose={() => setAreaModalOpen(false)} onSave={saveArea} />
      )}

      <ConfirmDialog
        open={!!deleteZone}
        title="حذف منطقة التوصيل"
        message={`حذف "${deleteZone?.name}"؟`}
        confirmLabel="حذف"
        onConfirm={removeZone}
        onCancel={() => setDeleteZone(null)}
      />
      <ConfirmDialog
        open={!!deleteArea}
        title="حذف الصالة"
        message={`حذف "${deleteArea?.name}"؟`}
        confirmLabel="حذف"
        onConfirm={removeArea}
        onCancel={() => setDeleteArea(null)}
      />
    </div>
  );
}

function ZoneEditModal({ zone, onClose, onSave }: {
  zone: DeliveryZone | null;
  onClose: () => void;
  onSave: (z: DeliveryZone) => void;
}) {
  const [name, setName] = useState(zone?.name ?? '');
  const [fee, setFee] = useState(zone ? String(zone.fee) : '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ id: zone?.id ?? uid('dz'), name: name.trim(), fee: parseFloat(fee) || 0 });
  };

  return (
    <Modal open onClose={onClose} title={zone ? 'تعديل منطقة التوصيل' : 'منطقة توصيل جديدة'} size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>حفظ</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="اسم المنطقة">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: حي النخيل" autoFocus />
        </Field>
        <Field label="رسوم التوصيل">
          <Input type="number" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0.00" />
        </Field>
      </div>
    </Modal>
  );
}

function AreaEditModal({ area, onClose, onSave }: {
  area: DineInArea | null;
  onClose: () => void;
  onSave: (a: DineInArea) => void;
}) {
  const [name, setName] = useState(area?.name ?? '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ id: area?.id ?? uid('area'), name: name.trim() });
  };

  return (
    <Modal open onClose={onClose} title={area ? 'تعديل الصالة' : 'صالة جديدة'} size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>حفظ</Button>
        </>
      }
    >
      <Field label="اسم الصالة">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: صالة 1" autoFocus />
      </Field>
    </Modal>
  );
}
