"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Monitor = {
  id: string;
  name: string;
  url: string;
  monitoringMode: "full_page" | "text" | "selector";
  selector: string | null;
  frequencyMinutes: number;
  status: "active" | "paused";
  lastCheckedAt: string | null;
  lastChangedAt: string | null;
  nextCheckAt: string | null;
};

type Change = {
  id: string;
  severity: "minor" | "moderate" | "major";
  changePercentage: number;
  additions: string;
  removals: string;
  createdAt: string;
};

type Check = {
  id: string;
  status: "success" | "failed";
  changed: boolean;
  httpStatus: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
  checkedAt: string;
};

export default function MonitorDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadMonitor() {
      try {
        const [monitorData, changesData, checksData] = await Promise.all([
          api<Monitor>(`/api/monitors/${params.id}`, {
            token,
          }),
          api<Change[]>(`/api/monitors/${params.id}/changes`, { token }),
          api<Check[]>(`/api/monitors/${params.id}/checks`, { token }),
        ]);

        setMonitor(monitorData);
        setChanges(changesData);
        setChecks(checksData);
      } catch (error) {
        if (
          error instanceof Error &&
          (error as Error & { status?: number }).status === 401
        ) {
          router.replace("/login");
          return;
        }

        setError(
          error instanceof Error ? error.message : "Unable to load monitor",
        );
      } finally {
        setLoading(false);
      }
    }

    loadMonitor();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading monitor...</p>
      </div>
    );
  }

  if (error || !monitor) {
    return (
      <div className="p-6">
        <Link
          href="/dashboard/monitors"
          className="text-sm text-muted-foreground"
        >
          ← Back to monitors
        </Link>

        <p className="mt-6 text-sm text-red-500">
          {error || "Monitor not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link
          href="/dashboard/monitors"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to monitors
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {monitor.name}
              </h1>

              <StatusBadge status={monitor.status} />
            </div>

            <a
              href={monitor.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex max-w-full items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <span className="truncate">{monitor.url}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          </div>

          <Link
            href={`/dashboard/monitors/${monitor.id}/edit`}
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Edit monitor
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Status" value={capitalize(monitor.status)} />

        <InfoCard
          label="Monitoring mode"
          value={formatMode(monitor.monitoringMode)}
        />

        <InfoCard
          label="Frequency"
          value={formatFrequency(monitor.frequencyMinutes)}
        />

        <InfoCard
          label="Last checked"
          value={formatDate(monitor.lastCheckedAt)}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Recent changes</h2>

            <p className="text-sm text-muted-foreground">
              Changes detected on this website.
            </p>
          </div>

          {changes.length === 0 ? (
            <EmptyState text="No changes detected yet." />
          ) : (
            <div className="space-y-3">
              {changes.map((change) => (
                <div key={change.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <SeverityBadge severity={change.severity} />

                    <span className="text-xs text-muted-foreground">
                      {formatDate(change.createdAt)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm">
                    Approximately <strong>{change.changePercentage}%</strong> of
                    the monitored content changed.
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <ChangeText label="Added" value={change.additions} />

                    <ChangeText label="Removed" value={change.removals} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Recent checks</h2>

            <p className="text-sm text-muted-foreground">
              Monitoring execution history.
            </p>
          </div>

          {checks.length === 0 ? (
            <EmptyState text="No checks recorded yet." />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <div className="divide-y">
                {checks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-center justify-between gap-4 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            check.status === "success"
                              ? "h-2 w-2 rounded-full bg-green-500"
                              : "h-2 w-2 rounded-full bg-red-500"
                          }
                        />

                        <span className="text-sm font-medium">
                          {capitalize(check.status)}
                        </span>

                        {check.changed && (
                          <span className="text-xs text-muted-foreground">
                            · Change detected
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(check.checkedAt)}
                      </p>
                    </div>

                    <div className="text-right text-xs text-muted-foreground">
                      {check.httpStatus && <p>HTTP {check.httpStatus}</p>}

                      {check.responseTimeMs !== null && (
                        <p>{check.responseTimeMs} ms</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="mt-8 rounded-lg border p-5">
        <h2 className="font-medium">Schedule</h2>

        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Next check</p>

            <p className="mt-1">{formatDate(monitor.nextCheckAt)}</p>
          </div>

          <div>
            <p className="text-muted-foreground">Last change</p>

            <p className="mt-1">{formatDate(monitor.lastChangedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Monitor["status"] }) {
  return (
    <span
      className={
        status === "active"
          ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
          : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
      }
    >
      {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: Change["severity"] }) {
  return (
    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
      {capitalize(severity)}
    </span>
  );
}

function ChangeText({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>

      <p className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap text-xs">
        {value || "(none)"}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatMode(mode: Monitor["monitoringMode"]) {
  switch (mode) {
    case "full_page":
      return "Full page";
    case "text":
      return "Text";
    case "selector":
      return "Selector";
  }
}

function formatFrequency(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;

    if (hours < 24) {
      return `${hours} hr`;
    }

    if (hours % 24 === 0) {
      return `${hours / 24} day`;
    }
  }

  return `${minutes} min`;
}

function formatDate(date: string | null) {
  if (!date) {
    return "Never";
  }

  return new Date(date).toLocaleString();
}
