"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
    <Button 
      onClick={handleRun} 
      disabled={disabled || isRunning} 
      variant="outline"
    >
      {isRunning ? "Kör..." : "Kör analys"}
    </Button>
  );
}
