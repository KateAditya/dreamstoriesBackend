const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Convert pool to use promises
const promisePool = pool.promise();

// Function to test database connection
const testConnection = () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error("❌ Database connection failed:", err.message);
        reject(err);
        return;
      }
      console.log("✅ Connected to MySQL Database");
      connection.release();
      resolve();
    });
  });
};

// Export pool, promise pool, and connection test
module.exports = pool;
module.exports.promise = promisePool;
module.exports.testConnection = testConnection;
