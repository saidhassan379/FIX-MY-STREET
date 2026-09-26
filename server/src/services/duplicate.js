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


// Find how many existing reports appear to describe the same issue
export async function getDuplicateInfo(
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

    let duplicateCount = 0;

    for (const report of result.rows) {

        const distance = calculateDistance(
            latitude,
            longitude,
            Number(report.latitude),
            Number(report.longitude)
        );

        if (distance <= 50) {
            duplicateCount++;
        }
    }

    return {
        possibleDuplicate: duplicateCount > 0,

        // Existing matching reports
        duplicateCount,

        // Existing matching reports + the new citizen's report
        totalReportsForIssue: duplicateCount + 1
    };
}


// Keep old function available so existing code does not break
export async function checkPossibleDuplicate(
    latitude,
    longitude,
    category
) {

    const info = await getDuplicateInfo(
        latitude,
        longitude,
        category
    );

    return info.possibleDuplicate;
}