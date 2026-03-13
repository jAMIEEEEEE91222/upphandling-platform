"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProcurementList from "@/components/procurement/ProcurementList";
import ProcurementForm from "@/components/procurement/ProcurementForm";
import { Procurement } from "@/types/procurement";
import { useProcurements } from "@/hooks/useProcurements";

export default function ProcurementsClient({ initialData }: { initialData: Procurement[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { procurements, remove, refresh } = useProcurements();
  
  const displayData = procurements.length > 0 ? procurements : initialData;

  const handleSuccess = () => {
    setIsDialogOpen(false);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Upphandlingar</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>+ Ny upphandling</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Skapa ny upphandling</DialogTitle>
            </DialogHeader>
            <ProcurementForm onSuccess={handleSuccess} onCancel={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      <ProcurementList procurements={displayData} onDelete={remove} />
    </div>
  );
}
