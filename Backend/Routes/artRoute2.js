import express from "express"
import multer from "multer"
import { createArt2, getAllArt2 } from "../controllers/artcontroller2.js"

const router = express.Router()
const upload = multer({dest: "uploads/"})

router.post("/", upload.single("src"), createArt2)
router.get("/", getAllArt2)

export default router;
