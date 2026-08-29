import type { Category, Product, Tag, DeliveryZone } from '@/pos/types';

const price = (n: number) => ({ dineIn: n, takeaway: n, delivery: n + 2, talabat: n + 3 });

export const demoCategories: Category[] = [
  { id: 'cat-grill', name: 'مشويات', color: '#dc2626' },
  { id: 'cat-sandwich', name: 'ساندويتشات', color: '#f59e0b' },
  { id: 'cat-sides', name: 'مقبلات', color: '#16a34a' },
  { id: 'cat-drinks', name: 'مشروبات', color: '#2563eb' },
];

const p = (
  id: string,
  name: string,
  value: number,
  categoryId: string,
  tagIds: string[] = [],
): Product => ({
  id,
  name,
  price: value,
  prices: price(value),
  categoryId,
  available: true,
  tagIds,
  modifierGroupIds: [],
});

export const demoProducts: Product[] = [
  p('prd-1', 'كباب لحم', 120, 'cat-grill', ['tag-best']),
  p('prd-2', 'كفتة مشوية', 95, 'cat-grill', ['tag-best']),
  p('prd-3', 'فراخ مشوية ١/٢', 85, 'cat-grill'),
  p('prd-4', 'ريش ضاني', 180, 'cat-grill'),
  p('prd-5', 'ساندويتش شاورما', 45, 'cat-sandwich', ['tag-best']),
  p('prd-6', 'ساندويتش برجر', 55, 'cat-sandwich'),
  p('prd-7', 'ساندويتش فراخ بانيه', 50, 'cat-sandwich'),
  p('prd-8', 'بطاطس مقلية', 25, 'cat-sides'),
  p('prd-9', 'سلطة طحينة', 15, 'cat-sides'),
  p('prd-10', 'أرز بسمتي', 20, 'cat-sides'),
  p('prd-11', 'عيش بلدي', 5, 'cat-sides'),
  p('prd-12', 'كوكاكولا', 15, 'cat-drinks'),
  p('prd-13', 'مياه معدنية', 8, 'cat-drinks'),
  p('prd-14', 'عصير مانجو', 22, 'cat-drinks', ['tag-new']),
];

export const demoTags: Tag[] = [
  { id: 'tag-best', name: 'الأكثر مبيعاً', color: '#f59e0b' },
  { id: 'tag-new', name: 'جديد', color: '#16a34a' },
];

export const demoZones: DeliveryZone[] = [
  { id: 'zone-1', name: 'وسط البلد', fee: 20 },
  { id: 'zone-2', name: 'المعادي', fee: 30 },
  { id: 'zone-3', name: 'مدينة نصر', fee: 35 },
];
