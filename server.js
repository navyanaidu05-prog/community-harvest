import { loadConfig, loadEnv } from "./src/config.js";
import { createDatabase, seedDatabase } from "./src/db.js";
import { createApp } from "./src/app.js";

loadEnv();
const config = loadConfig();
const db = createDatabase(config.databasePath);
seedDatabase(db, config);

const server = createApp({ db, config });

server.listen(config.port, () => {
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : config.port;
  console.log(`Community Harvest is running at http://localhost:${port}`);
  console.log(`Coordinator phone: ${config.admin.phone}`);
});

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} received. Closing Community Harvest.`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
