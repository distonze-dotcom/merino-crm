-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SALES',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "assignedToId" TEXT NOT NULL,
    CONSTRAINT "Customer_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "wasReceived" BOOLEAN NOT NULL DEFAULT true,
    "result" TEXT NOT NULL,
    "saleAmount" REAL NOT NULL DEFAULT 0,
    "nextVisitDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesRepId" TEXT NOT NULL,
    CONSTRAINT "Visit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Visit_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'un',
    "price" REAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" DATETIME,
    "notes" TEXT,
    "lossReason" TEXT,
    "exportedAt" DATETIME,
    "erpRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesRepId" TEXT NOT NULL,
    CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quotation_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "quotationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PreseaExportLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationId" TEXT NOT NULL,
    "exportedBy" TEXT NOT NULL,
    "exportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMsg" TEXT,
    "fileName" TEXT,
    CONSTRAINT "PreseaExportLog_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "customerId" TEXT,
    "quotationId" TEXT,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_number_key" ON "Quotation"("number");
