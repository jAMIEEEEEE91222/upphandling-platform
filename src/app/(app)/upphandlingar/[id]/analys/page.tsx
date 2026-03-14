import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import AnalysisClientPage from "./AnalysisClientPage";

export default async function AnalysisPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await props.params;
  const id = params?.id;

  if (!id) {
    notFound();
  }

  const procurement = await prisma.procurement.findUnique({
    where: { id },
    select: { id: true, status: true, title: true, createdById: true }
  });

  if (!procurement || procurement.createdById !== session.user.id) {
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
