import { useQuery } from "@tanstack/react-query";
import { getProducts, getProductStats } from "../api/products";

export function useProducts() {
  return useQuery({ queryKey: ["products"], queryFn: getProducts });
}

export function useProductStats() {
  return useQuery({ queryKey: ["product-stats"], queryFn: getProductStats });
}
