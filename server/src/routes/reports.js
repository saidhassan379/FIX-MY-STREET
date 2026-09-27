import {
    checkJwt,
    requireUpdateReports
} from "../middleware/auth0.js";


import express from "express";
import multer from "multer";
import { analyzeCivicIssue } from "../services/gemini.js";
import pool from "../db/pool.js";

import { getDuplicateInfo } from "../services/duplicate.js";
import { getTypicalResolutionTime } from "../services/resolutionTime.js";
import { getDepartment } from "../services/department.js";





const router = express.Router();

// Calculate the real distance between two GPS coordinates in metres
function getDistanceMeters(lat1, lng1, lat2, lng2) {

    const earthRadius = 6371000;

    const toRadians = (degrees) =>
        degrees * (Math.PI / 180);

    const latitude1 = toRadians(Number(lat1));
    const latitude2 = toRadians(Number(lat2));

    const latitudeDifference =
        toRadians(Number(lat2) - Number(lat1));

    const longitudeDifference =
        toRadians(Number(lng2) - Number(lng1));

    const a =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(latitude1) *
        Math.cos(latitude2) *
        Math.sin(longitudeDifference / 2) ** 2;

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

   return earthRadius * c;
}

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

                // Normalize AI output before routing/storing it.
                analysis.category = String(analysis.category || "unknown").toLowerCase();
                analysis.severity = String(analysis.severity || "low").toLowerCase();
                analysis.confidence = Math.max(0, Math.min(1, Number(analysis.confidence) || 0));
                analysis.safety_risk = Boolean(analysis.safety_risk);

                // 4. Duplicate detection comes later
                const duplicateInfo =
                    await getDuplicateInfo(
                        latitude,
                        longitude,
                        analysis.category
                    );

                const possibleDuplicate = duplicateInfo.possibleDuplicate;
                const duplicateCount = duplicateInfo.duplicateCount;
                const totalReportsForIssue = duplicateInfo.totalReportsForIssue;
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
                    report: {
                        ...savedReport,
                        duplicate_count: duplicateCount,
                        total_reports_for_issue: totalReportsForIssue
                    }
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
                count: groupedReports.length,
                radius_meters: radius,
                reports: groupedReports
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


    // PUBLIC: GET ACTIVE REPORTS NEAR A CITIZEN
    router.get("/nearby", async (req, res) => {

        try {

            const lat = Number(req.query.lat);
            const lng = Number(req.query.lng);

            // Radius in metres.
            // Default = 1000m, minimum = 50m, maximum = 5000m.
            const radius = Math.min(
                Math.max(Number(req.query.radius) || 1000, 50),
                5000
            );

            // Validate coordinates
            if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lng) ||
                lat < -90 ||
                lat > 90 ||
                lng < -180 ||
                lng > 180
            ) {
                return res.status(400).json({
                    success: false,
                    error: "Valid latitude and longitude are required"
                });
            }

            const result = await pool.query(
                `
            SELECT
                report_id,
                latitude,
                longitude,
                category,
                severity,
                status,
                created_at,

                (
                    6371000 * acos(
                        LEAST(
                            1,
                            GREATEST(
                                -1,
                                cos(radians($1))
                                * cos(radians(latitude))
                                * cos(
                                    radians(longitude) - radians($2)
                                )
                                + sin(radians($1))
                                * sin(radians(latitude))
                            )
                        )
                    )
                ) AS distance_meters

            FROM reports

            WHERE status != 'RESOLVED'

            AND (
                6371000 * acos(
                    LEAST(
                        1,
                        GREATEST(
                            -1,
                            cos(radians($1))
                            * cos(radians(latitude))
                            * cos(
                                radians(longitude) - radians($2)
                            )
                            + sin(radians($1))
                            * sin(radians(latitude))
                        )
                    )
                )
            ) <= $3

            ORDER BY distance_meters ASC

            LIMIT 50
            `,
                [lat, lng, radius]
            );

            // Group reports that appear to be the same nearby issue
            const groupedReports = [];

            for (const report of result.rows) {

                const distance = Number(report.distance_meters);

                const existingGroup = groupedReports.find((group) => {

                    const sameCategory =
                        group.category === report.category;

                    const distanceBetweenReports =
                        getDistanceMeters(
                            group.latitude,
                            group.longitude,
                            report.latitude,
                            report.longitude
                        );

                    const closeTogether =
                        distanceBetweenReports <= 50;

                    return sameCategory && closeTogether;
                });

                if (existingGroup) {

                    existingGroup.community_report_count += 1;
                    existingGroup.report_ids.push(report.report_id);

                } else {

                    groupedReports.push({
                        report_id: report.report_id,
                        latitude: report.latitude,
                        longitude: report.longitude,
                        category: report.category,
                        severity: report.severity,
                        status: report.status,
                        created_at: report.created_at,
                        distance_meters: distance,
                        community_report_count: 1,
                        report_ids: [report.report_id]
                    });
                }
            }

            res.json({
                success: true,
                count: groupedReports.length,
                radius_meters: radius,
                reports: groupedReports
            });
        } catch (error) {

            console.error("NEARBY REPORTS ERROR:");
            console.error(error);

            res.status(500).json({
                success: false,
                error: "Failed to retrieve nearby reports"
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

            const report = result.rows[0];

            const duplicateInfo = await getDuplicateInfo(
                Number(report.latitude),
                Number(report.longitude),
                report.category
            );

            // getDuplicateInfo includes this report itself because it is
            // already stored in the database.
            const totalReportsForIssue = Math.max(
                1,
                duplicateInfo.duplicateCount
            );

            const resolutionInfo =
                await getTypicalResolutionTime(report.category);

            res.json({
                success: true,
                report: {
                    ...report,
                    duplicate_count: Math.max(0, totalReportsForIssue - 1),
                    total_reports_for_issue: totalReportsForIssue,
                    median_resolution_ms: resolutionInfo.medianResolutionMs,
                    resolution_sample_size: resolutionInfo.resolvedReportCount
                }
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
    router.patch(
        "/:report_id/status",
        checkJwt,
        requireUpdateReports,
        async (req, res) => {

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