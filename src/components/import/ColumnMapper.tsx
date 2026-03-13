"use client";

import { ColumnMapping } from "@/types/import";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ColumnMapperProps {
  headers: string[];
  mapping: ColumnMapping;
  onChange: (newMapping: ColumnMapping) => void;
  onConfirm: () => void;
  isImporting: boolean;
}

export default function ColumnMapper({ headers, mapping, onChange, onConfirm, isImporting }: ColumnMapperProps) {
  const updateMapping = (key: keyof ColumnMapping, value: string) => {
    onChange({ ...mapping, [key]: value || null });
  };

  const canConfirm = mapping.itemName && mapping.price && mapping.supplierName;

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
      <h3 className="text-lg font-medium">Bekräfta kolumnmappning</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="supplierName" className="font-bold">Leverantörens namn (krävs)</Label>
          <Input 
            id="supplierName" 
            value={mapping.supplierName || ""} 
            onChange={(e) => updateMapping("supplierName", e.target.value)}
            placeholder="T.ex. Kontorshuset AB"
          />
          <p className="text-xs text-muted-foreground">Skriv in leverantörens namn för denna prisbilaga.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="itemName">Artikelnamn (krävs)</Label>
          <select 
            id="itemName" 
            title="Artikelnamn kolumn"
            value={mapping.itemName || ""} 
            onChange={(e) => updateMapping("itemName", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">-- Välj kolumn --</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Pris (krävs)</Label>
          <select 
            id="price" 
            title="Pris kolumn"
            value={mapping.price || ""} 
            onChange={(e) => updateMapping("price", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">-- Välj kolumn --</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Enhet (frivilligt)</Label>
          <select 
            id="unit" 
            title="Enhet kolumn"
            value={mapping.unit || ""} 
            onChange={(e) => updateMapping("unit", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">-- Välj kolumn --</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="itemCode">Artikelnummer (frivilligt)</Label>
          <select 
            id="itemCode" 
            title="Artikelnummer kolumn"
            value={mapping.itemCode || ""} 
            onChange={(e) => updateMapping("itemCode", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">-- Välj kolumn --</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button 
          onClick={onConfirm} 
          disabled={!canConfirm || isImporting}
          className="w-full sm:w-auto"
        >
          {isImporting ? "Importerar..." : "Bekräfta mappning och importera"}
        </Button>
      </div>
    </div>
  );
}
