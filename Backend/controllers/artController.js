
// import Art from "../Models/Art.js";
// import cloudinary from "../config/cloudinary.js";

// // POST: Upload image to Cloudinary + save metadata to MongoDB
// export const createArt = async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: "Image file is required" });

//     // Upload to Cloudinary
//     const uploadResult = await cloudinary.uploader.upload(req.file.path, {
//       folder: "artworks",
//     });

//     // Save to MongoDB
//     const newArt = new Art({
//       src: uploadResult.secure_url,
//       name: req.body.name,
//       author: req.body.author,
//       size: req.body.size,
//       description: req.body.description,
//       price: req.body.price,
//     });

//     const savedArt = await newArt.save();
//     res.status(201).json(savedArt);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // GET: Fetch all artworks
// export const getAllArt = async (req, res) => {
//   try {
//     const artworks = await Art.find().sort({ createdAt: -1 });
//     res.json(artworks);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
///////////////////////////////////////////////////////////////////////////////////////////////////////////


import Art from "../Models/artModel.js";
import cloudinary from "../config/cloudinary.js";

// CREATE
export const createArt = async (req, res) => {
  console.log("req.file:", req.file);
console.log("req.body:", req.body);
  try {
    if (!req.file) return res.status(400).json({ error: "Image file is required" });

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "artworks",
    });

    const {
      name,
      personType,
      personName,
      size,
      weight,
      type,
      description,
      price,
    } = req.body;

    const newArt = new Art({
      image: uploadResult.secure_url,
      publicId: uploadResult.public_id, // store public_id for deletion
      name,
      author: personType === "author" ? personName : undefined,
      inventor: personType === "inventor" ? personName : undefined,
      size,
      weight,
      type,
      description,
      price,
    });

    const savedArt = await newArt.save();
    res.status(201).json(savedArt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ ALL
export const getAllArt = async (req, res) => {
  try {
    const artworks = await Art.find().sort({ createdAt: -1 });
    res.json(artworks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ ONE
export const getArtById = async (req, res) => {
  try {
    const art = await Art.findById(req.params.id);
    if (!art) return res.status(404).json({ error: "Not found" });
    res.json(art);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
export const updateArt = async (req, res) => {
  try {
    const {
      name,
      personType,
      personName,
      size,
      weight,
      type,
      description,
      price,
    } = req.body;

    const updates = { name, size, weight, type, description, price };

    // If new image uploaded, replace old one
    if (req.file) {
      const art = await Art.findById(req.params.id);
      if (!art) return res.status(404).json({ error: "Not found" });

      // Delete old image from Cloudinary
      if (art.publicId) {
        await cloudinary.uploader.destroy(art.publicId);
      }

      // Upload new image
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "artworks",
      });
      updates.src = uploadResult.secure_url;
      updates.publicId = uploadResult.public_id;
    }

    if (personType === "author") {
      updates.author = personName;
      updates.inventor = undefined;
    } else if (personType === "inventor") {
      updates.inventor = personName;
      updates.author = undefined;
    }

    const art = await Art.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!art) return res.status(404).json({ error: "Not found" });
    res.json(art);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
export const deleteArt = async (req, res) => {
  try {
    const art = await Art.findById(req.params.id);
    if (!art) return res.status(404).json({ error: "Not found" });

    // Delete image from Cloudinary
    if (art.publicId) {
      await cloudinary.uploader.destroy(art.publicId);
    }

    await art.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
////////////////////////////////////////////////////////////////

// import Art from "../Models/artModel.js";
// import cloudinary from "../config/cloudinary.js";

// /**
//  * CREATE
//  * Uploads image to Cloudinary and saves metadata to MongoDB
//  */
// export const createArt = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "Image file is required" });
//     }

//     // Upload to Cloudinary
//     const uploadResult = await cloudinary.uploader.upload(req.file.path, {
//       folder: "artworks",
//     });

//     const {
//       name,
//       personType,
//       personName,
//       size,
//       weight,
//       type,
//       description,
//       price,
//     } = req.body;

//     const newArt = new Art({
//       image: uploadResult.secure_url,     // ✅ matches schema
//       publicId: uploadResult.public_id,   // ✅ matches schema
//       name,
//       author: personType === "author" ? personName : undefined,
//       inventor: personType === "inventor" ? personName : undefined,
//       size,
//       weight,
//       type,
//       description,
//       price,
//     });

//     const savedArt = await newArt.save();
//     res.status(201).json(savedArt);
//   } catch (err) {
//     console.error("Error creating art:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * READ ALL
//  */
// export const getAllArt = async (req, res) => {
//   try {
//     const artworks = await Art.find().sort({ createdAt: -1 });
//     res.json(artworks);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * READ ONE
//  */
// export const getArtById = async (req, res) => {
//   try {
//     const art = await Art.findById(req.params.id);
//     if (!art) return res.status(404).json({ error: "Not found" });
//     res.json(art);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * UPDATE
//  * If a new image is uploaded, replaces the old one in Cloudinary
//  */
// export const updateArt = async (req, res) => {
//   try {
//     const {
//       name,
//       personType,
//       personName,
//       size,
//       weight,
//       type,
//       description,
//       price,
//     } = req.body;

//     const updates = { name, size, weight, type, description, price };

//     // If new image uploaded, replace old one
//     if (req.file) {
//       const art = await Art.findById(req.params.id);
//       if (!art) return res.status(404).json({ error: "Not found" });

//       // Delete old image from Cloudinary
//       if (art.publicId) {
//         await cloudinary.uploader.destroy(art.publicId);
//       }

//       // Upload new image
//       const uploadResult = await cloudinary.uploader.upload(req.file.path, {
//         folder: "artworks",
//       });
//       updates.image = uploadResult.secure_url;   // ✅ matches schema
//       updates.publicId = uploadResult.public_id; // ✅ matches schema
//     }

//     if (personType === "author") {
//       updates.author = personName;
//       updates.inventor = undefined;
//     } else if (personType === "inventor") {
//       updates.inventor = personName;
//       updates.author = undefined;
//     }

//     const art = await Art.findByIdAndUpdate(req.params.id, updates, {
//       new: true,
//       runValidators: true,
//     });

//     if (!art) return res.status(404).json({ error: "Not found" });
//     res.json(art);
//   } catch (err) {
//     console.error("Error updating art:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// /**
//  * DELETE
//  * Removes artwork from DB and deletes image from Cloudinary
//  */
// export const deleteArt = async (req, res) => {
//   try {
//     const art = await Art.findById(req.params.id);
//     if (!art) return res.status(404).json({ error: "Not found" });

//     // Delete image from Cloudinary
//     if (art.publicId) {
//       await cloudinary.uploader.destroy(art.publicId);
//     }

//     await art.deleteOne();
//     res.json({ message: "Deleted successfully" });
//   } catch (err) {
//     console.error("Error deleting art:", err);
//     res.status(500).json({ error: err.message });
//   }
// };
// ///////////////////////////////////////////////////////////
