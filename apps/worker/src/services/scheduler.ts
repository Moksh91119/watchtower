import "dotenv/config";
import { db, monitors } from "@watchtower/db";
import { and, eq, lte } from "drizzle-orm";
import { runMonitor } from "./monitor.js";

let isRunning = false;

export async function runScheduler() {
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    const dueMonitors = await db
      .select()
      .from(monitors)
      .where(
        and(
          eq(monitors.status, "active"),
          lte(monitors.nextCheckAt, new Date()),
        ),
      )
      .limit(10);

    if (dueMonitors.length === 0) {
      return;
    }

    console.log(`Found ${dueMonitors.length} monitor(s) due for checking`);

    for (const monitor of dueMonitors) {
      try {
        const [claimed] = await db
          .update(monitors)
          .set({
            nextCheckAt: new Date(
              Date.now() + monitor.frequencyMinutes * 60 * 1000,
            ),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(monitors.id, monitor.id),
              eq(monitors.status, "active"),
              lte(monitors.nextCheckAt, new Date()),
            ),
          )
          .returning();

        if (!claimed) {
          continue;
        }

        console.log(`Checking: ${monitor.name}`);

        await runMonitor(monitor.id);

        console.log(`Completed: ${monitor.name}`);
      } catch (error) {
        console.error(`Failed: ${monitor.name}`, error);
      }
    }
  } finally {
    isRunning = false;
  }
}
