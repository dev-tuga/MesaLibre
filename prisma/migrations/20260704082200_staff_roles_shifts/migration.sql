-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'MANAGER', 'WAITER');

-- CreateEnum
CREATE TYPE "TableClaimMode" AS ENUM ('ASSIGNED', 'SELF_CLAIMED');

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "role" "StaffRole" NOT NULL DEFAULT 'WAITER',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "servedByStaffId" TEXT,
ADD COLUMN     "shiftId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "addedByStaffId" TEXT;

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableService" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "orderId" TEXT,
    "shiftId" TEXT,
    "claimMode" "TableClaimMode" NOT NULL DEFAULT 'SELF_CLAIMED',
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "TableService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shift_restaurantId_staffUserId_endedAt_idx" ON "Shift"("restaurantId", "staffUserId", "endedAt");

-- CreateIndex
CREATE INDEX "TableService_tableId_releasedAt_idx" ON "TableService"("tableId", "releasedAt");

-- CreateIndex
CREATE INDEX "TableService_staffUserId_releasedAt_idx" ON "TableService"("staffUserId", "releasedAt");

-- CreateIndex
CREATE INDEX "TableService_restaurantId_releasedAt_idx" ON "TableService"("restaurantId", "releasedAt");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_servedByStaffId_fkey" FOREIGN KEY ("servedByStaffId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_addedByStaffId_fkey" FOREIGN KEY ("addedByStaffId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableService" ADD CONSTRAINT "TableService_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableService" ADD CONSTRAINT "TableService_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableService" ADD CONSTRAINT "TableService_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableService" ADD CONSTRAINT "TableService_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableService" ADD CONSTRAINT "TableService_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
