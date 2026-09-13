import { db, monitors } from "@watchtower/db";
import { createMonitorSchema, updateMonitorSchema } from "@watchtower/shared";
import { eq } from "drizzle-orm";
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

  app.get<{ Params: { id: string } }>(
    "/monitors/:id",
    {
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const result = await db
        .select()
        .from(monitors)
        .where(eq(monitors.id, request.params.id));

      if (result.length === 0) {
        return reply.code(404).send({
          error: "Monitor not found",
        });
      }

      return result[0];
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

      const result = await db
        .update(monitors)
        .set({
          ...parsed.data,
          updatedAt: new Date(),
        })
        .where(eq(monitors.id, request.params.id))
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
      const result = await db
        .delete(monitors)
        .where(eq(monitors.id, request.params.id))
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
