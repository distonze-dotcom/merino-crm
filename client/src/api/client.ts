import axios from "axios";
import { useAuthStore } from "../store/auth.store";

const IS_LOCAL = typeof window !== "undefined" && window.location.hostname === "localhost";
const API_URL = IS_LOCAL ? "http://localhost:3000" : "https://merino-comerciales.vercel.app";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
