import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { monitorRoutes } from "./routes/monitors.js";
import { authRoutes } from "./routes/auth.js";
import jwt from "@fastify/jwt";
import authPlugin from "./plugins/auth.js";

const app = Fastify({
  logger: true,
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET!,
});

await app.register(authPlugin);

await app.register(cors);
await app.register(helmet);

app.get("/health", async () => {
  return {
    status: "ok",
    service: "watchtower-api",
  };
});

await app.register(authRoutes, {
  prefix: "/api/auth",
});

await app.register(monitorRoutes, {
  prefix: "/api",
});

const port = Number(process.env.PORT) || 4000;

await app.listen({
  port,
  host: "0.0.0.0",
});
