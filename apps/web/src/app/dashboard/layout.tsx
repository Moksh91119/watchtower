import Link from "next/link";
import { Activity, LayoutDashboard, Plus } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r md:flex md:flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight"
          >
            Watchtower
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          <Link
            href="/dashboard/monitors"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Activity className="h-4 w-4" />
            Monitors
          </Link>

          <Link
            href="/dashboard/monitors/new"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            New monitor
          </Link>
        </nav>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
