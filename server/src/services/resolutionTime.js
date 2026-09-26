import pool from "../db/pool.js";

export async function getTypicalResolutionTime(category) {

    const result = await pool.query(
        `
        SELECT
            created_at,
            status_history
        FROM reports
        WHERE category = $1
          AND status = 'RESOLVED'
        `,
        [category]
    );

    const resolutionTimes = [];

    for (const report of result.rows) {

        const resolvedEntry = report.status_history.find(
            entry => entry.status === "RESOLVED"
        );

        if (!resolvedEntry) {
            continue;
        }

        const createdAt = new Date(report.created_at);
        const resolvedAt = new Date(resolvedEntry.timestamp);

        const resolutionMilliseconds =
            resolvedAt.getTime() - createdAt.getTime();

        if (resolutionMilliseconds >= 0) {
            resolutionTimes.push(resolutionMilliseconds);
        }
    }

    // We don't have enough historical data yet
    if (resolutionTimes.length === 0) {
        return {
            medianResolutionMs: null,
            resolvedReportCount: 0
        };
    }

    resolutionTimes.sort((a, b) => a - b);

    const middle = Math.floor(resolutionTimes.length / 2);

    let median;

    if (resolutionTimes.length % 2 === 0) {
        median =
            (resolutionTimes[middle - 1] +
                resolutionTimes[middle]) / 2;
    } else {
        median = resolutionTimes[middle];
    }

    return {
        medianResolutionMs: Math.round(median),
        resolvedReportCount: resolutionTimes.length
    };
}