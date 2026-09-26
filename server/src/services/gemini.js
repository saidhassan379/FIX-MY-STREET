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

Analyze the provided image.

Allowed categories:

pothole
broken_streetlight
damaged_sidewalk
blocked_accessibility_ramp
damaged_sign
overflowing_garbage_bin
road_obstruction
unknown

If the image does not clearly match one of these categories,
return "unknown".

Citizen description:
${citizenDescription || "No description provided"}

Return:
- category
- confidence
- severity
- safety_risk
- description

The description should be short and factual.
Do not invent facts.
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