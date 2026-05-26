import type { LayoutItem, Product } from './types';

const layoutMap: Record<string, Omit<LayoutItem, 'id' | 'label' | 'category' | 'price'>> = {
  bed: { left: '7%', top: '9%', width: '40%', height: '27%' },
  desk: { left: '8%', top: '70%', width: '30%', height: '14%' },
  chair: { left: '43%', top: '68%', width: '17%', height: '18%' },
  storage: { left: '73%', top: '13%', width: '17%', height: '31%' },
  rug: { left: '31%', top: '43%', width: '38%', height: '21%' },
  lamp: { left: '65%', top: '70%', width: '10%', height: '13%' },
  table: { left: '52%', top: '15%', width: '18%', height: '13%' },
};

function inferCategory(product: Product): string {
  const text = product.name.toLowerCase();
  if (/bed|mattress|platform/.test(text)) return 'bed';
  if (/chair|armchair|seat|stool/.test(text)) return 'chair';
  if (/desk|writing/.test(text)) return 'desk';
  if (/shelf|cabinet|storage|dresser|bookcase/.test(text)) return 'storage';
  if (/rug|mat/.test(text)) return 'rug';
  if (/lamp|light/.test(text)) return 'lamp';
  if (/table|nightstand|stand/.test(text)) return 'table';
  return 'table';
}

export function buildLayout(products: Product[]): LayoutItem[] {
  const used = new Map<string, number>();

  return products.slice(0, 6).map((product, index) => {
    const category = inferCategory(product);
    const count = used.get(category) ?? 0;
    used.set(category, count + 1);
    const base = layoutMap[category] ?? layoutMap.table;
    const offset = count * 4;

    return {
      id: `${category}-${index}`,
      label: product.name.split(' ').slice(0, 2).join(' '),
      category,
      price: product.price,
      ...base,
      left: count ? `calc(${base.left} + ${offset}%)` : base.left,
      top: count ? `calc(${base.top} + ${offset}%)` : base.top,
    };
  });
}
