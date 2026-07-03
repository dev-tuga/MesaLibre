import type { MenuCategory } from "@/features/menu/queries";
import { formatClp } from "@/lib/format";

export function MenuSections({ categories }: { categories: MenuCategory[] }) {
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
                <p className="shrink-0 font-semibold tabular-nums">{formatClp(product.priceClp)}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
