"use client";

import { useState, useRef } from "react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export default function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const validateAndSelect = (file: File) => {
    setError(null);
    if (file.size > 50 * 1024 * 1024) {
      setError("Filen är för stor (max 50 MB)");
      return;
    }
    const isExcel = file.name.endsWith(".xlsx") || file.type.includes("spreadsheetml");
    const isCsv = file.name.endsWith(".csv") || file.type.includes("csv");
    
    if (!isExcel && !isCsv) {
      setError("Ogiltigt format. Endast .xlsx och .csv tillåts.");
      return;
    }
    
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-12 text-center flex flex-col items-center justify-center transition-colors 
        ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"}
        ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        title="Välj fil"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={handleChange}
      />
      
      <div className="mb-4 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <p className="mb-2 text-sm text-gray-600">
        <span className="font-semibold text-blue-600 cursor-pointer hover:underline" onClick={() => inputRef.current?.click()}>
          Klicka för att ladda upp
        </span>{" "}
        eller dra och släpp
      </p>
      <p className="text-xs text-gray-500">Endast .xlsx eller .csv (max 50MB)</p>
      
      {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}
      
      {isLoading && <div className="mt-4 text-blue-600 text-sm font-semibold">Analyserar fil...</div>}
    </div>
  );
}
