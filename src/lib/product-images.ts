const CATEGORY_IMAGES: Record<string, string> = {
  "Para picar":
    "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=160&h=160&fit=crop",
  "Platos de fondo":
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=160&h=160&fit=crop",
  Sándwiches:
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=160&h=160&fit=crop",
  "Bebidas y bajativos":
    "https://images.unsplash.com/photo-1546173159-315724a31696?w=160&h=160&fit=crop",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=160&h=160&fit=crop";

/** Generic food photo when a product has no custom image. */
export function getProductImageUrl(imageUrl: string | null | undefined, categoryName?: string) {
  if (imageUrl) return imageUrl;
  if (categoryName && CATEGORY_IMAGES[categoryName]) return CATEGORY_IMAGES[categoryName];
  return DEFAULT_IMAGE;
}
