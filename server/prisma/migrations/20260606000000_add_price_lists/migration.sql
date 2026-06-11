-- Product: add general price list column
ALTER TABLE "Product" ADD COLUMN "priceGeneral" DOUBLE PRECISION;

-- Customer: which price list applies ("reventa" default | "general")
ALTER TABLE "Customer" ADD COLUMN "priceList" TEXT NOT NULL DEFAULT 'reventa';
