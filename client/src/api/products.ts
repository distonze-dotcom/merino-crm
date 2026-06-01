import { api } from "./client";

export async function getProducts() {
  const { data } = await api.get("/products");
  return data;
}
