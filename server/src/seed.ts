import { PrismaClient } from "@prisma/client";

const QuotationStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  READY_FOR_INVOICING: "READY_FOR_INVOICING",
  INVOICED: "INVOICED",
} as const;
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean
  await prisma.auditLog.deleteMany();
  await prisma.preseaExportLog.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  // ─── Users ────────────────────────────────────────────────────────────────────
  const pw = await bcrypt.hash("merino123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@merino.com",
      passwordHash: pw,
      name: "Daniela Gordillo",
      avatar: "DG",
      color: "#e8541a",
      role: "ADMIN" as string,
    },
  });

  const lucas = await prisma.user.create({
    data: {
      email: "lucas@merino.com",
      passwordHash: pw,
      name: "Lucas Pérez",
      avatar: "LP",
      color: "#e8541a",
      role: "SALES",
    },
  });

  const sofia = await prisma.user.create({
    data: {
      email: "sofia@merino.com",
      passwordHash: pw,
      name: "Sofía Martínez",
      avatar: "SM",
      color: "#3b82f6",
      role: "SALES",
    },
  });

  const tomas = await prisma.user.create({
    data: {
      email: "tomas@merino.com",
      passwordHash: pw,
      name: "Tomás Rodríguez",
      avatar: "TR",
      color: "#22c55e",
      role: "SALES",
    },
  });

  console.log("✅ Users created");

  // ─── Products ─────────────────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.create({ data: { code: "ALB-LAT-20", name: "Alba Látex 20L", unit: "un", price: 18500 } }),
    prisma.product.create({ data: { code: "ALB-LAT-10", name: "Alba Látex 10L", unit: "un", price: 10200 } }),
    prisma.product.create({ data: { code: "FIJ-UNI-4", name: "Fijador Universal 4L", unit: "un", price: 4800 } }),
    prisma.product.create({ data: { code: "SIN-EXT-10", name: "Sinteplast Exterior 10L", unit: "un", price: 14200 } }),
    prisma.product.create({ data: { code: "SIN-INT-4", name: "Sinteplast Interior 4L", unit: "un", price: 6500 } }),
    prisma.product.create({ data: { code: "LOX-SEL-1", name: "Loxon Sellador", unit: "un", price: 5200 } }),
    prisma.product.create({ data: { code: "REV-FRE-20", name: "Revear Frentes 20L", unit: "un", price: 22000 } }),
    prisma.product.create({ data: { code: "CET-LAS-1", name: "Cetol Lasur 1L", unit: "un", price: 3800 } }),
    prisma.product.create({ data: { code: "LOX-4L", name: "Loxon 4L", unit: "un", price: 7200 } }),
    prisma.product.create({ data: { code: "SEL-UNI", name: "Sellador Universal", unit: "un", price: 4200 } }),
    prisma.product.create({ data: { code: "PIN-TEC-10", name: "Pintura techo 10L", unit: "un", price: 9800 } }),
    prisma.product.create({ data: { code: "MIC-CEM-5", name: "Microcemento 5kg", unit: "kg", price: 3200 } }),
    prisma.product.create({ data: { code: "FIJ-EXT-4", name: "Fijador exterior 4L", unit: "un", price: 5100 } }),
  ]);
  console.log("✅ Products created");

  const p = (code: string) => products.find((x) => x.code === code)!;

  // ─── Customers ────────────────────────────────────────────────────────────────
  const [c1, c2, c3, c4, c5, c6, c7, c8] = await Promise.all([
    prisma.customer.create({ data: { name: "Construcciones Del Valle", sector: "Empresa constructora", assignedToId: lucas.id, phone: "011-4567-8901" } }),
    prisma.customer.create({ data: { name: "Pinturería El Maestro", sector: "Pintor profesional", assignedToId: sofia.id, phone: "011-4567-8902" } }),
    prisma.customer.create({ data: { name: "Hotel Palermo", sector: "Comercio", assignedToId: lucas.id, phone: "011-4567-8903", email: "compras@hotelpalermo.com" } }),
    prisma.customer.create({ data: { name: "Arq. Claudia Vega", sector: "Decorador", assignedToId: tomas.id, phone: "011-4567-8904", email: "cvega@arq.com" } }),
    prisma.customer.create({ data: { name: "Obra Av. San Martín 4200", sector: "Obra en construcción", assignedToId: sofia.id, phone: "011-4567-8905" } }),
    prisma.customer.create({ data: { name: "Ferretería Central", sector: "Comercio", assignedToId: tomas.id, phone: "011-4567-8906" } }),
    prisma.customer.create({ data: { name: "Constructora Belgrano", sector: "Empresa constructora", assignedToId: lucas.id, phone: "011-4567-8907" } }),
    prisma.customer.create({ data: { name: "Pintor Jorge Salas", sector: "Pintor profesional", assignedToId: sofia.id, phone: "011-4567-8908" } }),
  ]);
  console.log("✅ Customers created");

  // ─── Visits ───────────────────────────────────────────────────────────────────
  const now = new Date("2024-01-24");
  const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000);
  const df = (daysFromNow: number) => new Date(now.getTime() + daysFromNow * 86400000);

  await Promise.all([
    prisma.visit.create({ data: { customerId: c1.id, salesRepId: lucas.id, date: d(2), wasReceived: true, result: "Presupuesto entregado. Muy interesado.", saleAmount: 280000, nextVisitDate: df(5) } }),
    prisma.visit.create({ data: { customerId: c3.id, salesRepId: lucas.id, date: d(3), wasReceived: true, result: "Espera aprobación del gerente.", saleAmount: 0, nextVisitDate: df(1) } }),
    prisma.visit.create({ data: { customerId: c2.id, salesRepId: sofia.id, date: d(4), wasReceived: true, result: "Pedido realizado en el momento.", saleAmount: 140000, nextVisitDate: df(12) } }),
    prisma.visit.create({ data: { customerId: c5.id, salesRepId: sofia.id, date: d(2), wasReceived: true, result: "Presupuesto en revisión por el arquitecto.", saleAmount: 0, nextVisitDate: df(2) } }),
    prisma.visit.create({ data: { customerId: c6.id, salesRepId: tomas.id, date: d(75), wasReceived: false, result: "No estaba el encargado. Dejar mensaje.", saleAmount: 0, nextVisitDate: d(0) } }),
    prisma.visit.create({ data: { customerId: c4.id, salesRepId: tomas.id, date: d(5), wasReceived: true, result: "Compró línea Cetol. Volver en 2 semanas.", saleAmount: 52000, nextVisitDate: df(9) } }),
    prisma.visit.create({ data: { customerId: c7.id, salesRepId: lucas.id, date: d(54), wasReceived: true, result: "No tienen obra activa por ahora.", saleAmount: 0, nextVisitDate: d(0) } }),
    prisma.visit.create({ data: { customerId: c8.id, salesRepId: sofia.id, date: d(19), wasReceived: true, result: "Presupuestó pero no cerró.", saleAmount: 0, nextVisitDate: d(0) } }),
  ]);
  console.log("✅ Visits created");

  // ─── Quotations ───────────────────────────────────────────────────────────────
  const q1 = await prisma.quotation.create({
    data: {
      number: "P-0041",
      customerId: c1.id,
      salesRepId: lucas.id,
      status: QuotationStatus.INVOICED,
      issueDate: d(2),
      exportedAt: d(1),
      items: { create: [
        { productId: p("ALB-LAT-20").id, quantity: 4, unitPrice: 18500, subtotal: 74000 },
        { productId: p("FIJ-UNI-4").id, quantity: 2, unitPrice: 4800, subtotal: 9600 },
      ]},
    },
  });

  const q2 = await prisma.quotation.create({
    data: {
      number: "P-0042",
      customerId: c3.id,
      salesRepId: lucas.id,
      status: QuotationStatus.REJECTED,
      issueDate: d(3),
      lossReason: "Precio — fue con otro proveedor",
      items: { create: [{ productId: p("SIN-EXT-10").id, quantity: 3, unitPrice: 14200, subtotal: 42600 }] },
    },
  });

  const q3 = await prisma.quotation.create({
    data: {
      number: "P-0043",
      customerId: c2.id,
      salesRepId: sofia.id,
      status: QuotationStatus.INVOICED,
      issueDate: d(4),
      exportedAt: d(3),
      items: { create: [
        { productId: p("LOX-SEL-1").id, quantity: 5, unitPrice: 5200, subtotal: 26000 },
        { productId: p("ALB-LAT-10").id, quantity: 6, unitPrice: 10200, subtotal: 61200 },
      ]},
    },
  });

  const q4 = await prisma.quotation.create({
    data: {
      number: "P-0044",
      customerId: c5.id,
      salesRepId: sofia.id,
      status: QuotationStatus.UNDER_REVIEW,
      issueDate: d(2),
      items: { create: [
        { productId: p("REV-FRE-20").id, quantity: 8, unitPrice: 22000, subtotal: 176000 },
        { productId: p("FIJ-EXT-4").id, quantity: 4, unitPrice: 5100, subtotal: 20400 },
      ]},
    },
  });

  const q5 = await prisma.quotation.create({
    data: {
      number: "P-0045",
      customerId: c4.id,
      salesRepId: tomas.id,
      status: QuotationStatus.REJECTED,
      issueDate: d(5),
      lossReason: "Stock — no teníamos el color",
      items: { create: [{ productId: p("CET-LAS-1").id, quantity: 10, unitPrice: 3800, subtotal: 38000 }] },
    },
  });

  const q6 = await prisma.quotation.create({
    data: {
      number: "P-0046",
      customerId: c6.id,
      salesRepId: tomas.id,
      status: QuotationStatus.INVOICED,
      issueDate: d(6),
      exportedAt: d(5),
      items: { create: [{ productId: p("PIN-TEC-10").id, quantity: 2, unitPrice: 9800, subtotal: 19600 }] },
    },
  });

  const q7 = await prisma.quotation.create({
    data: {
      number: "P-0047",
      customerId: c1.id,
      salesRepId: lucas.id,
      status: QuotationStatus.READY_FOR_INVOICING,
      issueDate: d(1),
      items: { create: [
        { productId: p("REV-FRE-20").id, quantity: 10, unitPrice: 22000, subtotal: 220000 },
        { productId: p("LOX-4L").id, quantity: 5, unitPrice: 7200, subtotal: 36000 },
        { productId: p("SEL-UNI").id, quantity: 3, unitPrice: 4200, subtotal: 12600 },
      ]},
    },
  });

  const q8 = await prisma.quotation.create({
    data: {
      number: "P-0048",
      customerId: c3.id,
      salesRepId: lucas.id,
      status: QuotationStatus.REJECTED,
      issueDate: d(7),
      lossReason: "No avanzó la obra",
      items: { create: [{ productId: p("MIC-CEM-5").id, quantity: 20, unitPrice: 3200, subtotal: 64000 }] },
    },
  });

  const q9 = await prisma.quotation.create({
    data: {
      number: "P-0049",
      customerId: c8.id,
      salesRepId: sofia.id,
      status: QuotationStatus.SENT,
      issueDate: d(14),
      items: { create: [{ productId: p("SIN-INT-4").id, quantity: 8, unitPrice: 6500, subtotal: 52000 }] },
    },
  });

  const q10 = await prisma.quotation.create({
    data: {
      number: "P-0050",
      customerId: c7.id,
      salesRepId: lucas.id,
      status: QuotationStatus.REJECTED,
      issueDate: d(40),
      lossReason: "Precio — presupuesto caro",
      items: { create: [{ productId: p("REV-FRE-20").id, quantity: 6, unitPrice: 22000, subtotal: 132000 }] },
    },
  });

  console.log("✅ Quotations created");
  console.log(`
╔════════════════════════════════════════╗
║       Merino CRM — Seed Complete       ║
╠════════════════════════════════════════╣
║  admin@merino.com   → ADMIN            ║
║  lucas@merino.com   → SALES            ║
║  sofia@merino.com   → SALES            ║
║  tomas@merino.com   → SALES            ║
║  Password: merino123                   ║
╚════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
