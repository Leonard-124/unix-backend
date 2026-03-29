"strict mode"
//Models

import mongoose from "mongoose";
import express from "express";



const artsChema = new mongoose.Schema({ //schema1
    publicId: {
        type: String,
        required: true
    },
    auoth0Id: {
        type: String,
        required: true
    }
    
},{timestamps: true})

{/*export default*/} mongoose.model("Art", artsChema)
////

const messageSchema = new mongoose.Schema({ // Schema 2
    recipientId: {
        type: String,
        required: true,
        index: true // ---> what is its essence?
    },
    senderId: {
        type: String,
        required: true,
        index: true  // ---> why
    },
    content: {
        type: String,
        required: true,
        maxLength: 2000
    },
    artworkId: {
        type: mongoose.Schema.Types.ObjectId, //why and how? unique 
        ref: "Art",
        default: null
    },
    read: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

messageSchema.index({recipientId: 1, senderId: 1, createdAt: -1}) // what is tis essence
messageSchema.index({recipientId: 1, read: 1})

{/*export default*/} mongoose.model("Message", messageSchema)
////

const orderSchema = new mongoose.Schema({ // Schema 3
    auth0Id: {
        type: String,
        required: true
    },
    artId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Art",
        required: true
    },
    artDetails: { // Store a snapshot of the details.
        name: {type: String},
        image: { type: String},
        price: { type: String},
        author: {type: String},
        inventor: {type: String},
        type: { type: String}
    },
    reference: {
        type: String,
        required: true,
        unique: true // unique paystack reference.
    },
    status: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending"
    },
    paidAt: {
        type: Date,
    },
    paymentData: {
        type: Object,
    }

}, { timestamps: true})

orderSchema.virtual("id").get(function () {
    return this._id.toHexString(); // why this?
});
orderSchema.set("toJSON", {
    virtuals: true // why this?
})
export default mongoose.model("Order", orderSchema)
////

const usersSchema = new mongoose.Schema({
    hasPaid: {
        type: Boolean,
        default: false
    },
    auth0Id: {
        type: String,
        required: true,
        unique: true
    },
    avatarPublicId: {
        type: String,
        default: null
    },
    followers: [{
        type: String // array of auth0Ids who follow user
    }]
}, {timestamps: true})

usersSchema.virtual("followerCount").get(function () {
    return this.followers ? this.followers.length : 0;
})
usersSchema.virtual("followingCount").get(function () {
    return this.following? this.following.length : 0;
})
usersSchema.set("toJSON", {
    virtuals: true
})
{/*export default*/} mongoose.model("users", usersSchema)

//////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////
//  const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
const uploadResult = await cloudinay.uploader.upload(
    req.file.path, {
        folder: "artworks",
    }
)
fs.unlinkSync(req.file.path) // Clean up temp file
const {name, personType, personName ...others} = req.body

const newArt = new Art({
    image: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    description,
    auth0Id
});
const savedArt = await newArt.save()
res.status(201).json(savedArt)
//catch (err) { console.error("Erro creating art:", err);}
if(req.file?.path) { //Clean up temp on error
    try{
        fs.unlinkSync(req.file.path);
    } catch (_) {}
}
res.status(500).json({error: err.message});
//////////////////////////
export const getAllart = async( req, res) => {
    try{
        const AllArt = await Art.find().sort({createdAt: -1})
        res.json(AllArt)
    } catch (err) {
        console.error("Error creating...", err)
        res.json(500).json({error: err.message})
    }
}
//////////////////////////
export const getById = async(req, res) => {
    try{
        const getOne = await Art.findById(req.params.id)
        if (!getOne) return res.status(404).json({error: "Piece not found"})
        res.json(getOne)
    } catch (err) {
        res.status(500).json({error: err.message})
    }
}
///////////////////////////
const updateArt = async(req, res) => {
    try{
        const auth0IdFromtoken = req.auth?.payload.sub || req.auth?.sub
        if(!auth0IdFromtoken) {
            return res.status(401).json({error: "Unauthorized"})
        }
        const art = await Art.findById(req.params.id)
        if (!art) return res.status(404).json({error: "No art available"})
        const {name, image, price, amount} = req.body
        const updates = {name, image, price, amount}
        if (quantity) updates.quantity = parseInt(quantity) || 1

        if (req.file) {
            if(art.publicId) {
                await cloudinary.uploader.destroy(art.pubblicId);
            }
            const uploadResult = await cloudinary.uploader.upload(
                req.file.path,{
                    folder: "artworks"
                }
            );
            //clean up function
            fs.UnlinkSync(req.file.path);
            updates.image = uploadResult.secure_url;
            updates.publicId = uploadResult.public_id;
        }
        if(personType === "author") {
            updates.author = personName;
            updates.inventor = undefined;
        }
        else if (personType === "inventor") {
            updates.inventor = personName;
            updates.author = undefined;
        }
        const updatedArt = await Art.findByIdAndUpdate(req.params.id,
            updates, {
                new: true,
                runValidators: true
            });
            res.json(updatedArt);
    } catch (err) {
        console.error("Error updating art:", err);
        if(req.file.path) {
            try{ fs.unlinkSync(req.file.path);} catch (_) {}
        }
        res.status(500).json({error: err.message})
    }
}

//////Delete Art/

const deleteArt = async(req, res) => {
    try{
        auth0IdFromtoken = req.auth?.payload.sub || req.auth?.sub
        if(!auth0IdFromtoken) {
            return res.status(401).json({error: "Unauthorized"})
        }
        const art = await Art.findById(req.params.id)
        if(!art) {
            return res.status(404).json({error: "Not Found?"})
        }

        //check ownership/who has power to delete
        if(art.auth0Id !== auth0IdFromtoken && !isAdmin(auth0IdFromtoken)) {
            return res.status(403).json({
                success: false,
                error: "Unauthorized, you can only modify your works!"
            })
        }
        if(art.publicId) {
            await cloudinary.uploader.destroy(art.publicId)
        }
        await art.deleteOne();
        res.json({message: "Deleted successfully"})
    } catch (err) {
        console.error("Error deleting art:", err)
        res.status(500).json({ error: err.message  });
    }
}

//READ USER'S ARTWORKS
const getUserArtworks = async(req, res) => {
    try{
        const { auth0Id } = req.params
        const auth0IdFromToken = req.auth?.sub || req.auth?.payload.sub

        //check ownership
        if(auth0IdFromToken !== auth0Id && !isAdmin(auth0IdFromToken)) {
            res.status(403).json({error: "Unauthorized canot read other person's work"})
        }
        const artworks = await Art.find({auth0Id}).sort({createdAt: -1})
        res.json(artworks);
    }catch (err) {
        console.error("Error fetching your artworks:", err)
        res.status(500).json({message: "Server error fetching user artworks"})
    }
}

////////////////////////////////////////////////////////////////////////////////////////////
//meessage.js
const { recipientId, content, artworkId } = req.body
const senderId = req.auth?.payload?.sub || req.user?.sub // auth0Id
const messages = await Message.find({
      $or: [
        { senderId: currentUserId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("artworkId", "name image price");   
    const sentMessages = await Message.find({ senderId: currentUserId })
      .distinct("recipientId");
//limit, sort, select, distinct, findOne, countDocuments, populate, all, updateMany, lean
const currentUser = await Users.findOne({ auth0Id: currentUserId });
const isFollowing = currentUser.following && currentUser.following.includes(targetUserId);
if (isFollowing) {
    // Unfollow
    currentUser.following = currentUser.following.filter(id => id !== targetUserId);
    targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);
} else {
    // Follow
    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];
    
    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);
}

///////////////
const result = await cloudinary.uploader.upload(req.file.path, {
    folder: "unix_avatars",
    transformation: [
    { width: 400, height: 400, crop: "fill", gravity: "face" },
    { quality: "auto" }
    ]
});
//////////////
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: "RS256",
});

//////////////
const upload = multer({ dest: "uploads/" });

// CREATE (with image upload)
router.post("/", checkJwt, upload.single("image"), createArt);

////////////
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// router.post("/", async (req, res) => {
//   const { message, email } = req.body;

//   try {
//     const msg = {
//       to: "loluoch710@gmail.com", // your receiving email
//       from: "feedback@yourdomain.com", // must be a verified sender in SendGrid
//       subject: "📩 New Feedback from Unix App",
//       text: `From: ${email || "Anonymous"}\n\n${message}`,
//     };

//     await sgMail.send(msg);
///////////
//Paystack api
// const initRes = await axios.post(
// 'https://api.paystack.co/transaction/initialize',
// { email, amount: paystackAmount },
// {
// headers: {
// Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
// 'Content-Type': 'application/json',
// },
// }
// );


// const { authorization_url, reference } = initRes.data.data;
// res.json({ authorization_url, reference });
// } catch (err) {
// res.status(400).json({ error: err.response?.data?.message || err.message });
// }
// });
////////////////////
//     const initRes = await axios.post(
//       'https://api.paystack.co/transaction/initialize',
//       { 
//         email, 
//         amount: paystackAmount,
//         metadata: {
//           auth0Id, //</>
//           artId, //</>
//           quantity: quantity || 1,
//         }
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     const { authorization_url, reference } = initRes.data.data;
//     res.json({ authorization_url, reference });
//   } catch (err) {
//     console.error("Paystack initialize error:", err.response?.data || err.message);
//     res.status(400).json({ error: err.response?.data?.message || err.message });
//   }
// });
//////////////////////
