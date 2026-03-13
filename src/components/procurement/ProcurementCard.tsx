"use client";

import Link from "next/link";
import { useState } from "react";
import { Procurement } from "@/types/procurement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProcurementCardProps {
  procurement: Procurement;
  onDelete: (id: string) => void;
}

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  IMPORTED: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  ANALYZED: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  REPORTED: "bg-green-100 text-green-800 hover:bg-green-200",
};

const statusLabels = {
  DRAFT: "Utkast",
  IMPORTED: "Importerad",
  ANALYZED: "Analyserad",
  REPORTED: "Rapporterad",
};

export default function ProcurementCard({ procurement, onDelete }: ProcurementCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!window.confirm("Är du säker på att du vill ta bort upphandlingen?")) return;
    
    setIsDeleting(true);
    await onDelete(procurement.id);
    setIsDeleting(false);
  };

  return (
    <Link href={`/upphandlingar/${procurement.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
          <div>
            <CardTitle className="text-xl font-bold">{procurement.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {procurement.category} {procurement.referenceNumber && `• ${procurement.referenceNumber}`}
            </p>
          </div>
          <Badge className={`${statusColors[procurement.status]} border-0`}>
            {statusLabels[procurement.status]}
          </Badge>
        </CardHeader>
        <CardContent className="mt-auto pt-4 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground flex gap-4">
              <span>{new Date(procurement.createdAt).toLocaleDateString("sv-SE")}</span>
              <span>• {procurement._count?.bids ?? 0} leverantörer</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-500 hover:text-red-700 hover:bg-red-50 z-10 relative" 
              disabled={isDeleting}
              onClick={handleDelete}
            >
              Ta bort
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
