import { api } from "./client";

export async function getQuotations(status?: string) {
  const { data } = await api.get("/quotations", { params: status ? { status } : {} });
  return data;
}

export async function getQuotation(id: string) {
  const { data } = await api.get(`/quotations/${id}`);
  return data;
}

export async function createQuotation(payload: {
  customerId: string;
  salesRepId: string;
  validUntil?: string;
  notes?: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
}) {
  const { data } = await api.post("/quotations", payload);
  return data;
}

export async function changeQuotationStatus(id: string, status: string, lossReason?: string) {
  const { data } = await api.patch(`/quotations/${id}/status`, { status, lossReason });
  return data;
}

export async function exportToPresea(id: string) {
  const response = await api.post(`/presea/${id}/export`, {}, { responseType: "blob" });
  const fileName = response.headers["x-quotation-number"]
    ? `presea_${response.headers["x-quotation-number"]}.xlsx`
    : "presea_export.xlsx";
  const url = URL.createObjectURL(response.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return { success: true, fileName };
}
