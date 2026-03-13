"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import type { DeviationMatrixData, MatrixRow } from "@/types/analysis";
import DeviationCell from "./DeviationCell";
import ItemDetailModal from "./ItemDetailModal";
import { Search } from "lucide-react";

interface DeviationMatrixProps {
  data: DeviationMatrixData;
}

const columnHelper = createColumnHelper<MatrixRow>();

function createColumns(suppliers: string[]) {
  const baseColumns = [
    columnHelper.accessor("itemName", {
      id: "itemName",
      header: "Artikel",
      cell: (info) => (
        <div className="py-2 pr-4 font-medium text-gray-900 min-w-[200px] max-w-[400px] truncate" title={info.getValue()}>
          {info.getValue()}
        </div>
      ),
    }),
  ];

  const supplierColumns = suppliers.map((sup) =>
    columnHelper.accessor((row) => row.cells[sup], {
      id: sup,
      header: () => <div className="text-center font-medium w-full">{sup}</div>,
      cell: (info) => (
        <div className="w-full h-full min-w-[140px] border-l border-gray-200">
          <DeviationCell cell={info.getValue()} />
        </div>
      ),
    })
  );

  return [...baseColumns, ...supplierColumns];
}

export default function DeviationMatrix({ data }: DeviationMatrixProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [showOnlyFlagged, setShowOnlyFlagged] = useState(false);
  const [selectedRow, setSelectedRow] = useState<MatrixRow | null>(null);

  const columns = useMemo(() => createColumns(data.suppliers), [data.suppliers]);

  const sortedAndFilteredData = useMemo(() => {
    let result = [...data.rows];
    
    // Default-sortering: CRITICAL överst, sedan WARNING, sedan NORMAL
    const priority: Record<string, number> = { "CRITICAL": 3, "WARNING": 2, "NORMAL": 1 };
    result.sort((a, b) => {
      const pA = priority[a.highestFlagLevel || "NORMAL"] || 0;
      const pB = priority[b.highestFlagLevel || "NORMAL"] || 0;
      return pB - pA;
    });

    if (showOnlyFlagged) {
      result = result.filter(r => r.highestFlagLevel === "WARNING" || r.highestFlagLevel === "CRITICAL");
    }
    
    return result;
  }, [data.rows, showOnlyFlagged]);

  const table = useReactTable({
    data: sortedAndFilteredData,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId) as string;
      return value.toLowerCase().includes(String(filterValue).toLowerCase());
    },
  });

  return (
    <div className="space-y-4">
      {/* Filterpanel */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Sök på artikelnamn..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyFlagged}
            onChange={(e) => setShowOnlyFlagged(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Visa bara flaggade artiklar</span>
        </label>
      </div>

      {/* TanStack Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-gray-100 border-b border-gray-200">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500 text-sm">
                    Inga artiklar hittades som matchar filtret.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-blue-50 cursor-pointer group transition-colors"
                    onClick={() => setSelectedRow(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-0 border-r border-gray-200 last:border-r-0">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ItemDetailModal 
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        row={selectedRow}
        suppliers={data.suppliers}
      />
    </div>
  );
}
