"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { CreateProcurementInput, CreateProcurementSchema } from "@/types/procurement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProcurementFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORIES = [
  "Kontorsmaterial",
  "IT-utrustning",
  "Fordon",
  "Tjänster",
  "Bygg & Fastighet",
  "Övrigt",
];

export default function ProcurementForm({ onSuccess, onCancel }: ProcurementFormProps) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<CreateProcurementInput>({
    resolver: zodResolver(CreateProcurementSchema),
    defaultValues: { title: "", category: CATEGORIES[0], referenceNumber: "" },
  });

  const onSubmit = async (values: CreateProcurementInput) => {
    try {
      setError(null);
      const res = await fetch("/api/procurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Misslyckades att skapa upphandling");
        return;
      }
      onSuccess();
    } catch {
      setError("Ett serverfel uppstod");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="text-red-500 text-sm">{error}</div>}
      
      <div className="space-y-2">
        <Label htmlFor="title">Titel</Label>
        <Input id="title" {...form.register("title")} placeholder="T.ex. Ramavtal Kontorsmaterial" />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Kategori</Label>
        <select
          id="category"
          {...form.register("category")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {form.formState.errors.category && (
          <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="referenceNumber">Referensnummer (frivilligt)</Label>
        <Input id="referenceNumber" {...form.register("referenceNumber")} placeholder="T.ex. UH-2025-01" />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Avbryt</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Skapar..." : "Skapa upphandling"}
        </Button>
      </div>
    </form>
  );
}
