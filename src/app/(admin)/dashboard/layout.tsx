import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAdminSession } from "@/lib/auth";
import { logout } from "../login/actions";

const navItems = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/carta", label: "Carta" },
  { href: "/dashboard/mesas", label: "Mesas abiertas" },
  { href: "/dashboard/pagos", label: "Pagos" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="bg-muted/40 min-h-screen print:bg-white">
      <header className="bg-background border-b print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2 font-semibold">
            <UtensilsCrossed className="size-5" aria-hidden />
            MesaLibre
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground hidden text-sm sm:inline">
              {session.user.name}
            </span>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut />
                Salir
              </Button>
            </form>
          </div>
        </div>
        <nav aria-label="Secciones del panel" className="mx-auto max-w-5xl px-4">
          <ul className="flex gap-1 overflow-x-auto pb-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
