import useSWR from "swr";
import { Procurement } from "@/types/procurement";

const fetcher = (url: string) => fetch(url).then(res => res.json()).then(res => res.data);

export function useProcurements() {
  const { data, error, isLoading, mutate } = useSWR<Procurement[]>("/api/procurements", fetcher);

  const create = async () => {
    mutate(); // Re-fetch all procurements
  };

  const remove = async (id: string) => {
    mutate((current) => current?.filter(p => p.id !== id), false); // Optimistic UI
    
    await fetch(`/api/procurements/${id}`, { method: "DELETE" });
    mutate(); // Re-fetch to confirm from server
  };

  return { 
    procurements: data ?? [], 
    error, 
    isLoading, 
    refresh: mutate,
    remove,
    create
  };
}
