"use client";

import { useState, useEffect, useCallback } from "react";
import { X, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
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
  const [activeFlagId, setActiveFlagId] = useState<string | null>(null);

  // Initiera note och hitta en flagResultId att spara på
  useEffect(() => {
    if (row) {
      setNote("");
      const firstFlaggedCell = Object.values(row.cells).find(c => c.flagResultId);
      setActiveFlagId(firstFlaggedCell?.flagResultId ?? null);
    }
  }, [row]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !row) return null;

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return "—";
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleSaveNote = async () => {
    if (!activeFlagId || !note.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/analysis/flag/${activeFlagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: note }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Kunde inte spara noteringen");
      }

      onClose();
    } catch (err) {
      alert("Fel: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const getFlagBadge = (flagLevel: string | null | undefined) => {
    if (flagLevel === "CRITICAL") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3" /> Kritisk
        </span>
      );
    }
    if (flagLevel === "WARNING") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
          <AlertTriangle className="w-3 h-3" /> Varning
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle2 className="w-3 h-3" /> Normal
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{row.itemName}</h2>
            {row.itemCode && <p className="text-sm text-gray-500">Art.nr: {row.itemCode}</p>}
            {row.unit && <p className="text-sm text-gray-500">Enhet: {row.unit}</p>}
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
              <p className="text-sm font-medium">Misstänkt prissamordning! Alla leverantörer har lämnat exakt samma pris för denna artikel.</p>
            </div>
          )}

          {/* Statistik-grid */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Statistik</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Medelpris</p>
                <p className="font-semibold text-gray-900">{formatPrice(row.stats.mean)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Median</p>
                <p className="font-semibold text-gray-900">{formatPrice(row.stats.median)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Std. Avvikelse</p>
                <p className="font-semibold text-gray-900">{formatPrice(row.stats.stdDev)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Lägsta</p>
                <p className="font-semibold text-gray-900">{formatPrice(row.stats.min)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Högsta</p>
                <p className="font-semibold text-gray-900">{formatPrice(row.stats.max)}</p>
              </div>
            </div>
          </div>

          {/* Leverantörstabell */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Leverantörernas priser</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leverantör</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pris</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Z-score</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Anledning</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suppliers.map((sup) => {
                    const cell = row.cells[sup];
                    const isMissing = !cell || cell.price === null;
                    return (
                      <tr key={sup}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{sup}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {isMissing ? "—" : formatPrice(cell.price)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                          {cell?.zScore != null ? cell.zScore.toFixed(2) : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {getFlagBadge(cell?.flagLevel)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {cell?.flagReason || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Handläggarnotering */}
          {activeFlagId && (
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
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Stäng
          </button>
          {activeFlagId && (
            <button
              onClick={handleSaveNote}
              disabled={isSaving || !note.trim()}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? "Sparar..." : "Spara notering"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
