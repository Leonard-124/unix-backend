
// import express from "express";
// import { createOrUpdateUser, getUserProfile } from "../controllers/userController.js";
// import { auth } from "express-oauth2-jwt-bearer";

// const router = express.Router();

// const checkJwt = auth({
//   audience: process.env.AUTH0_AUDIENCE,
//   issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
//   tokenSigningAlg: "RS256"
// });

// router.post("/users", checkJwt, createOrUpdateUser); // sync
// router.get("/users/:auth0Id", checkJwt, getUserProfile); // profile

// export default router;
// routes/user.routes.js
import express from "express";
import { createOrUpdateUser, getUserProfile } from "../controllers/userController.js";
import checkJwt from "../Middlewares/checkJwt.js";

const router = express.Router();

router.post("/users", checkJwt, createOrUpdateUser);
router.get("/users/:auth0Id", checkJwt, getUserProfile);

export default router;