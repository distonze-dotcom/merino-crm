import { prisma } from "../../lib/prisma";
import * as XLSX from "xlsx";

export async function exportToPresea(quotationId: string, actorId: string) {
  const q = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: true,
      salesRep: { select: { name: true } },
      items: { include: { product: true } },
    },
  });

  if (!q) throw new Error("Presupuesto no encontrado");
  if (q.status !== "READY_FOR_INVOICING") {
    throw new Error("Solo se pueden exportar presupuestos en estado READY_FOR_INVOICING");
  }
  if (q.exportedAt) {
    throw new Error(`Este presupuesto ya fue exportado el ${q.exportedAt.toISOString()}`);
  }

  const rows = q.items.map((item: { product: { code: string; name: string; unit: string }; quantity: number; unitPrice: number; subtotal: number }) => ({
    Código: item.product.code,
    Producto: item.product.name,
    Unidad: item.product.unit,
    Cantidad: item.quantity,
    "Precio Unitario": item.unitPrice,
    Subtotal: item.subtotal,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Detalle");

  const infoData = [
    ["Presupuesto", q.number],
    ["Cliente", q.customer.name],
    ["Sector", q.customer.sector],
    ["Comercial", q.salesRep.name],
    ["Fecha", q.issueDate.toLocaleDateString("es-AR")],
    ["Total", q.items.reduce((s: number, i: { subtotal: number }) => s + i.subtotal, 0)],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
  XLSX.utils.book_append_sheet(wb, wsInfo, "Encabezado");

  const fileName = `presea_${q.number}_${Date.now()}.xlsx`;
  const xlsxBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: "INVOICED", exportedAt: new Date(), erpRef: q.number },
  });

  await prisma.preseaExportLog.create({
    data: {
      quotationId,
      exportedBy: actorId,
      status: "success",
      fileName,
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: "quotation",
      entityId: quotationId,
      action: "exported",
      oldValue: "READY_FOR_INVOICING",
      newValue: "INVOICED",
      userId: actorId,
      quotationId,
      customerId: q.customerId,
    },
  });

  return { fileName, buffer: xlsxBuffer, number: q.number };
}
