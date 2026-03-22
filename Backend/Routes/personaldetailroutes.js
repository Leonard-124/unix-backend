import { createDetails, getPersonal, getOnePersonal, updatePersonal, deletePersonal } from "../controllers/personaldetails.js";
import checkJwt from "../Middlewares/checkJwt.js";
import express from "express";

const router = express.Router()

router.get("/", checkJwt, getPersonal);
router.get("/:id", checkJwt, getOnePersonal);
router.post("/", checkJwt, createDetails);
router.put("/:id", checkJwt, updatePersonal);
router.delete("/:id", checkJwt, deletePersonal)

export default router;