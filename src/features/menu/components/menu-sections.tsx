import type { ReactNode } from "react";

import type { MenuCategory } from "@/features/menu/queries";
import { formatClp } from "@/lib/format";

type MenuProduct = MenuCategory["products"][number];

type MenuSectionsProps = {
  categories: MenuCategory[];
  /** Optional slot rendered under each product, e.g. an "add to bill" button. */
  productAction?: (product: MenuProduct) => ReactNode;
};

export function MenuSections({ categories, productAction }: MenuSectionsProps) {
  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <section
          key={category.id}
          id={`categoria-${category.id}`}
          aria-labelledby={`categoria-${category.id}-titulo`}
          className="scroll-mt-16"
        >
          <h2
            id={`categoria-${category.id}-titulo`}
            className="mb-3 text-lg font-semibold tracking-tight"
          >
            {category.name}
          </h2>
          <ul className="bg-card divide-y rounded-xl border">
            {category.products.map((product) => (
              <li key={product.id} className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{product.name}</p>
                  {product.description ? (
                    <p className="text-muted-foreground mt-0.5 text-sm">{product.description}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="font-semibold tabular-nums">{formatClp(product.priceClp)}</p>
                  {productAction?.(product)}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
