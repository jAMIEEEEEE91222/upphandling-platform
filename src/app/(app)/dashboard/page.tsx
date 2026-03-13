import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BarChart2, AlertTriangle } from "lucide-react";

const stats = [
  {
    title: "Aktiva upphandlingar",
    value: "0",
    icon: FileText,
  },
  {
    title: "Analyser denna månad",
    value: "0",
    icon: BarChart2,
  },
  {
    title: "Flaggade rader",
    value: "0",
    icon: AlertTriangle,
  },
] as const;

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name ?? "Användare";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Välkommen, {userName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Här är en översikt av dina upphandlingar.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Inga upphandlingar ännu. Klicka på &quot;Upphandlingar&quot; i menyn
            för att komma igång.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
