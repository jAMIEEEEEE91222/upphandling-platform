import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, ChevronLeft, Calendar } from "lucide-react";
import ReportExportButton from "@/components/report/ReportExportButton";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const procurement = await prisma.procurement.findUnique({
    where: { id },
    include: {
      report: true
    }
  });

  if (!procurement || procurement.createdById !== session.user.id) {
    redirect("/upphandlingar");
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div>
        <div className="flex items-center gap-4 mb-2">
          <Link href={`/upphandlingar/${id}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Tillbaka till översikten
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-800 rounded-md">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rapportering och Export</h1>
            <p className="text-muted-foreground">
              Skapa kompletta presentationer av din avvikelserapport i PDF, samt nedbryteliga matrixar för Excel.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Visa lite meta om den ev gamla rapporten finns  */}
        {procurement.report && (
           <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Calendar className="w-5 h-5 text-gray-500" />
                 <div>
                    <h3 className="text-sm font-medium text-gray-900">Senaste genererade version:</h3>
                    <p className="text-xs text-gray-500">
                      {new Intl.DateTimeFormat("sv-SE", { dateStyle: "long", timeStyle: "medium" }).format(procurement.report.generatedAt)}
                    </p>
                 </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                Filstorlek PDF: {(procurement.report.fileSize! / 1024 / 1024).toFixed(2)} MB
              </div>
           </div>
        )}

        {/* Action komponenten! */}
        <ReportExportButton 
          procurementId={procurement.id} 
          hasExistingReport={!!procurement.report}
          existingReportId={procurement.report?.id}
        />
      </div>
    </div>
  );
}
