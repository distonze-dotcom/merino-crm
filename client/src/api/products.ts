import { api } from "./client";

export async function getProducts() {
  const { data } = await api.get("/products");
  return data;
}

export async function importProducts(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/products/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as { imported: number; updated: number; skipped: number; errors: string[] };
}

export async function getProductStats() {
  const { data } = await api.get("/products/stats");
  return data as { total: number; active: number; brands: string[]; lastImport: string | null };
}
