import express from "express";
import multer from "multer";
import { analyzeCivicIssue } from "../services/gemini.js";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 8 * 1024 * 1024
    }
});

router.post(
    "/analyze",
    upload.single("photo"),
    async (req, res) => {

        try {

            const { latitude, longitude, description } = req.body;

            if (!req.file) {
                return res.status(400).json({
                    error: "Missing photo"
                });
            }

            if (!latitude || !longitude) {
                return res.status(400).json({
                    error: "Missing latitude or longitude"
                });
            }

            console.log(req.file.originalname);
            console.log(latitude);
            console.log(longitude);
            console.log(description);

            const analysis = await analyzeCivicIssue(
                req.file,
                description
            );

            res.json({
                ...analysis,
                possible_duplicate: false
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Internal server error"
            });
        }
    }
);

export default router;