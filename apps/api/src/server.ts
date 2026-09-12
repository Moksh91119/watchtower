import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";

const app = Fastify({
  logger: true,
});

await app.register(cors);
await app.register(helmet);

app.get("/health", async () => {
  return {
    status: "ok",
    service: "watchtower-api",
  };
});

const port = Number(process.env.PORT) || 4000;

await app.listen({
  port,
  host: "0.0.0.0",
});
