"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import type { MatrixRow } from "@/types/analysis";

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  row: MatrixRow | null;
  suppliers: string[];
}

export default function ItemDetailModal({ isOpen, onClose, row, suppliers }: ItemDetailModalProps) {
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !row) return null;

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return "—";
    return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(price);
  };

  const handleSaveNote = async () => {
    // We would PATCH this to API, but API is not fully specified for this yet
    // I will mock this for now, or just make a fetch call.
    setIsSaving(true);
    // await fetch('/api/analysis/flag', { ... })
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{row.itemName}</h2>
            {row.itemCode && <p className="text-sm text-gray-500">Art.nr: {row.itemCode}</p>}
          </div>
          <button onClick={onClose} title="Stäng" aria-label="Stäng" className="p-2 text-gray-400 hover:text-gray-600 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {row.stats.suspectedCollusion && (
            <div className="flex items-center p-4 bg-red-50 text-red-800 border-l-4 border-red-500 rounded-r-md">
              <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
              <p className="text-sm font-medium">Misstänkt prissamordning! Alla leverantörer har lämnat exakt samma pris.</p>
            </div>
          )}

          {/* Stats Grid */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Statistik</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <p className="text-xs text-gray-500 uppercase">Medelpris</p>
                <p className="font-semibold">{formatPrice(row.stats.mean)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <p className="text-xs text-gray-500 uppercase">Median</p>
                <p className="font-semibold">{formatPrice(row.stats.median)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <p className="text-xs text-gray-500 uppercase">Std. Avvikelse</p>
                <p className="font-semibold">{formatPrice(row.stats.stdDev)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <p className="text-xs text-gray-500 uppercase">Lägsta</p>
                <p className="font-semibold">{formatPrice(row.stats.min)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <p className="text-xs text-gray-500 uppercase">Högsta</p>
                <p className="font-semibold">{formatPrice(row.stats.max)}</p>
              </div>
            </div>
          </div>

          {/* Leverantörer */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Leverantörernas priser</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leverantör</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pris</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Z-score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flaggning</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suppliers.map(sup => {
                    const cell = row.cells[sup];
                    const isMissing = !cell || cell.price === null;
                    return (
                      <tr key={sup}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{sup}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {isMissing ? "—" : formatPrice(cell.price)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {cell?.zScore !== null && cell?.zScore !== undefined ? cell.zScore.toFixed(2) : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {cell?.flagReason || "Normal"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Handläggarnotering */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Handläggarnotering</h3>
            <textarea
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Lägg till en notering om denna artikel..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Avbryt
          </button>
          <button 
            onClick={handleSaveNote}
            disabled={isSaving}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "Sparar..." : "Spara notering"}
          </button>
        </div>
      </div>
    </div>
  );
}
