
// // controllers/userController.js
// import Users from "../Models/users.js";

// /**
//  * Create or update a user record.
//  * This is typically called after Auth0 login, using claims from the JWT.
//  */
// export const createOrUpdateUser = async (req, res) => {
//   try {
//     // Extract user details from request body or JWT payload
//     const { auth0Id, username, fullname, email } = req.body;

//     if (!auth0Id || !email) {
//       return res.status(400).json({ success: false, message: "auth0Id and email are required." });
//     }

//     const user = await Users.findOneAndUpdate(
//       { auth0Id },
//       {
//         $set: {
//           username,
//           fullname,
//           email,
//         },
//         $setOnInsert: {
//           hasPaid: false, // default for new users
//         },
//       },
//       { upsert: true, new: true }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "User created/updated successfully.",
//       user,
//     });
//   } catch (error) {
//     console.error("Error creating/updating user:", error);
//     return res.status(500).json({ success: false, message: "Server error." });
//   }
// };

// /**
//  * Get user profile by auth0Id.
//  * Assumes req.user.sub is populated by JWT middleware.
//  */
// export const getUserProfile = async (req, res) => {
//   try {
//     const auth0Id = req.params.auth0Id || req.user?.sub;

//     if (!auth0Id) {
//       return res.status(400).json({ success: false, message: "auth0Id is required." });
//     }

//     const user = await Users.findOne({ auth0Id });

//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found." });
//     }

//     return res.status(200).json({ success: true, user });
//   } catch (error) {
//     console.error("Error fetching user profile:", error);
//     return res.status(500).json({ success: false, message: "Server error." });
//   }
// };
//////////////////////////////////////////////////////////////////////////////

import Users from "../Models/users.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

/**
 * Create or update a user record.
 * This is typically called after Auth0 login, using claims from the JWT.
 */
export const createOrUpdateUser = async (req, res) => {
  try {
    // Extract user details from request body or JWT payload
    const { auth0Id, username, fullname, email } = req.body;

    if (!auth0Id || !email) {
      return res.status(400).json({ success: false, message: "auth0Id and email are required." });
    }

    const user = await Users.findOneAndUpdate(
      { auth0Id },
      {
        $set: {
          username,
          fullname,
          email,
        },
        $setOnInsert: {
          hasPaid: false, // default for new users
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "User created/updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Error creating/updating user:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * Get user profile by auth0Id.
 * Assumes req.auth.payload.sub or req.user.sub is populated by JWT middleware.
 */
export const getUserProfile = async (req, res) => {
  try {
    const auth0Id = req.params.auth0Id || req.auth?.payload?.sub || req.user?.sub;

    if (!auth0Id) {
      return res.status(400).json({ success: false, message: "auth0Id is required." });
    }

    const user = await Users.findOne({ auth0Id });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * Get all users (for Artists & Inventors directory)
 */
export const getAllUsers = async (req, res) => {
  try {
    // Get all users who have at least one artwork
    const users = await Users.find()
      .select("auth0Id username fullname email avatar bio followers following")
      .lean();

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Follow/Unfollow a user
 */
export const toggleFollow = async (req, res) => {
  try {
    const { targetUserId } = req.body; // auth0Id of user to follow/unfollow
    const currentUserId = req.auth?.payload?.sub || req.user?.sub;

    if (!currentUserId) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required." 
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Target user ID is required."
      });
    }

    // Can't follow yourself
    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself."
      });
    }

    const currentUser = await Users.findOne({ auth0Id: currentUserId });
    const targetUser = await Users.findOne({ auth0Id: targetUserId });

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // Check if already following
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

    await currentUser.save();
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: isFollowing ? "Unfollowed successfully" : "Followed successfully",
      isFollowing: !isFollowing,
      followerCount: targetUser.followers.length,
      followingCount: targetUser.following.length,
    });
  } catch (error) {
    console.error("Error toggling follow:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update follow status."
    });
  }
};

/**
 * Check if current user follows target user
 */
export const checkFollowStatus = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.auth?.payload?.sub || req.user?.sub;

    if (!currentUserId) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required." 
      });
    }

    const currentUser = await Users.findOne({ auth0Id: currentUserId });
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const isFollowing = currentUser.following && currentUser.following.includes(targetUserId);

    return res.status(200).json({
      success: true,
      isFollowing,
    });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check follow status."
    });
  }
};

/**
 * Update user bio
 */
export const updateBio = async (req, res) => {
  try {
    const { bio, auth0Id } = req.body;
    const auth0IdFromToken = req.auth?.payload?.sub || req.user?.sub;

    // Verify user is updating their own bio
    if (!auth0IdFromToken || auth0Id !== auth0IdFromToken) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: You can only update your own bio." 
      });
    }

    // Validate bio length
    if (bio && bio.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Bio cannot exceed 500 characters."
      });
    }

    const user = await Users.findOne({ auth0Id: auth0IdFromToken });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found." 
      });
    }

    user.bio = bio || "";
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Bio updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Error updating bio:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to update bio." 
    });
  }
};

/**
 * Update username
 */
export const updateUsername = async (req, res) => {
  try {
    const { username, auth0Id } = req.body;
    const auth0IdFromToken = req.auth?.payload?.sub || req.user?.sub;

    // Verify user is updating their own username
    if (!auth0IdFromToken || auth0Id !== auth0IdFromToken) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: You can only update your own username." 
      });
    }

    // Validate username
    if (!username || username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 3 characters."
      });
    }

    // Check username format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Username can only contain letters, numbers, and underscores."
      });
    }

    // Check if username is already taken by another user
    const existingUser = await Users.findOne({ 
      username: username.trim(),
      auth0Id: { $ne: auth0IdFromToken } // Exclude current user
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username is already taken."
      });
    }

    const user = await Users.findOne({ auth0Id: auth0IdFromToken });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found." 
      });
    }

    user.username = username.trim();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Username updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Error updating username:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to update username." 
    });
  }
};

/**
 * Upload/Update user avatar
 */
export const uploadAvatar = async (req, res) => {
  try {
    const { auth0Id } = req.body;
    
    // Get auth0Id from JWT token - express-oauth2-jwt-bearer sets it in req.auth
    const auth0IdFromToken = req.auth?.payload?.sub || req.user?.sub;

    console.log("Auth0Id from body:", auth0Id);
    console.log("Auth0Id from token:", auth0IdFromToken);
    console.log("req.auth:", req.auth);

    // Verify user is updating their own avatar
    if (!auth0IdFromToken) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required." 
      });
    }

    if (!auth0Id || auth0Id !== auth0IdFromToken) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: You can only update your own avatar." 
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No avatar file provided." 
      });
    }

    const user = await Users.findOne({ auth0Id });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found." 
      });
    }

    // Delete old avatar from Cloudinary if exists
    if (user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (err) {
        console.error("Error deleting old avatar:", err);
      }
    }

    // Upload new avatar to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "unix_avatars",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto" }
      ]
    });

    // Delete temp file
    fs.unlinkSync(req.file.path);

    // Update user with new avatar
    user.avatar = result.secure_url;
    user.avatarPublicId = result.public_id;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully.",
      user,
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    
    // Clean up temp file if it exists
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Error deleting temp file:", err);
      }
    }

    return res.status(500).json({ 
      success: false, 
      message: "Failed to upload avatar." 
    });
  }
};






