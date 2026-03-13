"use client";

import { Procurement } from "@/types/procurement";
import ProcurementCard from "./ProcurementCard";

interface ProcurementListProps {
  procurements: Procurement[];
  onDelete: (id: string) => Promise<void>;
}

export default function ProcurementList({ procurements, onDelete }: ProcurementListProps) {
  if (procurements.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
        <h3 className="text-lg font-medium text-gray-900">Inga upphandlingar ännu</h3>
        <p className="mt-2 text-sm text-gray-500">Klicka på &apos;Ny upphandling&apos; för att börja.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground text-right">
        Sorterad efter: Skapad datum (nyast först)
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {procurements.map(procurement => (
          <ProcurementCard 
            key={procurement.id} 
            procurement={procurement} 
            onDelete={onDelete} 
          />
        ))}
      </div>
    </div>
  );
}
