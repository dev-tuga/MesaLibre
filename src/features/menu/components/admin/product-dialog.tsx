"use client";

import { Loader2, Pencil, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { upsertProduct } from "@/features/menu/actions/admin-menu-actions";

type ProductDialogProps = {
  categories: { id: string; name: string }[];
  defaultCategoryId?: string;
  product?: {
    id: string;
    categoryId: string;
    name: string;
    description: string | null;
    priceClp: number;
    available: boolean;
  };
};

export function ProductDialog({ categories, defaultCategoryId, product }: ProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "",
  );
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(product);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await upsertProduct({
        id: product?.id,
        categoryId,
        name: formData.get("name"),
        description: formData.get("description"),
        priceClp: Number(formData.get("priceClp")),
        available: formData.get("available") === "on",
      });
      if (result.ok) {
        toast.success(isEdit ? "Producto actualizado" : "Producto creado");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Editar ${product!.name}`}>
            <Pencil />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Plus />
            Nuevo producto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">Nombre</Label>
            <Input
              id="product-name"
              name="name"
              defaultValue={product?.name}
              placeholder="Ej: Pastel de jaiba"
              maxLength={80}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-description">Descripción</Label>
            <Textarea
              id="product-description"
              name="description"
              defaultValue={product?.description ?? ""}
              placeholder="Opcional"
              maxLength={200}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-price">Precio (CLP)</Label>
              <Input
                id="product-price"
                name="priceClp"
                type="number"
                inputMode="numeric"
                min={0}
                step={10}
                defaultValue={product?.priceClp}
                placeholder="9900"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-category">Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="product-category" className="w-full">
                  <SelectValue placeholder="Elige una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="product-available"
              name="available"
              type="checkbox"
              defaultChecked={product?.available ?? true}
              className="accent-primary size-4"
            />
            <Label htmlFor="product-available">Disponible en la carta</Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || !categoryId}>
              {isPending ? <Loader2 className="animate-spin" /> : null}
              {isEdit ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
