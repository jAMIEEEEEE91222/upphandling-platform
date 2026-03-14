"use client";

import { useState } from "react";
import { Upload, CheckCircle2, AlertTriangle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Använd random query param för cache-busting efter lyckad uppladdning
  const [logoUrl, setLogoUrl] = useState<string | null>("/custom-logo.png");

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch("/api/settings/logo", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || "Uppladdning misslyckades");
      }

      setLogoUrl(result.data.path);
      setSuccess(true);
      setFile(null);
      // Reset file input via form if we had a ref
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Oväntat fel vid uppladdning");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 2 * 1024 * 1024) {
        setError("Filstorleken får max vara 2MB.");
        setFile(null);
      } else if (!["image/png", "image/svg+xml"].includes(selected.type)) {
        setError("Bara PNG och SVG är tillåtet.");
        setFile(null);
      } else {
        setError(null);
        setSuccess(false);
        setFile(selected);
      }
    }
  };

  return (
    <div className="max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inställningar</h1>
        <p className="text-muted-foreground mt-2">Hantering av applikationsinställningar och anpassningar.</p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm flex flex-col md:flex-row p-6 gap-8">
        
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Rapportlogotyp</h2>
            <p className="text-sm text-gray-500">
              Denna logotyp kommer att synas på försättsbladet för alla analyser som genereras PDF-rapporter för.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label 
                htmlFor="logo-upload" 
                className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer"
              >
                Välj ny fil (PNG eller SVG, max 2MB)
              </label>
              <input 
                id="logo-upload"
                type="file" 
                accept=".png,.svg"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100 border border-gray-300 rounded-md
                "
              />
            </div>

            {file && (
              <p className="text-sm text-gray-600">
                Vald fil: <span className="font-medium">{file.name}</span>
              </p>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 text-red-700 bg-red-50 rounded-md text-sm border border-red-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 text-green-700 bg-green-50 rounded-md text-sm border border-green-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <p>Logotypen har uppladdats och sparats.</p>
              </div>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
              className="mt-4"
            >
              {isUploading ? (
                "Laddar upp..."
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Spara logotyp
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Nuvarande logo */}
        <div className="md:w-64 flex flex-col">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Nuvarande logotyp</h3>
          <div className="border border-dashed border-gray-300 bg-gray-50 rounded-lg p-6 flex flex-col items-center justify-center flex-1 min-h-[150px]">
            {logoUrl ? (
              // Notera att vi förlitar oss på browser failover om 404
              <img 
                src={logoUrl} 
                alt="Nuvarande rapportlogotyp" 
                className="max-w-[150px] max-h-[80px] object-contain"
                onError={(e) => {
                  if (logoUrl === "/custom-logo.png") {
                    setLogoUrl("/custom-logo.svg"); // Fallback
                  } else if (logoUrl === "/custom-logo.svg") {
                     setLogoUrl(null);
                  }
                }}
              />
            ) : (
              <div className="text-center text-gray-400">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <span className="text-xs uppercase font-semibold tracking-wider">Kommun</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
