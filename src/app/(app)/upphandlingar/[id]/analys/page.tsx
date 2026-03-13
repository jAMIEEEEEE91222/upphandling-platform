import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AnalysisClientPage from "./AnalysisClientPage";

export default async function AnalysisPage({ params }: { params: { id: string } }) {
  const procurement = await prisma.procurement.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, title: true }
  });

  if (!procurement) {
    notFound();
  }

  if (procurement.status === "DRAFT") {
    return (
      <div className="p-8 text-center text-gray-500">
        Inget Excel-dokument har importerats ännu. Gå tillbaka och importera en fil först.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-4">
        <span className="text-sm font-medium text-gray-500 uppercase">Upphandling</span>
        <h2 className="text-lg font-semibold text-gray-900">{procurement.title}</h2>
      </div>
      <AnalysisClientPage 
        procurementId={procurement.id} 
        initialStatus={procurement.status} 
      />
    </div>
  );
}
