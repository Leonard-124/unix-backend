
// import Userr from "../Models/User.js";

// // Helper to map errors to HTTP responses
// const sendError = (res, status, message) => res.status(status).json({ error: message });

// // Create or update user idempotently (no duplicates), with proper guards
// export const createOrUpdateUser = async (req, res) => {
//   try {
//     const payload = req.auth?.payload;
//     if (!payload) return sendError(res, 401, "Unauthorized: missing token payload");

//     const { sub, email, nickname, name } = payload;
//     if (!sub || !email) return sendError(res, 400, "Bad request: missing sub or email");

//     // Upsert avoids E11000 duplicate key errors by updating if exists
//     const user = await Userr.findOneAndUpdate(
//       { auth0Id: sub },
//       {
//         $set: {
//           email,
//           username: nickname || null,
//           fullname: name || null,
//         },
//         $setOnInsert: {
//           hasPaid: false,
//         },
//       },
//       { new: true, upsert: true }
//     );

//     return res.json(user);
//   } catch (err) {
//     // Handle common Mongo errors gracefully
//     if (err?.code === 11000) {
//       return sendError(res, 409, "Conflict: duplicate auth0Id");
//     }
//     if (err?.name === "ValidationError") {
//       return sendError(res, 422, `Validation error: ${err.message}`);
//     }
//     console.error("createOrUpdateUser error:", err);
//     return sendError(res, 500, "Internal server error");
//   }
// };

// export const getUserProfile = async (req, res) => {
//   try {
//     const sub = req.auth?.sub || req.auth?.payload?.sub;
//     if (!sub) return sendError(res, 401, "Unauthorized: missing sub");

//     const user = await User.findOne({ auth0Id: sub });
//     if (!user) return sendError(res, 404, "User not found");

//     return res.json(user);
//   } catch (err) {
//     console.error("getUserProfile error:", err);
//     return sendError(res, 500, "Internal server error");
//   }
// };
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// controllers/userController.js
import Users from "../Models/users.js";

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
 * Assumes req.user.sub is populated by JWT middleware.
 */
export const getUserProfile = async (req, res) => {
  try {
    const auth0Id = req.params.auth0Id || req.user?.sub;

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





