"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Upphandlingar", href: "/upphandlingar", icon: FileText },
  { name: "Inställningar", href: "/installningar", icon: Settings },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-white">
      <div className="flex h-16 items-center gap-2 px-4">
        <BarChart2 className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold text-foreground">
          Upphandling
        </span>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 px-2 py-4" aria-label="Huvudnavigering">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-l-2 border-primary bg-blue-50 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-2">
        <Separator className="mb-2" />
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-5 w-5" />
          Logga ut
        </Button>
      </div>
    </aside>
  );
}
