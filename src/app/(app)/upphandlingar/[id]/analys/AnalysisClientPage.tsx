"use client";

import { useState } from "react";
import { useAnalysis } from "@/hooks/useAnalysis";
import AnalysisSummary from "@/components/analysis/AnalysisSummary";
import DeviationMatrix from "@/components/analysis/DeviationMatrix";
import { Play, RotateCcw, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface AnalysisClientPageProps {
  procurementId: string;
  initialStatus: string;
}

export default function AnalysisClientPage({ procurementId, initialStatus }: AnalysisClientPageProps) {
  const { data, isLoading, error, runAnalysis } = useAnalysis(procurementId);
  const [isRunning, setIsRunning] = useState(false);
  const router = useRouter();

  const handleRunAnalysis = async () => {
    setIsRunning(true);
    try {
      await runAnalysis();
      router.refresh(); // Uppdatera serverkomponenter om de beror på status
    } catch (err: unknown) {
      alert("Fel vid analys: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsRunning(false);
    }
  };

  // Om analys inte är körd
  if (initialStatus === "IMPORTED" && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-dashed border-gray-300">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600">
          <Play className="w-8 h-8 ml-1" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Analys ej körd</h2>
        <p className="text-gray-500 mb-6 max-w-md text-center">
          Prisbilagan är importerad. Kör analysen för att få fram statistik och identifiera prismässiga avvikelser.
        </p>
        <button
          onClick={handleRunAnalysis}
          disabled={isRunning}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {isRunning ? "Kör analys..." : "Kör analys"}
        </button>
      </div>
    );
  }

  if (isLoading && !data) {
    return <div className="p-12 text-center text-gray-500">Laddar analysdata...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg flex items-start">
        <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0" />
        <div>
          <h3 className="font-semibold">Fel vid inläsning</h3>
          <p className="mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Avvikelsematris</h1>
        <button
          onClick={handleRunAnalysis}
          disabled={isRunning}
          className="flex items-center px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {isRunning ? "Kör..." : "Kör om analys"}
        </button>
      </div>

      {data && (
        <>
          <AnalysisSummary summary={data.summary} />
          <DeviationMatrix data={data} />
        </>
      )}
    </div>
  );
}
