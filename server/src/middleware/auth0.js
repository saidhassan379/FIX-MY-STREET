import { auth } from "express-oauth2-jwt-bearer";

export const checkJwt = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`
});

export const requireUpdateReports = (req, res, next) => {
    const permissions = req.auth?.payload?.permissions || [];

    console.log("Auth0 permissions:", permissions);

    if (!permissions.includes("update:reports")) {
        return res.status(403).json({
            success: false,
            error: "Forbidden: missing update:reports permission"
        });
    }

    next();
};