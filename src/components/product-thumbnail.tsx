import { getProductImageUrl } from "@/lib/product-images";
import { cn } from "@/lib/utils";

type ProductThumbnailProps = {
  imageUrl?: string | null;
  categoryName?: string;
  alt: string;
  className?: string;
};

export function ProductThumbnail({ imageUrl, categoryName, alt, className }: ProductThumbnailProps) {
  const src = getProductImageUrl(imageUrl, categoryName);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external Unsplash URLs, no image optimizer config needed
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("bg-muted size-14 shrink-0 rounded-lg object-cover sm:size-16", className)}
    />
  );
}
