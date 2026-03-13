"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProcurementWithCounts } from "@/types/procurement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface ProcurementCardProps {
  procurement: ProcurementWithCounts;
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
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(procurement.id);
    router.refresh();
    setIsDeleting(false);
  };

  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col relative group/card">
      <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
        <div>
          <CardTitle className="text-xl font-bold">
            <Link href={`/upphandlingar/${procurement.id}`} className="focus:outline-none before:absolute before:inset-0 rounded-xl">
              {procurement.title}
            </Link>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {procurement.category} {procurement.referenceNumber && `• ${procurement.referenceNumber}`}
          </p>
        </div>
        <Badge className={`${statusColors[procurement.status]} border-0`}>
          {statusLabels[procurement.status]}
        </Badge>
      </CardHeader>
      <CardContent className="mt-auto pt-4 border-t relative z-10">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground flex gap-4">
            <span>{new Date(procurement.createdAt).toLocaleDateString("sv-SE")}</span>
            <span>• {procurement._count?.bids ?? 0} leverantörer</span>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger render={
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-500 hover:text-red-700 hover:bg-red-50" 
                disabled={isDeleting}
              />
            }>
              Ta bort
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertTriangle className="size-5" />
                  <AlertDialogTitle>Ta bort upphandling</AlertDialogTitle>
                </div>
                <AlertDialogDescription>
                  Är du säker på att du vill ta bort &quot;{procurement.title}&quot;? 
                  Denna åtgärd går inte att ångra och all tillhörande data (anbud, rader, analys) kommer att raderas permanent.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Nej, avbryt</AlertDialogCancel>
                <AlertDialogAction 
                  variant="destructive" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                >
                  Ja, ta bort
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
