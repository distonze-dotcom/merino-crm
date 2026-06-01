import { api } from "./client";

export async function getAlerts() {
  const { data } = await api.get("/alerts");
  return data;
}
