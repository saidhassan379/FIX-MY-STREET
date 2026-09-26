import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import reportRoutes from "./routes/reports.js";

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`CivicFix backend running on port ${PORT}`);
});