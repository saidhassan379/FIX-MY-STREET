import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
}

// Read the URL
const dbUrl = new URL(process.env.DATABASE_URL);

// Remove ALL query parameters such as ?sslmode=require
dbUrl.search = "";

console.log("Database host:", dbUrl.hostname);
console.log("Database port:", dbUrl.port);
console.log("Database name:", dbUrl.pathname);
console.log("DB SSL verification disabled for hackathon:", true);

const pool = new Pool({
    connectionString: dbUrl.toString(),

    ssl: {
        rejectUnauthorized: false
    },

    connectionTimeoutMillis: 10000
});

export default pool;