"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { waiterAddItemToOrder } from "@/features/orders/actions/waiter-order-actions";
import type { AdminMenuCategory } from "@/features/menu/queries";

type WaiterMenuPickerProps = {
  tableId: string;
  categories: AdminMenuCategory[];
  disabled?: boolean;
};

export function WaiterMenuPicker({ tableId, categories, disabled }: WaiterMenuPickerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAdd(productId: string, productName: string) {
    startTransition(async () => {
      const result = await waiterAddItemToOrder({ tableId, productId, quantity: 1 });
      if (result.ok) {
        toast.success(`${productName} agregado a la mesa.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <section className="space-y-4">
      <h2 className="font-semibold">Agregar a la cuenta</h2>
      {categories.length === 0 ? (
        <p className="text-muted-foreground text-sm">No hay productos en la carta.</p>
      ) : (
        categories.map((category) => (
          <div key={category.id} className="space-y-2">
            <h3 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
              {category.name}
            </h3>
            <ul className="space-y-2">
              {category.products
                .filter((product) => product.available)
                .map((product) => (
                  <li
                    key={product.id}
                    className="bg-card flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <ProductThumbnail
                        imageUrl={product.imageUrl}
                        categoryName={category.name}
                        alt={product.name}
                        className="size-11 sm:size-12"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="text-muted-foreground text-sm tabular-nums">
                          ${product.priceClp.toLocaleString("es-CL")}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={disabled || isPending}
                      onClick={() => handleAdd(product.id, product.name)}
                    >
                      <Plus className="size-4" />
                      Agregar
                    </Button>
                  </li>
                ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
