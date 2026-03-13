"use client";

import { CheckCircle2, AlertTriangle, AlertCircle, Ban, Minus } from "lucide-react";
import type { MatrixCell } from "@/types/analysis";

interface DeviationCellProps {
  cell: MatrixCell;
}

export default function DeviationCell({ cell }: DeviationCellProps) {
  if (cell.price === null) {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 text-gray-400 text-sm h-full w-full">
        <span>—</span>
        <Minus className="w-4 h-4 ml-2" />
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cell.price);

  const isZeroPrice = cell.price === 0;

  if (isZeroPrice) {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-red-50 text-red-700 font-semibold text-sm h-full w-full">
        <span>{formattedPrice}</span>
        <Ban className="w-4 h-4 ml-2 text-red-600 flex-shrink-0" />
      </div>
    );
  }

  if (cell.flagLevel === "CRITICAL") {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-red-50 text-red-700 font-semibold text-sm h-full w-full">
        <span>{formattedPrice}</span>
        <AlertCircle className="w-4 h-4 ml-2 text-red-600 flex-shrink-0" />
      </div>
    );
  }

  if (cell.flagLevel === "WARNING") {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-amber-50 text-amber-700 font-medium text-sm h-full w-full">
        <span>{formattedPrice}</span>
        <AlertTriangle className="w-4 h-4 ml-2 text-amber-600 flex-shrink-0" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-white text-gray-900 text-sm h-full w-full">
      <span>{formattedPrice}</span>
      <CheckCircle2 className="w-4 h-4 ml-2 text-green-600 flex-shrink-0" />
    </div>
  );
}
