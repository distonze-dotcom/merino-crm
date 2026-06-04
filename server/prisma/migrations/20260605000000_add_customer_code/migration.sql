-- AlterTable: add optional unique code to Customer
ALTER TABLE "Customer" ADD COLUMN "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");
