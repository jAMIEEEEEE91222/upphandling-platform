"use client";

import { BarChart2, AlertCircle, AlertTriangle } from "lucide-react";

interface AnalysisSummaryProps {
  summary: {
    totalItems: number;
    totalBids: number;
    flaggedItems: number;
    flaggedCritical: number;
    flaggedWarning: number;
    analyzedAt: string;
  };
}

export default function AnalysisSummary({ summary }: AnalysisSummaryProps) {
  const date = new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(summary.analyzedAt));

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Sammanfattning av analys</h2>
        <span className="text-sm text-gray-500">Senast analyserad: {date}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Antal artiklar */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-50 text-blue-600">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Analyserade artiklar</p>
              <h3 className="text-2xl font-bold text-gray-900">{summary.totalItems}</h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            från {summary.totalBids} anbud/leverantörer
          </p>
        </div>

        {/* Kritiska avvikelser */}
        <div className="bg-red-50 rounded-lg border border-red-100 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-800">Kritiska avvikelser</p>
              <h3 className="text-2xl font-bold text-red-900">{summary.flaggedCritical}</h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-red-700">
            Artiklar som kräver omedelbar granskning
          </p>
        </div>

        {/* Varningar */}
        <div className="bg-amber-50 rounded-lg border border-amber-100 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-amber-800">Varningar</p>
              <h3 className="text-2xl font-bold text-amber-900">{summary.flaggedWarning}</h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-amber-700">
            Artiklar med potentiella avvikelser
          </p>
        </div>
      </div>
    </div>
  );
}
