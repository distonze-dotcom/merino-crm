import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomers, getCustomer, createCustomer, updateCustomer } from "../api/customers";

export function useCustomers() {
  return useQuery({ queryKey: ["customers"], queryFn: getCustomers });
}

export function useCustomer(id: string) {
  return useQuery({ queryKey: ["customers", id], queryFn: () => getCustomer(id), enabled: !!id });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Parameters<typeof updateCustomer>[1] & { id: string }) =>
      updateCustomer(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}
