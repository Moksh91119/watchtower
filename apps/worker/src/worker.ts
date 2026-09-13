import { runScheduler } from "./services/scheduler.js";

const intervalMs = 30_000;

console.log("Watchtower worker started");

await runScheduler();

setInterval(async () => {
  await runScheduler();
}, intervalMs);
