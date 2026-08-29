import { useState } from 'react';
import { useSettings } from '@/pos/context/SettingsContext';
import type { Tag } from '@/pos/types';
import { TAG_COLORS } from '@/pos/types';
import { uid } from '@/pos/utils/storage';
import { Modal, Button, Input, Field, Select } from '@/pos/components/ui/Modal';
import { ConfirmDialog } from '@/pos/components/ui/ConfirmDialog';
import {
  Tag as TagIcon, Plus, Pencil, Trash2, Link2, X,
} from 'lucide-react';

export function TagsScreen() {
  const { settings, update } = useSettings();
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [editTag, setEditTag] = useState<Tag | null>(null);
  const [deleteTag, setDeleteTag] = useState<Tag | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkTag, setLinkTag] = useState<Tag | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const saveTag = (tag: Tag) => {
    update((prev) => {
      const exists = prev.tags.some((t) => t.id === tag.id);
      return {
        ...prev,
        tags: exists
          ? prev.tags.map((t) => (t.id === tag.id ? tag : t))
          : [...prev.tags, tag],
      };
    });
    setTagModalOpen(false);
  };

  const removeTag = () => {
    if (!deleteTag) return;
    update((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t.id !== deleteTag.id),
      products: prev.products.map((p) => ({
        ...p,
        tagIds: p.tagIds.filter((id) => id !== deleteTag.id),
      })),
      orders: prev.orders.map((o) => ({
        ...o,
        tagIds: o.tagIds.filter((id) => id !== deleteTag.id),
      })),
    }));
    setDeleteTag(null);
  };

  const openLinkModal = (tag: Tag) => {
    setLinkTag(tag);
    setSelectedProductIds(
      settings.products.filter((p) => p.tagIds.includes(tag.id)).map((p) => p.id)
    );
    setLinkModalOpen(true);
  };

  const toggleProductLink = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const saveLinks = () => {
    if (!linkTag) return;
    update((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        const hasTag = p.tagIds.includes(linkTag.id);
        const shouldHave = selectedProductIds.includes(p.id);
        if (hasTag && !shouldHave) {
          return { ...p, tagIds: p.tagIds.filter((id) => id !== linkTag.id) };
        }
        if (!hasTag && shouldHave) {
          return { ...p, tagIds: [...p.tagIds, linkTag.id] };
        }
        return p;
      }),
    }));
    setLinkModalOpen(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center">
            <TagIcon className="text-pink-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">إدارة الوسوم</h1>
            <p className="text-sm text-gray-500 mt-1">إضافة وتعديل وحذف الوسوم وربطها بالمنتجات</p>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <Button onClick={() => { setEditTag(null); setTagModalOpen(true); }}>
            <Plus size={18} className="inline ml-1" />
            وسم جديد
          </Button>
        </div>

        {/* Tags grid */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {settings.tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <TagIcon size={48} className="mb-3" />
              <p className="text-sm mb-3">لا توجد وسوم بعد</p>
              <Button onClick={() => { setEditTag(null); setTagModalOpen(true); }}>
                <Plus size={18} className="inline ml-1" />
                إضافة أول وسم
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {settings.tags.map((tag) => {
                const linkedCount = settings.products.filter((p) => p.tagIds.includes(tag.id)).length;
                return (
                  <div key={tag.id} className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span
                        className="px-3 py-1.5 rounded-xl text-sm font-bold text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openLinkModal(tag)}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="ربط بالمنتجات"
                        >
                          <Link2 size={16} />
                        </button>
                        <button
                          onClick={() => { setEditTag(tag); setTagModalOpen(true); }}
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTag(tag)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      مرتبط بـ {linkedCount} منتج
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tag Edit Modal */}
      {tagModalOpen && (
        <TagEditModal tag={editTag} onClose={() => setTagModalOpen(false)} onSave={saveTag} />
      )}

      {/* Link Modal */}
      {linkModalOpen && linkTag && (
        <Modal open onClose={() => setLinkModalOpen(false)} title={`ربط الوسم "${linkTag.name}" بالمنتجات`} size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setLinkModalOpen(false)}>إلغاء</Button>
              <Button onClick={saveLinks}>حفظ الروابط</Button>
            </>
          }
        >
          {settings.products.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">لا توجد منتجات. أضف منتجات من شاشة المنتجات.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {settings.products.map((p) => (
                <label key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <button
                    onClick={() => toggleProductLink(p.id)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      selectedProductIds.includes(p.id)
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedProductIds.includes(p.id) && <X size={14} className="rotate-45" />}
                  </button>
                  <span className="text-sm font-semibold text-gray-700 flex-1">{p.name}</span>
                </label>
              ))}
            </div>
          )}
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTag}
        title="حذف الوسم"
        message={`حذف "${deleteTag?.name}"؟ سيتم إزالته من جميع المنتجات والطلبات المرتبطة.`}
        confirmLabel="حذف"
        onConfirm={removeTag}
        onCancel={() => setDeleteTag(null)}
      />
    </div>
  );
}

function TagEditModal({ tag, onClose, onSave }: {
  tag: Tag | null;
  onClose: () => void;
  onSave: (t: Tag) => void;
}) {
  const [name, setName] = useState(tag?.name ?? '');
  const [color, setColor] = useState(tag?.color ?? TAG_COLORS[0]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ id: tag?.id ?? uid('tag'), name: name.trim(), color });
  };

  return (
    <Modal open onClose={onClose} title={tag ? 'تعديل الوسم' : 'وسم جديد'} size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>حفظ</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="اسم الوسم">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: عاجل" autoFocus />
        </Field>
        <Field label="اللون">
          <div className="flex flex-wrap gap-2">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-xl transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-700 scale-110' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </Field>
        {name.trim() && (
          <div className="flex justify-center">
            <span
              className="px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {name}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
