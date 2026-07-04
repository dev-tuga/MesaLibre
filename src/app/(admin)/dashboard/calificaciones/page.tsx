import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";

import { ResponsiveTable } from "@/components/responsive-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getReviewsForAdmin } from "@/features/feedback/queries";
import { getStaffSession } from "@/features/staff/session";
import { canViewReviews } from "@/lib/staff-auth";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Calificaciones",
};

export default async function ReviewsPage() {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  if (!canViewReviews(session.user.role)) redirect("/dashboard");

  const { averageRating, totalReviews, reviews } = await getReviewsForAdmin(
    session.user.restaurantId,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Calificaciones</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Reseñas de comensales. Solo visible para dueño y administración.
        </p>
      </div>

      <div className="bg-card grid gap-4 rounded-xl border p-4 sm:grid-cols-2 sm:p-6">
        <div>
          <p className="text-muted-foreground text-sm">Promedio general</p>
          <p className="mt-1 flex items-center gap-2 text-3xl font-bold tabular-nums">
            {averageRating ? averageRating.toFixed(1) : "—"}
            <Star className="size-6 fill-amber-400 text-amber-400" aria-hidden />
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Total de reseñas</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{totalReviews}</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-xl border p-6 text-center">
          Todavía no hay calificaciones de comensales.
        </p>
      ) : (
        <ResponsiveTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Comentario</TableHead>
                <TableHead>Mesa</TableHead>
                <TableHead>Garzón</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDateTime(review.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 font-medium tabular-nums">
                      {review.rating}
                      <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {review.comment ?? (
                      <span className="text-muted-foreground italic">Sin comentario</span>
                    )}
                  </TableCell>
                  <TableCell>Mesa {review.order.table.number}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {review.order.servedBy?.name ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ResponsiveTable>
      )}
    </div>
  );
}
