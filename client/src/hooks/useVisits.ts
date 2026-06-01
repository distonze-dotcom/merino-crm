import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVisits, createVisit } from "../api/visits";

export function useVisits(customerId?: string) {
  return useQuery({ queryKey: ["visits", customerId], queryFn: () => getVisits(customerId) });
}

export function useCreateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createVisit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
