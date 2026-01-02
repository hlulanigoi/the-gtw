import { db } from "./storage";
import { sql } from "drizzle-orm";

async function runMigration() {
  try {
    console.log("Running migration: Add tracking_code to parcels...");
    
    // Add tracking_code column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE parcels ADD COLUMN IF NOT EXISTS tracking_code VARCHAR;
    `);
    
    // Create unique index
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS parcels_tracking_code_idx ON parcels(tracking_code);
    `);
    
    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
