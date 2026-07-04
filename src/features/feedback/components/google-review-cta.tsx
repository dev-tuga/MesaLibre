import { ExternalLink, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildGoogleReviewUrl } from "@/lib/google-maps";

type GoogleReviewCtaProps = {
  restaurantName: string;
  googlePlaceId?: string | null;
};

export function GoogleReviewCta({ restaurantName, googlePlaceId }: GoogleReviewCtaProps) {
  const reviewUrl = googlePlaceId ? buildGoogleReviewUrl(googlePlaceId) : null;

  return (
    <div className="bg-card to-background space-y-3 rounded-2xl border border-amber-200/60 bg-gradient-to-b from-amber-50/80 p-5 text-left dark:border-amber-900/40 dark:from-amber-950/20">
      <div className="flex items-center gap-2">
        <Star className="size-5 fill-amber-400 text-amber-500" aria-hidden />
        <p className="font-semibold">Ayuda a {restaurantName} en Google</p>
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Las reseñas en Google Maps mejoran la visibilidad del local en búsquedas cercanas. Tu
        opinión después de pagar ayuda a que más personas descubran el restaurante.
      </p>
      {reviewUrl ? (
        <Button asChild className="w-full" variant="outline">
          <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            Dejar reseña en Google Maps
          </a>
        </Button>
      ) : (
        <p className="text-muted-foreground text-xs">
          Demo: configura <code className="text-foreground">googlePlaceId</code> en el restaurante
          para activar el enlace directo a reseñas.
        </p>
      )}
    </div>
  );
}
