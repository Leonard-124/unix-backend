import express from "express"

import { getFeedback, uploadFeedback } from "../controllers/feedbackcontroller.js";


const router =  express.Router()

router.get("/", getFeedback)
router.post("/", uploadFeedback)


export default router;