"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RunAnalysisButton({ procurementId, disabled }: { procurementId: string, disabled: boolean }) {
  const [isRunning, setIsRunning] = useState(false);
  const router = useRouter();

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("/api/analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ procurementId }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Kunde inte köra analysen");
      }

      router.push(`/upphandlingar/${procurementId}/analys`);
      router.refresh(); // Refresh the cache as well
    } catch (err: unknown) {
      alert("Fel vid analys: " + (err instanceof Error ? err.message : String(err)));
      setIsRunning(false);
    }
  };

  return (
    <button 
      onClick={handleRun} 
      disabled={disabled || isRunning} 
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
    >
      {isRunning ? "Kör..." : "Kör analys"}
    </button>
  );
}
