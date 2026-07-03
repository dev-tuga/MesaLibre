import type { MenuCategory } from "@/features/menu/queries";

/**
 * Horizontal, scrollable chip list that anchors to each category section.
 * Plain anchors are enough here — no client-side JS needed.
 */
export function CategoryNav({ categories }: { categories: MenuCategory[] }) {
  return (
    <nav
      aria-label="Categorías de la carta"
      className="bg-background/95 sticky top-0 z-10 -mx-4 border-b px-4 py-2 backdrop-blur"
    >
      <ul className="flex [scrollbar-width:none] gap-2 overflow-x-auto">
        {categories.map((category) => (
          <li key={category.id} className="shrink-0">
            <a
              href={`#categoria-${category.id}`}
              className="bg-card text-card-foreground hover:bg-accent inline-flex rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors"
            >
              {category.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
