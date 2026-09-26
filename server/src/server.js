import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import reportRoutes from "./routes/reports.js";
import pool from "./db/pool.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/reports", reportRoutes);

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "CivicFix backend running"
    });
});

app.get("/api/db-test", async (req, res) => {
    try {
        console.log("DATABASE_URL loaded:", !!process.env.DATABASE_URL);

        const result = await pool.query("SELECT NOW()");

        res.json({
            success: true,
            time: result.rows[0].now
        });

    } catch (error) {
        console.error("DATABASE ERROR:");
        console.error(error);

        res.status(500).json({
            success: false,
            error: error?.message || "Database connection failed",
            code: error?.code || null
        });
    }
});

const PORT = process.env.PORT || 5000;

console.log("### RUNNING NEW CIVICFIX SERVER ###");

app.listen(PORT, () => {
    console.log(`CivicFix backend running on port ${PORT}`);
});