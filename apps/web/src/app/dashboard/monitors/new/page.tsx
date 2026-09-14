"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

type MonitoringMode = "full_page" | "text" | "selector";

export default function NewMonitorPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [monitoringMode, setMonitoringMode] =
    useState<MonitoringMode>("full_page");
  const [selector, setSelector] = useState("");
  const [frequencyMinutes, setFrequencyMinutes] = useState("60");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    setLoading(true);

    try {
      const monitor = await api<{ id: string }>("/api/monitors", {
        method: "POST",
        token,
        body: JSON.stringify({
          name,
          url,
          monitoringMode,
          selector: monitoringMode === "selector" ? selector : undefined,
          frequencyMinutes: frequency,
        }),
      });

      router.push(`/dashboard/monitors/${monitor.id}`);
    } catch (error) {
      if (
        error instanceof Error &&
        (error as Error & { status?: number }).status === 401
      ) {
        router.replace("/login");
        return;
      }

      setError(
        error instanceof Error ? error.message : "Unable to create monitor",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link
          href="/dashboard/monitors"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to monitors
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          New monitor
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Configure a website Watchtower should monitor.
        </p>
      </div>

      <div className="max-w-2xl rounded-lg border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Monitor name
            </label>

            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example: Company pricing page"
              required
              maxLength={100}
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2"
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
              placeholder="https://example.com"
              required
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2"
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
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2"
            >
              <option value="full_page">Full page</option>
              <option value="text">Text only</option>
              <option value="selector">CSS selector</option>
            </select>

            <p className="mt-2 text-xs text-muted-foreground">
              {monitoringMode === "full_page" &&
                "Track meaningful text changes across the page."}

              {monitoringMode === "text" &&
                "Track only the readable text content."}

              {monitoringMode === "selector" &&
                "Track a specific element using a CSS selector."}
            </p>
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
                placeholder="#pricing .price"
                maxLength={500}
                required
                className="w-full rounded-md border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2"
              />

              <p className="mt-2 text-xs text-muted-foreground">
                Example: <code>#pricing .price</code> or <code>main h1</code>
              </p>
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

          {error && (
            <div className="rounded-md border border-red-200 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/dashboard/monitors"
              className="rounded-md border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create monitor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
