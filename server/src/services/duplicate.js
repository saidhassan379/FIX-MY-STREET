import pool from "../db/pool.js";

// Distance between two GPS points in metres
function calculateDistance(lat1, lon1, lat2, lon2) {

    const earthRadius = 6371000;

    const toRadians = (degrees) =>
        degrees * (Math.PI / 180);

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return earthRadius * c;
}


export async function checkPossibleDuplicate(
    latitude,
    longitude,
    category
) {

    const result = await pool.query(
        `
        SELECT
            report_id,
            latitude,
            longitude
        FROM reports
        WHERE category = $1
          AND status != 'RESOLVED'
          AND created_at >= NOW() - INTERVAL '7 days'
        `,
        [category]
    );

    for (const report of result.rows) {

        const distance = calculateDistance(
            latitude,
            longitude,
            Number(report.latitude),
            Number(report.longitude)
        );

        if (distance <= 50) {
            return true;
        }
    }

    return false;
}