"use client";

import { ExternalLink, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type Product = {
  name: string;
  price: string;
  why_it_fits: string;
  image_url?: string;
  product_url?: string;
};

type ProductGridProps = {
  products: Product[];
};

const categoryImages: Record<string, string> = {
  bed: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
  table:
    "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=900&q=80",
  chair:
    "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=80",
  desk: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80",
  storage:
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80",
  rug: "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=900&q=80",
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Product plan
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Coordinated picks
          </h2>
        </div>
        <p className="text-sm text-slate-500">{products.length} items</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {products.slice(0, 5).map((product) => {
          const productUrl = getWayfairUrl(product);

          return (
          <article
            className="flex min-h-[360px] flex-col overflow-hidden rounded-lg border border-stone-200 bg-stone-50"
            key={`${product.name}-${product.price}`}
          >
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#ece6da]">
              <ProductImage name={product.name} src={product.image_url} />
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold leading-5 text-slate-950">
                  {product.name}
                </h3>
                <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-semibold text-[#7F187F] ring-1 ring-stone-200">
                  {product.price}
                </span>
              </div>
              <p className="line-clamp-4 text-sm leading-6 text-slate-600">
                {product.why_it_fits}
              </p>
              {productUrl ? (
                <a
                  className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[#7F187F] hover:text-[#4f0f4f]"
                  href={productUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {isSearchUrl(productUrl) ? "Search on Wayfair" : "View on Wayfair"}
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}

function ProductImage({ name, src }: { name: string; src?: string }) {
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const fallbackSrc = categoryImages[inferCategory(name)] ?? categoryImages.table;
  const imageSrc = isBadImageUrl(src) || fallbackIndex > 0 ? fallbackSrc : src;

  if (!imageSrc || fallbackIndex > 1) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-2 bg-[#ece6da] px-6 text-center text-slate-500">
        <ImageIcon className="size-8" />
        <span className="text-xs font-medium">{name}</span>
      </div>
    );
  }

  return (
    <Image
      alt=""
      className="size-full object-cover"
      fill
      loading="lazy"
      onError={() => setFallbackIndex((current) => current + 1)}
      sizes="(min-width: 1280px) 20vw, (min-width: 768px) 50vw, 100vw"
      src={imageSrc}
      unoptimized
    />
  );
}

function inferCategory(name: string) {
  const text = name.toLowerCase();
  if (/bed|mattress|platform/.test(text)) return "bed";
  if (/desk|writing/.test(text)) return "desk";
  if (/chair|armchair|seat|stool/.test(text)) return "chair";
  if (/shelf|cabinet|storage|dresser|bookcase/.test(text)) return "storage";
  if (/rug|mat/.test(text)) return "rug";
  return "table";
}

function isBadImageUrl(src?: string) {
  if (!src) return true;
  return /via\.placeholder\.com|placeholder\.com|example/i.test(src);
}

function getWayfairUrl(product: Product) {
  const url = product.product_url?.trim();
  const searchUrl = `https://www.wayfair.com/keyword.php?keyword=${encodeURIComponent(
    product.name,
  )}`;

  if (!url) return searchUrl;
  if (/wayfair\.com\/?$/.test(url)) return searchUrl;
  if (/\/example-[^/]+\.html/i.test(url)) return searchUrl;

  return url;
}

function isSearchUrl(url: string) {
  return /wayfair\.com\/keyword\.php/.test(url);
}
