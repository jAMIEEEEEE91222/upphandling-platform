import useSWR from "swr";
import type { DeviationMatrixData } from "@/types/analysis";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Kunde inte hämta analysdata");
  return res.json().then(j => j.data);
});

export function useAnalysis(procurementId: string) {
  const { data, error, isLoading, mutate } = useSWR<DeviationMatrixData>(
    `/api/analysis/${procurementId}`,
    fetcher
  );

  const runAnalysis = async () => {
    const res = await fetch("/api/analysis/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ procurementId }),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || "Kunde inte köra analysen");
    }

    await mutate();
  };

  return {
    data,
    error,
    isLoading,
    runAnalysis,
    refresh: mutate,
  };
}
