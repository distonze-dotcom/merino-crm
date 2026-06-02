import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQuotations, createQuotation, changeQuotationStatus, exportToPresea } from "../api/quotations";

export function useQuotations(status?: string) {
  return useQuery({ queryKey: ["quotations", status], queryFn: () => getQuotations(status) });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createQuotation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useChangeQuotationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, lossReason }: { id: string; status: string; lossReason?: string }) =>
      changeQuotationStatus(id, status, lossReason),

    // Optimistic update: reflect the new status instantly in every cached
    // quotations list, then roll back if the request fails.
    onMutate: async ({ id, status, lossReason }) => {
      await qc.cancelQueries({ queryKey: ["quotations"] });
      const snapshots = qc.getQueriesData<any[]>({ queryKey: ["quotations"] });
      for (const [key, list] of snapshots) {
        if (!Array.isArray(list)) continue;
        qc.setQueryData(
          key,
          list.map((q) => (q.id === id ? { ...q, status, lossReason: lossReason ?? q.lossReason } : q))
        );
      }
      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      context?.snapshots?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    // Reconcile with the server once settled (single refetch, not per keystroke).
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
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
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
