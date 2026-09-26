import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const civicIssueSchema = {
    type: "object",

    properties: {

        category: {
            type: "string",
            enum: [
                "pothole",
                "broken_streetlight",
                "damaged_sidewalk",
                "blocked_accessibility_ramp",
                "damaged_sign",
                "overflowing_garbage_bin",
                "road_obstruction",
                "unknown"
            ]
        },

        confidence: {
            type: "number"
        },

        severity: {
            type: "string"
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

export async function analyzeCivicIssue(file, citizenDescription = "") {

    const imageBase64 = file.buffer.toString("base64");

    const prompt = `
You are the CivicFix municipal infrastructure classification system.

Analyze the supplied photograph.

Classify ONLY into one of these categories:

pothole
broken_streetlight
damaged_sidewalk
blocked_accessibility_ramp
damaged_sign
overflowing_garbage_bin
road_obstruction
unknown

If the photograph does not clearly show one of these supported
municipal infrastructure problems, use:

unknown

Citizen supplied description:
"${citizenDescription}"

Return:

category
confidence
severity
safety_risk
description

confidence should represent your confidence in the classification.

description should be short, objective, and suitable for a
municipal service report.

Do not invent details that are not visible or supplied.
`;

    const interaction = await ai.interactions.create({

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

        response_format: {
            type: "text",
            mime_type: "application/json",
            schema: civicIssueSchema
        }
    });

    return JSON.parse(interaction.output_text);
}