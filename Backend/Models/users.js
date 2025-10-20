
// import mongoose from 'mongoose'

// const usersSchema = new mongoose.Schema({
//     auth0Id: {
//         type: String, required: true, unique: true
//     },
//     username: {
//         type: String
//     },
//     fullname: {
//         type: String
//     },
//     email: {
//         type: String, required: true
//     },
//     hasPaid: {
//         type: Boolean, default:false
//     }
// }, {
//     timestamps: true
// })

// export default mongoose.model("users", usersSchema)
///////////////////////////////////////////////////////////////

import mongoose from 'mongoose'

const usersSchema = new mongoose.Schema({
    auth0Id: {
        type: String, 
        required: true, 
        unique: true
    },
    username: {
        type: String
    },
    fullname: {
        type: String
    },
    email: {
        type: String, 
        required: true
    },
    bio: {
        type: String,
        maxlength: 500,
        default: ""
    },
    avatar: {
        type: String,  // Cloudinary URL
        default: null
    },
    avatarPublicId: {
        type: String,  // Cloudinary public_id for deletion
        default: null
    },
    followers: [{
        type: String, // Array of auth0Ids who follow this user
    }],
    following: [{
        type: String, // Array of auth0Ids this user follows
    }],
    hasPaid: {
        type: Boolean, 
        default: false
    }
}, {
    timestamps: true
})

// Virtual to get follower count
usersSchema.virtual('followerCount').get(function() {
    return this.followers ? this.followers.length : 0;
});

// Virtual to get following count
usersSchema.virtual('followingCount').get(function() {
    return this.following ? this.following.length : 0;
});

// Ensure virtuals are included in JSON
usersSchema.set('toJSON', {
    virtuals: true
});

export default mongoose.model("users", usersSchema)

