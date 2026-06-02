import { useQuery } from "@tanstack/react-query";
import { getDashboard, getUsers } from "../api/dashboard";

export function useDashboard() {
  return useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });
}

export function useUsers() {
  // Users (commercial team) change very rarely — cache aggressively.
  return useQuery({ queryKey: ["users"], queryFn: getUsers, staleTime: Infinity });
}
