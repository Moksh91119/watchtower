console.log("Watchtower worker started");

setInterval(() => {
  console.log("Worker heartbeat:", new Date().toISOString());
}, 30000);
