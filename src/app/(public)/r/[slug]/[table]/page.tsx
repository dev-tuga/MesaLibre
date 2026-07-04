import { redirect } from "next/navigation";

import { tableRouteParamsSchema } from "@/features/menu/schemas/route-params";

type PageProps = {
  params: Promise<{ slug: string; table: string }>;
};

/** Guests no longer browse the menu — they land on the live bill. */
export default async function TableRootRedirect({ params }: PageProps) {
  const parsed = tableRouteParamsSchema.safeParse(await params);
  if (!parsed.success) redirect("/");

  redirect(`/r/${parsed.data.slug}/${parsed.data.table}/cuenta`);
}
