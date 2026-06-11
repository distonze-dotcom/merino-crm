import { api } from "./client";

export async function getCustomers() {
  const { data } = await api.get("/customers");
  return data;
}

export async function getCustomer(id: string) {
  const { data } = await api.get(`/customers/${id}`);
  return data;
}

export async function createCustomer(payload: {
  code?: string;
  name: string;
  sector: string;
  priceList?: "reventa" | "general";
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  assignedToId: string;
}) {
  const { data } = await api.post("/customers", payload);
  return data;
}

export async function updateCustomer(id: string, payload: Partial<{ name: string; sector: string; phone: string; email: string; address: string; notes: string; active: boolean; assignedToId: string }>) {
  const { data } = await api.patch(`/customers/${id}`, payload);
  return data;
}
