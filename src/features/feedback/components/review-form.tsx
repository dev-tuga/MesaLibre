"use client";

import Link from "next/link";
import { Loader2, Star } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitReview } from "@/features/feedback/actions/review-actions";
import { MAX_COMMENT_LENGTH } from "@/features/feedback/schemas/review";
import { MAX_RATING } from "@/features/feedback/services/review";
import { cn } from "@/lib/utils";

type ReviewFormProps = {
  slug: string;
  qrToken: string;
  orderId: string;
};

const RATING_LABELS: Record<number, string> = {
  1: "Muy malo",
  2: "Malo",
  3: "Regular",
  4: "Bueno",
  5: "Excelente",
};

export function ReviewForm({ slug, qrToken, orderId }: ReviewFormProps) {
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (rating === 0) {
      toast.error("Elige una cantidad de estrellas.");
      return;
    }
    startTransition(async () => {
      const result = await submitReview({ slug, qrToken, orderId, rating, comment });
      if (result.ok) {
        setSubmitted(true);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (submitted) {
    return (
      <div className="bg-card space-y-4 rounded-xl border p-6 text-center">
        <p className="text-3xl" aria-hidden>
          🙌
        </p>
        <div>
          <p className="text-lg font-semibold">¡Gracias por tu opinión!</p>
          <p className="text-muted-foreground">
            Tu calificación ayuda al restaurante a mejorar el servicio.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/r/${slug}/${qrToken}`}>Volver a la carta</Link>
        </Button>
      </div>
    );
  }

  const displayedRating = hovered || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-base font-medium">¿Cómo estuvo el servicio?</legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
          {Array.from({ length: MAX_RATING }, (_, i) => i + 1).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHovered(value)}
              aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`}
              aria-pressed={rating === value}
              className="focus-visible:ring-ring rounded-md p-1 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:outline-none"
            >
              <Star
                className={cn(
                  "size-8",
                  value <= displayedRating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/40",
                )}
                aria-hidden
              />
            </button>
          ))}
        </div>
        <p className="text-muted-foreground h-5 text-sm" aria-live="polite">
          {displayedRating > 0 ? RATING_LABELS[displayedRating] : ""}
        </p>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="review-comment">Comentario (opcional)</Label>
        <Textarea
          id="review-comment"
          placeholder="Cuéntanos qué te pareció la comida y la atención…"
          maxLength={MAX_COMMENT_LENGTH}
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
        <p className="text-muted-foreground text-right text-xs tabular-nums">
          {comment.length}/{MAX_COMMENT_LENGTH}
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Enviando…
          </>
        ) : (
          "Enviar calificación"
        )}
      </Button>
    </form>
  );
}
