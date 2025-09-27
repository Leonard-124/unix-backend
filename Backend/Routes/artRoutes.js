
// // import express from "express";
// // import multer from "multer";
// // import { createArt, getAllArt } from "../controllers/artController.js";

// // const router = express.Router();
// // const upload = multer({ dest: "uploads/" }); // temp storage

// // router.post("/", upload.single("src"), createArt);
// // router.get("/", getAllArt);

// // export default router;


import express from "express";
import multer from "multer";
import {
  createArt,
  getAllArt,
  getArtById,
  updateArt,
  deleteArt,
} from "../controllers/artController.js";

const router = express.Router();

// Multer temp storage before Cloudinary upload
const upload = multer({ dest: "uploads/" });

// CREATE (with image upload)
router.post("/", upload.single("image"), createArt);

// READ all
router.get("/", getAllArt);

// READ one by ID
router.get("/:id", getArtById);

// UPDATE (full replacement)
router.put("/:id", upload.single("image"), updateArt);

// UPDATE (partial update)
router.patch("/:id", upload.single("image"), updateArt);

// DELETE
router.delete("/:id", deleteArt);

export default router;
////////////////////////////////////////////////////

// Routes/artRoutes.js
// import express from "express";
// import multer from "multer";
// import {
//   createArt,
//   getAllArt,
//   getArtById,
//   updateArt,
//   deleteArt,
// } from "../controllers/artController.js";

// const router = express.Router();

// // Multer temp storage before Cloudinary upload
// const upload = multer({ dest: "uploads/" });

// // CREATE (with image upload)
// router.post("/", upload.single("image"), createArt);

// // READ all
// router.get("/", getAllArt);

// // READ one by ID
// router.get("/:id", getArtById);

// // UPDATE (full replacement)
// router.put("/:id", upload.single("image"), updateArt);

// // UPDATE (partial update)
// router.patch("/:id", upload.single("image"), updateArt);

// // DELETE
// router.delete("/:id", deleteArt);

// export default router;
///////////////////////////////////////////////////////////////