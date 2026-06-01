import { useQuery } from "@tanstack/react-query";
import { getDashboard, getUsers } from "../api/dashboard";

export function useDashboard() {
  return useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });
}

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: getUsers });
}
