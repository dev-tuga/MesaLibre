import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { AvailabilityToggle } from "@/features/menu/components/admin/availability-toggle";
import { CategoryDialog } from "@/features/menu/components/admin/category-dialog";
import { DeleteButton } from "@/features/menu/components/admin/delete-button";
import { ProductDialog } from "@/features/menu/components/admin/product-dialog";
import { getMenuForAdmin } from "@/features/menu/queries";
import { getStaffSession } from "@/features/staff/session";
import { canManageMenu } from "@/lib/staff-auth";
import { formatClp } from "@/lib/format";

export const metadata: Metadata = {
  title: "Carta",
};

export default async function MenuAdminPage() {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  if (!canManageMenu(session.user.role)) redirect("/dashboard");
  const categories = await getMenuForAdmin(session.user.restaurantId);
  const categoryOptions = categories.map(({ id, name }) => ({ id, name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Carta</h1>
        <CategoryDialog />
      </div>

      {categories.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-xl border p-6 text-center">
          Crea una categoría para empezar a armar la carta.
        </p>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <section key={category.id} aria-labelledby={`admin-cat-${category.id}`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <h2 id={`admin-cat-${category.id}`} className="text-lg font-semibold">
                    {category.name}
                  </h2>
                  <CategoryDialog category={{ id: category.id, name: category.name }} />
                  <DeleteButton kind="category" id={category.id} name={category.name} />
                </div>
                <ProductDialog categories={categoryOptions} defaultCategoryId={category.id} />
              </div>

              {category.products.length === 0 ? (
                <p className="bg-card text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
                  Sin productos todavía.
                </p>
              ) : (
                <ul className="bg-card divide-y rounded-xl border">
                  {category.products.map((product) => (
                    <li key={product.id} className="flex items-center gap-3 p-4">
                      <AvailabilityToggle
                        productId={product.id}
                        productName={product.name}
                        available={product.available}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-medium">
                          <span className="truncate">{product.name}</span>
                          {!product.available ? (
                            <Badge variant="outline" className="shrink-0">
                              No disponible
                            </Badge>
                          ) : null}
                        </p>
                        {product.description ? (
                          <p className="text-muted-foreground truncate text-sm">
                            {product.description}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {formatClp(product.priceClp)}
                      </span>
                      <div className="flex shrink-0 items-center">
                        <ProductDialog categories={categoryOptions} product={product} />
                        <DeleteButton kind="product" id={product.id} name={product.name} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
