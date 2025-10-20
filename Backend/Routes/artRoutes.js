
// import express from "express";
// import multer from "multer";
// import checkJwt from "../Middlewares/checkJwt.js";
// import {
//   createArt,
//   getAllArt,
//   getArtById,
//   updateArt,
//   deleteArt,
//   getUserArtworks
// } from "../controllers/artController.js";


// const router = express.Router();

// // Multer temp storage before Cloudinary upload
// const upload = multer({ dest: "uploads/" });

// // CREATE (with image upload)
// router.post("/", checkJwt, upload.single("image"), createArt);

// // READ all
// router.get("/", getAllArt);

// // READ one by ID
// router.get("/:id", getArtById);

// // UPDATE (full replacement)
// router.put("/:id", checkJwt, upload.single("image"), updateArt);//checkwt

// // UPDATE (partial update)
// router.patch("/:id", checkJwt, upload.single("image"), updateArt);//checkwt

// // DELETE
// router.delete("/:id", checkJwt, deleteArt);//checkwt

// router.get("/user/:auth0Id", checkJwt, getUserArtworks);


// export default router;
//////////////////////////////////////////////////

import express from "express";
import multer from "multer";
import checkJwt from "../Middlewares/checkJwt.js"
import {
  createArt,
  getAllArt,
  getArtById,
  updateArt,
  deleteArt,
  getUserArtworks
} from "../controllers/artController.js";


const router = express.Router();

// Multer temp storage before Cloudinary upload
const upload = multer({ dest: "uploads/" });

// CREATE (with image upload)
router.post("/", checkJwt, upload.single("image"), createArt);//

// READ all
router.get("/", getAllArt);

// READ one by ID
router.get("/:id", getArtById);

// UPDATE (full replacement)
router.put("/:id", checkJwt, upload.single("image"), updateArt);//checkwt

// UPDATE (partial update)
router.patch("/:id", checkJwt, upload.single("image"), updateArt);//checkwt

// DELETE
router.delete("/:id", checkJwt, deleteArt);//checkwt

router.get("/user/:auth0Id", checkJwt, getUserArtworks);


export default router;

