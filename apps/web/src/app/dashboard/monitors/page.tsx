"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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

export default function MonitorsPage() {
  const router = useRouter();

  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    api<Monitor[]>("/api/monitors", { token })
      .then(setMonitors)
      .catch((error) => {
        if (
          error instanceof Error &&
          (error as Error & { status?: number }).status === 401
        ) {
          router.replace("/login");
          return;
        }

        setError(
          error instanceof Error ? error.message : "Unable to load monitors",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading monitors...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monitors</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage the websites Watchtower monitors for you.
          </p>
        </div>

        <Link
          href="/dashboard/monitors/new"
          className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          <Plus className="h-4 w-4" />
          New monitor
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {!error && monitors.length === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="font-medium">No monitors yet</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Add your first website to start tracking changes.
          </p>

          <Link
            href="/dashboard/monitors/new"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            <Plus className="h-4 w-4" />
            Create monitor
          </Link>
        </div>
      )}

      {!error && monitors.length > 0 && (
        <div className="overflow-hidden rounded-lg border">
          <div className="divide-y">
            {monitors.map((monitor) => (
              <Link
                key={monitor.id}
                href={`/dashboard/monitors/${monitor.id}`}
                className="block p-5 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-medium">{monitor.name}</h2>

                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {monitor.url}
                    </p>
                  </div>

                  <span
                    className={
                      monitor.status === "active"
                        ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                        : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {monitor.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <span>Mode: {formatMode(monitor.monitoringMode)}</span>

                  <span>Every {formatFrequency(monitor.frequencyMinutes)}</span>

                  <span>Last checked: {formatDate(monitor.lastCheckedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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
