"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportExportButtonProps {
  procurementId: string;
  hasExistingReport: boolean;
  existingReportId?: string;
}

export default function ReportExportButton({ procurementId, hasExistingReport, existingReportId }: ReportExportButtonProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // När en ny rapport genererats under denna session
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(null);
  
  const currentReportId = generatedReportId || existingReportId;

  const handleGenerate = async () => {
    if (hasExistingReport && !window.confirm("En rapport har redan genererats tidigare. Vill du skriva över den gamla rapporten med en ny omräkning?")) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ procurementId }),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error || "Misslyckades att generera rapport");
      }

      setGeneratedReportId(body.data.reportId);
      router.refresh(); // Update server components page parent 
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Serverfel: Ett okänt fel uppstod.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (currentReportId) {
      window.location.href = `/api/report/${currentReportId}`;
    }
  };

  const handleDownloadExcel = () => {
    if (currentReportId) {
      window.location.href = `/api/report/${currentReportId}/excel`;
    }
  };

  return (
    <div className="space-y-6">
      {!currentReportId ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border shadow-sm">
          <FileText className="w-12 h-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ingen genererad rapport...</h2>
          <p className="text-gray-500 mb-6 max-w-md text-center">
            Du behöver generera rapporten först. Detta skapar en PDF baserad på den senaste analysen och sammanställer Excel-filer för nedladdning.
          </p>
          <Button 
            size="lg" 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Genererar rapport (Detta kan ta c:a 5-10 sek...)
              </>
            ) : (
              "Kompilera & Generera Rapport"
            )}
          </Button>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md border border-red-200 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Rapporten är klar!</h2>
                <p className="text-sm text-gray-500">Genereringen lyckades och du kan nu ladda ner datan.</p>
              </div>
            </div>

            <Button 
              variant="outline"
              size="sm" 
              onClick={handleGenerate} 
              disabled={isGenerating}
            >
              {isGenerating ? "Uppdaterar..." : "Generera om ny version"}
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            <button 
              onClick={handleDownloadPDF}
              autoFocus
              className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            >
               <FileText className="w-10 h-10 text-red-500 mb-3 group-hover:scale-110 transition-transform" />
               <span className="font-semibold text-gray-900 group-hover:text-blue-700">Ladda ner Lång PDF-Rapport</span>
               <span className="text-xs text-gray-500 mt-1">Snygg, pappersvänlig sammanfattningsrapport</span>
            </button>

            <button 
              onClick={handleDownloadExcel}
              className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors group focus:outline-none focus:ring-4 focus:ring-green-500/20"
            >
               <FileSpreadsheet className="w-10 h-10 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
               <span className="font-semibold text-gray-900 group-hover:text-green-700">Ladda ner Excel Data</span>
               <span className="text-xs text-gray-500 mt-1">Fullständig filter-bar bilaga med färgkodningar</span>
            </button>
          </div>

          {error && (
             <div className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md border border-red-200 text-sm">
               <AlertTriangle className="w-4 h-4 flex-shrink-0" />
               <p>{error}</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
