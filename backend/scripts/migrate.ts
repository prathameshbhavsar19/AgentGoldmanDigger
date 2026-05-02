import { runMigrations } from "../src/db/migrate.js";

runMigrations();
console.log("Migrations complete.");
