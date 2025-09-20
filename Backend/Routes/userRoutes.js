
import express from "express";
import { createOrUpdateUser, getUserProfile } from "../controllers/userController.js";
import { auth } from "express-oauth2-jwt-bearer";

const router = express.Router();

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: "RS256"
});

router.post("/sync", checkJwt, createOrUpdateUser);
router.get("/profile", checkJwt, getUserProfile);

export default router;