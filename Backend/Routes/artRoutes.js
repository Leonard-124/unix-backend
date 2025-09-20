
import express from "express";
import multer from "multer";
import { createArt, getAllArt } from "../controllers/artController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // temp storage

router.post("/", upload.single("src"), createArt);
router.get("/", getAllArt);

export default router;