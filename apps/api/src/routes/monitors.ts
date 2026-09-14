import { changes, checks, db, monitors } from "@watchtower/db";
import { createMonitorSchema, updateMonitorSchema } from "@watchtower/shared";
import { and, desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

export async function monitorRoutes(app: FastifyInstance) {
  app.get(
    "/monitors",
    {
      onRequest: [app.authenticate],
    },
    async (request) => {
      const { userId } = request.user as { userId: string };

      return db.select().from(monitors).where(eq(monitors.userId, userId));
    },
  );

  app.get(
    "/dashboard",
    {
      onRequest: [app.authenticate],
    },
    async (request) => {
      const { userId } = request.user as { userId: string };

      const userMonitors = await db
        .select()
        .from(monitors)
        .where(eq(monitors.userId, userId));

      const monitorIds = userMonitors.map((monitor) => monitor.id);

      if (monitorIds.length === 0) {
        return {
          totalMonitors: 0,
          activeMonitors: 0,
          pausedMonitors: 0,
          totalChanges: 0,
          recentChanges: [],
        };
      }

      const recentChanges = await db
        .select({
          id: changes.id,
          monitorId: changes.monitorId,
          severity: changes.severity,
          changePercentage: changes.changePercentage,
          additions: changes.additions,
          removals: changes.removals,
          createdAt: changes.createdAt,
        })
        .from(changes)
        .innerJoin(monitors, eq(changes.monitorId, monitors.id))
        .where(eq(monitors.userId, userId))
        .orderBy(desc(changes.createdAt))
        .limit(10);

      const totalChanges = await db
        .select({ id: changes.id })
        .from(changes)
        .innerJoin(monitors, eq(changes.monitorId, monitors.id))
        .where(eq(monitors.userId, userId));

      return {
        totalMonitors: userMonitors.length,
        activeMonitors: userMonitors.filter(
          (monitor) => monitor.status === "active",
        ).length,
        pausedMonitors: userMonitors.filter(
          (monitor) => monitor.status === "paused",
        ).length,
        totalChanges: totalChanges.length,
        recentChanges,
      };
    },
  );

  app.get<{ Params: { id: string } }>(
    "/monitors/:id",
    {
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const { userId } = request.user as { userId: string };

      const result = await db
        .select()
        .from(monitors)
        .where(
          and(eq(monitors.id, request.params.id), eq(monitors.userId, userId)),
        );

      if (result.length === 0) {
        return reply.code(404).send({
          error: "Monitor not found",
        });
      }

      return result[0];
    },
  );

  app.get<{ Params: { id: string } }>(
    "/monitors/:id/checks",
    {
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const { userId } = request.user as { userId: string };

      const [monitor] = await db
        .select({ id: monitors.id })
        .from(monitors)
        .where(
          and(eq(monitors.id, request.params.id), eq(monitors.userId, userId)),
        );

      if (!monitor) {
        return reply.code(404).send({
          error: "Monitor not found",
        });
      }

      return db
        .select()
        .from(checks)
        .where(eq(checks.monitorId, monitor.id))
        .orderBy(desc(checks.checkedAt))
        .limit(50);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/monitors/:id/changes",
    {
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const { userId } = request.user as { userId: string };

      const [monitor] = await db
        .select({ id: monitors.id })
        .from(monitors)
        .where(
          and(eq(monitors.id, request.params.id), eq(monitors.userId, userId)),
        );

      if (!monitor) {
        return reply.code(404).send({
          error: "Monitor not found",
        });
      }

      return db
        .select()
        .from(changes)
        .where(eq(changes.monitorId, monitor.id))
        .orderBy(desc(changes.createdAt))
        .limit(50);
    },
  );

  app.post(
    "/monitors",
    {
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const parsed = createMonitorSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: "Invalid monitor data",
          details: parsed.error.flatten(),
        });
      }

      const data = parsed.data;

      const nextCheckAt = new Date(
        Date.now() + data.frequencyMinutes * 60 * 1000,
      );

      const { userId } = request.user as { userId: string };

      const result = await db
        .insert(monitors)
        .values({
          userId,
          name: data.name,
          url: data.url,
          monitoringMode: data.monitoringMode,
          selector: data.selector,
          frequencyMinutes: data.frequencyMinutes,
          nextCheckAt,
        })
        .returning();

      return reply.code(201).send(result[0]);
    },
  );

  app.patch<{ Params: { id: string } }>(
    "/monitors/:id",
    {
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const parsed = updateMonitorSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: "Invalid monitor data",
          details: parsed.error.flatten(),
        });
      }

      const { userId } = request.user as { userId: string };

      const updateData = {
        ...parsed.data,
        updatedAt: new Date(),
        ...(parsed.data.frequencyMinutes !== undefined
          ? {
              nextCheckAt: new Date(
                Date.now() + parsed.data.frequencyMinutes * 60 * 1000,
              ),
            }
          : {}),
      };

      const result = await db
        .update(monitors)
        .set(updateData)
        .where(
          and(eq(monitors.id, request.params.id), eq(monitors.userId, userId)),
        )
        .returning();

      if (result.length === 0) {
        return reply.code(404).send({
          error: "Monitor not found",
        });
      }

      return result[0];
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/monitors/:id",
    {
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const { userId } = request.user as { userId: string };

      const result = await db
        .delete(monitors)
        .where(
          and(eq(monitors.id, request.params.id), eq(monitors.userId, userId)),
        )
        .returning({ id: monitors.id });

      if (result.length === 0) {
        return reply.code(404).send({
          error: "Monitor not found",
        });
      }

      return reply.code(204).send();
    },
  );
}
