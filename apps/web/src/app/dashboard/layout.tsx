import Link from "next/link";
import { Activity, LayoutDashboard, Plus } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r bg-white md:flex md:flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight"
          >
            Watchtower
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <NavItem
              href="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
            />

            <NavItem
              href="/dashboard/monitors"
              icon={Activity}
              label="Monitors"
            />
          </div>

          <div className="mt-6 border-t pt-6">
            <Link
              href="/dashboard/monitors/new"
              className="flex items-center justify-center gap-2 rounded-md bg-slate-900 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              New monitor
            </Link>
          </div>
        </nav>

        <div className="border-t p-4">
          <p className="text-xs text-slate-500">Website change monitoring</p>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
