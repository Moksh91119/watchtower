import { changes, checks, db, monitors, snapshots } from "@watchtower/db";
import { eq } from "drizzle-orm";
import { fetchMonitorContent } from "./fetcher.js";
import { detectChange } from "./change-detector.js";

export async function runMonitor(monitorId: string) {
  const [monitor] = await db
    .select()
    .from(monitors)
    .where(eq(monitors.id, monitorId));

  if (!monitor) {
    throw new Error(`Monitor not found: ${monitorId}`);
  }

  const startedAt = Date.now();

  try {
    const result = await fetchMonitorContent({
      url: monitor.url,
      monitoringMode: monitor.monitoringMode,
      selector: monitor.selector,
    });

    const previousSnapshots = await db
      .select()
      .from(snapshots)
      .where(eq(snapshots.monitorId, monitor.id));

    const changed =
      previousSnapshots.length > 0 &&
      previousSnapshots[previousSnapshots.length - 1].contentHash !==
        result.contentHash;

    const previousSnapshot = previousSnapshots[previousSnapshots.length - 1];

    const [check] = await db
      .insert(checks)
      .values({
        monitorId: monitor.id,
        status: "success",
        changed,
        httpStatus: result.httpStatus,
        responseTimeMs: Date.now() - startedAt,
      })
      .returning();

    const [currentSnapshot] = await db
      .insert(snapshots)
      .values({
        monitorId: monitor.id,
        checkId: check.id,
        contentHash: result.contentHash,
        contentText: result.contentText,
        contentHtml: result.contentHtml,
        contentSize: result.contentSize,
      })
      .returning();

    if (changed && previousSnapshot) {
      const change = detectChange(
        previousSnapshot.contentText,
        currentSnapshot.contentText,
      );

      await db.insert(changes).values({
        monitorId: monitor.id,
        previousSnapshotId: previousSnapshot.id,
        currentSnapshotId: currentSnapshot.id,
        additions: change.additions,
        removals: change.removals,
        changePercentage: change.changePercentage,
        severity: change.severity,
      });
    }

    await db
      .update(monitors)
      .set({
        lastCheckedAt: new Date(),
        ...(changed ? { lastChangedAt: new Date() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(monitors.id, monitor.id));

    return {
      monitorId: monitor.id,
      changed,
      checkId: check.id,
      contentHash: result.contentHash,
    };
  } catch (error) {
    await db.insert(checks).values({
      monitorId: monitor.id,
      status: "failed",
      changed: false,
      responseTimeMs: Date.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    throw error;
  }
}
