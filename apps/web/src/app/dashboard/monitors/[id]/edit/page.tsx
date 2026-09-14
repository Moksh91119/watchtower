"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

type MonitoringMode = "full_page" | "text" | "selector";

type Monitor = {
  id: string;
  name: string;
  url: string;
  monitoringMode: MonitoringMode;
  selector: string | null;
  frequencyMinutes: number;
  status: "active" | "paused";
};

export default function EditMonitorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [monitor, setMonitor] = useState<Monitor | null>(null);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [monitoringMode, setMonitoringMode] =
    useState<MonitoringMode>("full_page");
  const [selector, setSelector] = useState("");
  const [frequencyMinutes, setFrequencyMinutes] = useState("60");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    api<Monitor>(`/api/monitors/${params.id}`, { token })
      .then((data) => {
        setMonitor(data);
        setName(data.name);
        setUrl(data.url);
        setMonitoringMode(data.monitoringMode);
        setSelector(data.selector ?? "");
        setFrequencyMinutes(String(data.frequencyMinutes));
      })
      .catch((error) => {
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
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.id, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (monitoringMode === "selector" && !selector.trim()) {
      setError("CSS selector is required for selector monitoring.");
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      setError("Please enter a valid URL.");
      return;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      setError("URL must use HTTP or HTTPS.");
      return;
    }

    const frequency = Number(frequencyMinutes);

    if (!Number.isInteger(frequency) || frequency < 5 || frequency > 10080) {
      setError("Frequency must be between 5 minutes and 7 days.");
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);

    try {
      await api<Monitor>(`/api/monitors/${params.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          name,
          url,
          monitoringMode,
          selector: monitoringMode === "selector" ? selector : undefined,
          frequencyMinutes: frequency,
        }),
      });

      router.push(`/dashboard/monitors/${params.id}`);
    } catch (error) {
      if (
        error instanceof Error &&
        (error as Error & { status?: number }).status === 401
      ) {
        router.replace("/login");
        return;
      }

      setError(
        error instanceof Error ? error.message : "Unable to update monitor",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    if (!monitor) return;

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setError("");

    try {
      const updated = await api<Monitor>(`/api/monitors/${monitor.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          status: monitor.status === "active" ? "paused" : "active",
        }),
      });

      setMonitor(updated);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update monitor status",
      );
    }
  }

  async function handleDelete() {
    if (!monitor) return;

    const confirmed = window.confirm(
      "Delete this monitor? This cannot be undone.",
    );

    if (!confirmed) return;

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await api<void>(`/api/monitors/${monitor.id}`, {
        method: "DELETE",
        token,
      });

      router.push("/dashboard/monitors");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to delete monitor",
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading monitor...</p>
      </div>
    );
  }

  if (!monitor) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">{error || "Monitor not found"}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link
          href={`/dashboard/monitors/${monitor.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to monitor
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Edit monitor
        </h1>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Monitor name
              </label>

              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={100}
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="url" className="mb-2 block text-sm font-medium">
                Website URL
              </label>

              <input
                id="url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                required
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="mode" className="mb-2 block text-sm font-medium">
                Monitoring mode
              </label>

              <select
                id="mode"
                value={monitoringMode}
                onChange={(event) =>
                  setMonitoringMode(event.target.value as MonitoringMode)
                }
                className="w-full rounded-md border bg-background px-3 py-2"
              >
                <option value="full_page">Full page</option>
                <option value="text">Text only</option>
                <option value="selector">CSS selector</option>
              </select>
            </div>

            {monitoringMode === "selector" && (
              <div>
                <label
                  htmlFor="selector"
                  className="mb-2 block text-sm font-medium"
                >
                  CSS selector
                </label>

                <input
                  id="selector"
                  value={selector}
                  onChange={(event) => setSelector(event.target.value)}
                  required
                  maxLength={500}
                  placeholder="#pricing .price"
                  className="w-full rounded-md border bg-background px-3 py-2 font-mono text-sm"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="frequency"
                className="mb-2 block text-sm font-medium"
              >
                Check frequency
              </label>

              <select
                id="frequency"
                value={frequencyMinutes}
                onChange={(event) => setFrequencyMinutes(event.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2"
              >
                <option value="5">Every 5 minutes</option>
                <option value="15">Every 15 minutes</option>
                <option value="30">Every 30 minutes</option>
                <option value="60">Every hour</option>
                <option value="360">Every 6 hours</option>
                <option value="720">Every 12 hours</option>
                <option value="1440">Every day</option>
                <option value="10080">Every 7 days</option>
              </select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-end gap-3">
              <Link
                href={`/dashboard/monitors/${monitor.id}`}
                className="rounded-md border px-4 py-2 text-sm font-medium"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="font-medium">Monitor status</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Pausing a monitor stops the scheduler from checking it.
          </p>

          <button
            type="button"
            onClick={handleToggleStatus}
            className="mt-4 rounded-md border px-4 py-2 text-sm font-medium"
          >
            {monitor.status === "active" ? "Pause monitor" : "Resume monitor"}
          </button>
        </div>

        <div className="rounded-lg border border-red-200 p-6">
          <h2 className="font-medium">Danger zone</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Permanently delete this monitor.
          </p>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete monitor"}
          </button>
        </div>
      </div>
    </div>
  );
}
