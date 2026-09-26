export function getDepartment(category) {

    const departments = {
        // City of Ottawa - Roads / Public Works
        pothole: "City of Ottawa - Roads Services",
        road_crack: "City of Ottawa - Roads Services",
        sinkhole: "City of Ottawa - Roads Services",
        road_obstruction: "City of Ottawa - Roads Services",
        guardrail_damage: "City of Ottawa - Roads Services",

        // City of Ottawa - Sidewalks / Accessibility
        damaged_sidewalk: "City of Ottawa - Roads Services",
        blocked_accessibility_ramp: "City of Ottawa - Roads Services",

        // City of Ottawa - Traffic
        traffic_signal_problem: "City of Ottawa - Traffic Services",
        damaged_sign: "City of Ottawa - Traffic Services",

        // City of Ottawa - Street Lighting
        broken_streetlight: "City of Ottawa - Street Lighting",

        // City of Ottawa - Waste
        overflowing_garbage_bin: "City of Ottawa - Solid Waste Services",
        illegal_dumping: "City of Ottawa - Solid Waste Services",

        // City of Ottawa - Winter Operations
        snow_blocked_sidewalk: "City of Ottawa - Roads Services",
        snow_blocked_road: "City of Ottawa - Roads Services",

        // City of Ottawa - Drainage / Water
        flooding: "City of Ottawa - Roads Services",
        blocked_storm_drain: "City of Ottawa - Roads Services",
        water_main_leak: "City of Ottawa - Water Services",
        fire_hydrant_damage: "City of Ottawa - Water Services",

        // City of Ottawa - Forestry
        fallen_tree: "City of Ottawa - Forestry Services",
        dangerous_tree_branch: "City of Ottawa - Forestry Services",

        // Electrical utility
        downed_or_hanging_wire: "Hydro Ottawa",
        damaged_utility_pole: "Hydro Ottawa",

        // City of Ottawa - By-law
        graffiti: "City of Ottawa - By-law Services",
        abandoned_vehicle: "City of Ottawa - By-law Services",

        // Other municipal issues
        dead_animal: "City of Ottawa - Roads Services",

        natural_gas_leak: "Enbridge Gas",

        // Could not confidently classify
        unknown: "City of Ottawa - 3-1-1"
    };

    return departments[category] || "City of Ottawa - 3-1-1";
}