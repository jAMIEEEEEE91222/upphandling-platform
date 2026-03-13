import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProcurementsClient from "./ProcurementsClient";

export default async function ProcurementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const procurements = await prisma.procurement.findMany({
    where: { createdById: session.user.id },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      referenceNumber: true,
      createdAt: true,
      updatedAt: true,
      createdById: true,
      _count: { select: { bids: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = procurements.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <ProcurementsClient initialData={serialized} />
    </div>
  );
}
