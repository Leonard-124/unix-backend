

// import Art from "../Models/artModel.js";
// import cloudinary from "../config/cloudinary.js";

// // CREATE
// export const createArt = async (req, res) => {
//   console.log("req.file:", req.file);
//   console.log("req.body:", req.body);

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

//     // ✅ Use req.auth.sub (set by express-oauth2-jwt-bearer)
//     const auth0Id = req.auth?.sub;
//     if (!auth0Id) {
//       return res.status(401).json({ error: "Unauthorized: no auth0Id" });
//     }

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
//       auth0Id, // ✅ store owner’s Auth0 ID
//     });

//     const savedArt = await newArt.save();
//     res.status(201).json(savedArt);
//   } catch (err) {
//     console.error("Error creating art:", err);
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
//       updates.image = uploadResult.secure_url; // ✅ fix: use image
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

// // READ USER’S ARTWORKS
// export const getUserArtworks = async (req, res) => {
//   console.log("req.auth.sub:", req.auth?.sub);
//   console.log("req.params.auth0Id:", req.params.auth0Id);

//   try {
//     const { auth0Id } = req.params;

//     // ✅ enforce ownership
//     if (req.auth?.sub !== auth0Id) {
//       return res.status(403).json({ message: "Forbidden: not your profile" });
//     }

//     const artworks = await Art.find({ auth0Id });
//     res.status(200).json(artworks);
//   } catch (err) {
//     console.error("Error fetching user artworks:", err);
//     res.status(500).json({ message: "Server error fetching user artworks" });
//   }
// };
/////////////////////////////////////////////////////////////////

import Art from "../Models/artModel.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

// CREATE new art
export const createArt = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    console.log("req.auth:", req.auth);
    console.log("req.user:", req.user);

    // Get auth0Id from token
    const auth0IdFromToken = req.auth?.payload?.sub || req.user?.sub;
    const auth0IdFromBody = req.body.auth0Id;

    if (!auth0IdFromToken) {
      return res.status(401).json({ error: "Unauthorized: no token" });
    }

    // Verify the auth0Id matches
    if (auth0IdFromBody && auth0IdFromBody !== auth0IdFromToken) {
      return res.status(403).json({ error: "Forbidden: auth0Id mismatch" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "unix_artworks",
    });

    // Delete temp file
    fs.unlinkSync(req.file.path);

    // Parse quantity
    const quantity = parseInt(req.body.quantity) || 1;

    // Create art document
    const art = await Art.create({
      image: result.secure_url,
      publicId: result.public_id,
      name: req.body.name,
      author: req.body.author,
      inventor: req.body.inventor,
      size: req.body.size,
      weight: req.body.weight,
      type: req.body.type,
      description: req.body.description,
      price: req.body.price,
      quantity: quantity,
      auth0Id: auth0IdFromToken, // Use auth0Id from token
    });

    res.status(201).json(art);
  } catch (error) {
    console.error("Error creating art:", error);
    
    // Clean up temp file if it exists
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Error deleting temp file:", err);
      }
    }
    
    res.status(500).json({ error: error.message });
  }
};

// READ all art
export const getAllArt = async (req, res) => {
  try {
    const arts = await Art.find().sort({ createdAt: -1 });
    res.status(200).json(arts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ one art by ID
export const getArtById = async (req, res) => {
  try {
    const art = await Art.findById(req.params.id);
    if (!art) {
      return res.status(404).json({ error: "Art not found" });
    }
    res.status(200).json(art);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE art
export const updateArt = async (req, res) => {
  try {
    const auth0IdFromToken = req.auth?.payload?.sub || req.user?.sub;
    
    if (!auth0IdFromToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const art = await Art.findById(req.params.id);
    
    if (!art) {
      return res.status(404).json({ error: "Art not found" });
    }

    // Verify ownership
    if (art.auth0Id !== auth0IdFromToken) {
      return res.status(403).json({ error: "Forbidden: You can only update your own artworks" });
    }

    let updateData = { ...req.body };

    // If new image uploaded
    if (req.file) {
      // Delete old image from Cloudinary
      if (art.publicId) {
        await cloudinary.uploader.destroy(art.publicId);
      }

      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "unix_artworks",
      });

      updateData.image = result.secure_url;
      updateData.publicId = result.public_id;

      // Delete temp file
      fs.unlinkSync(req.file.path);
    }

    // Parse quantity if provided
    if (req.body.quantity) {
      updateData.quantity = parseInt(req.body.quantity) || 1;
    }

    const updatedArt = await Art.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedArt);
  } catch (error) {
    console.error("Error updating art:", error);
    
    // Clean up temp file if it exists
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Error deleting temp file:", err);
      }
    }
    
    res.status(500).json({ error: error.message });
  }
};

// DELETE art
export const deleteArt = async (req, res) => {
  try {
    const auth0IdFromToken = req.auth?.payload?.sub || req.user?.sub;
    
    if (!auth0IdFromToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const art = await Art.findById(req.params.id);
    
    if (!art) {
      return res.status(404).json({ error: "Art not found" });
    }

    // Verify ownership
    if (art.auth0Id !== auth0IdFromToken) {
      return res.status(403).json({ error: "Forbidden: You can only delete your own artworks" });
    }

    // Delete image from Cloudinary
    if (art.publicId) {
      await cloudinary.uploader.destroy(art.publicId);
    }

    await Art.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Art deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET user's artworks
export const getUserArtworks = async (req, res) => {
  try {
    const auth0IdFromToken = req.auth?.payload?.sub || req.user?.sub;
    const auth0IdFromParam = req.params.auth0Id;

    if (!auth0IdFromToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify user is requesting their own artworks
    if (auth0IdFromParam !== auth0IdFromToken) {
      return res.status(403).json({ error: "Forbidden: You can only view your own artworks" });
    }

    const artworks = await Art.find({ auth0Id: auth0IdFromToken }).sort({ createdAt: -1 });
    res.status(200).json(artworks);
  } catch (error) {
    console.error("Error fetching user artworks:", error);
    res.status(500).json({ error: error.message });
  }
};



