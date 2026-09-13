import { changes, db, monitors, notifications, users } from "@watchtower/db";
import { eq } from "drizzle-orm";
import { sendChangeEmail } from "./email.js";

export async function notifyChange(changeId: string) {
  const [change] = await db
    .select()
    .from(changes)
    .where(eq(changes.id, changeId));

  if (!change) {
    throw new Error(`Change not found: ${changeId}`);
  }

  const [monitor] = await db
    .select()
    .from(monitors)
    .where(eq(monitors.id, change.monitorId));

  if (!monitor) {
    throw new Error(`Monitor not found: ${change.monitorId}`);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, monitor.userId));

  if (!user) {
    throw new Error(`User not found: ${monitor.userId}`);
  }

  const [notification] = await db
    .insert(notifications)
    .values({
      userId: user.id,
      monitorId: monitor.id,
      changeId: change.id,
      type: "email",
      status: "pending",
    })
    .returning();

  try {
    await sendChangeEmail({
      recipient: user.email,
      monitorName: monitor.name,
      monitorUrl: monitor.url,
      severity: change.severity,
      additions: change.additions,
      removals: change.removals,
    });

    await db
      .update(notifications)
      .set({
        status: "sent",
        sentAt: new Date(),
      })
      .where(eq(notifications.id, notification.id));

    return notification.id;
  } catch (error) {
    await db
      .update(notifications)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(notifications.id, notification.id));

    throw error;
  }
}
