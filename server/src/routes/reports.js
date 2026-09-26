import express from "express";
import multer from "multer";
import { analyzeCivicIssue } from "../services/gemini.js";
import pool from "../db/pool.js";
import { checkPossibleDuplicate } from "../services/duplicate.js";
import { getDepartment } from "../services/department.js";


const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 8 * 1024 * 1024
    }
});



router.post(
    "/analyze",
    upload.single("photo"),
    async (req, res) => {

        try {

            const { latitude, longitude, description } = req.body;

            // 1. Validate photo
            if (!req.file) {
                return res.status(400).json({
                    error: "Missing photo"
                });
            }

            // 2. Validate coordinates
            if (!latitude || !longitude) {
                return res.status(400).json({
                    error: "Missing latitude or longitude"
                });
            }

            const latitudeNumber = Number(latitude);
            const longitudeNumber = Number(longitude);

            if (
                Number.isNaN(latitudeNumber) ||
                Number.isNaN(longitudeNumber) ||
                latitudeNumber < -90 ||
                latitudeNumber > 90 ||
                longitudeNumber < -180 ||
                longitudeNumber > 180
            ) {
                return res.status(400).json({
                    error: "Invalid latitude or longitude"
                });
            }

            // 3. Send image to Gemini
            const analysis = await analyzeCivicIssue(
                req.file,
                description
            );

            // 4. Duplicate detection comes later
            const possibleDuplicate =
                await checkPossibleDuplicate(
                    latitudeNumber,
                    longitudeNumber,
                    analysis.category
                );

            // 5. Determine department
            const department = getDepartment(
                analysis.category
            );

            // 6. Initial status
            const status = "REPORTED";

            // 7. Create initial status history
            const statusHistory = [
                {
                    status: "REPORTED",
                    timestamp: new Date().toISOString()
                }
            ];

            // 8. Convert photo into text so we can store it
            const photo = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

            // 9. Insert report into Tiger Data
            const result = await pool.query(
                `
                INSERT INTO reports (
                    photo,
                    latitude,
                    longitude,
                    description,
                    category,
                    confidence,
                    severity,
                    safety_risk,
                    possible_duplicate,
                    department,
                    status,
                    status_history
                )

                VALUES (
                    $1, $2, $3, $4, $5, $6,
                    $7, $8, $9, $10, $11, $12
                )

                RETURNING
                    report_id,
                    latitude,
                    longitude,
                    description,
                    category,
                    confidence,
                    severity,
                    safety_risk,
                    possible_duplicate,
                    department,
                    status,
                    created_at,
                    status_history
                `,
                [
                    photo,
                    latitudeNumber,
                    longitudeNumber,
                    analysis.description,
                    analysis.category,
                    analysis.confidence,
                    analysis.severity,
                    analysis.safety_risk,
                    possibleDuplicate,
                    department,
                    status,
                    JSON.stringify(statusHistory)
                ]
            );

            // 10. Get newly-created report
            const savedReport = result.rows[0];

            // 11. Return it
            res.status(201).json({
                success: true,
                report: savedReport
            });

        } catch (error) {

            console.error("REPORT ERROR:");
            console.error(error);

            res.status(500).json({
                error: "Internal server error",
                details: error?.message
            });
        }
    }
);

// GET ALL REPORTS
router.get("/", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                report_id,
                photo,
                latitude,
                longitude,
                description,
                category,
                confidence,
                severity,
                safety_risk,
                possible_duplicate,
                department,
                status,
                created_at,
                status_history
            FROM reports
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            count: result.rows.length,
            reports: result.rows
        });

    } catch (error) {

        console.error("GET REPORTS ERROR:");
        console.error(error);

        res.status(500).json({
            success: false,
            error: "Failed to retrieve reports",
            details: error?.message
        });
    }
});

router.get("/:report_id/status_history", async (req, res) => {

    try {

        const { report_id } = req.params;

        const result = await pool.query(
            `
            SELECT
                report_id,
                status,
                status_history
            FROM reports
            WHERE report_id = $1
            `,
            [report_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Report not found"
            });
        }

        res.json({
            success: true,
            report_id: result.rows[0].report_id,
            current_status: result.rows[0].status,
            status_history: result.rows[0].status_history
        });

    } catch (error) {

        console.error("STATUS HISTORY ERROR:");
        console.error(error);

        res.status(500).json({
            success: false,
            error: "Failed to retrieve status history",
            details: error?.message
        });
    }
});

// GET ONE REPORT BY ID
router.get("/:report_id", async (req, res) => {

    try {

        const { report_id } = req.params;

        const result = await pool.query(
            `
            SELECT
                report_id,
                photo,
                latitude,
                longitude,
                description,
                category,
                confidence,
                severity,
                safety_risk,
                possible_duplicate,
                department,
                status,
                created_at,
                status_history
            FROM reports
            WHERE report_id = $1
            `,
            [report_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Report not found"
            });
        }

        res.json({
            success: true,
            report: result.rows[0]
        });

    } catch (error) {

        console.error("GET REPORT ERROR:");
        console.error(error);

        res.status(500).json({
            success: false,
            error: "Failed to retrieve report",
            details: error?.message
        });
    }
});

// UPDATE REPORT STATUS
router.patch("/:report_id/status", async (req, res) => {

    try {

        const { report_id } = req.params;
        const { status } = req.body;

        const validStatuses = [
            "REPORTED",
            "VERIFIED",
            "ASSIGNED",
            "INVESTIGATING",
            "SCHEDULED",
            "RESOLVED"
        ];

        if (!status) {
            return res.status(400).json({
                success: false,
                error: "Missing status"
            });
        }

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: "Invalid status"
            });
        }

        const existingReport = await pool.query(
            `
            SELECT status_history
            FROM reports
            WHERE report_id = $1
            `,
            [report_id]
        );

        if (existingReport.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Report not found"
            });
        }

        const currentHistory =
            existingReport.rows[0].status_history || [];

        const updatedHistory = [
            ...currentHistory,
            {
                status: status,
                timestamp: new Date().toISOString()
            }
        ];

        const result = await pool.query(
            `
            UPDATE reports
            SET
                status = $1,
                status_history = $2
            WHERE report_id = $3
            RETURNING
                report_id,
                status,
                status_history
            `,
            [
                status,
                JSON.stringify(updatedHistory),
                report_id
            ]
        );

        res.json({
            success: true,
            report: result.rows[0]
        });

    } catch (error) {

        console.error("STATUS UPDATE ERROR:");
        console.error(error);

        res.status(500).json({
            success: false,
            error: "Failed to update status",
            details: error?.message
        });
    }
});

export default router;