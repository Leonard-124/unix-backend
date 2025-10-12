


// import Art from "../Models/artModel.js";
// import cloudinary from "../config/cloudinary.js";

// // CREATE
// export const createArt = async (req, res) => {
//   console.log("req.file:", req.file);
// console.log("req.body:", req.body);
//   try {
//     if (!req.file) return res.status(400).json({ error: "Image file is required" });

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
//       image: uploadResult.secure_url,
//       publicId: uploadResult.public_id, // store public_id for deletion
//       name,
//       author: personType === "author" ? personName : undefined,
//       inventor: personType === "inventor" ? personName : undefined,
//       size,
//       weight,
//       type,
//       description,
//       price,
//       auth0Id: req.user.sub, // only if using authentication
//     });

//     const savedArt = await newArt.save();
//     res.status(201).json(savedArt);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // READ ALL
// export const getAllArt = async (req, res) => {
//   try {
//     const artworks = await Art.find().sort({ createdAt: -1 });
//     res.json(artworks);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // READ ONE
// export const getArtById = async (req, res) => {
//   try {
//     const art = await Art.findById(req.params.id);
//     if (!art) return res.status(404).json({ error: "Not found" });
//     res.json(art);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // UPDATE
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
//       updates.src = uploadResult.secure_url;
//       updates.publicId = uploadResult.public_id;
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
//     res.status(500).json({ error: err.message });
//   }
// };

// // DELETE
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
//     res.status(500).json({ error: err.message });
//   }
// };
// ////////////////////////////////////////////////////////////////


// export const getUserArtworks = async (req, res) => {
// console.log("req.auth.sub:", req.auth.sub);
// console.log("req.params.auth0Id:", req.params.auth0Id);
//   try {
//     const { auth0Id } = req.params;

//     // The middleware puts the claims in req.auth
//     if (req.auth.sub !== auth0Id) {
//       return res.status(403).json({ message: "Forbidden: not your profile" });
//     }

//     const artworks = await Art.find({ auth0Id });
//     res.status(200).json(artworks);
//   } catch (err) {
//     console.error("Error fetching user artworks:", err);
//     res.status(500).json({ message: "Server error fetching user artworks" });
//   }
// };

/////////////////////////////////////////////////////////////////////

import Art from "../Models/artModel.js";
import cloudinary from "../config/cloudinary.js";

// CREATE
export const createArt = async (req, res) => {
  console.log("req.file:", req.file);
  console.log("req.body:", req.body);

  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

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

    // ✅ Use req.auth.sub (set by express-oauth2-jwt-bearer)
    const auth0Id = req.auth?.sub;
    if (!auth0Id) {
      return res.status(401).json({ error: "Unauthorized: no auth0Id" });
    }

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
      auth0Id, // ✅ store owner’s Auth0 ID
    });

    const savedArt = await newArt.save();
    res.status(201).json(savedArt);
  } catch (err) {
    console.error("Error creating art:", err);
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
      updates.image = uploadResult.secure_url; // ✅ fix: use image
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

// READ USER’S ARTWORKS
export const getUserArtworks = async (req, res) => {
  console.log("req.auth.sub:", req.auth?.sub);
  console.log("req.params.auth0Id:", req.params.auth0Id);

  try {
    const { auth0Id } = req.params;

    // ✅ enforce ownership
    if (req.auth?.sub !== auth0Id) {
      return res.status(403).json({ message: "Forbidden: not your profile" });
    }

    const artworks = await Art.find({ auth0Id });
    res.status(200).json(artworks);
  } catch (err) {
    console.error("Error fetching user artworks:", err);
    res.status(500).json({ message: "Server error fetching user artworks" });
  }
};


