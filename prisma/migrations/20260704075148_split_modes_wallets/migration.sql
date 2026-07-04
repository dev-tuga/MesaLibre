-- CreateEnum
CREATE TYPE "PaymentSplitMode" AS ENUM ('EQUAL', 'BY_ITEMS');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'APPLE_PAY';
ALTER TYPE "PaymentMethod" ADD VALUE 'GOOGLE_PAY';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "splitMode" "PaymentSplitMode" NOT NULL DEFAULT 'EQUAL';

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "googlePlaceId" TEXT;

-- CreateTable
CREATE TABLE "PaymentItemAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amountClp" INTEGER NOT NULL,

    CONSTRAINT "PaymentItemAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentItemAllocation_paymentId_orderItemId_key" ON "PaymentItemAllocation"("paymentId", "orderItemId");

-- AddForeignKey
ALTER TABLE "PaymentItemAllocation" ADD CONSTRAINT "PaymentItemAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentItemAllocation" ADD CONSTRAINT "PaymentItemAllocation_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
