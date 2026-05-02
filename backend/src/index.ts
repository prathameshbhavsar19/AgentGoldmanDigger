import { runMigrations } from "./db/migrate.js";
import { createServer } from "./server.js";
import { cfg } from "./config.js";
import { logger } from "./utils/logger.js";
import fs from "fs";
import path from "path";

// Ensure data directories exist
fs.mkdirSync(path.resolve(cfg.DATA_DIR), { recursive: true });
fs.mkdirSync(path.resolve(cfg.USERS_DIR), { recursive: true });

runMigrations();

const server = createServer();

server.listen(cfg.PORT, () => {
  logger.info({ port: cfg.PORT, env: cfg.NODE_ENV }, "Portfolio GPS backend started");
});

server.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});
