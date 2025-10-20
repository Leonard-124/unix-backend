
// import express from "express";
// import { createOrUpdateUser, getUserProfile } from "../controllers/userController.js";
// import checkJwt from "../Middlewares/checkJwt.js";

// const router = express.Router();

// router.post("/users", checkJwt, createOrUpdateUser);
// router.get("/users/:auth0Id", checkJwt, getUserProfile);

// export default router;

import express from "express";
import multer from "multer";
import checkJwt from "../Middlewares/checkJwt.js";
import {
  createOrUpdateUser,
  getUserProfile,
  uploadAvatar,
  getAllUsers,
  updateBio,
  updateUsername,
  toggleFollow,
  checkFollowStatus,
} from "../controllers/userController.js";

const router = express.Router();

// Multer temp storage before Cloudinary upload
const upload = multer({ 
  dest: "uploads/",
  limits: { fileSize: 1 * 1024 * 1024 } // 1MB limit
});

// CREATE/UPDATE user (called after Auth0 login)
router.post("/users", checkJwt, createOrUpdateUser);

// GET user profile by auth0Id
router.get("/users/:auth0Id", checkJwt, getUserProfile);

// UPLOAD/UPDATE avatar
router.put("/avatar", checkJwt, upload.single("avatar"), uploadAvatar);

// UPDATE bio
router.put("/bio", checkJwt, updateBio);

// UPDATE username
router.put("/username", checkJwt, updateUsername);

// GET all users (for Artists & Inventors page)
router.get("/all", getAllUsers);

// FOLLOW/UNFOLLOW user
router.post("/follow", checkJwt, toggleFollow);

// CHECK follow status
router.get("/follow/status/:targetUserId", checkJwt, checkFollowStatus);

export default router;
