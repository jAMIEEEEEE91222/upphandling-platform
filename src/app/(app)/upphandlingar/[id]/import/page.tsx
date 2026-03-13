"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/import/FileUpload";
import ColumnMapper from "@/components/import/ColumnMapper";
import ImportPreview from "@/components/import/ImportPreview";
import { parseExcelFile } from "@/lib/excel/parser";
import { suggestColumnMapping } from "@/lib/excel/column-mapper";
import { RawExcelData, ColumnMapping } from "@/types/import";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ImportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<RawExcelData | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsReading(true);
    setError(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const rawData = parseExcelFile(arrayBuffer);
      setData(rawData);
      setMapping(suggestColumnMapping(rawData.headers));
    } catch (err) {
      console.error(err);
      setError("Kunde inte läsa filen. Är det en giltig Excel/CSV-fil?");
    } finally {
      setIsReading(false);
    }
  };

  const handleConfirm = async () => {
    if (!file || !mapping || !mapping.supplierName) return;
    
    setIsImporting(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("procurementId", params.id);
    formData.append("columnMapping", JSON.stringify(mapping));
    formData.append("supplierName", mapping.supplierName);

    try {
      const res = await fetch("/api/bids/import", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || "Misslyckades att importera filen");
      }

      router.push(`/upphandlingar/${params.id}`);
      router.refresh();
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ett okänt fel uppstod");
      }
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div>
        <div className="flex items-center gap-4 mb-2">
          <Link href={`/upphandlingar/${params.id}`} className="text-muted-foreground hover:text-foreground">
            &larr; Tillbaka
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Importera prisbilaga</h1>
        </div>
        <p className="text-muted-foreground">Ladda upp och mappa Excel-filen för denna upphandling.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {!data && (
        <FileUpload onFileSelect={handleFileSelect} isLoading={isReading} />
      )}

      {data && mapping && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-4 rounded-lg border gap-4">
            <div>
              <span className="font-semibold">Vald fil:</span> {file?.name}
            </div>
            <Button variant="outline" size="sm" onClick={() => setData(null)} disabled={isImporting}>
              Byt fil
            </Button>
          </div>

          <ColumnMapper 
            headers={data.headers}
            mapping={mapping}
            onChange={setMapping}
            onConfirm={handleConfirm}
            isImporting={isImporting}
          />

          <ImportPreview rows={data.rows} mapping={mapping} />
        </div>
      )}
    </div>
  );
}
