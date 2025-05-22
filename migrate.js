const fs = require("fs");
const path = require("path");
const db = require("./db");

// Function to run SQL from file
function executeSqlFile(filePath) {
  return new Promise((resolve, reject) => {
    console.log(`Executing SQL file: ${filePath}`);

    // Read the SQL file
    fs.readFile(filePath, "utf8", (err, sql) => {
      if (err) {
        return reject(err);
      }

      // Split the SQL by semicolon to handle multiple statements
      const statements = sql
        .split(";")
        .filter((statement) => statement.trim().length > 0);

      // Execute each statement
      let completed = 0;
      statements.forEach((statement, index) => {
        db.query(statement, (err, results) => {
          if (err) {
            console.error(`Error executing statement ${index + 1}:`, err);
            return reject(err);
          }

          completed++;
          if (completed === statements.length) {
            console.log(`✅ Successfully applied ${filePath}`);
            resolve();
          }
        });
      });
    });
  });
}

async function applyMigrations() {
  try {
    console.log("Applying database migrations...");

    // Create product_links table
    await executeSqlFile(
      path.join(__dirname, "create_product_links_table.sql")
    );

    console.log("✅ All migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

applyMigrations();
