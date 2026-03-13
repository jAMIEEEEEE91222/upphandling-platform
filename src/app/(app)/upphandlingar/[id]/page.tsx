import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  IMPORTED: "bg-blue-100 text-blue-800",
  ANALYZED: "bg-purple-100 text-purple-800",
  REPORTED: "bg-green-100 text-green-800",
};

const statusLabels = {
  DRAFT: "Utkast",
  IMPORTED: "Importerad",
  ANALYZED: "Analyserad",
  REPORTED: "Rapporterad",
};

export default async function ProcurementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const procurement = await prisma.procurement.findUnique({
    where: { id },
    include: {
      bids: {
        include: {
          _count: { select: { lineItems: true } }
        }
      }
    }
  });

  if (!procurement || procurement.createdById !== session.user.id) {
    redirect("/upphandlingar");
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{procurement.title}</h1>
            <Badge className={`${statusColors[procurement.status]} border-0 text-sm py-1`}>
              {statusLabels[procurement.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            {procurement.category} {procurement.referenceNumber && `• Ref: ${procurement.referenceNumber}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/upphandlingar/${procurement.id}/import`}>
            <Button>Ladda upp prisbilaga</Button>
          </Link>
          <Button disabled={procurement.status !== "IMPORTED"} variant="outline">Kör analys</Button>
          <Button disabled={procurement.status !== "ANALYZED"} variant="outline">Visa avvikelser</Button>
          <Button disabled={procurement.status !== "ANALYZED"} variant="outline">Generera rapport</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Importerade leverantörer</h2>
        </div>
        {procurement.bids.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Inga leverantörer importerade ännu. Börja med att ladda upp en prisbilaga.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 border-b">Leverantör</th>
                  <th className="px-6 py-3 border-b">Importerad</th>
                  <th className="px-6 py-3 border-b">Antal datarader</th>
                </tr>
              </thead>
              <tbody>
                {procurement.bids.map(bid => (
                  <tr key={bid.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-4 font-medium">{bid.supplierName}</td>
                    <td className="px-6 py-4">{bid.importedAt.toLocaleDateString("sv-SE")}</td>
                    <td className="px-6 py-4">{bid._count.lineItems}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
