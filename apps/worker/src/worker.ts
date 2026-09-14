import { runScheduler } from "./services/scheduler.js";

console.log("Watchtower worker started");

try {
  await runScheduler();
  console.log("Watchtower worker finished");
  process.exit(0);
} catch (error) {
  console.error("Watchtower worker failed:", error);
  process.exit(1);
}
