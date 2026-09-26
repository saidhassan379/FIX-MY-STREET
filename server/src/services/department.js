export function getDepartment(category) {

    const departments = {
        pothole: "Public Works",
        broken_streetlight: "Infrastructure",
        damaged_sidewalk: "Public Works",
        blocked_accessibility_ramp: "Public Works",
        damaged_sign: "Infrastructure",
        overflowing_garbage_bin: "Waste Management",
        road_obstruction: "Public Works",
        unknown: "General Services"
    };

    return departments[category] || "General Services";
}