import { getAdminSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import type { StaffSession } from "@/lib/staff-auth";

export async function getStaffSession(): Promise<StaffSession | null> {
  const session = await getAdminSession();
  if (!session?.user?.restaurantId || !session.user.role) return null;

  const prisma = getPrisma();
  const staff = await prisma.adminUser.findFirst({
    where: {
      id: session.user.id,
      restaurantId: session.user.restaurantId,
      isActive: true,
    },
    select: { role: true },
  });
  if (!staff) return null;

  return {
    ...session,
    user: {
      ...session.user,
      role: staff.role,
    },
  };
}
