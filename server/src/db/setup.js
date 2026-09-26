import pool from "./pool.js";

async function setupDatabase() {
    try {

        await pool.query(`
            CREATE TABLE IF NOT EXISTS reports (
                report_id BIGSERIAL PRIMARY KEY,

                photo TEXT NOT NULL,

                latitude DOUBLE PRECISION NOT NULL,
                longitude DOUBLE PRECISION NOT NULL,

                description TEXT NOT NULL,

                category TEXT NOT NULL CHECK (
                    category IN (
                        'pothole',
                        'broken_streetlight',
                        'damaged_sidewalk',
                        'blocked_accessibility_ramp',
                        'damaged_sign',
                        'overflowing_garbage_bin',
                        'road_obstruction',
                        'unknown'
                    )
                ),

                confidence DOUBLE PRECISION,

                severity TEXT,

                safety_risk BOOLEAN NOT NULL DEFAULT FALSE,

                possible_duplicate BOOLEAN NOT NULL DEFAULT FALSE,

                department TEXT,

                status TEXT NOT NULL DEFAULT 'REPORTED' CHECK (
                    status IN (
                        'REPORTED',
                        'VERIFIED',
                        'ASSIGNED',
                        'INVESTIGATING',
                        'SCHEDULED',
                        'RESOLVED'
                    )
                ),

                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

                status_history JSONB NOT NULL DEFAULT '[]'::jsonb
            );
        `);

        console.log("✅ reports table created successfully");

    } catch (error) {

        console.error("❌ Database setup failed");
        console.error(error);

    } finally {

        await pool.end();
    }
}

setupDatabase();