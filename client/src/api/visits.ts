import { api } from "./client";

export async function getVisits(customerId?: string) {
  const { data } = await api.get("/visits", { params: customerId ? { customerId } : {} });
  return data;
}

export async function createVisit(payload: {
  customerId: string;
  salesRepId: string;
  date: string;
  wasReceived: boolean;
  result: string;
  saleAmount: number;
  nextVisitDate?: string;
}) {
  const { data } = await api.post("/visits", payload);
  return data;
}
