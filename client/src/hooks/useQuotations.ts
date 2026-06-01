import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQuotations, createQuotation, changeQuotationStatus, exportToPresea } from "../api/quotations";

export function useQuotations(status?: string) {
  return useQuery({ queryKey: ["quotations", status], queryFn: () => getQuotations(status) });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createQuotation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotations"] }),
  });
}

export function useChangeQuotationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, lossReason }: { id: string; status: string; lossReason?: string }) =>
      changeQuotationStatus(id, status, lossReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useExportToPresea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: exportToPresea,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
