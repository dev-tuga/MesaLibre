import Link from "next/link";
import { redirect } from "next/navigation";
import type { StaffRole } from "@prisma/client";
import { LogOut, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getStaffSession } from "@/features/staff/session";
import { staffRoleLabel } from "@/features/staff/labels";
import {
  canManageMenu,
  canManageStaff,
  canViewAllTables,
  canViewPerformance,
} from "@/lib/staff-auth";
import { logout } from "../login/actions";

function buildNavItems(role: StaffRole) {
  const items = [{ href: "/dashboard", label: "Resumen" }];

  if (canManageMenu(role)) {
    items.push({ href: "/dashboard/carta", label: "Carta" });
  }

  items.push({
    href: "/dashboard/mesas",
    label: canViewAllTables(role) ? "Mesas abiertas" : "Mis mesas",
  });

  if (canViewAllTables(role)) {
    items.push({ href: "/dashboard/pagos", label: "Pagos" });
  }

  if (canManageStaff(role)) {
    items.push({ href: "/dashboard/equipo", label: "Equipo" });
  }

  if (canViewPerformance(role)) {
    items.push({ href: "/dashboard/desempeno", label: "Desempeño" });
  }

  return items;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getStaffSession();
  if (!session) {
    redirect("/login");
  }

  const navItems = buildNavItems(session.user.role);

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
              {session.user.name} · {staffRoleLabel(session.user.role)}
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
