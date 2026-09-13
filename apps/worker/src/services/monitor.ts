import { changes, checks, db, monitors, snapshots } from "@watchtower/db";
import { desc, eq } from "drizzle-orm";
import { fetchMonitorContent } from "./fetcher.js";
import { detectChange } from "./change-detector.js";
import { notifyChange } from "./notification.js";

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
      .where(eq(snapshots.monitorId, monitor.id))
      .orderBy(desc(snapshots.createdAt))
      .limit(1);

    const changed =
      previousSnapshots.length > 0 &&
      previousSnapshots[previousSnapshots.length - 1].contentHash !==
        result.contentHash;

    const previousSnapshot = previousSnapshots[0];

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

      const [createdChange] = await db
        .insert(changes)
        .values({
          monitorId: monitor.id,
          previousSnapshotId: previousSnapshot.id,
          currentSnapshotId: currentSnapshot.id,
          additions: change.additions,
          removals: change.removals,
          changePercentage: change.changePercentage,
          severity: change.severity,
        })
        .returning();

      try {
        await notifyChange(createdChange.id);
      } catch (error) {
        console.error(
          `Failed to send notification for change ${createdChange.id}:`,
          error,
        );
      }
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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await db.insert(checks).values({
      monitorId: monitor.id,
      status: "failed",
      changed: false,
      responseTimeMs: Date.now() - startedAt,
      errorMessage,
    });

    await db
      .update(monitors)
      .set({
        lastCheckedAt: new Date(),
        nextCheckAt: new Date(Date.now() + 15 * 60 * 1000),
        updatedAt: new Date(),
      })
      .where(eq(monitors.id, monitor.id));

    throw error;
  }
}
