"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

type DashboardData = {
  totalMonitors: number;
  activeMonitors: number;
  pausedMonitors: number;
  totalChanges: number;
};

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    api<DashboardData>("/api/monitors/dashboard", {
      token,
    })
      .then(setData)
      .catch((error) => {
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
      });
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

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Monitor your websites and track meaningful changes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total monitors" value={data!.totalMonitors} />
        <Stat label="Active" value={data!.activeMonitors} />
        <Stat label="Paused" value={data!.pausedMonitors} />
        <Stat label="Total changes" value={data!.totalChanges} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
