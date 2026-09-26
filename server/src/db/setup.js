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
                        'road_crack',
                        'sinkhole',
                        'broken_streetlight',
                        'traffic_signal_problem',
                        'damaged_sidewalk',
                        'blocked_accessibility_ramp',
                        'damaged_sign',
                        'guardrail_damage',
                        'overflowing_garbage_bin',
                        'illegal_dumping',
                        'road_obstruction',
                        'snow_blocked_sidewalk',
                        'snow_blocked_road',
                        'flooding',
                        'blocked_storm_drain',
                        'fallen_tree',
                        'dangerous_tree_branch',
                        'downed_or_hanging_wire',
                        'damaged_utility_pole',
                        'water_main_leak',
                        'fire_hydrant_damage',
                        'graffiti',
                        'abandoned_vehicle',
                        'dead_animal',
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


        // Existing databases need their old category CHECK constraint replaced.
        // This block finds the CHECK constraint attached to reports.category,
        // removes it, then adds the expanded CivicFix category list.
        await pool.query(`
            DO $$
            DECLARE
                constraint_name TEXT;
            BEGIN
                SELECT c.conname
                INTO constraint_name
                FROM pg_constraint c
                JOIN pg_class t ON t.oid = c.conrelid
                JOIN pg_namespace n ON n.oid = t.relnamespace
                WHERE t.relname = 'reports'
                  AND n.nspname = current_schema()
                  AND c.contype = 'c'
                  AND pg_get_constraintdef(c.oid) LIKE '%category%';

                IF constraint_name IS NOT NULL THEN
                    EXECUTE format('ALTER TABLE reports DROP CONSTRAINT %I', constraint_name);
                END IF;
            END $$;

            ALTER TABLE reports
            ADD CONSTRAINT reports_category_check
            CHECK (
                category IN (
                        'pothole',
                        'road_crack',
                        'sinkhole',
                        'broken_streetlight',
                        'traffic_signal_problem',
                        'damaged_sidewalk',
                        'blocked_accessibility_ramp',
                        'damaged_sign',
                        'guardrail_damage',
                        'overflowing_garbage_bin',
                        'illegal_dumping',
                        'road_obstruction',
                        'snow_blocked_sidewalk',
                        'snow_blocked_road',
                        'flooding',
                        'blocked_storm_drain',
                        'fallen_tree',
                        'dangerous_tree_branch',
                        'downed_or_hanging_wire',
                        'damaged_utility_pole',
                        'water_main_leak',
                        'fire_hydrant_damage',
                        'graffiti',
                        'abandoned_vehicle',
                        'dead_animal',
                        'unknown'
                )
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