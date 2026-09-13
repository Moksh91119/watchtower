import "@fastify/jwt";
import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<unknown>;
  }
}

import type { FastifyRequest, FastifyReply } from "fastify";
