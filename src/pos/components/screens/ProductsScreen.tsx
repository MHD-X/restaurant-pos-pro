import { useRef, useState, useMemo } from 'react';
import { useSettings } from '@/pos/context/SettingsContext';
import type { Product, Category, ProductPrice } from '@/pos/types';
import { CATEGORY_COLORS } from '@/pos/types';
import { uid, formatMoney, fileToDataUrl, getProductPrice } from '@/pos/utils/storage';
import { Modal, Button, Input, Select, Field } from '@/pos/components/ui/Modal';
import { ConfirmDialog } from '@/pos/components/ui/ConfirmDialog';
import {
  Plus, Pencil, Trash2, Utensils, ImagePlus, Search, FolderPlus, X,
} from 'lucide-react';

export function ProductsScreen() {
  const { settings, update } = useSettings();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [dragCatId, setDragCatId] = useState<string | null>(null);

  /* إعادة ترتيب الفئات بالسحب والإفلات */
  const reorderCategories = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    update((prev) => {
      const list = [...prev.categories];
      const from = list.findIndex((c) => c.id === fromId);
      const to = list.findIndex((c) => c.id === toId);
      if (from < 0 || to < 0) return prev;
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      return { ...prev, categories: list };
    });
  };

  const filtered = useMemo(() => {
    let list = settings.products;
    if (filterCat) list = list.filter((p) => p.categoryId === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [settings.products, filterCat, search]);

  const openNewProduct = () => {
    setEditProduct(null);
    setProductModalOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditProduct(p);
    setProductModalOpen(true);
  };

  const saveProduct = (product: Product) => {
    update((prev) => {
      const exists = prev.products.some((p) => p.id === product.id);
      return {
        ...prev,
        products: exists
          ? prev.products.map((p) => (p.id === product.id ? product : p))
          : [...prev.products, product],
      };
    });
    setProductModalOpen(false);
  };

  const removeProduct = () => {
    if (!deleteProduct) return;
    update((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== deleteProduct.id),
    }));
    setDeleteProduct(null);
  };

  const saveCategory = (cat: Category) => {
    update((prev) => {
      const exists = prev.categories.some((c) => c.id === cat.id);
      return {
        ...prev,
        categories: exists
          ? prev.categories.map((c) => (c.id === cat.id ? cat : c))
          : [...prev.categories, cat],
      };
    });
    setCategoryModalOpen(false);
  };

  const removeCategory = () => {
    if (!deleteCategory) return;
    update((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== deleteCategory.id),
      products: prev.products.filter((p) => p.categoryId !== deleteCategory.id),
    }));
    setDeleteCategory(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50" dir="rtl">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">إدارة المنتجات والأصناف</h1>
            <p className="text-sm text-gray-500 mt-1">{settings.products.length} منتج في {settings.categories.length} فئة</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCategoryModalOpen(true)}>
              <FolderPlus size={18} className="inline ml-1" />
              فئة جديدة
            </Button>
            <Button onClick={openNewProduct}>
              <Plus size={18} className="inline ml-1" />
              منتج جديد
            </Button>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="بحث عن منتج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="w-48">
            <option value="">كل الفئات</option>
            {settings.categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Utensils size={48} className="mb-3" />
              <p className="text-sm mb-3">لا توجد منتجات بعد</p>
              <Button onClick={openNewProduct}>
                <Plus size={18} className="inline ml-1" />
                إضافة أول منتج
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">الصورة</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">الاسم</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">الفئة</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">سعر الصالة</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">سعر السفري</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">سعر التوصيل</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">سعر طلبات</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">الوسوم</th>
                    <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">الحالة</th>
                    <th className="text-center text-xs font-bold text-gray-500 px-4 py-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const cat = settings.categories.find((c) => c.id === p.categoryId);
                    return (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Utensils size={20} className="text-gray-300" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-700">{p.name}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
                            style={{ backgroundColor: cat?.color ?? '#999' }}
                          >
                            {cat?.name ?? 'بدون فئة'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-blue-600">{formatMoney(p.prices.dineIn)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-600">{formatMoney(p.prices.takeaway)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-600">{formatMoney(p.prices.delivery)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-600">{formatMoney(p.prices.talabat)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {p.tagIds.map((tid) => {
                              const tag = settings.tags.find((t) => t.id === tid);
                              if (!tag) return null;
                              return (
                                <span key={tid} className="px-2 py-0.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: tag.color }}>
                                  {tag.name}
                                </span>
                              );
                            })}
                            {p.tagIds.length === 0 && <span className="text-xs text-gray-300">-</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                            p.available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {p.available ? 'متاح' : 'غير متاح'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditProduct(p)}
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteProduct(p)}
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-600">الفئات</h3>
            <span className="text-xs text-gray-400">اسحب البطاقة لإعادة الترتيب</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings.categories.map((c) => (
              <div
                key={c.id}
                draggable
                onDragStart={() => setDragCatId(c.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragCatId) reorderCategories(dragCatId, c.id);
                  setDragCatId(null);
                }}
                onDragEnd={() => setDragCatId(null)}
                className={`flex items-center gap-2 pl-2 pr-3 py-2 rounded-xl text-white text-sm font-semibold cursor-grab active:cursor-grabbing transition-opacity ${
                  dragCatId === c.id ? 'opacity-50' : ''
                }`}
                style={{ backgroundColor: c.color }}
              >
                <GripVertical size={14} className="opacity-70" />
                {c.image ? (
                  <img src={c.image} alt="" className="w-7 h-7 rounded-lg object-cover bg-white/20" />
                ) : null}
                {c.name}
                <button
                  onClick={() => setEditCategory(c)}
                  className="hover:bg-white/20 rounded p-0.5 transition-colors"
                  title="تعديل الفئة"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteCategory(c)}
                  className="hover:bg-white/20 rounded p-0.5 transition-colors"
                  title="حذف الفئة"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {productModalOpen && (
        <ProductEditModal
          product={editProduct}
          categories={settings.categories}
          tags={settings.tags}
          modifierGroups={settings.modifierGroups}
          onClose={() => setProductModalOpen(false)}
          onSave={saveProduct}
        />
      )}

      {(categoryModalOpen || editCategory) && (
        <CategoryEditModal
          category={editCategory}
          onClose={() => {
            setCategoryModalOpen(false);
            setEditCategory(null);
          }}
          onSave={(c) => {
            saveCategory(c);
            setEditCategory(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteProduct}
        title="حذف المنتج"
        message={`هل تريد حذف "${deleteProduct?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        onConfirm={removeProduct}
        onCancel={() => setDeleteProduct(null)}
      />

      <ConfirmDialog
        open={!!deleteCategory}
        title="حذف الفئة"
        message={`حذف "${deleteCategory?.name}" سيحذف جميع المنتجات بداخلها.`}
        confirmLabel="حذف"
        onConfirm={removeCategory}
        onCancel={() => setDeleteCategory(null)}
      />
    </div>
  );
}

function ProductEditModal({ product, categories, tags, modifierGroups, onClose, onSave }: {
  product: Product | null;
  categories: Category[];
  tags: { id: string; name: string; color: string }[];
  modifierGroups: { id: string; name: string }[];
  onClose: () => void;
  onSave: (p: Product) => void;
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? '');
  const [image, setImage] = useState<string | undefined>(product?.image);
  const [available, setAvailable] = useState(product?.available ?? true);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(product?.tagIds ?? []);
  const [selectedModifierGroupIds, setSelectedModifierGroupIds] = useState<string[]>(product?.modifierGroupIds ?? []);
  const [prices, setPrices] = useState<ProductPrice>(
    product?.prices ?? { dineIn: 0, takeaway: 0, delivery: 0, talabat: 0 }
  );
  const [useSamePrice, setUseSamePrice] = useState(!product);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = async (file: File | undefined) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setImage(dataUrl);
  };

  const setBasePrice = (val: string) => {
    const num = parseFloat(val) || 0;
    if (useSamePrice) {
      setPrices({ dineIn: num, takeaway: num, delivery: num, talabat: num });
    } else {
      setPrices({ ...prices, dineIn: num });
    }
  };

  const handleSave = () => {
    if (!name.trim() || !categoryId) return;
    onSave({
      id: product?.id ?? uid('prod'),
      name: name.trim(),
      price: prices.dineIn,
      prices,
      categoryId,
      image,
      available,
      tagIds: selectedTagIds,
      modifierGroupIds: selectedModifierGroupIds,
    });
  };

  return (
    <Modal open onClose={onClose} title={product ? 'تعديل المنتج' : 'منتج جديد'} size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>حفظ</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 mb-2">
            {image ? (
              <img src={image} alt="product" className="w-full h-full object-cover" />
            ) : (
              <Utensils size={36} className="text-gray-300" />
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files?.[0])} />
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            <ImagePlus size={16} className="inline ml-1" />
            {image ? 'تغيير الصورة' : 'رفع صورة'}
          </Button>
          {image && (
            <button onClick={() => setImage(undefined)} className="text-xs text-red-500 mt-1">
              إزالة الصورة
            </button>
          )}
        </div>

        <Field label="اسم المنتج">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: شاورما دجاج" autoFocus />
        </Field>

        <Field label="الفئة">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>

        {/* Multi-pricing */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-gray-700">الأسعار حسب نوع الطلب</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useSamePrice}
                onChange={(e) => {
                  setUseSamePrice(e.target.checked);
                  if (e.target.checked) {
                    setPrices({ dineIn: prices.dineIn, takeaway: prices.dineIn, delivery: prices.dineIn, talabat: prices.dineIn });
                  }
                }}
                className="w-4 h-4 rounded"
              />
              <span className="text-xs text-gray-500">نفس السعر للجميع</span>
            </label>
          </div>
          {useSamePrice ? (
            <Input
              type="number"
              step="0.01"
              value={String(prices.dineIn)}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="0.00"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <PriceField label="صالة" value={prices.dineIn} onChange={(v) => setPrices({ ...prices, dineIn: v })} />
              <PriceField label="سفري" value={prices.takeaway} onChange={(v) => setPrices({ ...prices, takeaway: v })} />
              <PriceField label="توصيل" value={prices.delivery} onChange={(v) => setPrices({ ...prices, delivery: v })} />
              <PriceField label="طلبات" value={prices.talabat} onChange={(v) => setPrices({ ...prices, talabat: v })} />
            </div>
          )}
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <button
            onClick={() => setAvailable(!available)}
            className={`w-12 h-6 rounded-full transition-colors relative ${available ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${available ? 'right-0.5' : 'right-6'}`} />
          </button>
          <span className="text-sm font-semibold text-gray-700">{available ? 'متاح للبيع' : 'غير متاح'}</span>
        </label>

        {tags.length > 0 && (
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">الوسوم</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() =>
                      setSelectedTagIds((prev) =>
                        active ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                      active ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={active ? { backgroundColor: tag.color } : {}}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {modifierGroups.length > 0 && (
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">مجموعات الإضافات</label>
            <div className="flex flex-wrap gap-2">
              {modifierGroups.map((mg) => {
                const active = selectedModifierGroupIds.includes(mg.id);
                return (
                  <button
                    key={mg.id}
                    onClick={() =>
                      setSelectedModifierGroupIds((prev) =>
                        active ? prev.filter((id) => id !== mg.id) : [...prev, mg.id]
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                      active ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {mg.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function PriceField({ label, value, onChange }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
      <Input
        type="number"
        step="0.01"
        value={String(value)}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder="0.00"
      />
    </div>
  );
}

function CategoryEditModal({ category, onClose, onSave }: {
  category?: Category | null;
  onClose: () => void;
  onSave: (c: Category) => void;
}) {
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0]);
  const [image, setImage] = useState<string>(category?.image ?? '');
  const fileRef = useRef<HTMLInputElement>(null);

  /* تصغير الصورة قبل الحفظ حتى لا تمتلئ مساحة التخزين */
  const pickImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 160;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImage(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: category?.id ?? uid('cat'),
      name: name.trim(),
      color,
      ...(image ? { image } : {}),
    });
  };

  return (
    <Modal open onClose={onClose} title={category ? 'تعديل الفئة' : 'فئة جديدة'} size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>حفظ</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="اسم الفئة">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: مشروبات" autoFocus />
        </Field>

        <Field label="صورة الفئة (اختياري)">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
              {image ? (
                <img src={image} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={22} className="text-gray-400" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                اختيار صورة
              </Button>
              {image && (
                <button onClick={() => setImage('')} className="text-xs font-semibold text-red-600">
                  إزالة الصورة
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pickImage(f);
                e.target.value = '';
              }}
            />
          </div>
        </Field>

        <Field label="اللون">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-xl transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-700 scale-110' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}
