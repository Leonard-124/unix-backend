import Art2 from "../Models/Art2.js";
import cloudinary from "../config/cloudinary.js";

export const createArt2 = async (req, res) => {
    try {
        if(!req.file) return res.status(400).json({error: "Image file is required"})

            const uploadResult = await  cloudinary.uploader.upload(req.file.path, {
                folder: "Artworks2",
            })

            const newArt = new Art2({
                src: uploadResult.secure_url,
                name: req.body.name,
                inventor: req.body.inventor,
                weight: req.body.weight,
                size: req.body.size,
                type: req.body.tpe,
                description: req.body.description,
                price: req.body.price
            });

            const savedArt = newArt.save();
            res.status(201).json(savedArt)
    } catch (err) {
        res.status(500).json({error: err.message})
    }
}

export const getAllArt2 = async (req, res) => {
    try {
        const artworks = await Art2.find().sort({ createdAt: -1})
        res.json(artworks)
    } catch (err) {
        res.status(500).json({ err: err.message })
    }
}
 




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