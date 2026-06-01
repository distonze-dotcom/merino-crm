import { api } from "./client";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  role: "ADMIN" | "SALES";
  active: boolean;
}

export async function getUsers() {
  const { data } = await api.get("/users");
  return data as User[];
}

export async function createUser(payload: {
  name: string;
  email: string;
  password: string;
  color: string;
  role: "ADMIN" | "SALES";
  avatar: string;
}) {
  const { data } = await api.post("/users", payload);
  return data as User;
}
