import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ResponsiveTableProps = {
  children: ReactNode;
  className?: string;
};

/** Horizontal scroll wrapper so data tables stay usable on phones. */
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("bg-card -mx-4 overflow-x-auto rounded-xl border sm:mx-0", className)}>
      <div className="min-w-[36rem]">{children}</div>
    </div>
  );
}
