import { useQuery } from "@tanstack/react-query";
import { getProducts, getProductStats } from "../api/products";

// Products change only when an admin imports a new price list, so we cache them
// aggressively and only refetch when the import mutation invalidates the key.
export function useProducts() {
  return useQuery({ queryKey: ["products"], queryFn: getProducts, staleTime: Infinity });
}

export function useProductStats() {
  return useQuery({ queryKey: ["product-stats"], queryFn: getProductStats, staleTime: Infinity });
}
