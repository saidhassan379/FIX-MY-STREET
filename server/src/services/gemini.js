import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

console.log("Gemini service loaded");
console.log("Gemini API key loaded:", !!apiKey);

if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from .env");
}

const client = new GoogleGenAI({
    apiKey: apiKey
});

const civicIssueSchema = {
    type: "object",
    properties: {
        category: {
            type: "string",
            enum: [
                "pothole",
                "road_crack",
                "sinkhole",
                "broken_streetlight",
                "traffic_signal_problem",
                "damaged_sidewalk",
                "blocked_accessibility_ramp",
                "damaged_sign",
                "guardrail_damage",
                "overflowing_garbage_bin",
                "illegal_dumping",
                "road_obstruction",
                "snow_blocked_sidewalk",
                "snow_blocked_road",
                "flooding",
                "blocked_storm_drain",
                "fallen_tree",
                "dangerous_tree_branch",
                "downed_or_hanging_wire",
                "damaged_utility_pole",
                "water_main_leak",
                "fire_hydrant_damage",
                "graffiti",
                "abandoned_vehicle",
                "dead_animal",
                "unknown"
            ]
        },

        confidence: {
            type: "number",
            minimum: 0,
            maximum: 1
        },

        severity: {
            type: "string",
            enum: ["low", "medium", "high", "critical"]
        },

        safety_risk: {
            type: "boolean"
        },

        description: {
            type: "string"
        }
    },

    required: [
        "category",
        "confidence",
        "severity",
        "safety_risk",
        "description"
    ]
};


export async function analyzeCivicIssue(
    file,
    citizenDescription = ""
) {

    console.log("### GEMINI FUNCTION CALLED ###");
    console.log("Image type:", file.mimetype);
    console.log("Image size:", file.size);

    const imageBase64 =
        file.buffer.toString("base64");
    const prompt = `
You are CivicFix's municipal infrastructure classifier.

Analyze the provided image together with the citizen description.

Allowed categories:
pothole
road_crack
sinkhole
broken_streetlight
traffic_signal_problem
damaged_sidewalk
blocked_accessibility_ramp
damaged_sign
guardrail_damage
overflowing_garbage_bin
illegal_dumping
road_obstruction
snow_blocked_sidewalk
snow_blocked_road
flooding
blocked_storm_drain
fallen_tree
dangerous_tree_branch
downed_or_hanging_wire
damaged_utility_pole
water_main_leak
fire_hydrant_damage
graffiti
abandoned_vehicle
dead_animal
unknown

Classification rules:
- Choose exactly one allowed category.
- Use "unknown" when the image and description do not provide enough evidence.
- Do not invent objects, damage, hazards, dimensions, causes, or conditions that are not visible or described.
- confidence must be a number from 0 to 1.
- severity must be exactly one of: "low", "medium", "high", "critical".

SEVERITY RUBRIC:

LOW:
- Minor or mostly cosmetic municipal issue.
- Little or no disruption.
- Examples: small road crack, minor graffiti, slightly damaged sign, or a small amount of litter.

MEDIUM:
- A genuine municipal maintenance issue that should be repaired, but there is no clear evidence of an immediate or major safety danger.
- This is the normal default for ordinary infrastructure damage.
- Examples: ordinary pothole, moderate sidewalk damage, overflowing garbage bin, broken streetlight, or moderate snow obstruction.
- Most potholes should be LOW or MEDIUM, not HIGH.

HIGH:
- Use only when the image or citizen description shows clear evidence of a substantial safety hazard or major disruption.
- There must be something visibly or explicitly more serious than an ordinary maintenance problem.
- Examples: unusually large/deep pothole seriously affecting an active traffic lane, major sidewalk collapse, large tree blocking traffic, substantial roadway flooding, or badly damaged traffic infrastructure.
- Do NOT choose HIGH merely because an issue could theoretically cause an accident.

CRITICAL:
- Reserve for apparent urgent hazards with potential for severe or immediate harm or major infrastructure failure.
- Examples: downed/hanging utility wire, visibly unstable utility pole, major sinkhole, severe flooding making a road dangerous or impassable, or a large fallen tree completely blocking a roadway.
- Use CRITICAL very sparingly.

SAFETY_RISK RULES:
- safety_risk is NOT a general indication that an issue could possibly hurt someone.
- Set safety_risk=true only when the available evidence shows a CLEAR, SIGNIFICANT hazard requiring priority municipal attention.
- Ordinary maintenance issues should normally have safety_risk=false.
- LOW severity should normally have safety_risk=false.
- MEDIUM severity should normally have safety_risk=false.
- HIGH severity may have safety_risk=true only when a substantial hazard is actually visible or explicitly described.
- CRITICAL severity should normally have safety_risk=true.
- Do not set safety_risk=true simply because the issue is located on a road, sidewalk, or public space.

IMPORTANT CALIBRATION EXAMPLES:
- Small/shallow pothole -> low or medium, safety_risk=false.
- Ordinary pothole needing repair -> medium, safety_risk=false.
- Multiple small or ordinary potholes -> medium, safety_risk=false.
- A long stretch containing many small or ordinary potholes -> medium, safety_risk=false.
- Very large/deep pothole creating an obvious traffic hazard -> high, safety_risk=true.
- Minor road crack -> low, safety_risk=false.
- Broken streetlight -> medium, safety_risk=false unless another clear hazard is present.
- Overflowing garbage bin -> medium, safety_risk=false.
- Graffiti -> low, safety_risk=false.
- Fallen branch off to the side of the road -> medium, safety_risk=false.
- Large tree blocking an active roadway -> high, safety_risk=true.
- Downed/hanging utility wire -> critical, safety_risk=true.
- Major sinkhole -> critical, safety_risk=true.
- Severe roadway flooding -> high or critical depending on visible extent, safety_risk=true.

IMPORTANT POTHOLE CALIBRATION:
- The number of defects alone does NOT justify HIGH or CRITICAL severity.
- Quantity alone must NEVER be used to classify potholes as HIGH or CRITICAL.
- Widespread minor pothole damage may increase maintenance workload without increasing safety severity.
- Increase pothole severity to HIGH only when visible SIZE, DEPTH, LOCATION, obstruction, or physical condition clearly creates a substantial hazard.
- Do not infer that a pothole is deep solely because it appears dark in the image.
- Do not infer dangerous depth when scale or depth cannot be reliably determined from the image.

WATER MAIN LEAK CALIBRATION:
- A water main leak is NOT automatically a safety hazard.
- Small or moderate water leakage -> medium, safety_risk=false.
- Water flowing from a pipe or roadway without major flooding or structural damage -> medium, safety_risk=false.
- Standing water by itself does NOT justify HIGH severity.
- Use HIGH with safety_risk=true only when there is clear evidence of substantial flooding, dangerous roadway conditions, major infrastructure damage, or significant traffic/pedestrian danger.
- Use CRITICAL only for extreme situations involving immediate severe danger or major infrastructure failure.
- Do not infer underground structural damage, road collapse, or dangerous water depth unless visible or explicitly described.

When uncertain between two severity levels, choose the LOWER level unless there is clear visual or textual evidence supporting the higher level.

A photo alone cannot confirm whether a wire is electrically energized. Describe it as a downed/hanging wire, not a live wire, unless the citizen description provides reliable confirmation.

The description should be short, factual, and useful to municipal staff.

Citizen description:
${citizenDescription || "No description provided"}

Return:
- category
- confidence
- severity
- safety_risk
- description
`;

    const interaction =
        await client.interactions.create({

            model: "gemini-3.8-flash",

            input: [
                {
                    type: "image",
                    data: imageBase64,
                    mime_type: file.mimetype
                },
                {
                    type: "text",
                    text: prompt
                }
            ],

            response_format: [
                {
                    type: "text",
                    mime_type: "application/json",
                    schema: civicIssueSchema
                }
            ]
        });

    console.log("Gemini response received");

    return JSON.parse(
        interaction.output_text
    );
}