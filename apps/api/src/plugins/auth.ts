import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export default fp(async (app: FastifyInstance) => {
  app.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.code(401).send({
          error: "Unauthorized",
        });
      }
    },
  );
});
