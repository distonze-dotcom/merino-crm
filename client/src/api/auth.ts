import { api } from "./client";

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  return data as { token: string; user: { id: string; email: string; name: string; avatar: string; color: string; role: "ADMIN" | "SALES" } };
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}
