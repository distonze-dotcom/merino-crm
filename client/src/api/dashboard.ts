import { api } from "./client";

export async function getDashboard() {
  const { data } = await api.get("/dashboard");
  return data;
}

export async function getUsers() {
  const { data } = await api.get("/users");
  return data;
}
