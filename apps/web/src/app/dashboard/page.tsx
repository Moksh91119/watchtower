"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, AlertTriangle, ArrowRight, PauseCircle } from "lucide-react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

type DashboardChange = {
  id: string;
  monitorId: string;
  severity: "minor" | "moderate" | "major";
  changePercentage: number;
  additions: string;
  removals: string;
  createdAt: string;
};

type DashboardData = {
  totalMonitors: number;
  activeMonitors: number;
  pausedMonitors: number;
  totalChanges: number;
  recentChanges: DashboardChange[];
};

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [monitorNames, setMonitorNames] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadDashboard() {
      try {
        const dashboard = await api<DashboardData>("/api/monitors/dashboard", {
          token,
        });

        setData(dashboard);

        if (dashboard.recentChanges.length > 0) {
          const uniqueIds = [
            ...new Set(
              dashboard.recentChanges.map((change) => change.monitorId),
            ),
          ];

          const monitors = await Promise.all(
            uniqueIds.map((id) =>
              api<{ id: string; name: string }>(`/api/monitors/${id}`, {
                token,
              }),
            ),
          );

          setMonitorNames(
            Object.fromEntries(
              monitors.map((monitor) => [monitor.id, monitor.name]),
            ),
          );
        }
      } catch (error) {
        if (
          error instanceof Error &&
          (error as Error & { status?: number }).status === 401
        ) {
          router.replace("/login");
          return;
        }

        setError(
          error instanceof Error ? error.message : "Unable to load dashboard",
        );
      }
    }

    loadDashboard();
  }, [router]);

  if (!data && !error) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  const hasMonitors = data!.totalMonitors > 0;

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Overview</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Keep track of your monitored websites and detected changes.
          </p>
        </div>

        <Link
          href="/dashboard/monitors/new"
          className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Add monitor
        </Link>
      </div>

      {!hasMonitors ? (
        <EmptyDashboard />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Activity}
              label="Total monitors"
              value={data!.totalMonitors}
            />

            <StatCard
              icon={Activity}
              label="Active"
              value={data!.activeMonitors}
            />

            <StatCard
              icon={PauseCircle}
              label="Paused"
              value={data!.pausedMonitors}
            />

            <StatCard
              icon={AlertTriangle}
              label="Detected changes"
              value={data!.totalChanges}
            />
          </div>

          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold">Recent changes</h2>

                <p className="text-sm text-muted-foreground">
                  The latest changes detected across your monitors.
                </p>
              </div>

              <Link
                href="/dashboard/monitors"
                className="hidden items-center gap-1 text-sm font-medium sm:flex"
              >
                View monitors
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {data!.recentChanges.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <p className="font-medium">No changes detected yet</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Watchtower will show detected changes here.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <div className="divide-y">
                  {data!.recentChanges.map((change) => (
                    <Link
                      key={change.id}
                      href={`/dashboard/monitors/${change.monitorId}`}
                      className="block p-5 hover:bg-muted/50"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">
                              {monitorNames[change.monitorId] ?? "Monitor"}
                            </span>

                            <SeverityBadge severity={change.severity} />
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {change.changePercentage}% of monitored content
                            changed
                          </p>
                        </div>

                        <span className="text-xs text-muted-foreground">
                          {formatDate(change.createdAt)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>

      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: DashboardChange["severity"];
}) {
  return (
    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
      {severity}
    </span>
  );
}

function EmptyDashboard() {
  return (
    <div className="rounded-lg border border-dashed p-12 text-center">
      <Activity className="mx-auto h-8 w-8 text-muted-foreground" />

      <h2 className="mt-4 font-medium">Start monitoring a website</h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Add a website and Watchtower will periodically check it for meaningful
        content changes.
      </p>

      <Link
        href="/dashboard/monitors/new"
        className="mt-6 inline-flex rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Create your first monitor
      </Link>
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}
